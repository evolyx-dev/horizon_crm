# Copyright (c) 2026, Horizon Dev and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

from horizon_crm.utils import validate_agency_access


class TravelBooking(Document):
	def validate(self):
		validate_agency_access(self)
		self.update_paid_amount()
		self.calculate_balance()

	def update_paid_amount(self):
		self.paid_amount = sum(
			p.amount or 0 for p in self.payments if p.status == "Received"
		)

	def calculate_balance(self):
		self.balance_amount = (self.total_amount or 0) - (self.paid_amount or 0)
