# Copyright (c) 2026, Horizon Dev and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class TravelAgency(Document):
    def autoname(self):
        if not self.agency_code:
            # Generate a short code from agency name
            self.agency_code = self.agency_name[:3].upper() + "-" + frappe.generate_hash(length=4).upper()

    def validate(self):
        if self.admin_user:
            self._validate_admin_user()

    def _validate_admin_user(self):
        """Ensure admin_user is a valid system user."""
        user_type = frappe.db.get_value("User", self.admin_user, "user_type")
        if user_type != "System User":
            frappe.throw(f"Admin user {self.admin_user} must be a System User.")

    def after_insert(self):
        """If admin_user is set, create/update their staff record."""
        if self.admin_user:
            self._ensure_admin_staff()

    def on_update(self):
        if self.has_value_changed("admin_user") and self.admin_user:
            self._ensure_admin_staff()

    def _ensure_admin_staff(self):
        """Create a Travel Agency Staff record for the admin user."""
        if frappe.db.exists("Travel Agency Staff", {"staff_user": self.admin_user, "agency": self.name}):
            # Update role
            frappe.db.set_value(
                "Travel Agency Staff",
                {"staff_user": self.admin_user, "agency": self.name},
                "role_in_agency",
                "Agency Admin",
            )
        else:
            staff = frappe.new_doc("Travel Agency Staff")
            staff.staff_user = self.admin_user
            staff.agency = self.name
            staff.role_in_agency = "Agency Admin"
            staff.is_active = 1
            staff.insert(ignore_permissions=True)
