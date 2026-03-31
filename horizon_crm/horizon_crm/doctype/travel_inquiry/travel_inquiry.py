# Copyright (c) 2026, Horizon Dev and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document


class TravelInquiry(Document):
	def on_update(self):
		if self.has_value_changed("status"):
			old_status = self.get_doc_before_save()
			old_val = old_status.status if old_status else "New"
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

			if new_val == "Won":
				frappe.msgprint(
					_("Inquiry marked as Won. You can now create a Booking from this inquiry."),
					alert=True,
				)
