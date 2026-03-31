"""Portal inquiry form context."""

import frappe


def get_context(context):
    if frappe.session.user == "Guest":
        frappe.throw("Please log in to access the portal.", frappe.AuthenticationError)

    context.no_cache = 1
    context.travel_types = frappe.get_all(
        "Travel Type",
        fields=["name", "type_name"],
        order_by="type_name asc",
    )

    return context
