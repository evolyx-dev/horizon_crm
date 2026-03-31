# Horizon CRM — Tutorial & Documentation Hub

> **Powered by Horizon CRM** | Travel Agency CRM built on the Frappe Framework

---

## Welcome to Horizon CRM Documentation

Horizon CRM is a complete travel agency management system that helps your team track leads, manage customer inquiries, create bookings, plan itineraries, send invoices, and collect feedback — all from one unified platform.

This documentation is organized by user role. Choose the guide that matches your role to get started quickly.

---

## Documentation Map

### By Role

| Guide | Audience | Description |
|-------|----------|-------------|
| [System Administrator Guide](SYSTEM_ADMIN_GUIDE.md) | Platform Admin | Multi-tenant setup, site creation, server management, backups, monitoring |
| [Agency Admin Guide](AGENCY_ADMIN_GUIDE.md) | Agency Owner / Manager | Agency setup, staff management, dashboard analytics, configuration |
| [Staff User Guide](STAFF_GUIDE.md) | Travel Agents / Team Leads | Daily workflows — inquiries, bookings, itineraries, customers, invoices |
| [Customer Portal Guide](CUSTOMER_PORTAL_GUIDE.md) | End Customers | Self-service booking inquiry, tracking, feedback |

### Technical References

| Guide | Description |
|-------|-------------|
| [Admin Manual](ADMIN_MANUAL.md) | Comprehensive feature reference for admins and team leads |
| [User Guide](USER_GUIDE.md) | Full platform walkthrough with CLI commands |
| [Development Guide](DEVELOPMENT_GUIDE.md) | Developer setup, coding conventions, API reference |
| [Docker Setup](DOCKER_SETUP.md) | Container-based deployment and development |
| [Testing Guide](TESTING_GUIDE.md) | E2E and unit test procedures |

### Architecture & Design

| Document | Description |
|----------|-------------|
| [Architecture](../architecture/ARCHITECTURE.md) | System architecture and multi-tenancy design |
| [Data Model](../architecture/DATA_MODEL.md) | DocType definitions, relationships, ERD |
| [PRD](../prd/PRD.md) | Product requirements and feature specifications |

---

## Quick Start by Role

### I'm a System Administrator
1. Read the [System Administrator Guide](SYSTEM_ADMIN_GUIDE.md) to set up the platform
2. Create your first agency site using `bench new-site`
3. Install Horizon CRM on the site
4. Set up the Agency Admin user

### I'm an Agency Admin
1. Read the [Agency Admin Guide](AGENCY_ADMIN_GUIDE.md)
2. Log in to your agency's Horizon CRM site
3. Configure your agency settings (name, logo, contact info)
4. Add your staff members and assign roles
5. Set up teams and review the dashboard

### I'm a Travel Agent (Staff)
1. Read the [Staff User Guide](STAFF_GUIDE.md)
2. Log in with the credentials your admin gave you
3. Check the Dashboard for open inquiries
4. Start managing leads, inquiries, and bookings

### I'm a Customer
1. Read the [Customer Portal Guide](CUSTOMER_PORTAL_GUIDE.md)
2. Log in to the portal with your email
3. View your bookings and itineraries
4. Submit new travel inquiries

---

## Application Overview

### Sidebar Navigation

The Horizon CRM desk organizes all features into clear sections:

| Section | Items | Purpose |
|---------|-------|---------|
| **Pipeline** | Leads, Inquiries, Bookings | Sales funnel from first contact to confirmed booking |
| **Customers** | Customers, Feedback | Customer profiles and post-travel feedback |
| **Billing** | Invoices | Payment tracking and invoice management |
| **Trip Planning** | Itineraries, Suppliers, Destinations | Travel planning resources |
| **Team** | Teams, Staff | Staff organization and assignment |
| **Settings** | Agency Settings, Travel Types, Kanban Boards | Configuration and customization |

### Dashboard at a Glance

![Dashboard Overview](../../images/01_dashboard.png)

The main dashboard provides:
- **Open Inquiries** — Number of inquiries awaiting response
- **Won This Month** — Inquiries converted to bookings this month
- **Active Bookings** — Current confirmed bookings
- **Total Revenue** — Cumulative revenue across all bookings
- **Outstanding Balance** — Total unpaid amounts
- **Customer Count** — Number of registered customers

### Theme Support

Horizon CRM supports both **Light** and **Dark** themes. Switch between themes from the user menu in the top-right corner.

| Light Theme | Dark Theme |
|-------------|------------|
| ![Light Dashboard](../../images/01_dashboard.png) | ![Dark Dashboard](../../images/11_dark_dashboard.png) |

---

## Key Workflow: Inquiry to Booking

```
Lead → Inquiry → Contacted → Quoted → Won → Booking → Invoice → Payment → Feedback
```

1. **Lead Capture**: A potential customer is added as a Lead
2. **Inquiry Created**: Customer makes a travel inquiry (destination, dates, budget)
3. **Staff Assignment**: Inquiry is assigned to a travel agent
4. **Itinerary Planned**: Agent creates a day-by-day itinerary
5. **Quote Sent**: Inquiry moves to "Quoted" status
6. **Booking Confirmed**: Customer accepts → Booking is created
7. **Invoice Generated**: Invoice is created for the booking amount
8. **Payment Tracked**: Payments are recorded against the invoice
9. **Travel Completed**: Booking status updates as travel progresses
10. **Feedback Collected**: Customer provides post-travel feedback

---

## Support & Resources

- **Troubleshooting**: See the [Troubleshooting Guide](../troubleshooting/TROUBLESHOOTING.md)
- **Task Breakdown**: See the [Task Breakdown](../tasks/TASK_BREAKDOWN.md) for implementation details
- **Research Notes**: See the [Research Notes](../research/RESEARCH_NOTES.md) for technical decisions
