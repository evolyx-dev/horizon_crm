# Copyright (c) 2026, Horizon Dev and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document

from horizon_crm.access import AGENCY_ROLE_MAP, sync_agency_user_access


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
		self.sync_user_access()

	def on_update(self):
		self.sync_user_access()

	def on_trash(self):
		sync_agency_user_access(self.staff_user, is_active=False)

	def sync_user_access(self):
		sync_agency_user_access(
			self.staff_user,
			AGENCY_ROLE_MAP.get(self.role_in_agency),
			bool(self.is_active),
		)
