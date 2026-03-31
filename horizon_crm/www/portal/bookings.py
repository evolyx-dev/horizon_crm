"""Portal bookings list page context."""

import frappe


def get_context(context):
    if frappe.session.user == "Guest":
        frappe.throw("Please log in to access the portal.", frappe.AuthenticationError)

    customer = frappe.db.get_value("Travel Customer", {"portal_user": frappe.session.user}, "name")

    context.no_cache = 1
    context.bookings = []

    if customer:
        context.bookings = frappe.get_all(
            "Travel Booking",
            filters={"customer": customer},
            fields=[
                "name", "booking_number", "status", "departure_date",
                "return_date", "num_travelers", "total_amount", "paid_amount",
                "balance_amount", "currency",
            ],
            order_by="departure_date desc",
        )

    return context
