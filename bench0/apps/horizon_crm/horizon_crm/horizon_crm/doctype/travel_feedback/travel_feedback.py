# Copyright (c) 2026, Horizon Dev and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import today

from horizon_crm.utils import validate_agency_access


class TravelFeedback(Document):
	def validate(self):
		validate_agency_access(self)
		if not self.submitted_on:
			self.submitted_on = today()
