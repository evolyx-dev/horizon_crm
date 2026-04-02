# Docker Setup Guide

Horizon CRM runs in three Docker environments, all sharing the same architecture pattern: **Nginx → Frappe → MariaDB + Redis**.

| Environment | Compose File | Nginx Port | Purpose |
|-------------|-------------|------------|---------|
| **Local Dev** | `docker-compose.yml` | `:8080` | Development with hot-reload |
| **Codespace** | `.devcontainer/docker-compose.yml` | `:8080` | One-click client demos |
| **Production** | `deploy/docker-compose.prod.yml` | `:80` | Hosting with Gunicorn + Workers |

## Prerequisites

| Requirement | Version |
|-------------|---------|
| Docker | 20.10+ |
| Docker Compose | v2+ |
| Git | 2.x |

## Shared Components

All environments use the same backing services:

| Component | Image | Purpose |
|-----------|-------|---------|
| MariaDB | `mariadb:10.6` | Database (utf8mb4, `--skip-innodb-read-only-compressed`) |
| Redis Cache | `redis:7-alpine` | In-memory caching |
| Redis Queue | `redis:7-alpine` | Background jobs + socketio pubsub |
| Nginx | `nginx:1.27-alpine` | Reverse proxy, security headers, gzip |

Nginx config for dev/codespace: `docker/nginx.dev.conf` — lightweight proxy without rate limiting.
Nginx config for production: `deploy/nginx.conf` — rate limiting, static asset caching, WebSocket upgrade.

## Demo Data

The demo seeder (`horizon_crm/setup/demo.py`) creates realistic sample data across all environments:

| Data | Count | Details |
|------|-------|---------|
| Demo User | 1 | `demo@horizon.com` / `demo1234` (Agency Admin) |
| Customers | 6 | Bronze → Platinum tiers, diverse nationalities |
| Leads | 7 | All pipeline stages (New → Converted) |
| Hotels | 3 | 3-5 star, with service pricing |
| Airlines | 2 | International carriers with class pricing |
| Tour Operators | 2 | Cultural + Safari specialists |
| Inquiries | 7 | New, Contacted, Quoted, Won, Lost |
| Bookings | 5 | Confirmed, In Progress, Completed |
| Invoices | 4 | Sent, Partially Paid, Paid |

The seed is **idempotent** — safe to run multiple times.

```bash
# Any environment — inside the bench directory:
bench --site horizon.localhost execute horizon_crm.setup.demo.seed
```

---

## Part 1 — Local Development

### Quick Start

```bash
git clone <repo-url> horizon_crm && cd horizon_crm

# Start all services (MariaDB + Redis + Nginx + Frappe)
docker compose up

# First run takes ~5 min (downloads frappe, installs app, creates site)
# Access:  http://localhost:8080 (nginx)
#          http://localhost:8000 (bench direct — for debugging)
# Login:   Administrator / admin
```

With demo data:
```bash
SEED_DEMO=1 docker compose up
```

### Architecture

```
┌────────────────────────────────────────────────────────────┐
│  docker-compose.yml (Local Development)                    │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Nginx (:8080 → :80)                    │   │
│  │    Reverse proxy — same headers as production       │   │
│  └────────────────────┬────────────────────────────────┘   │
│                       │                                    │
│  ┌────────────────────▼────────────────────────────────┐   │
│  │  Frappe Dev Server (frappe/bench:latest)             │   │
│  │  /workspace/horizon_crm ← bind-mount (hot-reload)   │   │
│  │  :8000 web  :9000 socketio                          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                            │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ MariaDB  │  │ Redis Cache  │  │ Redis Queue  │         │
│  │ :3307    │  │ :13000       │  │ :11000       │         │
│  └──────────┘  └──────────────┘  └──────────────┘         │
└────────────────────────────────────────────────────────────┘
```

### File Layout

```
docker-compose.yml        # 5 services: nginx, frappe, mariadb, redis-cache, redis-queue
docker/
├── init.sh               # Bootstrap script (bench init → install → site → start)
└── nginx.dev.conf        # Nginx reverse proxy for dev/codespace
```

### Services

| Service | Container | Host Port | Notes |
|---------|-----------|-----------|-------|
| nginx | horizon-nginx | 8080 | Reverse proxy to bench |
| frappe | horizon-frappe | 8000, 9000 | Dev server + socketio |
| mariadb | horizon-mariadb | 3307 | Persistent volume, healthcheck |
| redis-cache | horizon-redis-cache | 13000 | Cache |
| redis-queue | horizon-redis-queue | 11000 | Jobs + socketio pubsub |

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_ROOT_PASSWORD` | `123` | MariaDB root password |
| `ADMIN_PASSWORD` | `admin` | Frappe Administrator password |
| `SITE_NAME` | `horizon.localhost` | Frappe site name |
| `SEED_DEMO` | `0` | Set to `1` to seed demo data on first run |
| `HTTP_PORT` | `8080` | Nginx host port |
| `BENCH_PORT` | `8000` | Bench direct access (debugging) |
| `DB_PORT` | `3307` | MariaDB host port |

### Init Script (`docker/init.sh`)

On first launch:
1. Fix Docker volume permissions (`sudo chown`)
2. `bench init --frappe-branch version-15`
3. Configure db_host, redis-cache, redis-queue, developer_mode=1
4. Remove Redis from Procfile (Docker provides them)
5. Install app via symlink + pip (live source for dev)
6. `bench build --app horizon_crm`
7. Create site + install app + optionally seed demo data (`SEED_DEMO=1`)
8. `bench start`

On subsequent launches: detects existing bench/site, runs `migrate`, starts bench.

### Common Commands

```bash
# Start / stop
docker compose up                   # foreground
docker compose up -d                # background
docker compose down                 # stop
docker compose down -v              # reset everything (DESTRUCTIVE)

# With demo data
SEED_DEMO=1 docker compose up

# Logs
docker compose logs -f              # all services
docker compose logs -f frappe       # frappe only

# Shell access
docker compose exec frappe bash
cd /workspace/frappe-bench

# Bench commands
bench --site horizon.localhost migrate
bench --site horizon.localhost console
bench build --app horizon_crm
bench watch

# Seed demo data manually
bench --site horizon.localhost execute horizon_crm.setup.demo.seed

# Database access
docker compose exec mariadb mysql -u root -p123
```

### Hot-Reload

The app source is bind-mounted at `/workspace/horizon_crm`:
- **Python changes**: Auto-detected by bench dev server
- **JS/CSS changes**: `bench build --app horizon_crm` or `bench watch`

---

## Part 2 — GitHub Codespaces (Client Demo)

One-click demo environment using GitHub Codespaces (60 free hours/month on 2-core).

### How It Works

```
Client clicks Codespace link
  → GitHub provisions a container
  → .devcontainer/docker-compose.yml starts Nginx + MariaDB + Redis + Frappe
  → .devcontainer/init.sh bootstraps bench, installs app, seeds demo data
  → .devcontainer/start.sh starts bench on each resume
  → Nginx on port 8080 auto-opens in browser (public)
```

### Sharing With Clients

```
https://codespaces.new/evolyx-dev/horizon_crm?quickstart=1
```

Or use the "Open in GitHub Codespaces" badge in the README.

### File Layout

```
.devcontainer/
├── devcontainer.json     # Codespace config (ports, extensions, lifecycle)
├── docker-compose.yml    # 5 services: nginx, frappe, mariadb, redis-cache, redis-queue
├── init.sh               # One-time setup (onCreateCommand, ~5 min)
└── start.sh              # Start bench on resume (postStartCommand)

docker/
└── nginx.dev.conf        # Shared nginx config (used by both dev & codespace)

horizon_crm/setup/
└── demo.py               # Demo data seeder

docs/
└── DEMO.md               # Welcome page (auto-opened in Codespace)
```

### Architecture

Same as local dev but optimized for demos:
- **Nginx reverse proxy** on port 8080 (production-like routing)
- `developer_mode` OFF (production-like UI)
- Demo data always seeded
- Port 8080 is public and auto-opens
- App installed via symlink (live workspace files, no git clone)

### Demo Credentials

| User | Email | Password | Role |
|------|-------|----------|------|
| Administrator | Administrator | `admin` | Full Access |
| Demo User | demo@horizon.com | `demo1234` | Agency Admin |

### Init Script (`.devcontainer/init.sh`)

1. Wait for MariaDB (30 attempts × 2s)
2. Fix volume permissions (`sudo chown`)
3. `bench init --frappe-branch version-15`
4. Configure services (developer_mode=0)
5. **Symlink** app into bench + `pip install -e` (no git clone)
6. `bench build --app horizon_crm`
7. Create site, install app, seed demo data

### Lifecycle

| Phase | Script | When |
|-------|--------|------|
| Create | `.devcontainer/init.sh` | First launch (~5 min) |
| Start | `.devcontainer/start.sh` | Every start / resume |
| Stop | Automatic | After 30 min idle |

### Cost Control

- **Free tier**: 60 hours/month on 2-core
- **Auto-stop**: Default 30 min idle timeout
- **Tip**: Set to 240 min in GitHub Settings → Codespaces for longer demos
- **Cleanup**: Delete unused Codespaces at github.com/codespaces

### Codespace Troubleshooting

| Problem | Solution |
|---------|----------|
| Setup stuck on "Waiting for MariaDB" | Wait 60s, check: `docker compose -f .devcontainer/docker-compose.yml logs mariadb` |
| App doesn't open | Ports tab → globe icon next to port 8080 |
| Bench crashed | Terminal: `cd /workspace/frappe-bench && bench start` |
| Demo data missing | `bench --site horizon.localhost execute horizon_crm.setup.demo.seed` |
| Too slow | Upgrade to 4-core in Codespace settings |

---

## Part 3 — Production Deployment

Full production stack with Nginx, Gunicorn, background workers, and scheduler.

### Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  deploy/docker-compose.prod.yml                                  │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │                    Nginx (:80)                           │     │
│  │   Rate limiting · static assets · security headers      │     │
│  └──────┬──────────────────────────────────┬───────────────┘     │
│         │ HTTP                             │ WebSocket            │
│  ┌──────▼──────────┐              ┌───────▼────────────┐         │
│  │ frappe-web      │              │ frappe-socketio    │         │
│  │ (Gunicorn :8000)│              │ (Node.js :9000)    │         │
│  └─────────────────┘              └────────────────────┘         │
│                                                                  │
│  ┌─────────────────┐              ┌────────────────────┐         │
│  │ frappe-worker   │              │ frappe-scheduler   │         │
│  │ (background)    │              │ (cron-like)        │         │
│  └─────────────────┘              └────────────────────┘         │
│                                                                  │
│  ┌─────────────────┐              ┌────────────────────┐         │
│  │ Redis Cache     │              │ Redis Queue        │         │
│  │ (LRU, 128MB)   │              │ (AOF persist)      │         │
│  └─────────────────┘              └────────────────────┘         │
│                                                                  │
│  ┌─────────────────┐  (optional: --profile with-db)              │
│  │ MariaDB 10.6    │                                             │
│  └─────────────────┘                                             │
└──────────────────────────────────────────────────────────────────┘
```

### File Layout

```
deploy/
├── docker-compose.prod.yml   # 7 services + optional MariaDB
├── Dockerfile                # Multi-stage build (bench → app → runtime)
├── entrypoint.sh             # Multi-role entrypoint
├── nginx.conf                # Production nginx (rate limiting, caching)
├── .env.template             # Environment variable template
└── .env                      # Your values (gitignored)
```

### Quick Start

```bash
git clone <repo-url> horizon_crm && cd horizon_crm

# 1. Configure environment
cp deploy/.env.template deploy/.env
# Edit deploy/.env

# 2. Build the production image (~3 min)
docker compose -f deploy/docker-compose.prod.yml build

# 3a. Start WITH local MariaDB
docker compose -f deploy/docker-compose.prod.yml --profile with-db up -d

# 3b. Start WITHOUT local MariaDB (external DB)
docker compose -f deploy/docker-compose.prod.yml up -d

# 4. Seed demo data (optional)
docker compose -f deploy/docker-compose.prod.yml run --rm frappe-web seed

# 5. Access: http://localhost — Login: Administrator / <ADMIN_PASSWORD>
```

### Services

| Service | Image | Role | Container |
|---------|-------|------|-----------|
| nginx | `nginx:1.27-alpine` | Reverse proxy, static assets, rate limiting | horizon-nginx |
| frappe-web | `horizon-crm:latest` | Gunicorn web server (:8000) | horizon-web |
| frappe-socketio | `horizon-crm:latest` | WebSocket server (:9000) | horizon-socketio |
| frappe-worker | `horizon-crm:latest` | Background job processing | horizon-worker |
| frappe-scheduler | `horizon-crm:latest` | Periodic task scheduling | horizon-scheduler |
| redis-cache | `redis:7-alpine` | Cache (LRU, 128MB) | horizon-redis-cache |
| redis-queue | `redis:7-alpine` | Jobs + socketio pubsub (AOF) | horizon-redis-queue |
| mariadb | `mariadb:10.6` | Database (optional profile) | horizon-mariadb |

### Environment Variables (`deploy/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_HOST` | `mariadb` | Database hostname |
| `DB_PORT` | `3306` | Database port |
| `DB_ROOT_PASSWORD` | — | MariaDB root password |
| `FRAPPE_SITE_NAME` | `horizon.localhost` | Site name (your domain) |
| `ADMIN_PASSWORD` | `admin` | Administrator password |
| `REDIS_CACHE_HOST` | `redis-cache` | Cache hostname |
| `REDIS_QUEUE_HOST` | `redis-queue` | Queue hostname |
| `HTTP_PORT` | `80` | Nginx port |
| `GUNICORN_WORKERS` | auto | Workers (auto = nproc*2+1, max 4) |
| `WORKER_QUEUE` | `default,short,long` | Background queues |

### Entrypoint Roles (`deploy/entrypoint.sh`)

| Role | Usage | Description |
|------|-------|-------------|
| `web` | Default | Gunicorn (auto-creates site on first run) |
| `socketio` | `["socketio"]` | Node.js WebSocket |
| `worker` | `["worker"]` | Background jobs |
| `scheduler` | `["scheduler"]` | Periodic tasks |
| `migrate` | One-off | Database migrations |
| `new-site` | One-off | Create a new site |
| `seed` | One-off | Seed demo data |

### Dockerfile

Multi-stage build:
1. **Builder** — `frappe/bench:latest` → `bench init --version-15` → `bench get-app` → `bench build`
2. **Production** — Copies built bench, runs `entrypoint.sh`

### Production Nginx (`deploy/nginx.conf`)

- Reverse proxy to Gunicorn (`:8000`) and Socketio (`:9000`)
- Static assets with 1-year cache (`/assets`)
- WebSocket upgrade for `/socket.io`
- Rate limiting: 10 req/s API, 5 req/s portal
- Gzip, security headers, 50MB upload limit

### Production Commands

```bash
# Status & logs
docker compose -f deploy/docker-compose.prod.yml ps
docker compose -f deploy/docker-compose.prod.yml logs -f frappe-web

# Shell
docker compose -f deploy/docker-compose.prod.yml exec frappe-web bash
cd /home/frappe/frappe-bench

# Migrate
bench --site horizon.localhost migrate

# Backup
bench --site horizon.localhost backup --with-files

# Seed demo data
docker compose -f deploy/docker-compose.prod.yml run --rm frappe-web seed

# New tenant
bench new-site agency2.example.com \
  --db-host "$DB_HOST" --db-port "$DB_PORT" \
  --db-root-password "$DB_ROOT_PASSWORD" \
  --admin-password "SecurePass123" \
  --mariadb-user-host-login-scope='%'
bench --site agency2.example.com install-app horizon_crm

# Stop / reset
docker compose -f deploy/docker-compose.prod.yml down
docker compose -f deploy/docker-compose.prod.yml --profile with-db down -v
```

### Using Pre-Built GHCR Image

```bash
docker pull ghcr.io/evolyx-dev/horizon_crm:latest
```

Replace `build:` in `deploy/docker-compose.prod.yml`:
```yaml
x-frappe-common: &frappe-common
  image: ghcr.io/evolyx-dev/horizon_crm:latest
```

### Deploy to Oracle Cloud (Always Free)

1. Provision an A1.Flex instance (4 OCPU, 24GB, ARM64)
2. Install Docker + Compose
3. Configure `deploy/.env` with Oracle MySQL HeatWave as `DB_HOST`
4. `docker compose -f deploy/docker-compose.prod.yml up -d`
5. Point DNS to the instance IP

---

## Part 4 — CI/CD Pipeline

| Workflow | File | Trigger | Purpose |
|----------|------|---------|---------|
| CI | `.github/workflows/ci.yml` | Push to `main`, PRs | Server-side tests |
| Build | `.github/workflows/builds.yml` | Push to `main`, tags | Docker → GHCR (amd64 + arm64) |
| Linters | `.github/workflows/linter.yml` | PRs | Pre-commit + Semgrep |
| Release | `.github/workflows/on_release.yml` | Push to `main` | Semantic versioning |

### Runtime Versions

| Component | Version |
|-----------|---------|
| Python | 3.12 |
| Node.js | 18 |
| MariaDB | 10.6 |
| Redis | 7 |
| Frappe | v15 (`version-15` branch) |

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Port in use | Change via env: `HTTP_PORT=9090 docker compose up` |
| MariaDB won't start | `docker compose logs mariadb` — disk space or stale volume |
| Redis connection refused | `docker compose ps` — ensure redis containers are healthy |
| bench init hangs | Network issue. Check logs |
| Permission denied | `sudo chown -R $USER:$USER .` (host) or `sudo chown -R frappe:frappe /workspace` (container) |
| Site not found | `bench use horizon.localhost` |
| Assets 404 | `bench build --app horizon_crm` |
| First start slow | Normal — bench downloads frappe + node deps (~5 min) |
| Stale MariaDB volume | `docker compose down -v` (DESTRUCTIVE) |
| Nginx 502 | Bench not started yet — wait or check `docker compose logs frappe` |
