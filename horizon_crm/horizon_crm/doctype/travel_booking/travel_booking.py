# Copyright (c) 2026, Horizon Dev and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document


class TravelBooking(Document):
	def validate(self):
		self.update_paid_amount()
		self.calculate_balance()

	def on_update(self):
		if self.has_value_changed("status"):
			old_status = self.get_doc_before_save()
			old_val = old_status.status if old_status else "Confirmed"
			new_val = self.status
			frappe.get_doc(
				doctype="Comment",
				comment_type="Info",
				reference_doctype=self.doctype,
				reference_name=self.name,
				content=_("Status changed from {0} to {1}").format(
					f"<b>{old_val}</b>", f"<b>{new_val}</b>"
				),
			).insert(ignore_permissions=True)

	def update_paid_amount(self):
		self.paid_amount = sum(
			p.amount or 0 for p in self.payments if p.status == "Received"
		)

	def calculate_balance(self):
		self.balance_amount = (self.total_amount or 0) - (self.paid_amount or 0)
