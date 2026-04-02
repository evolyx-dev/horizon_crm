# Horizon CRM — Live Demo

Welcome to the **Horizon CRM** live demo environment!

## Login Credentials

| User | Email | Password | Role |
|------|-------|----------|------|
| Administrator | Administrator | `admin` | Full Access |
| Demo User | demo@horizon.com | `demo1234` | Agency Admin |

## Quick Start

Once the Codespace finishes setup (~5 min for first launch), the app opens automatically via **port 8080** (nginx).

If it doesn't, click the **Ports** tab at the bottom → click the globe icon next to port **8080**.

## What to Explore

### CRM Pipeline
- **Travel Inquiries** — See the full sales pipeline (New → Contacted → Quoted → Won/Lost)
- **Kanban Board** — Visual drag-and-drop pipeline at `Inquiry Kanban` in the sidebar
- **Travel Leads** — Lead management with sources and follow-ups

### Bookings & Billing
- **Travel Bookings** — Active bookings with payment tracking and progress bars
- **Travel Invoices** — Invoicing with line items, tax, and payment status

### Customers & Suppliers
- **Travel Customers** — Customer profiles with loyalty tiers and preferences
- **Hotel / Airline / Tour Operator** — Supplier management by category

### Dashboard
- Click **Horizon CRM** in the sidebar for charts and KPIs

## Demo Data Included

- 6 customers (Bronze → Platinum tiers)
- 7 leads across all pipeline stages
- 7 inquiries (New, Contacted, Quoted, Won, Lost)
- 5 bookings (Confirmed, In Progress, Completed)
- 4 invoices (Sent, Partially Paid, Paid)
- Hotels, airlines, and tour operators with services & pricing

## Restarting Bench

If the app stops responding, open a terminal and run:
```bash
cd /workspace/frappe-bench && bench start
```
