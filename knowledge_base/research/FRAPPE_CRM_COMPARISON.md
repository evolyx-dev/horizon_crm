# Horizon CRM vs Frappe CRM — Feature Comparison

> Date: 2026-03-31  
> Source: [github.com/frappe/crm](https://github.com/frappe/crm) (v1.62.x, 2.5k stars, 45 contributors)

---

## 1. Architecture Comparison

| Aspect | Frappe CRM | Horizon CRM |
|--------|-----------|-------------|
| **Domain** | Generic Sales CRM | Travel Agency CRM |
| **Frontend** | Custom Vue.js (Frappe UI) | Standard Frappe Desk + Portal |
| **Multi-tenancy** | Single organization | Agency-level isolation (planned) |
| **URL namespace** | `/crm/...` (custom routes) | `/app/...` (standard Frappe desk) |
| **Maturity** | 214 releases, 3 years | Early development |
| **License** | AGPL-3.0 | — |

---

## 2. Feature Matrix

### Legend
- ✅ = Implemented  
- 🟡 = Partial / Basic  
- ❌ = Not present  
- 🔵 = Not applicable to domain  

### 2.1 Core CRM / Sales Pipeline

| Feature | Frappe CRM | Horizon CRM | Notes |
|---------|-----------|-------------|-------|
| **Leads management** | ✅ Full (CRM Lead) | 🟡 Travel Inquiry serves as lead | Frappe CRM has dedicated Lead DocType with sources, statuses, scoring |
| **Deals / Opportunities** | ✅ Full (CRM Deal) | 🟡 Inquiry → Booking serves as deal flow | Frappe CRM has products, pricing, discounts on deals |
| **Contacts** | ✅ CRM Contacts + Organizations | 🟡 Travel Customer only | No separate Contact vs Organization distinction in Horizon |
| **Organizations** | ✅ CRM Organization | ❌ | Corporate clients / B2B not modeled |
| **Sales Pipeline (Kanban)** | ✅ Drag-and-drop Kanban view | ❌ | Only list views in Horizon |
| **Custom Views** | ✅ Saved, Pinned, Public views | ❌ | Uses standard Frappe list filters only |
| **Lead/Deal scoring** | ✅ | ❌ | Priority field exists but no scoring |
| **Products on deals** | ✅ Products, quantities, discounts | ❌ | Travel Booking has total_amount but no line items |
| **Currency & exchange rates** | ✅ Multi-currency + auto rates | 🟡 Currency field exists | No exchange rate conversion |
| **Lost reasons** | ✅ CRM Lost Reason | ❌ | Inquiry has Lost status but no reason |
| **Deal forecasting** | ✅ | ❌ | |

### 2.2 Communication & Activity Tracking

| Feature | Frappe CRM | Horizon CRM | Notes |
|---------|-----------|-------------|-------|
| **Email integration** | ✅ Send/receive from lead/deal page | ❌ | No email communication tracking |
| **Email templates** | ✅ | ❌ | |
| **Call logging** | ✅ CRM Call Log | ❌ | |
| **WhatsApp integration** | ✅ Via Frappe WhatsApp | ❌ | |
| **Comments & mentions** | ✅ @mention teammates | 🟡 Standard Frappe comments | No custom mention/notification system |
| **Activity timeline** | ✅ Unified activity view | ❌ | No consolidated activity feed |
| **Notes on leads/deals** | ✅ FCRM Note | 🟡 `notes` text field | Rich notes as separate DocType vs text field |
| **Communication status** | ✅ Track email open/reply | ❌ | |

### 2.3 Workflow & Automation

| Feature | Frappe CRM | Horizon CRM | Notes |
|---------|-----------|-------------|-------|
| **Assignment rules** | ✅ Auto-assign leads/deals | ❌ | Manual assignment only via `assigned_to` field |
| **SLA tracking** | ✅ CRM Service Level Agreement | ❌ | No response time tracking |
| **Tasks per lead/deal** | ✅ CRM Task | ❌ | No task management |
| **Form scripts** | ✅ CRM Form Script | ❌ | No custom client-side scripts |
| **Status change logging** | ✅ CRM Status Change Log | ❌ | Only on_update message for Won inquiries |
| **Notifications** | ✅ CRM Notification system | ❌ | Relies on standard Frappe notifications |

### 2.4 Travel-Specific Features (Horizon CRM Strength)

| Feature | Frappe CRM | Horizon CRM | Notes |
|---------|-----------|-------------|-------|
| **Travel Inquiry pipeline** | 🔵 | ✅ New→Contacted→Quoted→Won→Lost | Domain-specific statuses |
| **Inquiry → Booking conversion** | 🔵 | ✅ API: create_booking_from_inquiry | |
| **Itinerary builder** | 🔵 | ✅ Day-by-day with cost calc | Unique feature |
| **Booking lifecycle** | 🔵 | ✅ Confirmed→In Progress→Completed→Cancelled | |
| **Payment tracking** | 🔵 | ✅ Multiple payments per booking | Auto-calculates balance |
| **Traveler management** | 🔵 | ✅ Child table with passport, age | |
| **Travel Destinations** | 🔵 | ✅ Master data with popular flag | |
| **Travel Types** | 🔵 | ✅ 10 pre-loaded categories | |
| **Supplier management** | 🔵 | ✅ Hotels, airlines, operators | With service catalog |
| **Customer feedback** | 🔵 | ✅ Rating + experience levels | |
| **Customer portal** | ❌ No portal | ✅ Dashboard, bookings, inquiries, feedback | |
| **Agency staff management** | 🔵 | ✅ Role-based with max limit | |
| **Team organization** | 🔵 | ✅ Travel Teams with leads | |

### 2.5 Reporting & Analytics

| Feature | Frappe CRM | Horizon CRM | Notes |
|---------|-----------|-------------|-------|
| **Dashboard** | ✅ CRM Dashboard DocType | 🟡 Booking summary API only | No visual dashboard page |
| **Revenue tracking** | ✅ Deal value tracking | 🟡 get_booking_summary() | API exists but no dashboard UI |
| **Conversion rates** | ✅ | ❌ | Inquiry→Booking conversion not tracked |
| **Custom reports** | ✅ | ❌ | No custom report builder |
| **Pipeline analytics** | ✅ | ❌ | |

### 2.6 Integrations

| Feature | Frappe CRM | Horizon CRM | Notes |
|---------|-----------|-------------|-------|
| **Twilio (calls)** | ✅ Built-in | ❌ | |
| **Exotel (calls)** | ✅ Built-in | ❌ | |
| **WhatsApp** | ✅ Via frappe_whatsapp | ❌ | |
| **ERPNext** | ✅ Invoicing, accounting | ❌ | |
| **Meta/Facebook** | ✅ Lead syncing | ❌ | |
| **Payment gateways** | ❌ | ❌ | Both lack this |

### 2.7 UI/UX

| Feature | Frappe CRM | Horizon CRM | Notes |
|---------|-----------|-------------|-------|
| **Custom SPA frontend** | ✅ Vue.js SPA at /crm | ❌ Uses Frappe Desk | Frappe CRM has a much richer UI |
| **Dark mode** | ✅ | ❌ | |
| **Mobile responsive** | ✅ App-like experience | 🟡 Frappe Desk responsive | Standard Frappe mobile behavior |
| **Kanban board** | ✅ Drag-and-drop | ❌ | |
| **Custom field layouts** | ✅ Per-user field arrangement | ❌ | |
| **Customer portal** | ❌ | ✅ | Horizon's advantage |

---

## 3. What Can Be Adopted from Frappe CRM

### 3.1 High-Value Features (Should Implement)

1. **Kanban View for Inquiries & Bookings** — Drag-and-drop pipeline management is the #1 most impactful UX feature missing. Frappe CRM uses this as a core selling point.

2. **Activity Timeline** — Unified activity feed on Inquiry and Booking forms showing all interactions (status changes, comments, emails) chronologically.

3. **Email Communication** — Send/receive emails directly from inquiry/booking pages, link them to the record contextually.

4. **Assignment Rules** — Auto-assign inquiries to staff based on criteria (destination, travel type, workload). Frappe CRM's CRM Assignment Rule can be referenced.

5. **SLA Tracking** — Set response-time targets for new inquiries (e.g., "respond within 4 hours"). Flag overdue inquiries.

6. **Tasks** — Attach tasks to inquiries/bookings (e.g., "Follow up with customer", "Send visa docs"). Due dates + assignees.

7. **Notes as Separate DocType** — Replace the `notes` text field with a proper Notes child or linked DocType for richer note history.

8. **Lost Reasons** — When an inquiry moves to "Lost", capture why (competitor, budget, timing, etc.) for analytics.

9. **Status Change Log** — Track every status transition with timestamp and user for audit trail and analytics.

10. **Dashboard with Charts** — Visual dashboard showing inquiry pipeline, booking revenue, conversion rates, staff performance.

### 3.2 Medium-Value Features (Nice to Have)

11. **Custom Views** — Saved/pinned/public list views with custom filters, columns, and sorting.

12. **WhatsApp Integration** — Travel is highly WhatsApp-driven. Using `frappe_whatsapp` would be straightforward.

13. **Organizations/Corporate Clients** — B2B travel agencies deal with corporate clients; an Organization DocType would be valuable.

14. **Deal Products** — On bookings, itemize services (flights, hotels, tours) with quantities and prices instead of just a lump total_amount.

15. **Email Templates** — Pre-built templates for inquiry acknowledgment, quotation, booking confirmation, etc.

16. **Notifications System** — Custom notifications for overdue inquiries, upcoming departures, payment reminders.

### 3.3 Low-Priority / Not Needed

17. **Facebook/Meta Lead Sync** — Niche; not a priority for travel agencies.
18. **Twilio/Exotel** — Call integration is useful but not a differentiator for travel CRM.
19. **Custom Vue SPA** — Major rewrite; Frappe Desk works well enough for back-office. Portal already exists for customers.

---

## 4. Duplicacy / Features That Can Be Removed or Consolidated

### 4.1 Potential Overlaps

| Item | Issue | Recommendation |
|------|-------|---------------|
| **Travel Destination + Travel Type** as separate DocTypes | Low value as standalone DocTypes with only 2-3 fields each | **Keep but simplify** — they're useful as link targets. Consider making them non-listable (only accessible via link fields). |
| **Booking Payment child table** vs separate Payment DocType | Child table limits reporting capabilities | **Keep child table** for now; payments are always in booking context. Migrate to separate DocType only if cross-booking payment reporting is needed. |
| **`notes` text field on multiple DocTypes** | Duplicated on Inquiry, Booking, Supplier. Not searchable or versioned. | **Replace with Activity/Notes system** — linked DocType like Frappe CRM's fcrm_note. |
| **Customer `preferences` text field** | Unstructured data | **Replace with Tags or Select fields** for actionable preferences (dietary, room type, seat class). |
| **`destination_text` on Inquiry** | Duplicate of `destination` Link field — free-form fallback | **Remove** — add new destinations on-the-fly instead. If that's too restrictive, make destination an optional link + keep text, but flag for review. |

### 4.2 Missing Multi-Tenancy Implementation

The PRD describes multi-tenant agency isolation, but the **actual DocTypes do NOT have an `agency` Link field**. Currently:
- No data isolation between agencies
- No User Permissions based on agency
- `Travel Agency` is a singleton (only one agency)

This is a significant gap between the PRD and implementation. Either:
- **Option A**: Implement multi-tenancy as designed (add `agency` field to all DocTypes, add User Permission hooks)
- **Option B**: Simplify PRD to single-agency model (current reality), which is simpler and still covers most use cases

---

## 5. Summary: Priority Features Roadmap

| Priority | Feature | Complexity | Impact |
|----------|---------|-----------|--------|
| P0 | Kanban view for Inquiries | Medium | High — core UX improvement |
| P0 | Activity timeline on records | Medium | High — context at a glance |
| P0 | Dashboard with charts | Medium | High — visibility for management |
| P1 | Email communication | High | High — but Frappe has built-in email |
| P1 | Assignment rules | Medium | Medium — automation |
| P1 | SLA tracking | Medium | Medium — accountability |
| P1 | Tasks on inquiries/bookings | Low | Medium — operational tracking |
| P1 | Lost reasons | Low | Medium — analytics |
| P1 | Status change log | Low | Medium — audit trail |
| P2 | WhatsApp integration | Low | Medium — uses existing library |
| P2 | Email templates | Low | Low-Medium |
| P2 | Custom views | High | Medium — convenience |
| P2 | Notifications system | Medium | Medium |
| P3 | Organizations/B2B | Medium | Low-Medium |
| P3 | Itemized booking services | Medium | Low-Medium |
| P3 | Multi-tenancy | Very High | High (if needed) |
