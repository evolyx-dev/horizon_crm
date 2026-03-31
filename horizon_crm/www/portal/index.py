"""Portal dashboard page context."""

import frappe


def get_context(context):
    if frappe.session.user == "Guest":
        frappe.throw("Please log in to access the portal.", frappe.AuthenticationError)

    customer = frappe.db.get_value("Travel Customer", {"portal_user": frappe.session.user}, "name")

    context.no_cache = 1
    context.customer_name = frappe.db.get_value("Travel Customer", customer, "customer_name") if customer else ""
    context.total_bookings = 0
    context.active_bookings = 0
    context.completed_bookings = 0
    context.recent_bookings = []

    if customer:
        context.total_bookings = frappe.db.count("Travel Booking", {"customer": customer})
        context.active_bookings = frappe.db.count(
            "Travel Booking", {"customer": customer, "status": ["in", ["Confirmed", "In Progress"]]}
        )
        context.completed_bookings = frappe.db.count(
            "Travel Booking", {"customer": customer, "status": "Completed"}
        )
        context.recent_bookings = frappe.get_all(
            "Travel Booking",
            filters={"customer": customer},
            fields=["name", "booking_number", "status", "departure_date", "return_date", "num_travelers"],
            order_by="departure_date desc",
            limit=5,
        )

    return context
