"""Utility functions for Horizon CRM."""

import frappe


def get_agency_settings() -> "frappe.Document":
    """Return the singleton Agency Settings (Travel Agency) document."""
    return frappe.get_single("Travel Agency")


def get_staff_record(user: str | None = None) -> dict | None:
    """Get the Travel Agency Staff record for the given (or current) user.

    Returns a dict with name, role_in_agency, is_active or None.
    """
    if not user:
        user = frappe.session.user

    if user == "Administrator":
        return None

    return frappe.db.get_value(
        "Travel Agency Staff",
        {"staff_user": user, "is_active": 1},
        ["name", "role_in_agency", "is_active"],
        as_dict=True,
    )
