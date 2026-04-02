"""Backfill agency module profiles and role sync."""

from __future__ import annotations

import frappe

from horizon_crm.access import AGENCY_ROLE_MAP, ensure_admin_staff_record, ensure_module_profiles, sync_agency_user_access


def execute() -> None:
	ensure_module_profiles()

	agency = frappe.get_single("Travel Agency")
	ensure_admin_staff_record(agency.admin_user)

	for staff in frappe.get_all(
		"Travel Agency Staff",
		fields=["staff_user", "role_in_agency", "is_active"],
	):
		sync_agency_user_access(
			staff.staff_user,
			AGENCY_ROLE_MAP.get(staff.role_in_agency),
			bool(staff.is_active),
		)
