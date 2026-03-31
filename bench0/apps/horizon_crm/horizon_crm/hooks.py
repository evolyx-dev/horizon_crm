app_name = "horizon_crm"
app_title = "Horizon CRM"
app_publisher = "Horizon Dev"
app_description = "Travel Agency CRM for Frappe"
app_email = "dev@horizon.io"
app_license = "agpl-3.0"
app_logo_url = "/assets/horizon_crm/images/logo.svg"

# Apps
# ------------------

add_to_apps_screen = [
	{
		"name": "horizon_crm",
		"logo": "/assets/horizon_crm/images/logo.svg",
		"title": "Horizon CRM",
		"route": "/app/travel-inquiry",
	}
]

# Includes in <head>
# ------------------

app_include_css = "/assets/horizon_crm/css/horizon.css"
app_include_js = "/assets/horizon_crm/js/horizon.js"

web_include_css = "/assets/horizon_crm/css/horizon_portal.css"

# Home Pages
# ----------

role_home_page = {
	"Agency Customer": "portal",
	"Agency Staff": "travel-inquiry",
	"Agency Team Lead": "travel-inquiry",
	"Agency Admin": "travel-inquiry",
}

portal_menu_items = [
	{"title": "My Bookings", "route": "/portal/bookings", "role": "Agency Customer"},
	{"title": "New Inquiry", "route": "/portal/inquiry", "role": "Agency Customer"},
]

# Installation
# ------------

after_install = "horizon_crm.install.after_install"

# Bench CLI Commands
# ------------------

commands = "horizon_crm.commands.commands"

# Permissions
# -----------
# Standard role-based permissions are defined in DocType JSON files.
# In site-per-tenant architecture, each site is a separate tenant
# so no custom permission_query_conditions are needed.

# Block specific pages for non-admin roles
# Agency Staff and Team Leads should not access Setup or Module Setup pages
block_modules = {
	"Agency Staff": ["Setup", "Core", "Email", "Integrations", "Printing", "Website"],
	"Agency Team Lead": ["Setup", "Core", "Email", "Integrations", "Printing"],
	"Agency Customer": ["Setup", "Core", "Email", "Integrations", "Printing", "Website", "Horizon CRM"],
}

# Automatically update python controller files with type annotations for this app.
export_python_type_annotations = True

# Require all whitelisted methods to have type annotations
require_type_annotated_api_methods = True
