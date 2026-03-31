# Copyright (c) 2026, Horizon Dev and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class TravelItinerary(Document):
	def validate(self):
		self.calculate_total_cost()

	def calculate_total_cost(self):
		self.total_cost = sum(item.estimated_cost or 0 for item in self.items)
