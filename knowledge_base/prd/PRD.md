# Horizon CRM — Product Requirements Document (PRD)

**Version:** 1.0  
**Date:** 2026-03-30  
**Author:** Auto-generated  
**Status:** Draft  

---

## 1. Executive Summary

**Horizon CRM** is a multi-tenant Travel Agency CRM built on the Frappe Framework. It enables a **System Administrator** to spin up isolated travel agency tenants, each with their own admin, team leads, and staff. The app provides travel-industry-specific workflows for managing **leads, inquiries, bookings, itineraries, customers, and suppliers** with secure data isolation between agencies.

### Key Differentiators from Frappe CRM
| Aspect | Frappe CRM | Horizon CRM |
|--------|-----------|-------------|
| Domain | Generic Sales | Travel Agency |
| Multi-tenancy | Single-org | Agency-level isolation |
| Key entities | Lead, Deal, Organization | Inquiry, Booking, Itinerary, Customer, Supplier |
| Portal | None | Agency portal + Customer portal |
| Workflows | Sales pipeline | Inquiry → Quote → Booking → Travel → Feedback |

---

## 2. Goals & Objectives

1. **Multi-Agency Support**: System admin can create multiple travel agencies, each fully isolated.
2. **Role-Based Access**: Agency Admin, Team Lead, Staff — each with scoped permissions.
3. **Travel-Specific Workflows**: Inquiry management, itinerary building, booking lifecycle.
4. **Customer Portal**: Customers can view their bookings, itineraries, and provide feedback.
5. **Agency Portal**: Agency staff can manage their operations through a clean, modern UI.
6. **Data Isolation**: Strict enforcement — agencies cannot see each other's data.
7. **Modern UI/UX**: Clean, responsive interface following Frappe UI patterns.
8. **Docker-First Development**: All development and testing run in Docker.

---

## 3. User Personas

### 3.1 System Administrator
- Creates and manages travel agency tenants
- Manages global settings (destinations, travel types, currencies)
- Monitors platform health and usage

### 3.2 Agency Admin
- Manages their agency's settings, branding, staff
- Views agency-wide reports and dashboards
- Assigns leads to team leads

### 3.3 Team Lead
- Manages a team of staff within an agency
- Views team performance, assigns inquiries
- Escalation point for complex bookings

### 3.4 Staff (Travel Agent)
- Handles day-to-day inquiries, creates itineraries
- Manages bookings, communicates with customers
- Updates booking status and follow-ups

### 3.5 Customer (Portal User)
- Submits travel inquiries via portal
- Views booking status and itinerary details
- Provides feedback after travel

---

## 4. Core Features

### 4.1 Agency Management (System Admin)
- **FR-001**: Create/edit/disable Travel Agencies
- **FR-002**: Assign Agency Admin to each agency
- **FR-003**: View all agencies dashboard
- **FR-004**: Global destination and travel type management

### 4.2 Staff Management (Agency Admin)
- **FR-010**: Invite staff members to agency
- **FR-011**: Assign roles (Team Lead, Staff)
- **FR-012**: Manage teams within agency
- **FR-013**: View staff activity and performance

### 4.3 Inquiry / Lead Management
- **FR-020**: Create travel inquiry (from portal or desk)
- **FR-021**: Inquiry fields: destination, travel dates, travelers count, budget, preferences
- **FR-022**: Assign inquiry to staff
- **FR-023**: Inquiry status pipeline: New → Contacted → Quoted → Won → Lost
- **FR-024**: Convert inquiry to booking

### 4.4 Itinerary Builder
- **FR-030**: Create day-by-day itinerary
- **FR-031**: Add activities, accommodation, transport per day
- **FR-032**: Attach itinerary to inquiry/booking
- **FR-033**: Share itinerary via portal with customer
- **FR-034**: PDF export of itinerary

### 4.5 Booking Management
- **FR-040**: Create booking from inquiry
- **FR-041**: Booking status: Confirmed → In Progress → Completed → Cancelled
- **FR-042**: Track payments (amount, due date, status)
- **FR-043**: Link to supplier services
- **FR-044**: Booking notes and communication log

### 4.6 Customer Management
- **FR-050**: Customer profile with contact details
- **FR-051**: Customer travel history
- **FR-052**: Customer preferences and notes
- **FR-053**: Link customer to portal user

### 4.7 Supplier Management
- **FR-060**: Manage travel suppliers (hotels, airlines, tour operators)
- **FR-061**: Supplier contact details and services
- **FR-062**: Supplier service catalog

### 4.8 Customer Portal
- **FR-070**: Customer login and dashboard
- **FR-071**: View active bookings and itineraries
- **FR-072**: Submit new travel inquiry
- **FR-073**: View booking payment status
- **FR-074**: Provide post-travel feedback

### 4.9 Agency Dashboard
- **FR-080**: Agency-wide booking overview
- **FR-081**: Revenue tracking
- **FR-082**: Staff performance metrics
- **FR-083**: Inquiry conversion rates

---

## 5. Data Model Overview

### Core DocTypes

```
Travel Agency
├── name, agency_name, agency_code, logo, contact_email, phone, address
├── status (Active/Inactive)
└── admin_user (Link: User)

Travel Agency Staff
├── staff_user (Link: User)
├── agency (Link: Travel Agency)
├── role (Select: Agency Admin / Team Lead / Staff)
└── team (Link: Travel Team)

Travel Team
├── team_name, agency (Link: Travel Agency)
├── team_lead (Link: Travel Agency Staff)
└── description

Travel Inquiry
├── inquiry_number (autoname)
├── agency (Link: Travel Agency)  
├── customer (Link: Travel Customer)
├── assigned_to (Link: Travel Agency Staff)
├── destination, travel_type, budget_range
├── departure_date, return_date, num_travelers
├── status (New/Contacted/Quoted/Won/Lost)
├── notes
└── Child: Travel Inquiry Traveler (name, age, passport)

Travel Itinerary
├── itinerary_name, agency (Link: Travel Agency)
├── inquiry (Link: Travel Inquiry)
├── booking (Link: Travel Booking)
├── start_date, end_date
└── Child: Itinerary Day Item (day, activity, accommodation, transport, notes, cost)

Travel Booking
├── booking_number (autoname)
├── agency (Link: Travel Agency)
├── inquiry (Link: Travel Inquiry)
├── customer (Link: Travel Customer)
├── assigned_to (Link: Travel Agency Staff)
├── total_amount, paid_amount, balance
├── status (Confirmed/In Progress/Completed/Cancelled)
├── departure_date, return_date
└── Child: Booking Payment (amount, date, method, status, reference)

Travel Customer
├── customer_name, email, phone, address
├── agency (Link: Travel Agency)
├── portal_user (Link: User)
├── nationality, passport_number
└── preferences (Text)

Travel Supplier
├── supplier_name, supplier_type (Hotel/Airline/Tour Operator/Transport/Other)
├── agency (Link: Travel Agency)
├── contact_email, phone, website
└── Child: Supplier Service (service_name, description, price)

Travel Destination
├── destination_name, country, region
├── description, image
└── is_global (checkbox - system admin managed)

Travel Type
├── type_name (Adventure/Beach/Business/Cultural/Honeymoon/Family/Group/Solo)
└── description, icon

Travel Feedback
├── booking (Link: Travel Booking)
├── customer (Link: Travel Customer)
├── agency (Link: Travel Agency)
├── rating (1-5), comments
└── submitted_on (Date)
```

---

## 6. Security & Multi-Tenancy Design

### 6.1 Roles
| Role | Scope | Description |
|------|-------|-------------|
| System Manager | Global | Built-in Frappe role. Full platform access |
| Agency Admin | Per Agency | Manages agency settings, staff, all agency data |
| Agency Team Lead | Per Agency | Manages team, views team data |
| Agency Staff | Per Agency | Handles inquiries, bookings |
| Agency Customer | Per Agency | Portal user, view own bookings |

### 6.2 Data Isolation Strategy
- Every tenant-specific DocType has an `agency` Link field
- **User Permissions**: Auto-applied per user based on their `Travel Agency Staff` record
- On user creation for an agency, a User Permission is created linking that user to their agency
- Controller hooks (`validate`) ensure agency field is set and matches user's agency
- No cross-agency data leaks possible via API, list views, or reports

### 6.3 Permission Rules
```
Travel Agency:        System Manager (RWCD), Agency Admin (R)
Travel Agency Staff:  System Manager (RWCD), Agency Admin (RWC), Team Lead (R)
Travel Inquiry:       Agency Admin (RWCD), Team Lead (RWC), Staff (RWC)
Travel Booking:       Agency Admin (RWCD), Team Lead (RWC), Staff (RWC)
Travel Customer:      Agency Admin (RWCD), Team Lead (RWC), Staff (RWC), Customer (R, if_owner)
Travel Itinerary:     Agency Admin (RWCD), Team Lead (RWC), Staff (RWC)
Travel Supplier:      Agency Admin (RWCD), Team Lead (R), Staff (R)
Travel Feedback:      Agency Admin (R), Customer (RWC, if_owner)
```

---

## 7. Portal Design

### 7.1 Customer Portal Pages
- `/portal/dashboard` — Booking overview
- `/portal/bookings` — List of bookings
- `/portal/bookings/<name>` — Booking detail with itinerary
- `/portal/inquiries/new` — Submit new inquiry
- `/portal/feedback/<booking>` — Submit feedback

### 7.2 Portal Authentication
- Customers are created as Website Users with limited role
- Portal access tied to their agency

---

## 8. UI/UX Guidelines

### 8.1 Design Principles
- **Clean & Modern**: Utilize Frappe UI patterns with custom CSS refinements
- **Mobile-First**: Responsive design for staff on-the-go
- **Consistent**: Follow Horizon CRM brand colors throughout
- **Intuitive**: Minimal clicks to complete common tasks

### 8.2 Brand Identity
- Primary Color: Sunset gradient (#FF6B6B → #FF8E53)
- Logo: Horizon sun/path motif (from provided SVGs)
- Typography: System font stack (following Frappe defaults)
- Card-based layouts for dashboards

---

## 9. Non-Functional Requirements

| Requirement | Target |
|------------|--------|
| Response Time | < 2s for page loads |
| Data Isolation | 100% agency separation |
| Browser Support | Chrome, Firefox, Safari, Edge (latest 2 versions) |
| Mobile Support | Responsive, functional on mobile |
| Docker | Full development and testing in Docker |
| Testing | E2E tests for all features via Playwright |

---

## 10. Success Metrics
- Agency data isolation verified via E2E tests
- All CRUD operations work for each role
- Portal pages render correctly and are functional
- Inquiry → Booking workflow completes end-to-end
- No cross-agency data leaks in permission tests
