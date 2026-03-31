"""API methods for the customer portal."""

import frappe
from frappe import _


@frappe.whitelist(allow_guest=False)
def get_my_bookings() -> list[dict]:
    """Get bookings for the current portal user."""
    customer = _get_current_customer()
    if not customer:
        return []

    bookings = frappe.get_all(
        "Travel Booking",
        filters={"customer": customer},
        fields=[
            "name", "booking_number", "status", "departure_date",
            "return_date", "num_travelers", "total_amount", "paid_amount",
            "balance_amount", "currency",
        ],
        order_by="departure_date desc",
    )
    return bookings


@frappe.whitelist(allow_guest=False)
def get_booking_detail(booking_name: str) -> dict:
    """Get booking detail including itinerary for portal display."""
    customer = _get_current_customer()
    if not customer:
        frappe.throw(_("No customer record found for your account."))

    booking = frappe.get_doc("Travel Booking", booking_name)
    if booking.customer != customer:
        frappe.throw(_("Access denied."), frappe.PermissionError)

    result = booking.as_dict()

    # Include itinerary if linked
    if booking.itinerary:
        itinerary = frappe.get_doc("Travel Itinerary", booking.itinerary)
        result["itinerary_detail"] = itinerary.as_dict()

    return result


@frappe.whitelist(allow_guest=False)
def submit_inquiry(
    destination: str,
    departure_date: str,
    return_date: str,
    num_travelers: int = 1,
    travel_type: str | None = None,
    budget_min: float = 0,
    budget_max: float = 0,
    notes: str = "",
) -> str:
    """Submit a new travel inquiry from the portal."""
    customer = _get_current_customer()
    if not customer:
        frappe.throw(_("No customer record found for your account."))

    customer_doc = frappe.get_doc("Travel Customer", customer)

    inquiry = frappe.new_doc("Travel Inquiry")
    inquiry.customer = customer
    inquiry.customer_name = customer_doc.customer_name
    inquiry.customer_email = customer_doc.email
    inquiry.customer_phone = customer_doc.phone
    inquiry.destination_text = destination
    inquiry.departure_date = departure_date
    inquiry.return_date = return_date
    inquiry.num_travelers = num_travelers
    inquiry.travel_type = travel_type
    inquiry.budget_min = budget_min
    inquiry.budget_max = budget_max
    inquiry.notes = notes
    inquiry.source = "Website"
    inquiry.insert(ignore_permissions=True)

    return inquiry.name


@frappe.whitelist(allow_guest=False)
def submit_feedback(
    booking: str,
    rating: int,
    overall_experience: str = "",
    comments: str = "",
) -> str:
    """Submit feedback for a completed booking."""
    customer = _get_current_customer()
    if not customer:
        frappe.throw(_("No customer record found for your account."))

    booking_doc = frappe.get_doc("Travel Booking", booking)
    if booking_doc.customer != customer:
        frappe.throw(_("Access denied."), frappe.PermissionError)

    if booking_doc.status != "Completed":
        frappe.throw(_("Feedback can only be submitted for completed bookings."))

    # Check for existing feedback
    if frappe.db.exists("Travel Feedback", {"booking": booking, "customer": customer}):
        frappe.throw(_("You have already submitted feedback for this booking."))

    feedback = frappe.new_doc("Travel Feedback")
    feedback.booking = booking
    feedback.customer = customer
    feedback.rating = rating
    feedback.overall_experience = overall_experience
    feedback.comments = comments
    feedback.insert(ignore_permissions=True)

    return feedback.name


def _get_current_customer() -> str | None:
    """Get the Travel Customer record linked to the current portal user."""
    user = frappe.session.user
    return frappe.db.get_value("Travel Customer", {"portal_user": user}, "name")
