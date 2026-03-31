# Horizon CRM — System Administrator Guide

> **Audience**: Platform administrators responsible for deploying, configuring, and managing the Horizon CRM multi-tenant platform.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Platform Architecture](#2-platform-architecture)
3. [Installation & Setup](#3-installation--setup)
4. [Creating Agency Sites (Tenants)](#4-creating-agency-sites-tenants)
5. [Managing Sites](#5-managing-sites)
6. [Backup & Restore](#6-backup--restore)
7. [Monitoring & Maintenance](#7-monitoring--maintenance)
8. [Security Configuration](#8-security-configuration)
9. [Upgrading Horizon CRM](#9-upgrading-horizon-crm)
10. [Multi-Tenancy Deep Dive](#10-multi-tenancy-deep-dive)
11. [CLI Command Reference](#11-cli-command-reference)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Overview

As a **System Administrator**, you manage the underlying infrastructure that Horizon CRM runs on. Your responsibilities include:

- Deploying and configuring the Frappe bench environment
- Creating and managing tenant sites (one per travel agency)
- Managing databases, Redis, and background workers
- Performing backups, updates, and monitoring
- Ensuring data isolation between agency tenants

### Your Tools

| Tool | Purpose |
|------|---------|
| `bench` CLI | Primary management tool for sites, apps, and services |
| Docker Compose | Container orchestration for development/production |
| MariaDB | Database engine (one database per tenant site) |
| Redis | Caching (redis-cache) and job queue (redis-queue) |
| Supervisor/systemd | Process management for production deployments |

---

## 2. Platform Architecture

### Multi-Tenancy Model: Site-Per-Tenant

Horizon CRM uses Frappe's **site-per-tenant** model. Each travel agency gets its own:
- **Separate database** (complete data isolation)
- **Separate site configuration** (`sites/<sitename>/site_config.json`)
- **Shared application code** (all sites run the same `horizon_crm` app)

```
frappe-bench/                     # Inside Docker: /workspace/frappe-bench
├── apps/
│   ├── frappe/          ← Framework (shared)
│   └── horizon_crm/    ← CRM app (symlink to repo root)
├── sites/
│   ├── common_site_config.json    ← Global config
│   ├── horizon.localhost/         ← Agency 1 (own DB)
│   ├── tenant2.localhost/         ← Agency 2 (own DB)
│   └── agency3.example.com/       ← Agency 3 (own DB)
└── config/
```

### Component Diagram

```
┌─────────────────────────────────────────────────┐
│                    Nginx / Proxy                 │
│         (Routes by hostname to Frappe)           │
├─────────────────────────────────────────────────┤
│              Frappe Web Server (Gunicorn)         │
│    ┌────────────┬────────────┬────────────┐      │
│    │ Agency 1   │ Agency 2   │ Agency 3   │      │
│    │ site       │ site       │ site       │      │
│    └──────┬─────┴──────┬─────┴──────┬─────┘      │
├───────────┼────────────┼────────────┼────────────┤
│    ┌──────▼─────┐┌─────▼──────┐┌────▼───────┐   │
│    │ agency1_db ││ agency2_db ││ agency3_db │   │
│    └────────────┘└────────────┘└────────────┘   │
│                   MariaDB                        │
├─────────────────────────────────────────────────┤
│         Redis Cache    │    Redis Queue           │
└─────────────────────────────────────────────────┘
```

### Request Flow

1. User hits `agency1.example.com` in their browser
2. Nginx routes the request to the Frappe web server
3. Frappe's middleware identifies the site by hostname
4. The correct database is selected for that site
5. All data operations are scoped to that agency's database

---

## 3. Installation & Setup

### Prerequisites

| Requirement | Version | Purpose |
|-------------|---------|---------|
| Python | 3.11+ | Frappe runtime |
| Node.js | 18+ | Asset building |
| MariaDB | 10.6+ | Database |
| Redis | 7+ | Cache and queue |
| Docker | 24+ | Container deployment (recommended) |

### Docker Setup (Recommended)

```bash
# 1. Clone the repository
git clone <repo-url> horizon_crm
cd horizon_crm

# 2. Start all services (MariaDB + Redis + Frappe bench)
docker compose up

# First run bootstraps automatically: creates bench, installs app, creates site.
# Watch the logs for "bench start" — then access http://localhost:8000
```

### Verify Installation

```bash
# Enter the container
docker compose exec frappe bash
cd /workspace/frappe-bench

# Check installed apps
bench version
# Output: frappe x.y.z, horizon_crm x.y.z
```

---

## 4. Creating Agency Sites (Tenants)

### Create a New Agency Site

Each travel agency requires its own site. Here's the complete process:

```bash
# Step 1: Create the site (creates a new database)
bench new-site agency1.example.com \
  --mariadb-root-password <db-root-password> \
  --admin-password <admin-password>

# Step 2: Install Horizon CRM on the site
bench --site agency1.example.com install-app horizon_crm

# Step 3: Run migrations to set up DocTypes
bench --site agency1.example.com migrate

# Step 4: Build assets
bench build --app horizon_crm
```

### Post-Creation Setup

After creating a site, log in as Administrator and:

1. **Configure Agency Settings**: Go to Sidebar → Agency Settings
2. **Set Agency Name**: Enter the agency's display name
3. **Add Agency Admin**: Create a user with "Agency Admin" role
4. **Configure Staff**: Add staff members via Sidebar → Staff

### Example: Creating Multiple Agencies

```bash
# Agency 1: Wanderlust Travels
bench new-site wanderlust.example.com \
  --mariadb-root-password root --admin-password admin123
bench --site wanderlust.example.com install-app horizon_crm
bench --site wanderlust.example.com migrate

# Agency 2: Sunset Tours
bench new-site sunset.example.com \
  --mariadb-root-password root --admin-password admin123
bench --site sunset.example.com install-app horizon_crm
bench --site sunset.example.com migrate
```

### DNS/Host Configuration

For local development, add entries to `/etc/hosts`:

```
127.0.0.1   wanderlust.example.com
127.0.0.1   sunset.example.com
```

For production, configure DNS A records pointing to your server IP.

---

## 5. Managing Sites

### List All Sites

```bash
bench --site all list-apps
```

### Switch Default Site

```bash
bench use agency1.example.com
```

### Site Configuration

Each site has a `site_config.json` in `sites/<sitename>/`:

```json
{
  "db_name": "agency1_db",
  "db_password": "...",
  "db_type": "mariadb",
  "encryption_key": "...",
  "host_name": "https://agency1.example.com"
}
```

### Disable/Enable a Site

```bash
# Disable a site (returns 503 to visitors)
bench --site agency1.example.com set-config maintenance_mode 1

# Re-enable
bench --site agency1.example.com set-config maintenance_mode 0
```

### Delete a Site

> **Warning**: This permanently deletes the site and its database!

```bash
bench drop-site agency1.example.com --force
```

---

## 6. Backup & Restore

### Manual Backup

```bash
# Backup a single site
bench --site agency1.example.com backup

# Backup with files (uploads, attachments)
bench --site agency1.example.com backup --with-files

# Backup location
ls sites/agency1.example.com/private/backups/
```

### Automated Backups

Add to crontab for daily backups:

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM for all sites
0 2 * * * docker compose -f /path/to/horizon_crm/docker-compose.yml exec -T frappe bash -c "cd /workspace/frappe-bench && bench --site all backup --with-files" >> /var/log/bench-backup.log 2>&1
```

### Restore from Backup

```bash
# Restore database
bench --site agency1.example.com restore \
  sites/agency1.example.com/private/backups/20260101_120000-agency1_db-database.sql.gz

# Restore with files
bench --site agency1.example.com restore \
  sites/agency1.example.com/private/backups/20260101_120000-agency1_db-database.sql.gz \
  --with-private-files sites/agency1.example.com/private/backups/20260101_120000-agency1_db-files.tar \
  --with-public-files sites/agency1.example.com/private/backups/20260101_120000-agency1_db-public-files.tar
```

---

## 7. Monitoring & Maintenance

### Check Running Services

```bash
# In development
bench start

# Check process status
ps aux | grep -E "gunicorn|redis|worker"
```

### Database Maintenance

```bash
# Optimize tables for a site
bench --site agency1.example.com optimize-tables

# Check database size
bench --site agency1.example.com mariadb -e "SELECT table_schema, 
  ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)' 
  FROM information_schema.tables GROUP BY table_schema;"
```

### Clear Cache

```bash
# Clear cache for a specific site
bench --site agency1.example.com clear-cache

# Clear cache for all sites
bench --site all clear-cache
```

### Log Files

| Log | Location | Purpose |
|-----|----------|---------|
| Web server | `logs/web.log` | HTTP request logs |
| Worker | `logs/worker.log` | Background job logs |
| Scheduler | `logs/scheduler.log` | Scheduled task logs |
| Database | `logs/database.log` | MariaDB query logs |

### Health Check

```bash
# Verify site is responding
curl -s -o /dev/null -w "%{http_code}" http://agency1.example.com:8000

# Check scheduler status
bench --site agency1.example.com scheduler status

# Run doctor to check for issues
bench doctor
```

---

## 8. Security Configuration

### SSL/TLS Setup

For production, always use HTTPS. Use Let's Encrypt with Nginx:

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d agency1.example.com

# Auto-renewal (certbot adds this automatically)
sudo systemctl enable certbot.timer
```

### Database Security

- Use strong passwords for MariaDB root and site databases
- Restrict MariaDB access to localhost only
- Enable binary logging for point-in-time recovery

```ini
# /etc/mysql/mariadb.conf.d/99-security.cnf
[mysqld]
bind-address = 127.0.0.1
log_bin = /var/log/mysql/mariadb-bin
expire_logs_days = 14
```

### Redis Security

Configure ACLs for Redis:

```
# config/redis_cache.acl
user default on >your_password ~* +@all
```

### User Account Security

```bash
# Set password policy
bench --site agency1.example.com set-config password_policy 1
bench --site agency1.example.com set-config minimum_password_score 3
```

---

## 9. Upgrading Horizon CRM

### Development Upgrade

```bash
# 1. Pull latest code
cd apps/horizon_crm && git pull origin main && cd ../..

# 2. Install updated dependencies
pip install -e apps/horizon_crm

# 3. Build assets
bench build --app horizon_crm

# 4. Migrate all sites
bench --site all migrate

# 5. Restart
bench restart
```

### Production Upgrade (Zero-Downtime)

```bash
# 1. Enable maintenance mode for all sites
bench --site all set-config maintenance_mode 1

# 2. Pull code and install
cd apps/horizon_crm && git pull origin main && cd ../..
pip install -e apps/horizon_crm

# 3. Build and migrate
bench build --app horizon_crm
bench --site all migrate

# 4. Restart services
sudo supervisorctl restart all

# 5. Disable maintenance mode
bench --site all set-config maintenance_mode 0
```

---

## 10. Multi-Tenancy Deep Dive

### How Data Isolation Works

Each site has its own database. When a request comes in:

1. Frappe reads the `Host` header from the HTTP request
2. Matches it to a site directory in `sites/`
3. Loads that site's `site_config.json`
4. Connects to the site-specific database
5. All operations are scoped to that database

There is **zero cross-tenant data leakage** because each agency's data lives in a completely separate database.

### Shared vs. Isolated Components

| Component | Shared or Isolated |
|-----------|--------------------|
| Application code | Shared (all sites run the same code) |
| Database | Isolated (separate DB per site) |
| File uploads | Isolated (per-site `public/files/` and `private/files/`) |
| Redis cache | Shared (but keys are site-scoped) |
| Redis queue | Shared (but jobs are site-scoped) |
| User accounts | Isolated (users are per-site) |

### Scaling Considerations

- **Vertical**: Increase server RAM/CPU for more concurrent tenants
- **Horizontal**: Move databases to dedicated MariaDB servers
- **Redis**: Use separate Redis instances for high-traffic deployments
- **Workers**: Increase background worker count for more parallel jobs

```bash
# Increase workers in Procfile
bench setup procfile --workers 4
```

---

## 11. CLI Command Reference

### Site Management

```bash
# Create site
bench new-site <site-name> --mariadb-root-password <pwd> --admin-password <pwd>

# Install app on site
bench --site <site-name> install-app horizon_crm

# Run migrations
bench --site <site-name> migrate

# Delete site
bench drop-site <site-name> --force

# List sites
bench --site all list-apps
```

### User Management

```bash
# Add system administrator
bench --site <site-name> add-system-manager <email>

# Set user password
bench --site <site-name> set-admin-password <new-password>

# Disable user
bench --site <site-name> disable-user <email>
```

### Maintenance

```bash
# Backup
bench --site <site-name> backup --with-files

# Restore
bench --site <site-name> restore <backup-file>

# Clear cache
bench --site <site-name> clear-cache

# Rebuild search index
bench --site <site-name> build-search-index

# Console (Python REPL with site context)
bench --site <site-name> console
```

### Development

```bash
# Start dev server
bench start

# Build assets
bench build --app horizon_crm

# Watch mode (auto-rebuild on changes)
bench watch --apps horizon_crm

# Run tests
bench --site <site-name> run-tests --app horizon_crm
```

---

## 12. Troubleshooting

### Site Not Loading

```bash
# Check if site exists
ls sites/<site-name>/

# Check site config
cat sites/<site-name>/site_config.json

# Test database connectivity
bench --site <site-name> mariadb -e "SELECT 1"

# Check for errors
tail -50 logs/web.log
```

### Migration Errors

```bash
# Check pending patches
bench --site <site-name> show-pending-patches

# Force migrate
bench --site <site-name> migrate --skip-failing

# Rebuild
bench --site <site-name> clear-cache
bench build --app horizon_crm
bench --site <site-name> migrate
```

### Redis Connection Issues

```bash
# Check Redis is running
redis-cli -p 13000 ping   # Cache
redis-cli -p 11000 ping   # Queue

# Restart Redis
docker compose restart redis-cache redis-queue
```

### Database Connection Issues

```bash
# Check MariaDB is running
docker compose ps mariadb

# Test connection
mysql -h 127.0.0.1 -P 3307 -u root -p -e "SHOW DATABASES"

# Check database exists for site
mysql -h 127.0.0.1 -P 3307 -u root -p -e "SHOW DATABASES LIKE '%agency%'"
```

### Caching Issues After Updates

Frappe's `@site_cache()` decorator caches data in memory. After updating sidebar configuration or fixtures:

```bash
# Must restart the server process to clear in-memory caches
# Kill and restart bench, or:
bench restart

# Then clear Redis cache
bench --site <site-name> clear-cache
```

---

## Quick Reference Card

| Task | Command |
|------|---------|
| Create site | `bench new-site <name> --mariadb-root-password <pwd> --admin-password <pwd>` |
| Install app | `bench --site <name> install-app horizon_crm` |
| Migrate | `bench --site <name> migrate` |
| Backup | `bench --site <name> backup --with-files` |
| Clear cache | `bench --site <name> clear-cache` |
| Start server | `bench start` |
| Build assets | `bench build --app horizon_crm` |
| Add admin | `bench --site <name> add-system-manager <email>` |
| Console | `bench --site <name> console` |
| Doctor | `bench doctor` |
