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
}

portal_menu_items = [
	{"title": "My Bookings", "route": "/portal/bookings", "role": "Agency Customer"},
	{"title": "New Inquiry", "route": "/portal/inquiry", "role": "Agency Customer"},
]

# Installation
# ------------

after_install = "horizon_crm.install.after_install"

# Permissions
# -----------
# Standard role-based permissions are defined in DocType JSON files.
# In site-per-tenant architecture, each site is a separate tenant
# so no custom permission_query_conditions are needed.

# Automatically update python controller files with type annotations for this app.
export_python_type_annotations = True

# Require all whitelisted methods to have type annotations
require_type_annotated_api_methods = True
