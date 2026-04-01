# Horizon CRM — Task Breakdown v2.0

**Date**: 2026-04-01  
**Tracks**: REFACTOR_PLAN.md + FEATURE_PLAN_V2.md

---

## Phase 1: Portal Rewrite (Lead-Capture Form)

### Task 1.1: Rewrite `api/portal.py`
- Remove: `get_my_bookings()`, `get_booking_detail()`, `submit_inquiry()`, `submit_feedback()`, `_get_current_customer()`
- Add: `submit_lead()` with `allow_guest=True`
- Add: `get_portal_context()` with `allow_guest=True` (returns travel types + destinations)
- Input validation: name, email required; sanitize all string inputs
- Rate limiting: `frappe.rate_limiter.limit(key="portal_lead:" + ip, limit=10, seconds=3600)`
- Creates `Travel Lead` with `source="Website"`

### Task 1.2: Rewrite `www/portal/inquiry.html`
- Remove: all `frappe.ui.form.make_control` JavaScript
- Add: plain HTML `<form>` with standard inputs
- Fields: full_name, email, phone, destination (datalist from context), travel_type (select from context), departure_date, return_date, num_travelers, budget_min, budget_max, notes
- Client-side validation via HTML5 `required` + JS
- Submit via `fetch()` to `/api/method/horizon_crm.api.portal.submit_lead`
- On success: redirect to `/portal/thank-you`
- Responsive layout using existing portal CSS

### Task 1.3: Rewrite `www/portal/inquiry.py`
- Remove: authentication check (`frappe.session.user == "Guest"` → throw)
- Add: `context.show_sidebar = False` (clean layout for iframe)
- Provide `travel_types` and `destinations` in context
- Set `context.no_cache = 1`

### Task 1.4: Create `www/portal/thank-you.html` + `thank-you.py`
- Simple confirmation page: "Your inquiry has been submitted!"
- No auth required
- Link back to form for another submission

### Task 1.5: Remove old portal pages
- Delete: `www/portal/index.html`, `www/portal/index.py`
- Delete: `www/portal/bookings.html`, `www/portal/bookings.py`

---

## Phase 2: Permission Lockdown

### Task 2.1: Update `hooks.py`
- Remove: `portal_menu_items`
- Remove: `role_home_page["Agency Customer"]`
- Update: `block_modules` — all three agency roles block everything except Horizon CRM and Desk
- Remove: `override_whitelisted_methods = {}` (unused)

### Task 2.2: Update `install.py`
- Keep `Agency Customer` role definition (dormant)
- Ensure Module Profile is not overly configured (Frappe handles module blocking via `block_modules`)

### Task 2.3: Remove `Agency Customer` permissions from DocType JSONs
- Audit all DocType JSON files for `Agency Customer` permission entries
- Remove any `Agency Customer` rows from `permissions` arrays
- This ensures the role has zero DocType access even if accidentally assigned

---

## Phase 3: Test Rewrite

### Task 3.1: Update `fixtures.ts`
- Remove `customer` from `USERS` object
- Keep all other helpers intact

### Task 3.2: Update `global-setup.ts`
- Remove customer user creation
- Remove Travel Customer creation for portal tests
- Remove customer role verification

### Task 3.3: Update `global-teardown.ts`
- Add: cleanup of test Travel Leads (by email pattern)
- Remove: customer-specific booking/inquiry/feedback cleanup
- Keep: all staff-related cleanup

### Task 3.4: Rewrite `07-portal.spec.ts`
New tests:
1. Portal inquiry form loads without authentication
2. Form renders all expected fields (name, email, phone, destination, etc.)
3. Guest can submit lead via form API
4. Lead created with correct data and source="Website"
5. Required field validation (missing name → error)
6. Required field validation (missing email → error)
7. Thank-you page loads after submission
8. Rate limiting returns 429 after excessive submissions (optional — hard to test in E2E)

### Task 3.5: Update `01-auth.spec.ts`
- Remove: "Customer sees restricted desk with no admin access" test
- Add: "Agency Staff cannot access system modules" test
- Add: "Agency Admin cannot access Setup module" test

### Task 3.6: Update `06-security.spec.ts`
- Change: "Customer cannot access admin resources" → "Guest cannot access admin resources"
- Change: "Customer cannot create staff records" → "Guest cannot create staff records"
- Keep: CSRF, XSS, SQL injection tests unchanged

### Task 3.7: Update `13-validation-negative.spec.ts`
- Remove: "Portal API — negative cases" section (old submit_inquiry, submit_feedback, get_booking_detail tests)
- Add: "Public Lead API — negative cases" section:
  - Submitting lead without name returns error
  - Submitting lead without email returns error
  - Submitting lead with invalid email returns error
- Remove: "Customer portal user cannot create booking via API" test
- Remove: "Customer cannot write to inquiry" test
- Update: any remaining tests that reference customer user

---

## Phase 4: Documentation Update

### Task 4.1: Update PRD.md
- Update Section 3.5 (Customer persona) — now a passive entity, no login
- Update Section 4.8 (Customer Portal) — now public lead form
- Update data model — remove portal_user references

### Task 4.2: Update AGENCY_ADMIN_GUIDE.md
- Add: "Managing Website Leads" section
- Add: "Embedding the Lead Form" section with iframe snippet
- Remove: any customer portal management references
- Update: permissions section to reflect lockdown

### Task 4.3: Update STAFF_GUIDE.md
- Add: "Working with Website Leads" section (leads from portal)
- Update: workflow to show Lead → Inquiry → Booking pipeline
- Remove: customer portal references

### Task 4.4: Update SYSTEM_ADMIN_GUIDE.md
- Update: role descriptions (no more Agency Customer active users)
- Update: module access matrix
- Add: portal configuration section

### Task 4.5: Rewrite CUSTOMER_PORTAL_GUIDE.md
- Rename to: "Portal & Lead Form Guide"
- Document: public form, embed snippet, lead workflow
- Remove: all customer login/dashboard/booking sections

### Task 4.6: Update TESTING_GUIDE.md
- Update: test structure table
- Update: test suite coverage table
- Remove: customer-related test descriptions
- Add: portal lead form test descriptions

### Task 4.7: Update USER_GUIDE.md
- Remove: customer portal usage sections
- Add: lead form section

### Task 4.8: Update ARCHITECTURE.md & DATA_MODEL.md
- Update: permission model documentation
- Update: portal architecture description
- Remove: customer authentication flow

### Task 4.9: Update DEVELOPMENT_GUIDE.md
- Update: project structure
- Update: API reference to show new `submit_lead` endpoint

---

## Execution Order

```
Phase 1 (Portal)  →  Phase 2 (Permissions)  →  bench migrate  →  Phase 3 (Tests)  →  Phase 4 (Docs)
```

Each phase is committed separately for clean git history.
