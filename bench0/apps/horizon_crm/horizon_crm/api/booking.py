"""API methods for Travel Booking management."""

import frappe
from frappe import _


@frappe.whitelist()
def get_booking_summary(agency: str | None = None) -> dict:
    """Get booking statistics for an agency dashboard.

    Args:
        agency: Travel Agency name. If None, uses current user's agency.

    Returns:
        dict with counts by status and financial summary
    """
    from horizon_crm.utils import get_user_agency

    if not agency:
        agency = get_user_agency()

    if not agency:
        frappe.throw(_("No agency associated with the current user."))

    filters = {"agency": agency}

    total = frappe.db.count("Travel Booking", filters)
    confirmed = frappe.db.count("Travel Booking", {**filters, "status": "Confirmed"})
    in_progress = frappe.db.count("Travel Booking", {**filters, "status": "In Progress"})
    completed = frappe.db.count("Travel Booking", {**filters, "status": "Completed"})
    cancelled = frappe.db.count("Travel Booking", {**filters, "status": "Cancelled"})

    total_revenue = frappe.db.sql(
        """
        SELECT COALESCE(SUM(total_amount), 0) as total,
               COALESCE(SUM(paid_amount), 0) as paid,
               COALESCE(SUM(balance_amount), 0) as balance
        FROM `tabTravel Booking`
        WHERE agency = %s AND status != 'Cancelled'
        """,
        agency,
        as_dict=True,
    )[0]

    return {
        "total": total,
        "confirmed": confirmed,
        "in_progress": in_progress,
        "completed": completed,
        "cancelled": cancelled,
        "total_revenue": total_revenue.get("total", 0),
        "total_paid": total_revenue.get("paid", 0),
        "total_balance": total_revenue.get("balance", 0),
    }
