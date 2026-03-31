# Docker Development Setup Guide

## Prerequisites

| Requirement | Version |
|-------------|---------|
| Docker | 20.10+ |
| Docker Compose | v2+ |
| Git | 2.x |

## Quick Start

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
