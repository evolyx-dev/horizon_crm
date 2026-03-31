# Copyright (c) 2026, Horizon Dev and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document


ROLE_MAP = {
	"Agency Admin": "Agency Admin",
	"Team Lead": "Agency Team Lead",
	"Staff": "Agency Staff",
}


class TravelAgencyStaff(Document):
	def validate(self):
		self.validate_max_staff()

	def validate_max_staff(self):
		agency = frappe.get_single("Travel Agency")
		if agency.max_staff:
			current_count = frappe.db.count(
				"Travel Agency Staff",
				filters={"is_active": 1, "name": ["!=", self.name]},
			)
			if current_count >= agency.max_staff:
				frappe.throw(
					_("Agency has reached the maximum staff limit of {0}").format(
						agency.max_staff
					)
				)

	def after_insert(self):
		self.assign_role()

	def assign_role(self):
		role = ROLE_MAP.get(self.role_in_agency)
		if role and not frappe.db.exists("Has Role", {"parent": self.staff_user, "role": role}):
			user = frappe.get_doc("User", self.staff_user)
			user.append("roles", {"role": role})
			user.save(ignore_permissions=True)
