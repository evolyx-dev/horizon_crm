# Horizon CRM — Task Breakdown

**Version:** 2.0  
**Date:** 2026-03-31  
**Reference:** [FRAPPE_CRM_COMPARISON.md](../research/FRAPPE_CRM_COMPARISON.md)

---

## Completed Phases (v1.0)

<details>
<summary>Phase 1: Foundation & Setup ✅</summary>

- [x] Research Frappe framework, CRM app, DocTypes, permissions
- [x] Create Knowledge Base documentation
- [x] Create `horizon_crm` Frappe app
- [x] Setup Docker environment (docker-compose.yml, Dockerfile, init.sh)
- [x] Configure hooks.py with app metadata, CSS/JS includes
</details>

<details>
<summary>Phase 2: Core DocTypes ✅</summary>

- [x] Travel Agency (singleton, admin_user, agency_code generation)
- [x] Travel Agency Staff (role assignment hooks via ROLE_MAP)
- [x] Travel Team, Travel Customer, Travel Destination, Travel Type
- [x] Travel Inquiry + Traveler child table (New→Contacted→Quoted→Won→Lost)
- [x] Travel Itinerary + Day Item child table (auto total_cost calculation)
- [x] Travel Booking + Payment child table (auto paid/balance calculation)
- [x] Travel Supplier + Service child table
- [x] Travel Feedback (rating, experience level, auto submitted_on)
- [x] Seed data: 10 destinations, 10 travel types via install.py
</details>

<details>
<summary>Phase 3: Security & Roles ✅</summary>

- [x] Custom roles: Agency Admin, Agency Team Lead, Agency Staff, Agency Customer
- [x] Role-based permissions per DocType
- [x] Auto-role assignment via Travel Agency Staff after_insert hook
- [x] Max staff limit enforcement
</details>

<details>
<summary>Phase 4: Business Logic ✅</summary>

- [x] Inquiry status pipeline + Won notification
- [x] Inquiry-to-Booking conversion API (create_booking_from_inquiry)
- [x] Booking payment auto-calculation (paid_amount, balance_amount)
- [x] Itinerary total_cost auto-calculation from day items
- [x] Feedback submitted_on auto-set
</details>

<details>
<summary>Phase 5: Portal & UI ✅</summary>

- [x] Customer portal: dashboard, bookings list, inquiry form, feedback
- [x] Portal API: get_my_bookings, get_booking_detail, submit_inquiry, submit_feedback
- [x] Custom CSS (horizon.css, horizon_portal.css)
- [x] Booking summary API (get_booking_summary)
</details>

<details>
<summary>Phase 6: E2E Testing ✅</summary>

- [x] 9 test spec files, 61 tests × 2 projects (chromium + mobile) = 124 tests
- [x] Auth, Agency, Staff, Inquiry, Booking, Security, Portal, UI/UX, Other DocTypes
- [x] Allure reporting with video capture and screenshots
- [x] Global setup (bootstrap data) + Global teardown (cleanup)
- [x] All 124 tests passing
</details>

---

## Phase 7: CRM Feature Parity (P0 — High Impact)

> Inspired by Frappe CRM. These features close the biggest UX gaps.

### 7.1 Kanban View for Inquiries & Bookings
**Complexity:** Medium | **Impact:** High  
Frappe CRM's #1 selling point is visual pipeline management.

- [ ] Create Kanban board for Travel Inquiry (columns = status)
- [ ] Create Kanban board for Travel Booking (columns = status)
- [ ] Drag-and-drop status transitions
- [ ] Card preview showing customer name, destination, dates, assigned_to
- [ ] Count badges per column
- [ ] Option to use Frappe's built-in Kanban (Desk already supports it) or custom implementation

**Notes:** Frappe Desk has built-in Kanban support — just needs a Kanban Board DocType record pointing at Travel Inquiry/Booking with the status field. May need custom card template for travel-specific fields.

---

### 7.2 Activity Timeline on Records
**Complexity:** Medium | **Impact:** High  
Consolidate all interactions on a single record into a chronological feed.

- [ ] Create Activity Log linked DocType (or use Frappe's built-in Comment + Activity Log)
- [ ] Auto-log: status changes, assignment changes, email sent/received, notes added
- [ ] Show timeline on Travel Inquiry form (sidebar or section)
- [ ] Show timeline on Travel Booking form
- [ ] Include user avatar, timestamp, action description
- [ ] Filter by activity type (comments, status changes, emails, notes)

---

### 7.3 Dashboard with Charts
**Complexity:** Medium | **Impact:** High  
Agency admins need visual overview of business performance.

- [ ] Create Agency Dashboard page (custom Frappe Page or Report)
- [ ] Inquiry pipeline chart (bar chart: count per status)
- [ ] Booking status distribution (pie/donut chart)
- [ ] Monthly revenue trend (line chart from booking totals)
- [ ] Inquiry → Booking conversion rate (gauge or number card)
- [ ] Top destinations (bar chart)
- [ ] Overdue inquiries count (number card with alert color)
- [ ] Staff performance summary (inquiries handled, bookings closed)

**Notes:** Can use Frappe's Number Card, Chart, and Dashboard DocTypes for low-code implementation.

---

## Phase 8: Workflow & Automation (P1 — Operational Efficiency)

### 8.1 Lost Reasons
**Complexity:** Low | **Impact:** Medium  
Track why inquiries are lost for analytics and process improvement.

- [ ] Create "Travel Lost Reason" DocType (name, description)
- [ ] Add `lost_reason` Link field to Travel Inquiry (visible when status=Lost)
- [ ] Seed default reasons: Competitor, Budget Too High, Timing, No Response, Changed Plans, Other
- [ ] Add `lost_detail` Small Text field for additional context
- [ ] Lost reason analytics in dashboard

---

### 8.2 Status Change Log
**Complexity:** Low | **Impact:** Medium  
Audit trail for inquiry and booking status transitions.

- [ ] Create "Travel Status Change Log" child or linked DocType
  - Fields: `doctype_name`, `document`, `from_status`, `to_status`, `changed_by`, `changed_at`, `comment`
- [ ] Hook into Travel Inquiry on_update: log status changes
- [ ] Hook into Travel Booking on_update: log status changes
- [ ] Display on activity timeline (Phase 7.2)
- [ ] Report: Average time per status (New→Contacted: avg 2 days, etc.)

---

### 8.3 Task Management
**Complexity:** Low-Medium | **Impact:** Medium  
Attach actionable tasks to inquiries and bookings.

- [ ] Create "Travel Task" DocType
  - Fields: `subject`, `description`, `assigned_to` (Link→User), `due_date`, `priority`, `status` (Open/In Progress/Done), `linked_doctype`, `linked_document`
- [ ] Tasks section on Travel Inquiry form
- [ ] Tasks section on Travel Booking form
- [ ] My Tasks view for staff (filtered by assigned_to = current user)
- [ ] Overdue task notifications

**Notes:** Could also leverage Frappe's built-in ToDo DocType with custom filters.

---

### 8.4 Assignment Rules
**Complexity:** Medium | **Impact:** Medium  
Auto-assign new inquiries to staff based on criteria.

- [ ] Create "Travel Assignment Rule" DocType
  - Fields: `doctype` (Inquiry/Booking), `criteria` (destination, travel_type, source), `assign_to` (Link→Staff), `round_robin` (Check)
- [ ] Hook into Travel Inquiry after_insert: apply matching rule
- [ ] Round-robin support: track last-assigned per rule
- [ ] Manual override: assigned_to field still editable
- [ ] Dashboard: assignment load per staff member

**Notes:** Could reuse Frappe's built-in Assignment Rule DocType instead of custom.

---

### 8.5 SLA Tracking
**Complexity:** Medium | **Impact:** Medium  
Ensure timely response to customer inquiries.

- [ ] Add fields to Travel Inquiry: `sla_response_by` (Datetime), `sla_status` (On Track/At Risk/Breached)
- [ ] Configure default SLA: e.g., respond within 4 hours, quote within 24 hours
- [ ] Auto-calculate `sla_response_by` on inquiry creation
- [ ] Scheduled job to update `sla_status` based on current time vs deadline
- [ ] Dashboard widget: SLA compliance rate
- [ ] Color indicators on inquiry list view

---

## Phase 9: Communication (P1 — Customer Engagement)

### 9.1 Email Integration
**Complexity:** High | **Impact:** High  
Send and receive emails directly from inquiry/booking pages.

- [ ] Configure Frappe Email Account connection
- [ ] "Send Email" button on Inquiry and Booking forms
- [ ] Email composer with recipient pre-filled from customer
- [ ] Email thread display in activity timeline
- [ ] Communication DocType integration (Frappe built-in)
- [ ] Email templates (see 9.2)

**Notes:** Frappe has built-in Communication DocType and email hooks. The heavy lifting is mostly configuration, not code.

---

### 9.2 Email Templates
**Complexity:** Low | **Impact:** Medium  
Pre-built templates for common travel agency communications.

- [ ] Create/seed email templates:
  - Inquiry Acknowledgment ("Thank you for your interest in {destination}...")
  - Quotation Sent ("Please find attached your travel quote...")
  - Booking Confirmation ("Your booking {booking_number} is confirmed...")
  - Payment Reminder ("Payment of {balance_amount} is due...")
  - Pre-Departure Info ("Your trip to {destination} starts on {departure_date}...")
  - Post-Trip Feedback Request ("How was your trip? Please share your feedback...")
- [ ] Template selector in email composer
- [ ] Jinja variable support for dynamic fields

---

### 9.3 Notes System
**Complexity:** Low | **Impact:** Medium  
Replace text field with proper notes history.

- [ ] Create "Travel Note" DocType
  - Fields: `content` (Text Editor), `linked_doctype`, `linked_document`, `created_by`, `created_at`
- [ ] Notes section on Inquiry, Booking, Customer forms
- [ ] Chronological note history (latest first)
- [ ] Notes appear in activity timeline
- [ ] Remove `notes` text field from Inquiry, Booking, Supplier

---

## Phase 10: Enhanced Data Model (P2 — Feature Depth)

### 10.1 Itemized Booking Services
**Complexity:** Medium | **Impact:** Medium  
Replace lump-sum total_amount with line-item breakdown.

- [ ] Create "Booking Service Item" child table
  - Fields: `service_type` (Hotel/Flight/Tour/Transfer/Insurance/Other), `description`, `supplier` (Link→Supplier), `quantity`, `unit_price`, `discount_percent`, `total`
- [ ] Auto-calculate booking total_amount from service items sum
- [ ] Link to Supplier Service catalog for price lookup
- [ ] Keep manual total_amount as fallback for simple bookings

---

### 10.2 Organizations / Corporate Clients
**Complexity:** Medium | **Impact:** Low-Medium  
Support B2B travel (corporate accounts).

- [ ] Create "Travel Organization" DocType
  - Fields: `organization_name`, `industry`, `contact_person`, `email`, `phone`, `address`, `credit_terms`
- [ ] Add `organization` Link field to Travel Customer
- [ ] Add `organization` Link field to Travel Inquiry
- [ ] Organization-level reporting (total bookings, revenue)

---

### 10.3 WhatsApp Integration
**Complexity:** Low | **Impact:** Medium  
Leverage `frappe_whatsapp` app for travel communication.

- [ ] Install frappe_whatsapp as optional dependency
- [ ] "Send WhatsApp" button on Inquiry and Booking forms
- [ ] WhatsApp templates for booking confirmations, reminders
- [ ] WhatsApp messages logged in activity timeline

---

### 10.4 Notification System
**Complexity:** Medium | **Impact:** Medium  
Custom notifications beyond standard Frappe.

- [ ] New inquiry assigned → notify assigned staff
- [ ] Inquiry overdue SLA → notify staff + team lead
- [ ] Payment received → notify booking owner
- [ ] Upcoming departure (3 days before) → notify staff
- [ ] Feedback received → notify agency admin
- [ ] Bell icon badge with unread count

---

## Phase 11: Multi-Tenancy (P3 — Scale)

> **Decision required:** The PRD describes multi-tenancy but current implementation is single-agency.
> Only pursue this if multiple agencies on one instance is a real requirement.

### 11.1 Data Model Changes
- [ ] Add `agency` Link field to: Inquiry, Booking, Customer, Itinerary, Supplier, Feedback, Team, Staff
- [ ] Travel Agency: convert from singleton to regular DocType
- [ ] Auto-set `agency` field from current user's staff record

### 11.2 Data Isolation
- [ ] User Permissions: auto-create on staff creation (user → agency)
- [ ] User Permissions: auto-delete on staff removal
- [ ] Validate controllers: agency field matches user's agency
- [ ] Prevent agency field modification after creation
- [ ] Cross-agency access prevention tests

### 11.3 Agency Onboarding
- [ ] Agency creation wizard for System Admin
- [ ] Auto-create admin user + staff record
- [ ] Agency-specific branding (logo, colors)

---

## Phase 12: Reporting & Analytics (P2)

### 12.1 Standard Reports
- [ ] Inquiry Conversion Funnel (New→Contacted→Quoted→Won, with drop-off %)
- [ ] Monthly Revenue Report (booking totals by month)
- [ ] Destination Popularity Report (inquiries + bookings per destination)
- [ ] Staff Performance Report (inquiries handled, conversion rate, avg response time)
- [ ] Payment Collections Report (received vs pending)

### 12.2 Custom Views
- [ ] Saved views per user (filter + column + sort configurations)
- [ ] Public views (shared across team)
- [ ] Pinned views (quick access)

---

## Priority Execution Order

```
Phase 7 (P0: Kanban, Timeline, Dashboard)     ← Start here
    ↓
Phase 8 (P1: Lost Reasons, Status Log, Tasks, Assignment, SLA)
    ↓
Phase 9 (P1: Email, Templates, Notes)
    ↓
Phase 10 (P2: Itemized Services, Organizations, WhatsApp, Notifications)
    ↓
Phase 12 (P2: Reports, Custom Views)
    ↓
Phase 11 (P3: Multi-Tenancy — only if needed)
```

---

## Estimated Scope

| Phase | Tasks | Complexity |
|-------|-------|-----------|
| Phase 7 | 3 features, ~18 sub-tasks | Medium |
| Phase 8 | 5 features, ~25 sub-tasks | Medium |
| Phase 9 | 3 features, ~15 sub-tasks | Medium-High |
| Phase 10 | 4 features, ~16 sub-tasks | Medium |
| Phase 11 | 3 features, ~12 sub-tasks | Very High |
| Phase 12 | 2 features, ~8 sub-tasks | Medium |
