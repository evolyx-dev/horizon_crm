"""Permission query conditions and has_permission hooks for Horizon CRM.

These enforce row-level multi-tenancy isolation by filtering data
based on the user's associated Travel Agency.
"""

import frappe
from horizon_crm.utils import get_user_agency


def _agency_query_condition(doctype: str, user: str | None = None) -> str:
    """Generic agency-based query condition for tenant-scoped DocTypes."""
    if not user:
        user = frappe.session.user
    if user == "Administrator" or "System Manager" in frappe.get_roles(user):
        return ""

    agency = get_user_agency(user)
    if not agency:
        return "1=0"

    return f"`tab{doctype}`.`agency` = {frappe.db.escape(agency)}"


def _agency_has_permission(doc, ptype: str | None = None, user: str | None = None) -> bool:
    """Generic agency-based permission check for tenant-scoped DocTypes."""
    if not user:
        user = frappe.session.user
    if user == "Administrator" or "System Manager" in frappe.get_roles(user):
        return True

    agency = get_user_agency(user)
    if not agency:
        return False

    return doc.agency == agency


# --- Query conditions (return SQL WHERE clause string) ---

def travel_inquiry_query(user: str | None = None) -> str:
    return _agency_query_condition("Travel Inquiry", user)

def travel_booking_query(user: str | None = None) -> str:
    return _agency_query_condition("Travel Booking", user)

def travel_customer_query(user: str | None = None) -> str:
    return _agency_query_condition("Travel Customer", user)

def travel_itinerary_query(user: str | None = None) -> str:
    return _agency_query_condition("Travel Itinerary", user)

def travel_supplier_query(user: str | None = None) -> str:
    return _agency_query_condition("Travel Supplier", user)

def travel_feedback_query(user: str | None = None) -> str:
    return _agency_query_condition("Travel Feedback", user)

def travel_agency_staff_query(user: str | None = None) -> str:
    return _agency_query_condition("Travel Agency Staff", user)

def travel_team_query(user: str | None = None) -> str:
    return _agency_query_condition("Travel Team", user)


# --- has_permission hooks (return bool) ---

def travel_inquiry_permission(doc, ptype=None, user=None) -> bool:
    return _agency_has_permission(doc, ptype, user)

def travel_booking_permission(doc, ptype=None, user=None) -> bool:
    return _agency_has_permission(doc, ptype, user)

def travel_customer_permission(doc, ptype=None, user=None) -> bool:
    return _agency_has_permission(doc, ptype, user)

def travel_itinerary_permission(doc, ptype=None, user=None) -> bool:
    return _agency_has_permission(doc, ptype, user)

def travel_supplier_permission(doc, ptype=None, user=None) -> bool:
    return _agency_has_permission(doc, ptype, user)

def travel_feedback_permission(doc, ptype=None, user=None) -> bool:
    return _agency_has_permission(doc, ptype, user)

def travel_agency_staff_permission(doc, ptype=None, user=None) -> bool:
    return _agency_has_permission(doc, ptype, user)

def travel_team_permission(doc, ptype=None, user=None) -> bool:
    return _agency_has_permission(doc, ptype, user)
