# Docker Setup Guide

This guide covers both the **development** Docker stack (for local coding) and the **production** Docker deployment (for hosting / demos).

---

## Prerequisites

| Requirement | Version |
|-------------|---------|
| Docker | 20.10+ |
| Docker Compose | v2+ |
| Git | 2.x |

---

## Part 1 — Development Setup

### Quick Start

```bash
# 1. Clone the repository
git clone <repo-url> horizon_crm
cd horizon_crm

# 2. Start all services (MariaDB + Redis + Frappe bench)
docker compose up

# 3. Wait for first-time bootstrap (watch the logs)
#    init.sh creates bench, installs the app, seeds data, and starts the server.

# 4. Access the application
#    Desk:   http://localhost:8000
#    Portal: http://localhost:8000/portal
#    Login:  Administrator / admin
```

## Architecture

```
┌──────────────────────────────────────────────────────┐
│  docker-compose.yml                                  │
│                                                      │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ MariaDB  │  │ Redis Cache  │  │ Redis Queue  │   │
│  │ :3306    │  │ :6379        │  │ :6379        │   │
│  └──────────┘  └──────────────┘  └──────────────┘   │
│                                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │ Frappe Dev Server (frappe/bench:latest)       │    │
│  │  /workspace/app ← repo bind-mount            │    │
│  │  /workspace/frappe-bench ← bench volume       │    │
│  │  :8000 web  :9000 socketio                   │    │
│  └──────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────┘
```

## Service Details

| Service | Image | Port (host) | Notes |
|---------|-------|-------------|-------|
| mariadb | `mariadb:10.6` | 3307 | utf8mb4, persistent volume |
| redis-cache | `redis:7-alpine` | 13000 | In-memory cache |
| redis-queue | `redis:7-alpine` | 11000 | Background job queue |
| frappe | `frappe/bench:latest` | 8000, 9000 | Dev server + socketio |

## Environment Variables

Set these in `.env` or pass via the command line:

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_ROOT_PASSWORD` | `123` | MariaDB root password |
| `ADMIN_PASSWORD` | `admin` | Frappe Administrator password |
| `DB_PORT` | `3307` | Host port for MariaDB |
| `REDIS_CACHE_PORT` | `13000` | Host port for Redis cache |
| `REDIS_QUEUE_PORT` | `11000` | Host port for Redis queue |
| `BENCH_PORT` | `8000` | Host port for bench web |
| `SOCKETIO_PORT` | `9000` | Host port for socketio |
| `SITE_NAME` | `horizon.localhost` | Frappe site name |

## Common Commands

### Start / Stop

```bash
# Start all services (foreground — see logs)
docker compose up

# Start in background
docker compose up -d

# Stop all services
docker compose down

# Stop and remove volumes (DESTRUCTIVE — resets DB & bench)
docker compose down -v

# Restart a single service
docker compose restart frappe
```

### Logs

```bash
docker compose logs -f              # All services
docker compose logs -f frappe       # Frappe only
docker compose logs --tail=100 frappe
```

### Shell Access

```bash
# Enter Frappe container
docker compose exec frappe bash

# Run bench commands inside the container
cd /workspace/frappe-bench
bench --site horizon.localhost migrate
bench --site horizon.localhost console
bench build --app horizon_crm
bench watch
```

### Database

```bash
# Access MariaDB console
docker compose exec mariadb mysql -u root -p123

# Backup
docker compose exec frappe bash -c "cd /workspace/frappe-bench && bench --site horizon.localhost backup"

# Restore
docker compose exec frappe bash -c "cd /workspace/frappe-bench && bench --site horizon.localhost restore <backup-file>"
```

## Init Script (`docker/init.sh`)

On first launch, the frappe container runs `docker/init.sh` which:

1. **Initializes bench** (`bench init` with `version-15`)
2. **Configures services** (db_host=mariadb, redis-cache, redis-queue)
3. **Removes Redis from Procfile** (already provided by Docker)
4. **Installs the app** (`bench get-app file:///workspace/app`)
5. **Creates the site** (horizon.localhost, installs horizon_crm)
6. **Starts bench** (`bench start`)

On subsequent launches, it detects the existing bench/site and runs `migrate` instead.

## Hot-Reload Workflow

The app source (repo root) is bind-mounted at `/workspace/app` inside the container.

- **Python changes**: Picked up automatically by the bench dev server
- **JS/CSS changes**:
  ```bash
  docker compose exec frappe bash -c "cd /workspace/frappe-bench && bench build --app horizon_crm"
  ```

## Self-Hosting Compose

A minimal compose for production/self-hosting is available at `docker/docker-compose.yml` (3 services: MariaDB, Redis, Frappe).

---

## Part 2 — Production Deployment

The `deploy/` directory contains a full production-grade Docker deployment with Nginx, Gunicorn, background workers, and scheduler.

### Production Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  deploy/docker-compose.prod.yml                                  │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │                    Nginx (:80)                           │     │
│  │          Reverse proxy + static assets                   │     │
│  └──────┬──────────────────────────────┬───────────────────┘     │
│         │ HTTP                         │ WebSocket                │
│  ┌──────▼──────────┐          ┌───────▼────────────┐             │
│  │ frappe-web      │          │ frappe-socketio    │             │
│  │ (Gunicorn :8000)│          │ (Node.js :9000)    │             │
│  └─────────────────┘          └────────────────────┘             │
│                                                                  │
│  ┌─────────────────┐          ┌────────────────────┐             │
│  │ frappe-worker   │          │ frappe-scheduler   │             │
│  │ (background)    │          │ (cron-like)        │             │
│  └─────────────────┘          └────────────────────┘             │
│                                                                  │
│  ┌─────────────────┐          ┌────────────────────┐             │
│  │ Redis Cache     │          │ Redis Queue        │             │
│  │ (LRU, 128MB)   │          │ (AOF persist)      │             │
│  └─────────────────┘          └────────────────────┘             │
│                                                                  │
│  ┌─────────────────┐  (optional — use --profile with-db)         │
│  │ MariaDB 10.6    │                                             │
│  └─────────────────┘                                             │
└──────────────────────────────────────────────────────────────────┘
```

### Production Service Details

| Service | Image | Role | Container Name |
|---------|-------|------|----------------|
| nginx | `nginx:1.27-alpine` | Reverse proxy, static assets | horizon-nginx |
| frappe-web | `horizon-crm:latest` | Gunicorn web server (:8000) | horizon-web |
| frappe-socketio | `horizon-crm:latest` | Real-time WebSocket (:9000) | horizon-socketio |
| frappe-worker | `horizon-crm:latest` | Background job processing | horizon-worker |
| frappe-scheduler | `horizon-crm:latest` | Periodic task scheduling | horizon-scheduler |
| redis-cache | `redis:7-alpine` | In-memory cache (LRU) | horizon-redis-cache |
| redis-queue | `redis:7-alpine` | Job queue + socketio pubsub | horizon-redis-queue |
| mariadb | `mariadb:10.6` | Database (optional, profile) | horizon-mariadb |

### Quick Start — Production

```bash
# 1. Clone the repository
git clone <repo-url> horizon_crm
cd horizon_crm

# 2. Create your .env from the template
cp deploy/.env.template deploy/.env
# Edit deploy/.env — set DB_HOST, passwords, site name

# 3. Build the production image (~2-3 min)
docker compose -f deploy/docker-compose.prod.yml build

# 4a. Start WITH local MariaDB (for testing / demos):
docker compose -f deploy/docker-compose.prod.yml --profile with-db up -d

# 4b. Start WITHOUT local MariaDB (external DB, e.g. Oracle MySQL HeatWave):
docker compose -f deploy/docker-compose.prod.yml up -d

# 5. Access the application
#    http://localhost (port 80 via nginx)
#    Login: Administrator / <ADMIN_PASSWORD from .env>
```

### Production Environment Variables

Set in `deploy/.env`:

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_HOST` | `mariadb` | Database hostname (use container name or external IP) |
| `DB_PORT` | `3306` | Database port |
| `DB_ROOT_PASSWORD` | — | MariaDB/MySQL root password |
| `FRAPPE_SITE_NAME` | `horizon.localhost` | Frappe site name (matches your domain) |
| `ADMIN_PASSWORD` | `admin` | Frappe Administrator password |
| `REDIS_CACHE_HOST` | `redis-cache` | Redis cache container hostname |
| `REDIS_QUEUE_HOST` | `redis-queue` | Redis queue container hostname |
| `HTTP_PORT` | `80` | Host port for nginx |
| `GUNICORN_WORKERS` | auto | Web workers (auto = `nproc * 2 + 1`, max 4) |
| `WORKER_QUEUE` | `default,short,long` | Background job queues |

### Production Commands

```bash
# View all container status
docker compose -f deploy/docker-compose.prod.yml ps

# View logs
docker compose -f deploy/docker-compose.prod.yml logs -f              # All
docker compose -f deploy/docker-compose.prod.yml logs -f frappe-web   # Web only

# Run bench commands inside the web container
docker compose -f deploy/docker-compose.prod.yml exec frappe-web bash
cd /home/frappe/frappe-bench
bench --site horizon.localhost migrate
bench --site horizon.localhost console

# Backup
docker compose -f deploy/docker-compose.prod.yml exec frappe-web \
  bash -c "cd /home/frappe/frappe-bench && bench --site horizon.localhost backup --with-files"

# Stop
docker compose -f deploy/docker-compose.prod.yml down

# Stop and remove volumes (DESTRUCTIVE)
docker compose -f deploy/docker-compose.prod.yml --profile with-db down -v
```

### Create a New Tenant (Production)

```bash
# Enter the web container
docker compose -f deploy/docker-compose.prod.yml exec frappe-web bash

# Create a new site for the agency
bench new-site agency2.example.com \
  --db-host "$DB_HOST" \
  --db-port "$DB_PORT" \
  --db-root-password "$DB_ROOT_PASSWORD" \
  --admin-password SecurePass123 \
  --mariadb-user-host-login-scope='%'

bench --site agency2.example.com install-app horizon_crm
bench --site agency2.example.com migrate
```

### Production Dockerfile

The `deploy/Dockerfile` uses a multi-stage build:

1. **Builder stage**: `frappe/bench:latest` → `bench init` → `bench get-app` → `bench build`
2. **Production stage**: Copies the built bench, adds `entrypoint.sh`, runs Gunicorn

The `deploy/entrypoint.sh` is a single entrypoint that handles all service roles:
- `web` — Gunicorn (gthread, capped at 4 workers)
- `socketio` — Node.js socketio server
- `worker` — Background job processor
- `scheduler` — Periodic task runner
- `migrate` — One-off migration
- `new-site` — One-off site creation

### Production Nginx

The `deploy/nginx.conf` provides:
- Reverse proxy to Gunicorn (`:8000`) and Socketio (`:9000`)
- Static asset serving with 1-year cache (`/assets`)
- WebSocket upgrade for `/socket.io`
- Rate limiting: 10 req/s for API, 5 req/s for portal
- Gzip compression
- Security headers (X-Frame-Options, X-Content-Type-Options, etc.)
- 50MB upload limit

### Deploying to Oracle Cloud (Always Free)

The production stack is designed for **Oracle Cloud A1.Flex** (4 OCPU, 24GB RAM, ARM64):

1. Provision an A1.Flex instance with Oracle Linux / Ubuntu
2. Install Docker and Docker Compose
3. Clone the repo, configure `deploy/.env` with Oracle MySQL HeatWave as `DB_HOST`
4. Run `docker compose -f deploy/docker-compose.prod.yml up -d` (no `--profile with-db`)
5. Point your domain's DNS A record to the instance IP

### Deploying to GitHub Codespaces (Demos)

The stack also works in GitHub Codespaces (120 free hours/month on 2-core/8GB):

1. Open the repo in Codespaces
2. Use `--profile with-db` to include the local MariaDB
3. Forward port 80 and set visibility to "Public"
4. Share the Codespace URL with clients for live demos

> **Tip:** Set idle timeout to 240 minutes in Codespaces settings to avoid sleep during demos.

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Port in use | Change port via env vars: `BENCH_PORT=8001 docker compose up` |
| MariaDB won't start | Check logs: `docker compose logs mariadb`. Often disk space. |
| Redis connection refused | `docker compose ps` — ensure redis containers are running |
| bench init hangs | Network issue pulling frappe. Check `docker compose logs frappe` |
| Permission denied | `sudo chown -R $USER:$USER .` |
| Site not found | Enter container and run `bench use horizon.localhost` |
| Assets 404 | `docker compose exec frappe bash -c "cd /workspace/frappe-bench && bench build"` |
| First start is slow | bench init downloads frappe + node deps. Subsequent starts are fast. |
