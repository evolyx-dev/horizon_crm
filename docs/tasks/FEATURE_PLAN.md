# Horizon CRM — Feature Modification & Addition Plan

> Based on deep analysis of [Frappe CRM](https://github.com/frappe/crm) (Vue.js SPA)  
> Adapted for **Standard Frappe Desk** (no custom Vue frontend)  
> Date: 2025-07-17

---

## Executive Summary

Frappe CRM is a Vue.js SPA with a beautiful sidebar, Kanban views, two-panel deal layouts, activity timelines, and rich integrations. Horizon CRM runs on standard Frappe Desk. This plan adapts the **highest-impact patterns** from Frappe CRM into Desk-native equivalents — Workspaces (sidebar), Kanban Boards, Dashboard Charts, Number Cards, and enhanced client scripts.

---

## Phase 1: Navigation & Workspace (Frappe CRM Sidebar Equivalent)

### 1.1 Create Custom Workspace — "Horizon CRM"
**Frappe CRM has:** Collapsible sidebar with sections — Dashboard, Leads, Deals, Contacts, Organizations, Notes, Tasks, Calendar, Call Logs  
**Our equivalent:** A Frappe Workspace JSON with shortcuts and links

| Section | Items | Icon |
|---------|-------|------|
| **Overview** | Dashboard (Number Cards + Charts) | dashboard |
| **Pipeline** | Travel Inquiries, Travel Bookings | file-text, shopping-cart |
| **Customers** | Travel Customers, Travel Feedback | users, star |
| **Operations** | Travel Itineraries, Travel Suppliers | map, truck |
| **Organization** | Travel Teams, Travel Agency Staff, Travel Agency | briefcase, user-check, building |
| **Reference Data** | Travel Destinations, Travel Types, Travel Lost Reasons | map-pin, tag, x-circle |

### 1.2 Module Definition
- Set `module = "Horizon CRM"` on all DocTypes (currently set)
- Use workspace as default landing page for all staff roles

---

## Phase 2: Kanban Board (Frappe CRM's #1 UX Feature)

### 2.1 Travel Inquiry Kanban
**Frappe CRM has:** Drag-and-drop Kanban for Leads/Deals by status  
**Our equivalent:** Frappe's built-in Kanban Board DocType

- **Board Name:** "Inquiry Pipeline"
- **Reference DocType:** Travel Inquiry  
- **Field Name:** status
- **Columns:** New → Contacted → Quoted → Won / Lost
- **Color coding:** Blue → Orange → Yellow → Green / Red

### 2.2 Travel Booking Kanban
- **Board Name:** "Booking Tracker"
- **Reference DocType:** Travel Booking
- **Field Name:** status
- **Columns:** Confirmed → In Progress → Completed / Cancelled

---

## Phase 3: Dashboard & Analytics

### 3.1 Number Cards
**Frappe CRM has:** Dashboard page with KPI metrics  
**Our equivalent:** Frappe Number Cards on Workspace

| Card | DocType | Filter | Function |
|------|---------|--------|----------|
| Open Inquiries | Travel Inquiry | status in (New, Contacted, Quoted) | Count |
| Won This Month | Travel Inquiry | status=Won, modified this month | Count |
| Active Bookings | Travel Booking | status in (Confirmed, In Progress) | Count |
| Total Revenue | Travel Booking | status != Cancelled | Sum(total_amount) |
| Outstanding Balance | Travel Booking | balance_amount > 0 | Sum(balance_amount) |
| Customer Count | Travel Customer | — | Count |

### 3.2 Dashboard Charts
| Chart | Type | DocType | Config |
|-------|------|---------|--------|
| Inquiry Pipeline | Donut | Travel Inquiry | Group by status |
| Monthly Bookings | Line | Travel Booking | Count by creation, monthly |
| Revenue Trend | Bar | Travel Booking | Sum total_amount by month |
| Top Destinations | Bar | Travel Inquiry | Group by destination |
| Inquiry Sources | Pie | Travel Inquiry | Group by source |

---

## Phase 4: Enhanced Data Tracking

### 4.1 Status Change Log (Inspired by CRM Status Change Log)
Track every status transition on Inquiries and Bookings:
- **Implementation:** Use `track_changes = 1` (already enabled by Frappe) + create a custom "Horizon Activity" DocType to log important events
- **Alternative (simpler):** Enhance `on_update` to post comments with status changes — visible in standard Frappe comment timeline

### 4.2 Lost Reason Tracking
- Already implemented (Travel Lost Reason DocType + lost_reason field on Inquiry)
- **Enhancement:** Add `lost_detail` Long Text field for additional notes when lost

### 4.3 Assignment & Follow-up
- Use Frappe's built-in "Assign To" feature (already available on all DocTypes)
- Add "Next Follow-up" Date field on Travel Inquiry for scheduling

---

## Phase 5: Enhanced Client-Side UX

### 5.1 Inquiry Form Improvements
- **Quick Actions Bar:** Buttons for common actions (Assign, Follow Up, Convert to Booking)
- **Customer Info Sidebar:** Show customer history (past inquiries, bookings) in form sidebar
- **Status Timeline:** Visual timeline showing status progression with timestamps

### 5.2 Booking Form Improvements
- **Payment Progress Bar:** Visual indicator of payment completion percentage
- **Linked Records Section:** Show inquiry source, itinerary, feedback all at glance
- **Financial Summary Card:** Styled total/paid/balance display

### 5.3 Customer Form Improvements
- **Activity Summary:** Show total inquiries, bookings, feedback score
- **Quick Links:** Navigate to related records easily

---

## Phase 6: Reports

### 6.1 Custom Script Reports
| Report | Purpose |
|--------|---------|
| Inquiry Conversion Report | Won/Lost rates by source, destination, staff |
| Revenue Report | Monthly/quarterly revenue with trends |
| Staff Performance | Inquiries handled, conversion rate per staff |
| Destination Popularity | Most requested destinations with booking rates |
| Payment Collection | Outstanding payments, collection rate |

---

## Implementation Priority

| Priority | Feature | Effort | Files Changed |
|----------|---------|--------|---------------|
| **P0** | Workspace with sidebar navigation | Low | +1 workspace JSON |
| **P0** | Number Cards (6 cards) | Low | +6 number card JSONs |
| **P0** | Dashboard Charts (5 charts) | Low | +5 chart JSONs |
| **P0** | Kanban for Inquiries | Low | Created via desk |
| **P0** | Kanban for Bookings | Low | Created via desk |
| **P1** | Status change comments | Low | Modify inquiry.py, booking.py |
| **P1** | Next Follow-up field | Low | Modify travel_inquiry.json |
| **P1** | Enhanced horizon.js (timeline, payment bar) | Medium | Modify horizon.js |
| **P2** | Custom reports (5 reports) | Medium | +5 report files |
| **P3** | Email templates | Low | +template files |

---

## What We're NOT Building (And Why)

| Frappe CRM Feature | Why Not |
|-------|---------|
| Custom Vue.js SPA | Massive effort, Frappe Desk is sufficient for back-office |
| Custom router/routes | Use Frappe's standard URL structure |
| SidePanelLayout component | Frappe forms already have sections; we enhance with CSS/JS |
| Twilio/Exotel integration | Not a priority for travel agencies |
| Facebook lead sync | Niche use case |
| Custom notification system | Frappe's built-in notifications are sufficient |

---

## File Changes Summary

### New Files
```
horizon_crm/
  horizon_crm/
    workspace/
      horizon_crm/
        horizon_crm.json          # Main workspace
    number_card/
      open_inquiries/             # 6 number card DocTypes
      won_this_month/
      active_bookings/
      total_revenue/
      outstanding_balance/
      customer_count/
    dashboard_chart/
      inquiry_pipeline/           # 5 dashboard charts
      monthly_bookings/
      revenue_trend/
      top_destinations/
      inquiry_sources/
```

### Modified Files
```
horizon_crm/
  horizon_crm/
    doctype/
      travel_inquiry/
        travel_inquiry.json       # Add follow_up_date field
        travel_inquiry.py         # Status change logging
      travel_booking/
        travel_booking.py         # Status change logging
    public/
      js/horizon.js               # Enhanced form UX
      css/horizon.css             # Dashboard and timeline styles
    hooks.py                      # Fixtures for workspace export
```
