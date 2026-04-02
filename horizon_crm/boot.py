"""Desk boot helpers for Horizon CRM."""

from __future__ import annotations

import frappe
from frappe import _
from frappe.desk.desktop import Workspace as DeskWorkspace
from frappe.desk.utils import slug
from frappe.utils import cstr


WORKSPACE_NAME = "Horizon CRM"
SECTION_LABELS = {
	"CRM Pipeline": "Pipeline",
	"Customers & Communication": "Customers",
	"Billing & Payments": "Billing",
	"Trip Planning": "Trip Planning",
	"Team & Organization": "Team",
	"Settings & Configuration": "Settings",
}


def boot_session(bootinfo: frappe._dict) -> None:
	"""Expose the Horizon workspace navigation model to desk JS."""
	bootinfo.horizon_crm = {
		"workspace_name": WORKSPACE_NAME,
		"workspace_route": _route_for_workspace(WORKSPACE_NAME),
		"app_nav": get_app_nav(),
	}


def get_app_nav() -> dict[str, object]:
	"""Return permission-filtered app navigation derived from workspace card groups."""
	if not frappe.db.exists("Workspace", WORKSPACE_NAME):
		return {"dashboard": None, "sections": []}

	workspace = DeskWorkspace({"name": WORKSPACE_NAME, "title": WORKSPACE_NAME, "public": 1})
	sections = []
	for group in workspace.get_links():
		items = []
		for item in group.get("links", []):
			route = _route_for_item(item)
			if not route:
				continue

			items.append(
				{
					"label": cstr(item.get("label")),
					"route": route,
					"link_type": cstr(item.get("link_type")),
					"link_to": cstr(item.get("link_to")),
				}
			)

		if not items:
			continue

		sections.append(
			{
				"label": SECTION_LABELS.get(cstr(group.get("label")), cstr(group.get("label"))),
				"items": items,
			}
		)

	return {
		"dashboard": {"label": _("Dashboard"), "route": _route_for_workspace(WORKSPACE_NAME)},
		"sections": sections,
	}


def _route_for_item(item: dict[str, object]) -> str | None:
	link_type = cstr(item.get("link_type"))
	link_to = cstr(item.get("link_to"))
	if not link_type or not link_to:
		return None

	if link_type == "Workspace":
		return _route_for_workspace(link_to)

	if link_type in {"DocType", "Page"}:
		return f"/app/{slug(link_to)}"

	if link_type == "Report":
		return f"/app/query-report/{slug(link_to)}"

	return None


def _route_for_workspace(workspace_name: str) -> str:
	return f"/app/{slug(workspace_name)}"
