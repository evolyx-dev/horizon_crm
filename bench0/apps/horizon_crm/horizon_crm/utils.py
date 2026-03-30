"""Utility functions for Horizon CRM multi-tenancy and common operations."""

import frappe


def get_user_agency(user: str | None = None) -> str | None:
    """Get the Travel Agency linked to the current user (or specified user).

    Returns the agency name or None if user is System Manager without agency.
    """
    if not user:
        user = frappe.session.user

    if user == "Administrator":
        return None

    staff = frappe.db.get_value(
        "Travel Agency Staff",
        {"staff_user": user, "is_active": 1},
        "agency",
    )
    return staff


def validate_agency_access(doc):
    """Validate that the document's agency matches the current user's agency.

    Called from validate() hooks on all tenant-scoped DocTypes.
    System Manager can access all agencies.
    """
    if frappe.session.user == "Administrator" or "System Manager" in frappe.get_roles():
        return

    user_agency = get_user_agency()
    if not user_agency:
        frappe.throw("You are not associated with any Travel Agency.")

    if not doc.agency:
        doc.agency = user_agency
    elif doc.agency != user_agency:
        frappe.throw(
            f"You do not have permission to access data for this agency.",
            frappe.PermissionError,
        )


def get_agency_filter(user: str | None = None) -> str:
    """Return SQL condition for filtering by agency.

    Used in permission_query_conditions hooks.
    """
    if frappe.session.user == "Administrator" or "System Manager" in frappe.get_roles():
        return ""

    agency = get_user_agency(user)
    if not agency:
        return "1=0"

    return f"`agency` = {frappe.db.escape(agency)}"
