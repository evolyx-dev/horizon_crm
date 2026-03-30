# Copyright (c) 2026, Horizon Dev and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

from horizon_crm.utils import validate_agency_access


class TravelTeam(Document):
	def validate(self):
		validate_agency_access(self)
