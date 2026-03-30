app_name = "horizon_crm"
app_title = "Horizon CRM"
app_publisher = "Horizon Dev"
app_description = "Multi-tenant Travel Agency CRM"
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
		"route": "/app/travel-agency",
	}
]

# Includes in <head>
# ------------------

app_include_css = "/assets/horizon_crm/css/horizon.css"
app_include_js = "/assets/horizon_crm/js/horizon.js"

web_include_css = "/assets/horizon_crm/css/horizon_portal.css"

# include custom scss in every website theme (without file extension ".scss")
# website_theme_scss = "horizon_crm/public/scss/website"

# include js, css files in header of web form
# webform_include_js = {"doctype": "public/js/doctype.js"}
# webform_include_css = {"doctype": "public/css/doctype.css"}

# include js in page
# page_js = {"page" : "public/js/file.js"}

# include js in doctype views
# doctype_js = {"doctype" : "public/js/doctype.js"}
# doctype_list_js = {"doctype" : "public/js/doctype_list.js"}
# doctype_tree_js = {"doctype" : "public/js/doctype_tree.js"}
# doctype_calendar_js = {"doctype" : "public/js/doctype_calendar.js"}

# Svg Icons
# ------------------
# include app icons in desk
# app_include_icons = "horizon_crm/public/icons.svg"

# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "login"

# website user home page (by Role)
role_home_page = {
	"Agency Customer": "portal",
}

portal_menu_items = [
	{"title": "My Bookings", "route": "/portal/bookings", "role": "Agency Customer"},
	{"title": "New Inquiry", "route": "/portal/inquiry", "role": "Agency Customer"},
]

# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]

# automatically load and sync documents of this doctype from downstream apps
# importable_doctypes = [doctype_1]

# Jinja
# ----------

# add methods and filters to jinja environment
# jinja = {
# 	"methods": "horizon_crm.utils.jinja_methods",
# 	"filters": "horizon_crm.utils.jinja_filters"
# }

# Installation
# ------------

# before_install = "horizon_crm.install.before_install"
after_install = "horizon_crm.install.after_install"

# Uninstallation
# ------------

# before_uninstall = "horizon_crm.uninstall.before_uninstall"
# after_uninstall = "horizon_crm.uninstall.after_uninstall"

# Integration Setup
# ------------------
# To set up dependencies/integrations with other apps
# Name of the app being installed is passed as an argument

# before_app_install = "horizon_crm.utils.before_app_install"
# after_app_install = "horizon_crm.utils.after_app_install"

# Integration Cleanup
# -------------------
# To clean up dependencies/integrations with other apps
# Name of the app being uninstalled is passed as an argument

# before_app_uninstall = "horizon_crm.utils.before_app_uninstall"
# after_app_uninstall = "horizon_crm.utils.after_app_uninstall"

# Desk Notifications
# ------------------
# See frappe.core.notifications.get_notification_config

# notification_config = "horizon_crm.notifications.get_notification_config"

# Permissions
# -----------
# Permissions evaluated in scripted ways

permission_query_conditions = {
	"Travel Inquiry": "horizon_crm.permissions.travel_inquiry_query",
	"Travel Booking": "horizon_crm.permissions.travel_booking_query",
	"Travel Customer": "horizon_crm.permissions.travel_customer_query",
	"Travel Itinerary": "horizon_crm.permissions.travel_itinerary_query",
	"Travel Supplier": "horizon_crm.permissions.travel_supplier_query",
	"Travel Feedback": "horizon_crm.permissions.travel_feedback_query",
	"Travel Agency Staff": "horizon_crm.permissions.travel_agency_staff_query",
	"Travel Team": "horizon_crm.permissions.travel_team_query",
}

has_permission = {
	"Travel Inquiry": "horizon_crm.permissions.travel_inquiry_permission",
	"Travel Booking": "horizon_crm.permissions.travel_booking_permission",
	"Travel Customer": "horizon_crm.permissions.travel_customer_permission",
	"Travel Itinerary": "horizon_crm.permissions.travel_itinerary_permission",
	"Travel Supplier": "horizon_crm.permissions.travel_supplier_permission",
	"Travel Feedback": "horizon_crm.permissions.travel_feedback_permission",
	"Travel Agency Staff": "horizon_crm.permissions.travel_agency_staff_permission",
	"Travel Team": "horizon_crm.permissions.travel_team_permission",
}

# Document Events
# ---------------
# Hook on document methods and events

# doc_events = {
# 	"*": {
# 		"on_update": "method",
# 		"on_cancel": "method",
# 		"on_trash": "method"
# 	}
# }

# Scheduled Tasks
# ---------------

# scheduler_events = {
# 	"all": [
# 		"horizon_crm.tasks.all"
# 	],
# 	"daily": [
# 		"horizon_crm.tasks.daily"
# 	],
# 	"hourly": [
# 		"horizon_crm.tasks.hourly"
# 	],
# 	"weekly": [
# 		"horizon_crm.tasks.weekly"
# 	],
# 	"monthly": [
# 		"horizon_crm.tasks.monthly"
# 	],
# }

# Testing
# -------

# before_tests = "horizon_crm.install.before_tests"

# Extend DocType Class
# ------------------------------
#
# Specify custom mixins to extend the standard doctype controller.
# extend_doctype_class = {
# 	"Task": "horizon_crm.custom.task.CustomTaskMixin"
# }

# Overriding Methods
# ------------------------------
#
# override_whitelisted_methods = {
# 	"frappe.desk.doctype.event.event.get_events": "horizon_crm.event.get_events"
# }
#
# each overriding function accepts a `data` argument;
# generated from the base implementation of the doctype dashboard,
# along with any modifications made in other Frappe apps
# override_doctype_dashboards = {
# 	"Task": "horizon_crm.task.get_dashboard_data"
# }

# exempt linked doctypes from being automatically cancelled
#
# auto_cancel_exempted_doctypes = ["Auto Repeat"]

# Ignore links to specified DocTypes when deleting documents
# -----------------------------------------------------------

# ignore_links_on_delete = ["Communication", "ToDo"]

# Request Events
# ----------------
# before_request = ["horizon_crm.utils.before_request"]
# after_request = ["horizon_crm.utils.after_request"]

# Job Events
# ----------
# before_job = ["horizon_crm.utils.before_job"]
# after_job = ["horizon_crm.utils.after_job"]

# User Data Protection
# --------------------

# user_data_fields = [
# 	{
# 		"doctype": "{doctype_1}",
# 		"filter_by": "{filter_by}",
# 		"redact_fields": ["{field_1}", "{field_2}"],
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_2}",
# 		"filter_by": "{filter_by}",
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_3}",
# 		"strict": False,
# 	},
# 	{
# 		"doctype": "{doctype_4}"
# 	}
# ]

# Authentication and authorization
# --------------------------------

# auth_hooks = [
# 	"horizon_crm.auth.validate"
# ]

# Automatically update python controller files with type annotations for this app.
export_python_type_annotations = True

# Require all whitelisted methods to have type annotations
require_type_annotated_api_methods = True

# default_log_clearing_doctypes = {
# 	"Logging DocType Name": 30  # days to retain logs
# }

# Translation
# ------------
# List of apps whose translatable strings should be excluded from this app's translations.
# ignore_translatable_strings_from = []

