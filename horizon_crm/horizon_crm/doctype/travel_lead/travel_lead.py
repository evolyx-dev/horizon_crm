"""Travel Lead DocType controller."""

import frappe
from frappe.model.document import Document


class TravelLead(Document):
    def validate(self) -> None:
        if not self.email and not self.phone and not self.mobile_no:
            frappe.throw("At least one contact method (Email, Phone, or Mobile) is required.")

    def on_update(self) -> None:
        # Log status changes
        if self.has_value_changed("status"):
            frappe.get_doc(
                doctype="Comment",
                comment_type="Info",
                reference_doctype=self.doctype,
                reference_name=self.name,
                content=f"Status changed to <b>{self.status}</b>",
            ).insert(ignore_permissions=True)
