# Horizon CRM — Refactor Plan v2.0

**Date**: 2026-04-01  
**Status**: In Progress  
**Scope**: Portal simplification, permission lockdown, customer role removal

---

## 1. Problem Statement

Three critical issues identified in the current architecture:

### 1.1 Customer User Type Is Wrong
- Customer user (`customer@agency1.test`) was set as **System User** (gives full desk access)
- Screenshot evidence: all 14 modules visible (Automation, Core, Custom, Workflow, etc.)
- The `Agency Customer` role was designed with `desk_access=0` (portal only), but the user type override bypasses this

### 1.2 Module Access Too Permissive
- Agency Admin, Staff, and Team Lead can see system modules (Automation, Workflow, Core, Custom, Geo, Contacts)
- `block_modules` in hooks.py only blocks a few modules — not enough
- Only System Administrator should have create/manage access to desk configuration

### 1.3 Portal Forms Are Broken
- Portal inquiry form at `/portal/inquiry` uses `frappe.ui.form.make_control()` (desk-only JS API)
- Website Users don't receive the desk JS bundle → fields never render
- Screenshot shows only header + "Submit Inquiry" button, no form fields
- Portal requires authentication — overkill for travel inquiry submission

---

## 2. Architectural Decision

### Remove Customer Authentication. Convert Portal to Public Lead Form.

**Rationale:**
1. A minimal travel agency CRM does not need customer login/booking management
2. Customer self-service adds complexity without proportional value
3. The portal's primary value is **lead generation** — capturing trip requests from the agency website
4. Travel agency staff should manage all bookings, inquiries, and customer communication
5. The `Travel Lead` DocType already has all needed fields (name, email, phone, destination, travel type, budget, dates)
6. A public form is embeddable/iframeable in any agency website

### New Architecture

| Aspect | Before (v1) | After (v2) |
|--------|-------------|------------|
| **Portal** | Authenticated customer dashboard | Public lead-capture form (guest-accessible) |
| **Inquiry from portal** | Creates `Travel Inquiry` (requires login) | Creates `Travel Lead` (no auth needed) |
| **Customer login** | Required for portal | Removed — no customer accounts |
| **CRM users** | Admin + Staff + Team Lead + Customer | Admin + Staff + Team Lead only |
| **Booking management** | Customer views own bookings | Staff manages everything |
| **Module access** | Loosely restricted | Strict — only Horizon CRM + Desk for staff |
| **Portal form tech** | `frappe.ui.form.make_control` (broken) | Plain HTML form with `allow_guest=True` API |
| **Embeddability** | Not possible (requires Frappe session) | Standalone HTML — works as iframe |
| **Multi-tenant portal** | Not functional | Each site gets its own `/portal/inquiry` endpoint |

---

## 3. What's Being Removed

| Component | File(s) | Reason |
|-----------|---------|--------|
| `Agency Customer` role usage | `install.py`, `hooks.py` | No more customer users |
| Customer portal dashboard | `www/portal/index.html`, `www/portal/index.py` | No authenticated portal |
| Customer bookings page | `www/portal/bookings.html`, `www/portal/bookings.py` | Staff manages bookings |
| Authenticated portal APIs | `api/portal.py` (get_my_bookings, get_booking_detail, submit_inquiry, submit_feedback) | Replaced with guest lead API |
| `portal_menu_items` | `hooks.py` | No portal menu |
| `role_home_page["Agency Customer"]` | `hooks.py` | No customer home page |
| Portal test file (old) | `tests/e2e/07-portal.spec.ts` | Rewritten for public form |
| Customer user in tests | `global-setup.ts`, `fixtures.ts` | No customer user needed |

## 4. What's Being Added

| Component | File(s) | Purpose |
|-----------|---------|---------|
| Public lead form | `www/portal/inquiry.html` (rewritten) | Plain HTML form, guest-accessible |
| Guest lead API | `api/portal.py` (rewritten) | `submit_lead()` with `allow_guest=True`, rate limiting |
| Contact fields on form | `www/portal/inquiry.html` | Name, email, phone (required for lead creation) |
| Thank-you page | `www/portal/thank-you.html` | Post-submission confirmation |
| Embeddable snippet | In docs | `<iframe>` code agencies paste into their websites |
| Strict `block_modules` | `hooks.py` | Only Horizon CRM + Desk for agency roles |
| Module Profile | `install.py` | Pre-configured module access via Frappe Module Profile |

## 5. What's Being Modified

| Component | Change |
|-----------|--------|
| `hooks.py` | Remove `portal_menu_items`, update `role_home_page`, expand `block_modules` |
| `install.py` | Keep `Agency Customer` role definition (dormant), add Module Profile creation |
| `api/portal.py` | Replace all methods with single `submit_lead()` guest API |
| `www/portal/inquiry.html` | Rewrite as plain HTML form (no `frappe.ui.form.make_control`) |
| `www/portal/inquiry.py` | Allow guest access, provide travel types and destinations |
| `tests/e2e/07-portal.spec.ts` | Rewrite for public lead form tests |
| `tests/e2e/01-auth.spec.ts` | Remove customer login test, add module restriction tests |
| `tests/e2e/06-security.spec.ts` | Update customer access tests → guest access tests |
| `tests/e2e/13-validation-negative.spec.ts` | Update portal API negative tests |
| `global-setup.ts` | Remove customer user creation and Travel Customer record |
| `global-teardown.ts` | Remove customer-specific cleanup, add lead cleanup |
| `fixtures.ts` | Remove customer from USERS |
| All DocType permissions | Remove `Agency Customer` permission entries |

---

## 6. Migration Path

1. No data migration needed — this is a structural refactor
2. Existing `Travel Customer` records remain untouched (staff-managed)
3. Existing `Travel Lead` records remain untouched
4. The `Agency Customer` role stays defined but is not assigned to any user
5. `bench migrate` applies permission changes from updated DocType JSONs
