"""Remove the deprecated Travel Supplier DocType from the database.

The generic Travel Supplier has been replaced by 6 category-specific DocTypes:
Airline Supplier, Hotel Supplier, Visa Agent, Transport Supplier,
Tour Operator, Insurance Provider.

Records should have already been migrated by the
migrate_suppliers_to_categories patch.
"""

import frappe


def execute():
	# Delete any remaining Travel Supplier records first
	if frappe.db.table_exists("tabTravel Supplier"):
		frappe.db.sql("DELETE FROM `tabSupplier Service` WHERE parenttype = 'Travel Supplier'")
		frappe.db.sql("DELETE FROM `tabTravel Supplier`")
		frappe.db.commit()

	# Remove the DocType itself
	if frappe.db.exists("DocType", "Travel Supplier"):
		frappe.delete_doc("DocType", "Travel Supplier", force=True, ignore_permissions=True)
		frappe.db.commit()
