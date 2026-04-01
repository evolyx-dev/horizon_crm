# Horizon CRM — Feature Plan v2.0

**Date**: 2026-04-01  
**Status**: In Progress  
**Supersedes**: Feature Plan v1.0 (2025-07-17)

---

## Executive Summary

This feature plan covers the v2.0 refactor of Horizon CRM:
1. **Public Lead-Capture Portal** — replace authenticated customer portal with guest-accessible inquiry form
2. **Permission Lockdown** — strict module access for agency roles, desk restricted to admin
3. **Customer Role Removal** — eliminate Agency Customer user type from active use
4. **Embeddable Widget** — portal form that works as an iframe in external agency websites
5. **Test Modernization** — full E2E coverage for new architecture

---

## Feature 1: Public Lead-Capture Form

### Goal
Replace the broken authenticated portal with a clean, guest-accessible HTML form that creates Travel Leads.

### Requirements
- **FR-P01**: Form accessible at `/portal/inquiry` without authentication
- **FR-P02**: Collects: full name, email, phone, destination, travel type, departure date, return date, number of travelers, budget range, notes
- **FR-P03**: Creates a `Travel Lead` (not `Travel Inquiry`) with `source = "Website"`
- **FR-P04**: Fields rendered as plain HTML (no `frappe.ui.form.make_control`)
- **FR-P05**: Client-side validation for required fields (name, email, destination, departure date)
- **FR-P06**: Server-side validation and sanitization via whitelisted API
- **FR-P07**: Rate limiting — max 10 submissions per IP per hour (via Frappe rate limiter)
- **FR-P08**: Thank-you confirmation after submission
- **FR-P09**: Works for guest users (`allow_guest=True`)
- **FR-P10**: CSRF protection via Frappe cookie

### API
```python
@frappe.whitelist(allow_guest=True)
def submit_lead(
    full_name: str,
    email: str,
    phone: str = "",
    destination: str = "",
    travel_type: str = "",
    departure_date: str = "",
    return_date: str = "",
    num_travelers: int = 1,
    budget_min: float = 0,
    budget_max: float = 0,
    notes: str = "",
) -> dict:
```

### Portal Pages
| Page | URL | Auth | Purpose |
|------|-----|------|---------|
| Inquiry Form | `/portal/inquiry` | Guest | Lead capture form |
| Thank You | `/portal/thank-you` | Guest | Post-submission confirmation |

---

## Feature 2: Embeddable Form Widget

### Goal
Allow agencies to embed the lead-capture form in their existing websites via iframe.

### Requirements
- **FR-E01**: Form works in a standalone page suitable for `<iframe>` embedding
- **FR-E02**: Clean layout without Frappe navbar/sidebar when accessed directly
- **FR-E03**: Cross-origin support via appropriate headers
- **FR-E04**: Documentation provides ready-to-paste embed snippet

### Embed Snippet
```html
<iframe
  src="https://your-crm-site.example.com/portal/inquiry"
  width="100%"
  height="700"
  frameborder="0"
  style="border: none; border-radius: 12px;"
></iframe>
```

---

## Feature 3: Permission Lockdown

### Goal
Ensure agency roles (Admin, Staff, Team Lead) can only access Horizon CRM features, not Frappe system internals.

### Requirements
- **FR-L01**: Agency Staff sees only: Horizon CRM, Desk
- **FR-L02**: Agency Team Lead sees only: Horizon CRM, Desk
- **FR-L03**: Agency Admin sees only: Horizon CRM, Desk (no Automation, Workflow, Core, Custom, etc.)
- **FR-L04**: Only System Manager/Administrator can access: Setup, Core, Custom, Automation, Workflow, Integrations, Email, Printing, Website, Contacts, Geo
- **FR-L05**: Module access enforced via `block_modules` in hooks.py
- **FR-L06**: Agency Customer role permissions removed from all DocType JSONs

### Module Access Matrix

| Module | System Admin | Agency Admin | Team Lead | Staff |
|--------|:---:|:---:|:---:|:---:|
| Horizon CRM | ✅ | ✅ | ✅ | ✅ |
| Desk | ✅ | ✅ | ✅ | ✅ |
| Automation | ✅ | ❌ | ❌ | ❌ |
| Workflow | ✅ | ❌ | ❌ | ❌ |
| Core | ✅ | ❌ | ❌ | ❌ |
| Custom | ✅ | ❌ | ❌ | ❌ |
| Contacts | ✅ | ❌ | ❌ | ❌ |
| Email | ✅ | ❌ | ❌ | ❌ |
| Geo | ✅ | ❌ | ❌ | ❌ |
| Integrations | ✅ | ❌ | ❌ | ❌ |
| Printing | ✅ | ❌ | ❌ | ❌ |
| Website | ✅ | ❌ | ❌ | ❌ |

---

## Feature 4: Customer Role Removal

### Goal
Remove `Agency Customer` from active use. Customers do not log in.

### Requirements
- **FR-C01**: No customer user accounts created
- **FR-C02**: `Agency Customer` role definition kept (for backward compat) but not assigned
- **FR-C03**: Portal menu items removed
- **FR-C04**: Customer home page redirect removed
- **FR-C05**: `Travel Customer` DocType remains — managed by staff
- **FR-C06**: `portal_user` field on `Travel Customer` becomes optional/unused

---

## Feature 5: Test Coverage

### Goal
100% E2E coverage for the new architecture.

### Test Changes
| Spec File | Change |
|-----------|--------|
| `01-auth.spec.ts` | Remove customer login test, add module restriction test |
| `06-security.spec.ts` | Update customer-role tests to guest tests |
| `07-portal.spec.ts` | Rewrite entirely — test public lead form, guest API, rate limiting |
| `13-validation-negative.spec.ts` | Update portal API tests, remove customer RBAC tests |
| `global-setup.ts` | Remove customer user creation |
| `global-teardown.ts` | Add lead cleanup, remove customer-specific cleanup |
| `fixtures.ts` | Remove customer from USERS |

### New Test Coverage
- Guest can submit lead via form
- Guest can submit lead via API
- Rate limiting blocks excessive submissions
- Lead created with correct fields and source="Website"
- Form validates required fields client-side
- API validates required fields server-side
- Thank-you page shown after submission
- Form renders without authentication
- Module access restricted for agency roles

---

## Non-Goals (Out of Scope)

- Customer self-service booking management
- Customer login / authentication
- Customer payment tracking portal
- Customer feedback portal
- Customer itinerary viewing
- Real-time notifications to customers
