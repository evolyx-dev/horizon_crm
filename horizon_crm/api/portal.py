"""API methods for the public portal lead-capture form."""

import frappe
from frappe import _
from frappe.rate_limiter import rate_limit
from frappe.utils import validate_email_address


@frappe.whitelist(allow_guest=True)
@rate_limit(key="portal_lead", limit=10, seconds=3600)
def submit_lead(
    full_name: str,
    email: str,
    phone: str = "",
    destination: str = "",
    travel_type: str = "",
    departure_date: str = "",
    return_date: str = "",
    num_travelers: int = 1,
    budget_min: float = 0,
    budget_max: float = 0,
    notes: str = "",
) -> dict:
    """Submit a travel inquiry from the public portal form.

    Creates a Travel Lead with source='Website'. No authentication required.

    Args:
        full_name: Lead's full name (required)
        email: Lead's email address (required)
        phone: Phone number (optional)
        destination: Desired travel destination
        travel_type: Type of travel (e.g. Adventure, Beach)
        departure_date: Desired departure date (YYYY-MM-DD)
        return_date: Desired return date (YYYY-MM-DD)
        num_travelers: Number of travelers (default 1)
        budget_min: Minimum budget
        budget_max: Maximum budget
        notes: Additional notes

    Returns:
        dict with lead name and success message
    """
    # Validate required fields
    full_name = (full_name or "").strip()
    email = (email or "").strip()
    if not full_name:
        frappe.throw(_("Full name is required."), title=_("Missing Field"))
    if not email:
        frappe.throw(_("Email is required."), title=_("Missing Field"))
    if not validate_email_address(email):
        frappe.throw(_("Please enter a valid email address."), title=_("Invalid Email"))

    # Sanitize inputs
    num_travelers = max(1, int(num_travelers or 1))
    budget_min = max(0, float(budget_min or 0))
    budget_max = max(0, float(budget_max or 0))

    lead = frappe.new_doc("Travel Lead")
    lead.lead_name = frappe.utils.escape_html(full_name)
    lead.email = email
    lead.phone = frappe.utils.escape_html(phone) if phone else ""
    lead.source = "Website"
    lead.status = "New"
    lead.interested_destination = frappe.utils.escape_html(destination) if destination else ""
    lead.travel_type = travel_type if travel_type else ""
    lead.expected_travel_date = departure_date if departure_date else None
    lead.expected_budget = budget_max if budget_max else None
    lead.num_travelers = num_travelers
    lead.notes = frappe.utils.escape_html(notes) if notes else ""
    lead.insert(ignore_permissions=True)
    frappe.db.commit()

    return {"name": lead.name, "message": _("Thank you! Your inquiry has been submitted.")}
