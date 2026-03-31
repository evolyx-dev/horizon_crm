"""Post-install setup for Horizon CRM.

Creates custom roles and default data.
"""

import frappe


def after_install():
    """Setup roles, default travel types, destinations, and agency settings after app install."""
    create_roles()
    create_default_travel_types()
    create_default_destinations()
    create_default_lost_reasons()
    initialize_agency_settings()
    create_kanban_boards()
    set_branding()
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


def initialize_agency_settings():
    """Initialize the Travel Agency singleton with default values."""
    agency = frappe.get_single("Travel Agency")
    if not agency.agency_name:
        agency.agency_name = frappe.local.site.replace(".localhost", "").replace(".", " ").title()
        agency.contact_email = "admin@example.com"
        agency.status = "Active"
        agency.max_staff = 10
        agency.save(ignore_permissions=True)


def create_kanban_boards():
    """Create default Kanban boards for visual pipeline management."""
    boards = [
        {
            "name": "Inquiry Pipeline",
            "doctype_ref": "Travel Inquiry",
            "field": "status",
            "columns": {
                "New": "Blue",
                "Contacted": "Orange",
                "Quoted": "Yellow",
                "Won": "Green",
                "Lost": "Red",
            },
        },
        {
            "name": "Booking Tracker",
            "doctype_ref": "Travel Booking",
            "field": "status",
            "columns": {
                "Confirmed": "Green",
                "In Progress": "Orange",
                "Completed": "Blue",
                "Cancelled": "Red",
            },
        },
    ]
    for board in boards:
        if not frappe.db.exists("Kanban Board", board["name"]):
            kb = frappe.new_doc("Kanban Board")
            kb.kanban_board_name = board["name"]
            kb.reference_doctype = board["doctype_ref"]
            kb.field_name = board["field"]
            kb.private = 0
            kb.show_labels = 1
            for col_name, color in board["columns"].items():
                kb.append("columns", {
                    "column_name": col_name,
                    "status": "Active",
                    "indicator": color,
                })
            kb.insert(ignore_permissions=True)


def set_branding():
    """Set white label branding to Evolyx Lab."""
    # Website Settings
    ws = frappe.get_single("Website Settings")
    ws.app_name = "Evolyx Lab"
    ws.footer_powered = "Powered by Evolyx Lab"
    ws.copyright = "Evolyx Lab"
    ws.save(ignore_permissions=True)

    # System Settings
    ss = frappe.get_single("System Settings")
    ss.app_name = "Evolyx Lab"
    ss.save(ignore_permissions=True)

    # Navbar Settings - set custom logo
    ns = frappe.get_single("Navbar Settings")
    ns.app_logo = "/assets/horizon_crm/images/logo.svg"
    ns.save(ignore_permissions=True)


def create_default_lost_reasons():
    """Create default lost reasons for tracking why inquiries are lost."""
    reasons = [
        ("Competitor", "Customer chose a competitor agency"),
        ("Budget Too High", "Our pricing exceeded customer budget"),
        ("Bad Timing", "Customer could not travel at the proposed dates"),
        ("No Response", "Customer stopped responding"),
        ("Changed Plans", "Customer cancelled or changed travel plans"),
        ("Destination Change", "Customer wanted a different destination"),
        ("Service Dissatisfaction", "Customer was unhappy with service quality"),
        ("Other", "Other reason not listed above"),
    ]
    for name, desc in reasons:
        if not frappe.db.exists("Travel Lost Reason", name):
            doc = frappe.new_doc("Travel Lost Reason")
            doc.reason = name
            doc.description = desc
            doc.insert(ignore_permissions=True)
