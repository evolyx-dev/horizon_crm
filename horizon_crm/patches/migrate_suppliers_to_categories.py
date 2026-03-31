"""Migrate Travel Supplier records to category-specific supplier doctypes.

Maps supplier_type → new DocType:
  Hotel         → Hotel Supplier
  Airline       → Airline Supplier
  Visa Agent    → Visa Agent
  Transport     → Transport Supplier
  Tour Operator → Tour Operator
  Insurance     → Insurance Provider
  Other         → Tour Operator (fallback)
"""

import frappe

# Map old supplier_type values to (new_doctype, title_field)
TYPE_MAP = {
	"Hotel": ("Hotel Supplier", "hotel_name"),
	"Airline": ("Airline Supplier", "airline_name"),
	"Visa Agent": ("Visa Agent", "agent_name"),
	"Transport": ("Transport Supplier", "transport_name"),
	"Tour Operator": ("Tour Operator", "operator_name"),
	"Insurance": ("Insurance Provider", "provider_name"),
	"Other": ("Tour Operator", "operator_name"),
}


def execute():
	if not frappe.db.table_exists("tabTravel Supplier"):
		return

	suppliers = frappe.get_all(
		"Travel Supplier",
		fields=[
			"name",
			"supplier_name",
			"supplier_type",
			"is_active",
			"contact_email",
			"phone",
			"website",
			"address",
			"city",
			"country",
			"supplier_notes",
		],
	)

	for sup in suppliers:
		stype = sup.get("supplier_type") or "Other"
		target_dt, title_field = TYPE_MAP.get(stype, TYPE_MAP["Other"])

		# Skip if already migrated (check by name match)
		if frappe.db.exists(target_dt, {"supplier_notes": f"[migrated:{sup.name}]"}):
			continue

		doc = frappe.new_doc(target_dt)
		doc.set(title_field, sup.supplier_name)
		doc.is_active = sup.is_active
		doc.contact_email = sup.contact_email
		doc.phone = sup.phone
		doc.website = sup.website
		doc.address = sup.address
		doc.city = sup.city
		doc.country = sup.country
		doc.supplier_notes = f"[migrated:{sup.name}]\n{sup.supplier_notes or ''}"

		# Copy child table rows
		services = frappe.get_all(
			"Supplier Service",
			filters={"parent": sup.name, "parenttype": "Travel Supplier"},
			fields=["service_name", "description", "price", "currency"],
		)
		for svc in services:
			doc.append(
				"services",
				{
					"service_name": svc.service_name,
					"description": svc.description,
					"price": svc.price,
					"currency": svc.currency,
				},
			)

		doc.insert(ignore_permissions=True)

	frappe.db.commit()
