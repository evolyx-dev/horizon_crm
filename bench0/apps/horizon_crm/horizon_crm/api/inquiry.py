"""API methods for Travel Inquiry management."""

import frappe
from frappe import _


@frappe.whitelist()
def create_booking_from_inquiry(source_name: str) -> dict:
    """Create a Travel Booking from a won Travel Inquiry.

    Args:
        source_name: Name of the Travel Inquiry to convert

    Returns:
        dict: New booking document as dict
    """
    inquiry = frappe.get_doc("Travel Inquiry", source_name)

    if inquiry.status != "Won":
        frappe.throw(_("Only inquiries with status 'Won' can be converted to bookings."))

    # Check if booking already exists for this inquiry
    existing = frappe.db.exists("Travel Booking", {"inquiry": source_name})
    if existing:
        frappe.throw(_("A booking already exists for this inquiry: {0}").format(existing))

    # Ensure customer exists or create one
    customer = None
    if inquiry.customer:
        customer = inquiry.customer
    else:
        customer = _get_or_create_customer(inquiry)

    booking = frappe.new_doc("Travel Booking")
    booking.inquiry = source_name
    booking.customer = customer
    booking.assigned_to = inquiry.assigned_to
    booking.departure_date = inquiry.departure_date
    booking.return_date = inquiry.return_date
    booking.num_travelers = inquiry.num_travelers or 1
    booking.total_amount = inquiry.budget_max or 0
    booking.booking_date = frappe.utils.today()
    booking.notes = inquiry.notes
    booking.insert()

    return booking.as_dict()


def _get_or_create_customer(inquiry) -> str:
    """Find or create a Travel Customer from inquiry details."""
    existing = frappe.db.get_value(
        "Travel Customer",
        {"email": inquiry.customer_email},
        "name",
    )
    if existing:
        return existing

    customer = frappe.new_doc("Travel Customer")
    customer.customer_name = inquiry.customer_name
    customer.email = inquiry.customer_email
    customer.phone = inquiry.customer_phone
    customer.insert(ignore_permissions=True)
    return customer.name
