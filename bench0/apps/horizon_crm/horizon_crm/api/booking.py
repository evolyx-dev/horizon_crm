"""API methods for Travel Booking management."""

import frappe
from frappe import _


@frappe.whitelist()
def get_booking_summary() -> dict:
    """Get booking statistics for the agency dashboard.

    Returns:
        dict with counts by status and financial summary
    """
    total = frappe.db.count("Travel Booking")
    confirmed = frappe.db.count("Travel Booking", {"status": "Confirmed"})
    in_progress = frappe.db.count("Travel Booking", {"status": "In Progress"})
    completed = frappe.db.count("Travel Booking", {"status": "Completed"})
    cancelled = frappe.db.count("Travel Booking", {"status": "Cancelled"})

    total_revenue = frappe.db.sql(
        """
        SELECT COALESCE(SUM(total_amount), 0) as total,
               COALESCE(SUM(paid_amount), 0) as paid,
               COALESCE(SUM(balance_amount), 0) as balance
        FROM `tabTravel Booking`
        WHERE status != 'Cancelled'
        """,
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
