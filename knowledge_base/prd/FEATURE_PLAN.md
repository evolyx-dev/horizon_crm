# Horizon CRM — Feature Modification Plan (Frappe CRM Comparison)

> Deep analysis and comparison of **Frappe CRM** vs **Horizon CRM**, with implementation status

---

## Analysis Summary

**Frappe CRM** is a Vue.js SPA built on top of Frappe Framework with a custom frontend (AppSidebar, KanbanView, router.js). It targets generic CRM use (Leads → Deals → Contacts → Organizations).

**Horizon CRM** uses Frappe Desk's native UI with custom CSS/JS enhancements, targeting the **travel agency** vertical. It leverages multi-tenancy (site-per-tenant) and includes domain-specific features like itineraries, suppliers, and a customer portal.

---

## Feature-by-Feature Comparison

### 1. Sidebar Navigation

| Aspect | Frappe CRM | Horizon CRM |
|--------|-----------|-------------|
| **Technology** | Custom Vue `AppSidebar.vue` | Frappe Desk sidebar + custom CSS |
| **Sections** | All Views, Public Views, Pinned Views | Workspace links |
| **Items** | Dashboard, Leads, Deals, Contacts, Organizations, Notes, Tasks, Call Logs | Travel Inquiry, Booking, Customer, Itinerary, Kanban boards |
| **User Menu** | Bottom dropdown with settings, log, help | Navbar user menu (top right) |
| **Notifications** | In-sidebar notification bell | Navbar notifications |

**Status**: ✅ Enhanced sidebar CSS (border radius, hover states, active indicators, gradient accent bars) implemented to match Frappe CRM aesthetic within Desk constraints.

---

### 2. Kanban Board

| Aspect | Frappe CRM | Horizon CRM |
|--------|-----------|-------------|
| **Technology** | Custom `KanbanView.vue` with `vuedraggable` | Frappe native Kanban Board DocType |
| **Drag & Drop** | Yes (vuedraggable library) | Yes (Frappe built-in) |
| **Color Indicators** | Per-column color with popover picker | Per-column color (Blue, Green, Red, Orange, Yellow) |
| **Card Fields** | Title + configurable display fields | Title + status indicator |
| **Add Column** | In-view add column button | Via Kanban Board DocType configuration |

**Status**: ✅ Two Kanban boards created:
- **Inquiry Pipeline**: New → Contacted → Quoted → Won → Lost
- **Booking Tracker**: Confirmed → In Progress → Completed → Cancelled

CSS enhancements: rounded cards, hover shadows, grab cursor, accent borders.

---

### 3. Dashboard/Workspace

| Aspect | Frappe CRM | Horizon CRM |
|--------|-----------|-------------|
| **Technology** | Vue component dashboard | Frappe Workspace with Number Cards + Dashboard Charts |
| **KPIs** | Deal counts, pipeline value | Total/New Inquiries, Active Bookings, Total Revenue |
| **Charts** | Deal funnel, activity timeline | Inquiry Funnel by Status, Monthly Revenue trend |
| **Quick Actions** | Create Lead, Create Deal | Shortcut cards to List and Kanban views |

**Status**: ✅ Workspace dashboard with 4 number cards, 2 charts, 6 shortcuts (4 list + 2 kanban).

---

### 4. Lead/Inquiry Form

| Aspect | Frappe CRM | Horizon CRM |
|--------|-----------|-------------|
| **Pipeline Visual** | Status tabs at top | Custom pipeline dots with connecting lines |
| **Side Panel** | Activity sidebar, contacts, deals | Customer activity sidebar (inquiries, bookings, revenue) |
| **Status Tracking** | New → Replied → Opportunity → Quotation → ... | New → Contacted → Quoted → Won/Lost |
| **Quick Actions** | Convert to Deal, Add Activity | Convert to Booking (on Won) |

**Status**: ✅ Custom pipeline visualization with colored dots, payment progress bar, customer sidebar stats.

---

### 5. Branding/White-Label

| Aspect | Frappe CRM | Horizon CRM |
|--------|-----------|-------------|
| **App Name** | "Frappe CRM" | "Horizon CRM" by Evolyx Lab |
| **Logo** | Frappe logo | Custom SVG logo |
| **Footer** | "Built with Frappe" | "Powered by Evolyx Lab" |
| **Copyright** | Frappe Technologies | Evolyx Lab |

**Status**: ✅ Complete white-labeling: all user-visible "Frappe" references replaced with "Evolyx Lab" (hooks.py, JS, CSS comments, database settings, install script).

---

### 6. Unique Horizon CRM Features (Not in Frappe CRM)

| Feature | Description |
|---------|-------------|
| **Multi-Tenancy** | Site-per-tenant architecture with CLI provisioning |
| **Customer Portal** | Self-service portal for customers to view bookings, submit inquiries |
| **Travel Itineraries** | Day-by-day activity planning with day items |
| **Supplier Management** | Travel vendor/partner tracking with services |
| **Team Management** | Staff team grouping with team leads |
| **Travel Feedback** | Post-trip feedback with ratings |
| **Payment Tracking** | Per-booking payment records with visual progress bar |
| **Travel-Specific Fields** | Destinations, travel types, traveler details, passport info |

---

## Implementation Roadmap

### ✅ Phase 1 — Completed

| Task | Status |
|------|--------|
| Multi-tenant architecture | ✅ Done |
| Core DocTypes (Inquiry, Booking, Customer, etc.) | ✅ Done |
| UI/UX redesign (pipeline, payment bar, sidebar stats) | ✅ Done |
| Workspace dashboard (number cards, charts, shortcuts) | ✅ Done |
| Evolyx Lab white-labeling | ✅ Done |
| Kanban boards (Inquiry Pipeline, Booking Tracker) | ✅ Done |
| Enhanced sidebar CSS | ✅ Done |
| Kanban card CSS polish | ✅ Done |
| Customer portal | ✅ Done |
| E2E test suite (131 tests) | ✅ Done |

### 🔮 Phase 2 — Future Enhancements

| Task | Priority | Description |
|------|----------|-------------|
| Call Log Integration | Medium | Track customer calls like Frappe CRM |
| Email Templates | Medium | Pre-built templates for quotations, confirmations |
| Activity Timeline | Medium | Dedicated activity feed per inquiry/booking |
| Pinned Views | Low | Save custom list filters as named views |
| Dashboard Widgets | Low | More chart types (pie, Bar) for workspace |
| Mobile Optimization | Medium | Better mobile list/form experience |
| PDF Itinerary Export | High | Generate printable itinerary PDFs |
| WhatsApp Integration | Medium | Send booking confirmations via WhatsApp |
| Calendar View | Low | Calendar visualization for travel dates |
| Report Builder | Low | Custom reports for revenue, conversion rates |

---

*Plan maintained by Evolyx Lab — Horizon CRM Development*
