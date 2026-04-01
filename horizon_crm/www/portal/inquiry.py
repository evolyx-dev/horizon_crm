"""Portal inquiry form context — guest-accessible lead capture."""

import frappe


def get_context(context):
	context.no_cache = 1
	context.show_sidebar = False

	context.travel_types = frappe.get_all(
		"Travel Type",
		fields=["name", "type_name"],
		order_by="type_name asc",
	)

	context.destinations = frappe.get_all(
		"Travel Destination",
		fields=["name", "destination_name"],
		filters={"is_popular": 1},
		order_by="destination_name asc",
	)

	return context
