# Copyright (c) 2026, Horizon Dev and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

from horizon_crm.access import ensure_admin_staff_record


class TravelAgency(Document):
    def validate(self):
        if not self.agency_code:
            self.agency_code = self.agency_name[:3].upper() + "-" + frappe.generate_hash(length=4).upper()
        if self.admin_user:
            self._validate_admin_user()

    def _validate_admin_user(self):
        """Ensure admin_user is a valid system user."""
        user_type = frappe.db.get_value("User", self.admin_user, "user_type")
        if user_type != "System User":
            frappe.throw(f"Admin user {self.admin_user} must be a System User.")

    def on_update(self):
        if self.admin_user:
            self._ensure_admin_staff()

    def _ensure_admin_staff(self):
        """Create a Travel Agency Staff record for the admin user."""
        ensure_admin_staff_record(self.admin_user)
