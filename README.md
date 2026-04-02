# Horizon CRM

Multi-tenant Travel Agency CRM built on the Frappe Framework.

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/evolyx-dev/horizon_crm?quickstart=1)

> **Try it now** — Click the badge above to launch a free live demo in your browser. Login: `demo@horizon.com` / `demo1234`

![Horizon CRM Dashboard](.github/screenshots/01_dashboard.png)

> **Demo Video:** [Watch the full feature walkthrough](https://github.com/evolyx-dev/horizon_crm/releases/download/v1.0.1/horizon-crm-demo.webm) (~20 min, all features covered)

## Horizon CRM

Horizon CRM is a purpose-built CRM for travel agencies, running on the Frappe Framework. It supports multi-tenant operation (site-per-tenant), a complete sales pipeline from Lead → Inquiry → Booking, six specialized supplier categories, and a customer portal for self-service booking management.

### Key Features

- **Lead Management** — Capture and qualify travel leads with a visual pipeline (New → Contacted → Qualified → Converted)
- **Inquiry Pipeline** — Track travel inquiries through quoting to win/loss with budget ranges, follow-ups, and lost-reason tracking
- **Booking Management** — Manage confirmed bookings with payment tracking, itinerary links, and status timeline
- **Category-Specific Suppliers** — Dedicated doctypes for Airlines, Hotels, Visa Agents, Transport, Tour Operators, and Insurance Providers
- **Itinerary Builder** — Day-by-day trip planning with automatic cost calculations
- **Invoicing** — Generate invoices with line items, tax, discounts, and payment tracking
- **Customer Portal** — Self-service portal for customers to view bookings, submit inquiries, and leave feedback
- **Multi-Tenant** — Site-per-tenant architecture — each agency gets a fully isolated site
- **Role-Based Access** — Agency Admin, Team Lead, Staff, and Customer roles with appropriate permissions
- **Kanban Boards** — Visual pipeline boards for Leads, Inquiries, and Bookings

### Under the Hood

- [Frappe Framework](https://github.com/frappe/frappe) — A full-stack web application framework.

---

## Getting Started

### One-Click Demo (GitHub Codespaces)

Click the Codespaces badge at the top to launch a free live demo. Setup takes ~5 minutes, then the app opens automatically with demo data pre-loaded. Login: `demo@horizon.com` / `demo1234`.

### Production Deployment

The `deploy/` directory contains a production-grade Docker stack with Nginx, Gunicorn, background workers, and scheduler.

```bash
git clone <repo-url> horizon_crm && cd horizon_crm

# 1. Configure environment
cp deploy/.env.template deploy/.env
# Edit deploy/.env — set DB_HOST, DB_ROOT_PASSWORD, ADMIN_PASSWORD, FRAPPE_SITE_NAME

# 2. Build the production image
docker compose -f deploy/docker-compose.prod.yml build

# 3. Start (with local MariaDB for testing)
docker compose -f deploy/docker-compose.prod.yml --profile with-db up -d

# 4. Optionally seed demo data
docker compose -f deploy/docker-compose.prod.yml run --rm frappe-web seed

# 5. Access: http://localhost — Login: Administrator / <ADMIN_PASSWORD>
```

For external database (Oracle MySQL HeatWave, managed MariaDB, etc.):
```bash
docker compose -f deploy/docker-compose.prod.yml up -d
```

### Using Pre-Built Image (GHCR)

```bash
docker pull ghcr.io/evolyx-dev/horizon_crm:latest
```

Replace the `build:` directive in `deploy/docker-compose.prod.yml` with:
```yaml
x-frappe-common: &frappe-common
  image: ghcr.io/evolyx-dev/horizon_crm:latest
```

### Self Hosting (Frappe Easy Install)

```bash
wget https://frappe.io/easy-install.py
python3 ./easy-install.py deploy \
    --project=horizon_crm_setup \
    --email=your@email.com \
    --image=ghcr.io/evolyx-dev/horizon_crm \
    --version=latest \
    --app=horizon_crm \
    --sitename subdomain.domain.tld
```

---

## Development

### Local Setup (without Docker)

1. [Setup Bench](https://docs.frappe.io/framework/user/en/installation) and run `bench start`.
2. In a new terminal:
```bash
bench get-app horizon_crm
bench new-site horizon.localhost --install-app horizon_crm
bench browse horizon.localhost --user Administrator
```

### Local Setup (with Docker)

All environments use Nginx as a reverse proxy, matching the production architecture.

```bash
git clone <repo-url> horizon_crm && cd horizon_crm

# Start all services — first run takes ~5 min to bootstrap
docker compose up

# With demo data pre-loaded:
SEED_DEMO=1 docker compose up

# Access via nginx:  http://localhost:8080 — Login: Administrator / admin
# Direct bench:      http://localhost:8000 (for debugging)
```

The app source is bind-mounted for hot-reload. Python changes are picked up automatically. For JS/CSS: `docker compose exec frappe bash -c "cd /workspace/frappe-bench && bench build --app horizon_crm"`.

### Tenant Setup

```bash
bench new-site agency.localhost --db-root-password 123 --admin-password admin
bench --site agency.localhost install-app horizon_crm
bench --site agency.localhost horizon-crm create-tenant \
    --agency-name "Acme Travel" \
    --admin-email admin@acme.com \
    --admin-password SecurePass123
```

---

## Documentation

Full documentation is available in the [docs/](docs/) directory:

- [Docker Setup Guide](docs/how-to/DOCKER_SETUP.md) — Local, Codespace, and Production Docker stacks
- [Architecture](docs/architecture/ARCHITECTURE.md)
- [Data Model](docs/architecture/DATA_MODEL.md)
- [User Guide](docs/how-to/USER_GUIDE.md)
- [Admin Manual](docs/how-to/ADMIN_MANUAL.md)
- [Development Guide](docs/how-to/DEVELOPMENT_GUIDE.md)
- [Testing Guide](docs/how-to/TESTING_GUIDE.md)
- [Demo Guide](docs/DEMO.md) — Codespace demo walkthrough

---

## License

[AGPL-3.0](LICENSE)
