"""Agency access control helpers for Horizon CRM."""

from __future__ import annotations

import frappe


HORIZON_MODULE = "Horizon CRM"
AGENCY_ROLE_MAP = {
	"Agency Admin": "Agency Admin",
	"Team Lead": "Agency Team Lead",
	"Staff": "Agency Staff",
}
AGENCY_USER_ROLES = tuple(AGENCY_ROLE_MAP.values())
AGENCY_MODULE_PROFILES = {role: role for role in AGENCY_USER_ROLES}


def get_agency_blocked_modules() -> list[str]:
	"""Return every installed module except Horizon CRM."""
	return sorted(
		module for module in frappe.get_all("Module Def", pluck="name") if module != HORIZON_MODULE
	)


def ensure_module_profiles() -> None:
	"""Create or update the agency module profiles used to collapse the desk rail."""
	blocked_modules = get_agency_blocked_modules()
	existing_blocked = [{"module": module} for module in blocked_modules]

	for profile_name in AGENCY_MODULE_PROFILES.values():
		if frappe.db.exists("Module Profile", profile_name):
			profile = frappe.get_doc("Module Profile", profile_name)
		else:
			profile = frappe.new_doc("Module Profile")
			profile.module_profile_name = profile_name

		current_modules = sorted(module.module for module in profile.block_modules)
		if current_modules == blocked_modules:
			continue

		profile.set("block_modules", existing_blocked)
		if profile.is_new():
			profile.insert(ignore_permissions=True)
		else:
			profile.save(ignore_permissions=True)


def sync_agency_user_access(
	user_name: str | None,
	agency_role: str | None = None,
	is_active: bool = True,
) -> None:
	"""Synchronize agency roles and module profile for a user."""
	if not user_name or user_name in {"Administrator", "Guest"}:
		return

	ensure_module_profiles()

	user = frappe.get_doc("User", user_name)
	desired_role = agency_role if is_active else None
	desired_profile = AGENCY_MODULE_PROFILES.get(desired_role) if desired_role else None
	current_roles = [row.role for row in user.roles]
	non_agency_roles = [row.as_dict(no_nulls=True) for row in user.roles if row.role not in AGENCY_USER_ROLES]
	new_roles = list(non_agency_roles)

	if desired_role:
		new_roles.append({"role": desired_role})

	needs_role_update = sorted(current_roles) != sorted(role["role"] for role in new_roles)
	needs_profile_update = user.module_profile != desired_profile
	if not needs_role_update and not needs_profile_update:
		return

	user.set("roles", new_roles)
	user.module_profile = desired_profile
	user.save(ignore_permissions=True)


def ensure_admin_staff_record(admin_user: str | None) -> None:
	"""Ensure the agency admin has a staff record and synced access."""
	if not admin_user:
		return

	staff_name = frappe.db.exists("Travel Agency Staff", {"staff_user": admin_user})
	if staff_name:
		staff = frappe.get_doc("Travel Agency Staff", staff_name)
		needs_update = False
		if staff.role_in_agency != "Agency Admin":
			staff.role_in_agency = "Agency Admin"
			needs_update = True
		if not staff.is_active:
			staff.is_active = 1
			needs_update = True
		if needs_update:
			staff.save(ignore_permissions=True)
		else:
			sync_agency_user_access(admin_user, "Agency Admin", True)
		return

	staff = frappe.new_doc("Travel Agency Staff")
	staff.staff_user = admin_user
	staff.role_in_agency = "Agency Admin"
	staff.is_active = 1
	staff.insert(ignore_permissions=True)

