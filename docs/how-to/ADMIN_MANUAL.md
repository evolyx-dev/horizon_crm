# Horizon CRM — Complete Admin & Team Manual

> **Powered by Horizon CRM** | Travel Agency CRM built on the Frappe Framework

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Your First Login](#2-your-first-login)
3. [Dashboard & Navigation](#3-dashboard--navigation)
4. [Setting Up Your Agency](#4-setting-up-your-agency)
5. [Managing Your Team](#5-managing-your-team)
6. [Lead Management](#6-lead-management)
7. [Inquiry Workflow](#7-inquiry-workflow)
8. [Booking Process](#8-booking-process)
9. [Invoicing & Payments](#9-invoicing--payments)
10. [Itinerary Planning](#10-itinerary-planning)
11. [Suppliers & Destinations](#11-suppliers--destinations)
12. [Customer Management](#12-customer-management)
13. [Customer Feedback](#13-customer-feedback)
14. [Communication & WhatsApp](#14-communication--whatsapp)
15. [Kanban Boards](#15-kanban-boards)
16. [Reports & Analytics](#16-reports--analytics)
17. [Customer Portal](#17-customer-portal)
18. [Roles & Permissions](#18-roles--permissions)
19. [Tips & Best Practices](#19-tips--best-practices)
20. [Troubleshooting](#20-troubleshooting)

---

## 1. Getting Started

### What is Horizon CRM?

Horizon CRM is a complete travel agency management system. It helps you track leads, manage customer inquiries, create bookings, plan itineraries, send invoices, and collect payments — all from one place.

### System Requirements

- A modern web browser (Chrome, Firefox, Edge, Safari)
- Internet connection
- Login credentials provided by your Agency Admin

### Key Concepts

| Term | Meaning |
|------|---------|
| **Lead** | A potential customer who has shown interest but hasn't made an inquiry yet |
| **Inquiry** | A formal request from a customer about a trip |
| **Booking** | A confirmed travel arrangement with financial details |
| **Invoice** | A bill sent to the customer for payment |
| **Itinerary** | A day-by-day travel plan |
| **Supplier** | Hotels, airlines, transport companies you work with |

---

## 2. Your First Login

1. Open your browser and go to your Horizon CRM URL (e.g., `https://youragency.example.com`)
2. Enter your **Email** and **Password**
3. Click **Login**

After login, you'll land on the **Desk** — the main working area.

> **First-time admin?** You'll see the Setup Wizard. Complete it to configure basic settings like timezone, language, and company name.

### Navigating the Desk

- **Search Bar** (top center): Press `Ctrl+K` to quickly search for anything — documents, customers, settings
- **Sidebar** (left): Access all CRM modules organized by category
- **Awesomebar**: Type any DocType name (e.g., "Travel Lead") to jump directly to it

---

## 3. Dashboard & Navigation

### Workspace Dashboard

When you click **Horizon CRM** in the sidebar, you'll see:

#### Number Cards (Top Row)
- **Open Inquiries** — Inquiries that haven't been resolved
- **Won This Month** — Inquiries converted to bookings this month
- **Active Bookings** — In-progress bookings
- **Total Revenue** — Sum of all booking amounts
- **Outstanding Balance** — Unpaid balance across bookings
- **Customer Count** — Total registered customers

#### Charts
- **Inquiry Pipeline** (donut) — Visual breakdown of inquiry statuses
- **Inquiry Sources** (pie) — Where your inquiries come from
- **Monthly Bookings** (bar) — Booking trend by month
- **Revenue Trend** (line) — Revenue over time
- **Top Destinations** (bar) — Most popular destinations

#### Quick Access Shortcuts
Colored tiles for one-click access to Leads, Inquiries, Bookings, Customers, Invoices, Itineraries, and Kanban boards.

### Sidebar Sections

The sidebar is organized into six main categories:

| Section | Contains |
|---------|----------|
| **CRM Pipeline** | Leads, Inquiries, Bookings, Kanban Board, Lost Reasons |
| **Customers & Communication** | Customers, Feedback, Communication logs |
| **Billing & Payments** | Invoices |
| **Trip Planning** | Itineraries, Suppliers, Destinations |
| **Team & Organization** | Teams, Staff, Users |
| **Settings & Configuration** | Agency Settings, Travel Types, Charts, Number Cards |

---

## 4. Setting Up Your Agency

### Agency Settings (Singleton)

Go to **Settings & Configuration → Travel Agency**.

This is your agency's master profile.

| Field | What to Enter |
|-------|---------------|
| Agency Name | Your company name |
| Contact Email | Main contact email |
| Phone | Office phone |
| Website | Agency website URL |
| Address | Office address |
| Status | Active / Inactive / Suspended |
| Max Staff | Maximum number of staff members |
| Logo | Upload your agency logo |
| Subscription Plan | Free / Starter / Professional / Enterprise |

> **Important:** This is a **singleton** — there's only one record. It represents YOUR agency.

### Travel Types

Go to **Settings & Configuration → Travel Type**.

These are pre-populated categories like Adventure, Beach, Business, Cultural, Honeymoon, Family, Group, Solo, Cruise, Luxury.

**To add a new type:**
1. Click **+ Add Travel Type**
2. Enter the Type Name and Description
3. Save

### Destinations

Go to **Trip Planning → Travel Destination**.

Pre-loaded with popular destinations (Paris, Bali, Maldives, etc.).

**To add a new destination:**
1. Click **+ Add Travel Destination**
2. Enter: Destination Name, Country, Region
3. Check "Is Popular" if it should appear in quick filters
4. Add a description
5. Save

---

## 5. Managing Your Team

### Create Teams

Go to **Team & Organization → Travel Team**.

1. Click **+ Add Travel Team**
2. Enter: Team Name, assign the Agency
3. Add a description (e.g., "Domestic Sales", "International Bookings")
4. Save

### Add Staff Members

Go to **Team & Organization → Travel Agency Staff**.

1. Click **+ Add Travel Agency Staff**
2. Fill in:
   - **Staff Name** — Full name
   - **Email** — Must match their system user email
   - **User** — Link to the Frappe User account
   - **Agency** — Your agency
   - **Team** — Their assigned team
   - **Role in Agency** — Agency Admin / Team Lead / Staff
   - **Phone**, **Date of Joining** — Optional
   - **Is Active** — Check to enable
3. Save

> **Note:** The User account must exist first. Go to **Team & Organization → User** to create user accounts if needed.

### Roles Explained

| Role | What They Can Do |
|------|-----------------|
| **Agency Admin** | Full access — create, read, update, delete all records; manage settings |
| **Agency Team Lead** | Create and manage inquiries, bookings, leads; read-only for agency settings |
| **Agency Staff** | Create and manage inquiries, bookings, leads; limited settings access |
| **Agency Customer** | Portal-only access — view their bookings, submit inquiries/feedback |

---

## 6. Lead Management

### What is a Lead?

A lead is a **potential customer** — someone who has expressed interest but hasn't submitted a formal inquiry yet. Leads can come from website forms, social media, phone calls, travel fairs, etc.

### Creating a Lead

Go to **CRM Pipeline → Travel Lead** and click **+ Add Travel Lead**.

**Required fields:**
- **Full Name** — The person's name
- **At least one contact method** — Email, Phone, or Mobile Number

**Key fields:**
| Field | Purpose |
|-------|---------|
| Status | New → Contacted → Interested → Qualified → Converted |
| Lead Source | Where this lead came from (Website, Phone, Facebook, Google Ads, etc.) |
| Assigned To | Staff member responsible for this lead |
| Priority | Low / Medium / High / Urgent |
| Next Follow-up | Date to follow up |
| Interested Destination | Where they want to travel |
| Travel Type | What kind of trip |
| Expected Budget | How much they expect to spend |

### Lead Pipeline

The lead form shows a **visual pipeline** at the top:

```
[New] ──── [Contacted] ──── [Interested] ──── [Qualified] ──── [Converted]
```

Each dot lights up as you progress through the stages.

### Converting a Lead

When a lead reaches **Qualified** or **Interested** status:
1. Open the lead
2. Click **Actions → Create Inquiry**
3. The system pre-fills the inquiry with lead information
4. Complete any missing details and save

When a lead is **Converted**:
1. Click **Actions → Create Customer**
2. Customer record is pre-filled with lead data

### Lead Kanban Board

Use the **Lead Pipeline** Kanban board for a visual drag-and-drop view:
- Drag leads between columns (New → Contacted → Interested, etc.)
- See all your leads at a glance

---

## 7. Inquiry Workflow

### Creating an Inquiry

Go to **CRM Pipeline → Travel Inquiry** and click **+ Add Travel Inquiry**.

**Required fields:**
- **Customer Name** — Who is inquiring
- **Email** — Contact email
- **Status** — Starts as "New"

**Key fields:**
| Field | Purpose |
|-------|---------|
| Customer | Link to an existing customer (auto-fills name/email/phone) |
| Lead | Link to the source lead (if converted from a lead) |
| Destination | Where they want to go |
| Travel Type | Type of trip |
| Departure / Return Date | Travel dates |
| Number of Travelers | How many people |
| Budget Min / Max | Expected budget range |
| Assigned To | Staff member handling this inquiry |
| Source | How the inquiry arrived (Walk-in, Phone, Email, etc.) |
| Priority | Low / Medium / High / Urgent |

### Inquiry Pipeline

The form shows a visual pipeline:

```
[New] ──── [Contacted] ──── [Quoted] ──── [Won]
                                             │
                                          [Lost]
```

### Status Workflow

| Status | Meaning | Next Steps |
|--------|---------|------------|
| **New** | Just received | Contact the customer |
| **Contacted** | First contact made | Send a quotation |
| **Quoted** | Price/itinerary sent | Wait for response |
| **Won** | Customer accepted! | Create a booking |
| **Lost** | Customer declined | Select a Lost Reason |

### Converting to Booking

When an inquiry reaches **Won** status:
1. Click **Actions → Create Booking**
2. Booking is pre-filled with inquiry data (customer, destination, dates, travelers)
3. Add financial details and save

### Follow-up Tracking

Set a **Follow-up Date** on any inquiry. The form will show alerts:
- 🔴 **Overdue** — Follow-up date has passed
- 🟠 **Due today** — Follow up now!
- 🔵 **Due in X days** — Upcoming follow-up

### Lost Inquiries

When marking an inquiry as **Lost**:
1. Change status to "Lost"
2. Select a **Lost Reason** (required): Competitor, Budget Too High, Bad Timing, No Response, etc.
3. Add additional details if needed

### Travelers

Add traveler details to the inquiry using the **Travelers** child table:
- Traveler Name
- Contact information

---

## 8. Booking Process

### Creating a Booking

Go to **CRM Pipeline → Travel Booking** and click **+ Add Travel Booking**.

**Required fields:**
- **Customer** — Link to a Travel Customer
- **Booking Date** — When the booking was made (defaults to today)
- **Status** — Starts as "Confirmed"
- **Departure / Return Date** — Travel dates
- **Number of Travelers**
- **Total Amount** — The total booking cost

**Key fields:**
| Field | Purpose |
|-------|---------|
| Source Inquiry | Link back to the original inquiry |
| Destination | Where they're traveling (auto-filled from inquiry) |
| Itinerary | Link to a Travel Itinerary |
| Assigned To | Staff member managing this booking |
| Currency | Payment currency (default: USD) |

### Payment Tracking

The booking form shows a **Payment Progress Bar**:

```
Payment Progress
[$2,000 / $5,000]
████████░░░░░░░░░░░░ 40% collected
```

- 🔴 Red bar: Less than 30% paid
- 🟠 Orange bar: 30-70% paid
- 🟢 Green bar: Over 70% paid

#### Adding Payments

Scroll to the **Payments** section and add entries:
- Payment Date
- Amount
- Payment Method
- Reference Number
- Status (Pending / Received / Refunded)

The **Paid Amount** and **Balance Amount** update automatically.

### Booking Status Timeline

```
[Confirmed] ──── [In Progress] ──── [Completed]
```

### Quick Actions from Booking

Use the **Go To** menu to jump to:
- View Inquiry (source inquiry)
- View Itinerary
- View Customer

Use **Actions → Create Invoice** to generate an invoice from this booking.

---

## 9. Invoicing & Payments

### Creating an Invoice

Go to **Billing & Payments → Travel Invoice** and click **+ Add Travel Invoice**.

**Required fields:**
- **Customer** — Who to bill
- **Invoice Date** — Date of invoice (defaults to today)
- **Due Date** — Payment deadline
- **Status** — Starts as "Draft"
- **Items** — At least one line item

### Adding Line Items

In the **Invoice Items** table, add each service:

| Column | Example |
|--------|---------|
| Description | "Bali Hotel - 5 nights" |
| Quantity | 5 |
| Rate | $200 |
| Amount | $1,000 (auto-calculated) |

Add as many items as needed (flights, hotels, tours, insurance, visa fees, etc.)

### Tax & Totals

The system calculates automatically:

```
Subtotal:    $3,500.00
Tax (10%):   $  350.00
Discount:    $  100.00
─────────────────────
Grand Total: $3,750.00
Paid:        $1,000.00
Outstanding: $2,750.00
```

- **Subtotal** = Sum of all item amounts
- **Tax Amount** = Subtotal × Tax %
- **Grand Total** = Subtotal + Tax - Discount
- **Outstanding** = Grand Total - Paid Amount

### Invoice Statuses

| Status | Meaning |
|--------|---------|
| **Draft** | Just created, not yet sent |
| **Sent** | Invoice sent to customer |
| **Partially Paid** | Some payment received |
| **Paid** | Fully paid |
| **Overdue** | Past due date, not fully paid |
| **Cancelled** | Invoice voided |

### Recording Payments

1. Open the invoice
2. Enter the **Paid Amount**
3. Select **Payment Method** (Cash, Bank Transfer, Credit Card, UPI, PayPal, Stripe, etc.)
4. Enter the **Payment Date**
5. Save — Outstanding amount updates automatically

### Dashboard Indicators

- 🟠 "Outstanding: $2,750.00" — Money still owed
- 🟢 "Fully Paid" — Invoice settled

---

## 10. Itinerary Planning

### Creating an Itinerary

Go to **Trip Planning → Travel Itinerary**.

**Key fields:**
- **Title** — Descriptive name (e.g., "7-Day Bali Adventure")
- **Inquiry / Booking** — Link to related records
- **Customer** — Who it's for
- **Destination** — Where
- **Start / End Date** — Trip dates
- **Status** — Draft → Shared → Approved → Archived

### Day-by-Day Planning

In the **Items** table, add each day's activities:

| Field | Example |
|-------|---------|
| Day Number | 1 |
| Title | "Arrival & Beach Resort Check-in" |
| Description | "Airport pickup, transfer to resort, welcome dinner" |
| Location | "Kuta, Bali" |
| Estimated Cost | $250 |

The **Total Cost** updates automatically as you add items.

### Number of Days

Set the start and end dates — the system calculates the number of days for you.

---

## 11. Suppliers & Destinations

### Managing Suppliers

Suppliers are organized into six category-specific DocTypes, each accessible from the workspace sidebar:

| DocType | Prefix | Key Fields |
|---------|--------|------------|
| Airline Supplier | AIR- | airline_name, iata_code, alliance, domestic/international |
| Hotel Supplier | HTL- | hotel_name, star_rating, property_type, total_rooms |
| Visa Agent | VISA- | agent_name, countries_served, avg_processing_days |
| Transport Supplier | TRN- | transport_name, transport_type, fleet_size |
| Tour Operator | TOUR- | operator_name, specialization, destinations_covered |
| Insurance Provider | INS- | provider_name, insurance_types, max_coverage_amount |

All supplier types share contact info, address, notes, and a **Services** child table (service_name, description, price).

### Managing Destinations

Go to **Trip Planning → Travel Destination**.

Track popular destinations with name, country, region, description, and "Is Popular" flag.

---

## 12. Customer Management

### Creating a Customer

Go to **Customers & Communication → Travel Customer**.

**Required fields:**
- **Full Name**
- **Email**

**Key fields:**
| Field | Purpose |
|-------|---------|
| Phone | Main phone number |
| Mobile Number | Used for WhatsApp messaging |
| Portal User | Link to a Frappe User for portal access |
| Photo | Customer photo |
| Gender | Optional |
| Lead | Source lead that became this customer |
| Loyalty Tier | Bronze / Silver / Gold / Platinum |
| Date of Birth | For birthday greetings |
| Nationality | Travel document info |
| Passport Number | For bookings |
| Address | Mailing address |
| Emergency Contact | Name and phone |
| Travel Preferences | Notes about preferences (window seat, vegetarian, etc.) |

### Customer Dashboard

When viewing a customer, the form shows:
- 🔵 **X Inquiry(s)** — Number of inquiries from this customer
- 🟢 **X Booking(s)** — Number of bookings
- 🟠 **X Feedback(s)** — Number of feedback entries

### Quick Actions

- **Create → New Inquiry** — Start a new inquiry for this customer
- **Create → New Invoice** — Create an invoice for this customer
- **Communication → WhatsApp** — Open WhatsApp chat with the customer

---

## 13. Customer Feedback

### Collecting Feedback

Go to **Customers & Communication → Travel Feedback**.

**Key fields:**
- **Customer** — Who's giving feedback
- **Booking** — Which booking it's about
- **Rating** — 1 to 5 stars (displayed as ★★★★☆)
- **Comments** — Written feedback
- **Service Rating**, **Value Rating**, **Recommendation** — Detailed ratings

### Star Display

The form shows star ratings visually:
- ★★★★★ (5 stars) = Green indicator
- ★★★★☆ (4 stars) = Green indicator
- ★★★☆☆ (3 stars) = Orange indicator
- ★★☆☆☆ (2 stars) = Red indicator
- ★☆☆☆☆ (1 star) = Red indicator

---

## 14. Communication & WhatsApp

### WhatsApp Integration

Horizon CRM includes one-click WhatsApp messaging on key forms.

#### Where WhatsApp buttons appear:

| Form | Phone Field Used |
|------|-----------------|
| Travel Lead | Mobile Number (or Phone fallback) |
| Travel Inquiry | Customer Phone |
| Travel Customer | Mobile Number (or Phone fallback) |

#### How to use:

1. Open any Lead, Inquiry, or Customer record
2. Click **Communication → WhatsApp** (in the toolbar)
3. WhatsApp Web opens in a new tab with the contact pre-filled
4. Type your message and send

> **Tip:** Make sure the **Mobile Number** field includes the country code (e.g., +91 9876543210) for WhatsApp to work correctly.

### Communication Logs

Frappe's built-in **Communication** module (in the sidebar under **Customers & Communication**) tracks all email communication automatically.

---

## 15. Kanban Boards

### Available Kanban Boards

| Board | DocType | Columns |
|-------|---------|---------|
| **Lead Pipeline** | Travel Lead | New → Contacted → Interested → Qualified → Converted / Do Not Contact |
| **Inquiry Pipeline** | Travel Inquiry | New → Contacted → Quoted → Won / Lost |
| **Booking Tracker** | Travel Booking | Confirmed → In Progress → Completed / Cancelled |

### How to Use Kanban

1. Click the Kanban shortcut on the dashboard (e.g., "Lead Pipeline")
2. Cards represent individual records
3. **Drag and drop** cards between columns to change status
4. Click a card to open the full form
5. Use filters at the top to narrow down results

---

## 16. Reports & Analytics

### Dashboard Charts

The workspace dashboard provides live analytics:

| Chart | Type | Shows |
|-------|------|-------|
| Inquiry Pipeline | Donut | Distribution of inquiry statuses |
| Inquiry Sources | Pie | Where inquiries come from |
| Monthly Bookings | Bar | Bookings trend by month |
| Revenue Trend | Line | Revenue over time |
| Top Destinations | Bar | Most booked destinations |

### Number Cards

Real-time statistics shown at the top of the dashboard.

### Custom Reports

Click **Settings & Configuration → Dashboard Chart** or **Number Card** to create custom analytics.

---

## 17. Customer Portal

### Overview

Customers with **Agency Customer** role can access a self-service portal.

### Portal Features

- **My Bookings** — View all their bookings
- **New Inquiry** — Submit a travel inquiry
- **Feedback** — Submit feedback for past bookings

### Setting Up Portal Access

1. Create a **Travel Customer** record with an email
2. Create a **User** account with the same email
3. Assign the **Agency Customer** role
4. Link the user to the customer's **Portal User** field
5. Share the portal URL with the customer

The customer logs in and sees only their own data — they cannot access the admin desk.

---

## 18. Roles & Permissions

### Permission Matrix

| Action | Agency Admin | Team Lead | Staff | Customer |
|--------|:-----------:|:---------:|:-----:|:--------:|
| View Leads | ✅ | ✅ | ✅ | ❌ |
| Create Leads | ✅ | ✅ | ✅ | ❌ |
| Delete Leads | ✅ | ❌ | ❌ | ❌ |
| View Inquiries | ✅ | ✅ | ✅ | Portal only |
| Create Bookings | ✅ | ✅ | ✅ | ❌ |
| Delete Bookings | ✅ | ❌ | ❌ | ❌ |
| View Invoices | ✅ | ✅ | ✅ | ❌ |
| Create Invoices | ✅ | ✅ | ✅ | ❌ |
| Agency Settings | ✅ | Read only | ❌ | ❌ |
| Manage Users | ✅ | ❌ | ❌ | ❌ |
| Export Data | ✅ | ❌ | ❌ | ❌ |

### Blocked Modules

Staff and Team Leads are blocked from accessing system configuration modules (Setup, Core, Email, Integrations, etc.) to keep the interface focused on CRM tasks.

---

## 19. Tips & Best Practices

### Data Entry

- **Always link to existing records** — Use the Customer, Lead, and Inquiry link fields to connect data automatically
- **Use fetch_from** — When you select a Customer on an inquiry, email and phone auto-fill
- **Follow-up dates** — Set them on every open inquiry and lead to never miss a callback

### Workflow

1. **Lead** → Capture initial interest
2. **Lead → Inquiry** — Convert qualified leads to formal inquiries
3. **Inquiry → Booking** — Convert won inquiries to bookings
4. **Booking → Invoice** — Create invoices for confirmed bookings
5. **Booking → Itinerary** — Plan the day-by-day trip
6. **After trip → Feedback** — Collect customer feedback

### WhatsApp Tips

- Always include country code in mobile numbers (e.g., +1, +91, +44)
- Use WhatsApp to send quick updates, not formal documents
- For formal communication, use the email system in Frappe

### Kanban Boards

- Use Kanban for daily pipeline reviews
- Drag cards to update status — it's faster than opening each record
- Filter by "Assigned To" to see your personal pipeline

### Keyboard Shortcuts

- `Ctrl+K` — Quick search
- `Ctrl+Enter` — Save current form
- `Ctrl+Shift+N` — New document
- `Esc` — Close dialog

---

## 20. Troubleshooting

### Common Issues

| Problem | Solution |
|---------|----------|
| Can't see sidebar sections | Clear browser cache (`Ctrl+Shift+R`) |
| WhatsApp button doesn't appear | Ensure phone/mobile_no field has a value |
| WhatsApp opens with wrong number | Include country code (e.g., +91) |
| Follow-up alert not showing | Check follow_up_date / next_follow_up field is set |
| Invoice totals wrong | Check that items have quantity and rate; save to recalculate |
| Can't access a module | Check your role permissions with Agency Admin |
| Portal not working | Ensure user has "Agency Customer" role and desk_access is OFF |
| Kanban drag not updating | Make sure the Kanban Board exists (check install.py) |

### Getting Help

- **Search everything**: Use the search bar (`Ctrl+K`) to find any record or setting
- **Activity Log**: Check the Activity Log in the form's timeline for changes
- **Comments**: Add comments on any record to communicate with your team
- **Error Log**: Agency Admins can check **Settings → Error Log** for system errors

---

## Appendix: Complete DocType Reference

### DocType List

| DocType | Autoname | Purpose |
|---------|----------|---------|
| Travel Lead | LEAD-.##### | Pre-inquiry lead tracking |
| Travel Inquiry | INQ-.##### | Customer travel requests |
| Travel Booking | BK-.##### | Confirmed bookings |
| Travel Invoice | INV-.##### | Billing and payments |
| Travel Customer | CUST-.##### | Customer records |
| Travel Itinerary | ITN-.##### | Day-by-day trip plans |
| Airline Supplier | AIR-.##### | Airlines and charter services |
| Hotel Supplier | HTL-.##### | Hotels, resorts, hostels |
| Visa Agent | VISA-.##### | Visa processing agents |
| Transport Supplier | TRN-.##### | Ground transport providers |
| Tour Operator | TOUR-.##### | Tour companies and guides |
| Insurance Provider | INS-.##### | Travel insurance providers |
| Travel Feedback | FB-.##### | Customer satisfaction |
| Travel Destination | (by name) | Travel locations |
| Travel Type | (by name) | Trip categories |
| Travel Team | (by name) | Staff groups |
| Travel Agency Staff | (by staff_user) | Individual staff |
| Travel Agency | (singleton) | Agency master settings |
| Travel Lost Reason | (by name) | Why inquiries are lost |
| Invoice Item | (child) | Invoice line items |
| Booking Payment | (child) | Booking payment entries |
| Travel Inquiry Traveler | (child) | Inquiry traveler details |
| Itinerary Day Item | (child) | Itinerary daily items |
| Supplier Service | (child) | Supplier service catalog |

---

*This manual covers Horizon CRM v3.0. For updates and more help, visit the Horizon CRM repository.*
