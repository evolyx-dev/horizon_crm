# Copyright (c) 2026, Horizon Dev and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document

from horizon_crm.utils import validate_agency_access


ROLE_MAP = {
	"Agency Admin": "Agency Admin",
	"Team Lead": "Agency Team Lead",
	"Staff": "Agency Staff",
}


class TravelAgencyStaff(Document):
	def validate(self):
		validate_agency_access(self)
		self.validate_max_staff()

	def validate_max_staff(self):
		agency = frappe.get_doc("Travel Agency", self.agency)
		if agency.max_staff:
			current_count = frappe.db.count(
				"Travel Agency Staff",
				filters={"agency": self.agency, "is_active": 1, "name": ["!=", self.name]},
			)
			if current_count >= agency.max_staff:
				frappe.throw(
					_("Agency {0} has reached the maximum staff limit of {1}").format(
						self.agency, agency.max_staff
					)
				)

	def after_insert(self):
		self.create_user_permission()
		self.assign_role()

	def on_trash(self):
		self.remove_user_permission()

	def create_user_permission(self):
		if not frappe.db.exists(
			"User Permission",
			{"user": self.staff_user, "allow": "Travel Agency", "for_value": self.agency},
		):
			frappe.get_doc(
				{
					"doctype": "User Permission",
					"user": self.staff_user,
					"allow": "Travel Agency",
					"for_value": self.agency,
				}
			).insert(ignore_permissions=True)

	def remove_user_permission(self):
		perms = frappe.get_all(
			"User Permission",
			filters={"user": self.staff_user, "allow": "Travel Agency", "for_value": self.agency},
		)
		for perm in perms:
			frappe.delete_doc("User Permission", perm.name, ignore_permissions=True)

	def assign_role(self):
		role = ROLE_MAP.get(self.role_in_agency)
		if role and not frappe.db.exists("Has Role", {"parent": self.staff_user, "role": role}):
			user = frappe.get_doc("User", self.staff_user)
			user.append("roles", {"role": role})
			user.save(ignore_permissions=True)
