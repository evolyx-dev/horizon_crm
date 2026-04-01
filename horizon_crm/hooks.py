app_name = "horizon_crm"
app_title = "Horizon CRM"
app_publisher = "Horizon Dev"
app_description = "Multi-tenant Travel Agency CRM for Frappe"
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

website_context = {
	"favicon": "/assets/horizon_crm/images/favicon.svg",
}

# Home Pages
# ----------

role_home_page = {
	"Agency Staff": "travel-inquiry",
	"Agency Team Lead": "travel-inquiry",
	"Agency Admin": "travel-inquiry",
}

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
# Only Horizon CRM and Desk modules are allowed for agency roles.
# All system/framework modules are blocked.
_system_modules = [
	"Setup", "Core", "Custom", "Automation", "Workflow",
	"Email", "Contacts", "Geo", "Integrations", "Printing", "Website",
]

block_modules = {
	"Agency Staff": _system_modules,
	"Agency Team Lead": _system_modules,
	"Agency Admin": _system_modules,
}

# Automatically update python controller files with type annotations for this app.
export_python_type_annotations = True

# Require all whitelisted methods to have type annotations
require_type_annotated_api_methods = True

# Fixtures
# --------
# Export standard records (workspace, charts, number cards) with the app
fixtures = [
	{
		"dt": "Workspace",
		"filters": [["module", "=", "Horizon CRM"]],
	},
	{
		"dt": "Workspace Sidebar",
		"filters": [["module", "=", "Horizon CRM"]],
	},
	{
		"dt": "Number Card",
		"filters": [["module", "=", "Horizon CRM"]],
	},
	{
		"dt": "Dashboard Chart",
		"filters": [["module", "=", "Horizon CRM"]],
	},
]
