# Copyright (c) 2026, Horizon Dev and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document

from horizon_crm.utils import validate_agency_access


class TravelInquiry(Document):
	def validate(self):
		validate_agency_access(self)

	def on_update(self):
		if self.has_value_changed("status") and self.status == "Won":
			frappe.msgprint(
				_("Inquiry marked as Won. You can now create a Booking from this inquiry."),
				alert=True,
			)
