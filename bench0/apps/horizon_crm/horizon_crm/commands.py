"""Bench CLI commands for Horizon CRM tenant management.

Usage:
    bench --site <site> horizon-crm create-tenant --agency-name "Acme Travel" \\
        --admin-email admin@acme.com --admin-password SecurePass123

These commands run within the context of an already-created Frappe site.
To provision a full tenant from scratch, use the helper script or call:

    bench new-site <tenant>.localhost --db-root-password <pw> --admin-password <pw>
    bench --site <tenant>.localhost install-app horizon_crm
    bench --site <tenant>.localhost horizon-crm create-tenant --agency-name "..." ...
"""

import click
import frappe
from frappe.commands import get_site, pass_context


@click.command("create-tenant", help="Configure a Horizon CRM tenant on the current site.")
@click.option("--agency-name", required=True, help="Display name for the travel agency")
@click.option("--admin-email", required=True, help="Email address for the agency admin user")
@click.option("--admin-password", default=None, help="Password for the admin user (default: site admin password)")
@click.option("--max-staff", default=10, type=int, help="Maximum staff members allowed")
@click.option("--contact-email", default=None, help="Agency contact email (defaults to admin-email)")
@pass_context
def create_tenant(context, agency_name, admin_email, admin_password, max_staff, contact_email):
    """Set up a Horizon CRM tenant on the current Frappe site.

    This command:
    1. Configures the Travel Agency singleton with the provided details
    2. Creates the admin user (if not exists) and assigns Agency Admin role
    3. Links the admin user as agency admin_user (triggers staff creation hook)
    """
    site = get_site(context)
    frappe.init(site=site)
    frappe.connect()

    try:
        _setup_tenant(agency_name, admin_email, admin_password, max_staff, contact_email)
        frappe.db.commit()
        click.secho(f"✓ Tenant '{agency_name}' configured on site '{site}'", fg="green")
    except Exception as e:
        frappe.db.rollback()
        click.secho(f"✗ Failed to create tenant: {e}", fg="red")
        raise
    finally:
        frappe.destroy()


def _setup_tenant(agency_name, admin_email, admin_password, max_staff, contact_email):
    """Core tenant setup logic (also callable from Python)."""
    # Step 1: Create admin user if not exists
    if not frappe.db.exists("User", admin_email):
        if not admin_password:
            frappe.throw("--admin-password is required when creating a new admin user")

        user = frappe.new_doc("User")
        user.email = admin_email
        user.first_name = agency_name + " Admin"
        user.new_password = admin_password
        user.send_welcome_email = 0
        user.insert(ignore_permissions=True)
        click.echo(f"  Created user: {admin_email}")
    else:
        click.echo(f"  User already exists: {admin_email}")

    # Step 2: Configure the Travel Agency singleton
    agency = frappe.get_single("Travel Agency")
    agency.agency_name = agency_name
    agency.contact_email = contact_email or admin_email
    agency.admin_user = admin_email
    agency.max_staff = max_staff
    agency.status = "Active"
    agency.save(ignore_permissions=True)
    click.echo(f"  Configured agency: {agency_name}")

    # Step 3: Verify admin got Agency Admin role (should happen via hook)
    user_roles = frappe.get_all(
        "Has Role",
        filters={"parent": admin_email, "role": "Agency Admin"},
        limit=1,
    )
    if user_roles:
        click.echo(f"  Agency Admin role assigned to {admin_email}")
    else:
        click.echo(f"  ⚠ Agency Admin role not found on {admin_email} — adding manually")
        user_doc = frappe.get_doc("User", admin_email)
        user_doc.add_roles("Agency Admin")
        user_doc.save(ignore_permissions=True)


@click.command("tenant-info", help="Show Horizon CRM tenant information for the current site.")
@pass_context
def tenant_info(context):
    """Display tenant configuration for the current site."""
    site = get_site(context)
    frappe.init(site=site)
    frappe.connect()

    try:
        agency = frappe.get_single("Travel Agency")
        staff_count = frappe.db.count("Travel Agency Staff", {"is_active": 1})
        customer_count = frappe.db.count("Travel Customer")
        inquiry_count = frappe.db.count("Travel Inquiry")
        booking_count = frappe.db.count("Travel Booking")

        click.echo(f"\n{'─' * 40}")
        click.echo(f"  Site:       {site}")
        click.echo(f"  Agency:     {agency.agency_name or '(not configured)'}")
        click.echo(f"  Code:       {agency.agency_code or '(none)'}")
        click.echo(f"  Status:     {agency.status}")
        click.echo(f"  Admin:      {agency.admin_user or '(none)'}")
        click.echo(f"  Email:      {agency.contact_email or '(none)'}")
        click.echo(f"  Staff:      {staff_count}/{agency.max_staff or '∞'}")
        click.echo(f"  Customers:  {customer_count}")
        click.echo(f"  Inquiries:  {inquiry_count}")
        click.echo(f"  Bookings:   {booking_count}")
        click.echo(f"{'─' * 40}\n")
    finally:
        frappe.destroy()


commands = [create_tenant, tenant_info]
