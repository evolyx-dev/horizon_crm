# Copyright (c) 2026, Horizon Dev and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

from horizon_crm.utils import validate_agency_access


class TravelItinerary(Document):
	def validate(self):
		validate_agency_access(self)
		self.calculate_total_cost()

	def calculate_total_cost(self):
		self.total_cost = sum(item.estimated_cost or 0 for item in self.items)
