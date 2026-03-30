# Skill: DocType Creation

## Description
Create a new Frappe DocType for the Horizon CRM app following established patterns.

## Steps
1. Read the DATA_MODEL.md for field specifications
2. Create the DocType JSON file with all fields, permissions, and settings
3. Create the Python controller with agency validation
4. Create the client script (JS) for form behavior
5. Create the test file with basic CRUD tests
6. Update modules.txt if needed
7. Run `bench migrate` to apply changes

## Key Patterns

### DocType JSON Structure
```json
{
  "doctype": "DocType",
  "name": "<DocType Name>",
  "module": "Horizon CRM",
  "fields": [...],
  "permissions": [...],
  "autoname": "...",
  "naming_rule": "...",
  "sort_field": "modified",
  "sort_order": "DESC"
}
```

### Controller Pattern (tenant-scoped)
```python
import frappe
from frappe.model.document import Document
from horizon_crm.utils import get_user_agency, validate_agency_access

class TravelXxx(Document):
    def validate(self):
        validate_agency_access(self)
```

### Client Script Pattern
```javascript
frappe.ui.form.on('<DocType>', {
    refresh(frm) {
        // Custom buttons, indicators
    },
    agency(frm) {
        // Filter dependent fields by agency
    }
});
```
