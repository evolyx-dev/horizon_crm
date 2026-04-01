# Horizon CRM

Multi-tenant Travel Agency CRM built on the Frappe Framework.

![Horizon CRM Dashboard](.github/screenshots/01_dashboard.png)

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

## Getting Started (Production)

### Docker Compose (Recommended)

The `deploy/` directory contains a production-grade Docker stack with Nginx, Gunicorn, background workers, and scheduler.

```bash
git clone <repo-url> horizon_crm
cd horizon_crm

# 1. Configure environment
cp deploy/.env.template deploy/.env
# Edit deploy/.env — set DB_HOST, DB_ROOT_PASSWORD, ADMIN_PASSWORD, FRAPPE_SITE_NAME

# 2. Build the production image
docker compose -f deploy/docker-compose.prod.yml build

# 3. Start with local database (testing / demos)
docker compose -f deploy/docker-compose.prod.yml --profile with-db up -d

# 4. Access: http://localhost — Login: Administrator / <your ADMIN_PASSWORD>
```

For external database (Oracle MySQL HeatWave, managed MariaDB, etc.):

```bash
# Set DB_HOST=<your-db-host> in deploy/.env, then:
docker compose -f deploy/docker-compose.prod.yml up -d
```

**Production services:** Nginx (port 80), Gunicorn, Socketio, Worker, Scheduler, Redis Cache, Redis Queue.

See [Docker Setup Guide](docs/how-to/DOCKER_SETUP.md) for deployment to Oracle Cloud, GitHub Codespaces, and full configuration reference.

### Self Hosting (Frappe Easy Install)

Follow these steps to set up Horizon CRM in production:

**Step 1:** Download the easy install script

```bash
wget https://frappe.io/easy-install.py
```

**Step 2:** Run the deployment command

```bash
python3 ./easy-install.py deploy \
    --project=horizon_crm_setup \
    --email=your@email.com \
    --image=ghcr.io/ArkOne-Softwares/horizon-crm \
    --version=stable \
    --app=horizon_crm \
    --sitename subdomain.domain.tld
```

---

## Getting Started (Development)

### Local Setup

1. [Setup Bench](https://docs.frappe.io/framework/user/en/installation).
2. In the frappe-bench directory, run `bench start` and keep it running.
3. Open a new terminal session and cd into `frappe-bench` directory and run:

```bash
bench get-app horizon_crm
bench new-site horizon.localhost --install-app horizon_crm
bench browse horizon.localhost --user Administrator
```

### Docker

You need Docker, docker-compose, and git setup on your machine. Refer [Docker documentation](https://docs.docker.com/).

**Step 1:** Setup folder and download the required files

```bash
mkdir horizon-crm
cd horizon-crm

# Download the docker-compose file
wget -O docker-compose.yml https://raw.githubusercontent.com/ArkOne-Softwares/horizon-crm/main/docker/docker-compose.yml

# Download the setup script
wget -O init.sh https://raw.githubusercontent.com/ArkOne-Softwares/horizon-crm/main/docker/init.sh
```

**Step 2:** Run the container and daemonize it

```bash
docker compose up -d
```

**Step 3:** The site http://horizon.localhost:8000 should now be available. The default credentials are:

- Username: `Administrator`
- Password: `admin`

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

- [Architecture](docs/architecture/ARCHITECTURE.md)
- [Data Model](docs/architecture/DATA_MODEL.md)
- [User Guide](docs/how-to/USER_GUIDE.md)
- [Admin Manual](docs/how-to/ADMIN_MANUAL.md)
- [Development Guide](docs/how-to/DEVELOPMENT_GUIDE.md)
- [Testing Guide](docs/how-to/TESTING_GUIDE.md)

---

## License

[AGPL-3.0](LICENSE)
