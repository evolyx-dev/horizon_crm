"""Travel Invoice DocType controller."""

import frappe
from frappe.model.document import Document
from frappe.utils import flt


class TravelInvoice(Document):
    def validate(self) -> None:
        self.calculate_totals()
        self.set_outstanding()

    def on_update(self) -> None:
        if self.has_value_changed("status"):
            frappe.get_doc(
                doctype="Comment",
                comment_type="Info",
                reference_doctype=self.doctype,
                reference_name=self.name,
                content=f"Status changed to <b>{self.status}</b>",
            ).insert(ignore_permissions=True)

    def calculate_totals(self) -> None:
        """Recalculate item amounts, subtotal, tax, and grand total."""
        subtotal = 0
        for item in self.items:
            item.amount = flt(item.quantity) * flt(item.rate)
            subtotal += item.amount

        self.subtotal = subtotal
        self.tax_amount = flt(subtotal) * flt(self.tax_percent) / 100
        self.grand_total = flt(subtotal) + flt(self.tax_amount) - flt(self.discount)

    def set_outstanding(self) -> None:
        """Calculate outstanding amount from grand total and paid amount."""
        self.outstanding_amount = flt(self.grand_total) - flt(self.paid_amount)
