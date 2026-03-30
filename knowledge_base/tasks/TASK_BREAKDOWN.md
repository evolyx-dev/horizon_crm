# Horizon CRM — Task Breakdown

**Version:** 1.0  
**Date:** 2026-03-30  

---

## Phase 1: Foundation & Setup

### 1.1 Project Scaffolding
- [x] Research Frappe framework, CRM app, DocTypes, permissions
- [x] Create Knowledge Base documentation
- [ ] Create `horizon_crm` Frappe app via `bench new-app`
- [ ] Setup app directory structure
- [ ] Copy logos/favicons to app public/images
- [ ] Configure hooks.py with app metadata
- [ ] Setup Docker development environment

### 1.2 Docker Environment
- [ ] Create `docker-compose.yml` for development
- [ ] Create `Dockerfile` for frappe + horizon_crm
- [ ] Create `docker/init.sh` bootstrap script
- [ ] Verify Docker stack starts correctly
- [ ] Document Docker setup process

---

## Phase 2: Core DocTypes

### 2.1 Global Reference DocTypes
- [ ] Travel Destination DocType + controller
- [ ] Travel Type DocType + controller
- [ ] Seed default destinations and travel types

### 2.2 Tenant Management DocTypes
- [ ] Travel Agency DocType + controller
- [ ] Travel Agency Staff DocType + controller (with auto User Permission)
- [ ] Travel Team DocType + controller

### 2.3 Core Business DocTypes
- [ ] Travel Customer DocType + controller
- [ ] Travel Inquiry DocType + controller
- [ ] Travel Inquiry Traveler (child) DocType
- [ ] Travel Itinerary DocType + controller
- [ ] Itinerary Day Item (child) DocType
- [ ] Travel Booking DocType + controller
- [ ] Booking Payment (child) DocType
- [ ] Travel Supplier DocType + controller
- [ ] Supplier Service (child) DocType
- [ ] Travel Feedback DocType + controller

---

## Phase 3: Security & Multi-Tenancy

### 3.1 Roles & Permissions
- [ ] Create custom roles: Agency Admin, Agency Team Lead, Agency Staff, Agency Customer
- [ ] Configure DocType permission rules per DATA_MODEL.md
- [ ] Implement install.py to create roles on app install

### 3.2 Data Isolation
- [ ] Travel Agency Staff controller: auto-create User Permissions on save
- [ ] Travel Agency Staff controller: cleanup User Permissions on delete
- [ ] Validate `agency` field in all tenant DocType controllers
- [ ] Prevent agency field modification after creation
- [ ] Test cross-agency data access prevention

---

## Phase 4: Business Logic

### 4.1 Inquiry Workflow
- [ ] Inquiry status transitions (New → Contacted → Quoted → Won/Lost)
- [ ] Convert Inquiry to Booking action
- [ ] Auto-create customer from inquiry if not exists
- [ ] Inquiry assignment to staff

### 4.2 Booking Workflow
- [ ] Booking status management
- [ ] Payment tracking (auto-calculate balance)
- [ ] Link booking to itinerary

### 4.3 Itinerary Builder
- [ ] Day-by-day item management
- [ ] Auto-calculate total cost from day items
- [ ] Status workflow (Draft → Shared → Approved)

---

## Phase 5: Portal & UI

### 5.1 Customer Portal
- [ ] Portal base template with Horizon branding
- [ ] Dashboard page (booking overview)
- [ ] Bookings list page
- [ ] Booking detail page (with itinerary)
- [ ] New inquiry submission page
- [ ] Feedback submission page

### 5.2 UI/UX Polish
- [ ] Custom CSS (horizon.css) with brand colors
- [ ] Card-based dashboard layouts
- [ ] Status badges and progress indicators
- [ ] Responsive design verification
- [ ] Custom Desk page for agency dashboard

### 5.3 App Branding
- [ ] Move provided logos to app public/images
- [ ] Configure app logo in hooks.py
- [ ] Favicon setup
- [ ] Splash/loader screen with logo

---

## Phase 6: Testing

### 6.1 Unit Tests
- [ ] Travel Agency CRUD tests
- [ ] Travel Agency Staff CRUD + permission tests
- [ ] Travel Inquiry lifecycle tests
- [ ] Travel Booking lifecycle tests
- [ ] Travel Customer CRUD tests

### 6.2 Security Tests
- [ ] Cross-agency data isolation tests
- [ ] Role-based access control tests per role
- [ ] Portal authentication tests
- [ ] API permission tests

### 6.3 E2E Tests (Playwright)
- [ ] Login flow tests
- [ ] Agency creation flow
- [ ] Staff management flow
- [ ] Inquiry → Booking workflow
- [ ] Customer portal flow
- [ ] Data isolation verification (multi-agency)
- [ ] Responsive UI tests

---

## Phase 7: Documentation

### 7.1 Developer Docs
- [ ] Development setup guide (Docker)
- [ ] App architecture overview
- [ ] DocType customization guide
- [ ] Testing guide

### 7.2 Operational Docs
- [ ] Deployment guide
- [ ] Troubleshooting guide
- [ ] FAQ

### 7.3 User Docs
- [ ] Agency admin user guide
- [ ] Staff user guide
- [ ] Customer portal guide

---

## Phase 8: Agents & Skills

- [ ] Create `.instructions.md` for codebase conventions
- [ ] Create agent definitions for specialized tasks
- [ ] Create skill files for common operations

---

## Priority Order

1. **Phase 1** → Foundation (blocks everything)
2. **Phase 2.1, 2.2** → Reference + Tenant DocTypes (blocks security)
3. **Phase 3** → Security (blocks business logic safety)
4. **Phase 2.3** → Business DocTypes (blocks workflows)
5. **Phase 4** → Business Logic (blocks portal)
6. **Phase 5** → Portal & UI
7. **Phase 6** → Testing (continuous, but formal pass here)
8. **Phase 7** → Documentation (continuous, finalized here)
9. **Phase 8** → Agents & Skills
