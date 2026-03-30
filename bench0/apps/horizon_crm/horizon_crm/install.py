"""Post-install setup for Horizon CRM.

Creates custom roles and default data.
"""

import frappe


def after_install():
    """Setup roles, default travel types, and destinations after app install."""
    create_roles()
    create_default_travel_types()
    create_default_destinations()
    frappe.db.commit()


def create_roles():
    """Create custom roles for the app."""
    roles = [
        {"role_name": "Agency Admin", "desk_access": 1, "is_custom": 1},
        {"role_name": "Agency Team Lead", "desk_access": 1, "is_custom": 1},
        {"role_name": "Agency Staff", "desk_access": 1, "is_custom": 1},
        {"role_name": "Agency Customer", "desk_access": 0, "is_custom": 1},
    ]
    for role_data in roles:
        if not frappe.db.exists("Role", role_data["role_name"]):
            role = frappe.new_doc("Role")
            role.update(role_data)
            role.insert(ignore_permissions=True)


def create_default_travel_types():
    """Create default travel type options."""
    types = [
        ("Adventure", "Outdoor activities, trekking, safaris"),
        ("Beach", "Beach holidays and coastal resorts"),
        ("Business", "Corporate travel and conferences"),
        ("Cultural", "Heritage tours, museums, cultural experiences"),
        ("Honeymoon", "Romantic getaways for couples"),
        ("Family", "Family-friendly destinations and activities"),
        ("Group", "Group tours and organized travel"),
        ("Solo", "Solo travel experiences"),
        ("Cruise", "Cruise ship holidays"),
        ("Luxury", "Premium travel experiences"),
    ]
    for name, desc in types:
        if not frappe.db.exists("Travel Type", name):
            doc = frappe.new_doc("Travel Type")
            doc.type_name = name
            doc.description = desc
            doc.insert(ignore_permissions=True)


def create_default_destinations():
    """Create a set of popular default destinations."""
    destinations = [
        ("Paris", "France", "Europe"),
        ("Bali", "Indonesia", "Asia"),
        ("Maldives", "Maldives", "Asia"),
        ("New York", "United States", "North America"),
        ("Tokyo", "Japan", "Asia"),
        ("Dubai", "UAE", "Middle East"),
        ("London", "United Kingdom", "Europe"),
        ("Rome", "Italy", "Europe"),
        ("Bangkok", "Thailand", "Asia"),
        ("Sydney", "Australia", "Oceania"),
    ]
    for name, country, region in destinations:
        if not frappe.db.exists("Travel Destination", name):
            doc = frappe.new_doc("Travel Destination")
            doc.destination_name = name
            doc.country = country
            doc.region = region
            doc.is_popular = 1
            doc.insert(ignore_permissions=True)
