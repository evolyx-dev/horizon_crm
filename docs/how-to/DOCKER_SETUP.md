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
git clone <repo-url> frappe_space
cd frappe_space

# 2. Start all services
docker compose up -d

# 3. Wait for first-time bootstrap (runs init.sh internally)
docker compose logs -f frappe

# 4. Access the application
# Desk:   http://localhost:8000
# Portal: http://localhost:8000/portal
# Login:  Administrator / admin
```

## Architecture

```
┌─────────────────────────────────────────────┐
│  docker-compose.yml                         │
│                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ MariaDB  │  │ Redis    │  │ Redis    │  │
│  │ :3306    │  │ Cache    │  │ Queue    │  │
│  │          │  │ :6379    │  │ :6380    │  │
│  └──────────┘  └──────────┘  └──────────┘  │
│                                             │
│  ┌──────────────────────────────────────┐   │
│  │ Frappe Dev Server (:8000)            │   │
│  │  bench0/ mounted as volume           │   │
│  │  horizon_crm/ mounted for hot-reload │   │
│  └──────────────────────────────────────┘   │
│                                             │
│  ┌──────────────────────────────────────┐   │
│  │ Playwright (:9323)                   │   │
│  │  tests/ mounted                      │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

## Service Details

### MariaDB
- **Image**: `mariadb:10.6`
- **Port**: 3306 (internal only by default)
- **Credentials**: root / frappe
- **Character Set**: utf8mb4 / utf8mb4_unicode_ci
- **Volume**: `mariadb-data` (persistent)

### Redis Cache
- **Image**: `redis:7-alpine`
- **Port**: 6379

### Redis Queue
- **Image**: `redis:7-alpine`
- **Port**: 6380

### Frappe Dev
- **Build**: `./docker/Dockerfile`
- **Port**: 8000 (mapped to host)
- **Volumes**:
  - `bench-data` → `/home/frappe/frappe-bench`
  - `./bench0/apps/horizon_crm` → hot-reload mount
  - `./tests` → test files

### Playwright
- **Image**: `mcr.microsoft.com/playwright:v1.42.0-jammy`
- **Port**: 9323
- **Working dir**: `/tests`

## Common Commands

### Start / Stop

```bash
# Start all services
docker compose up -d

# Stop all services
docker compose down

# Stop and remove volumes (DESTRUCTIVE — resets DB)
docker compose down -v

# Restart a single service
docker compose restart frappe
```

### Logs

```bash
# View all logs
docker compose logs -f

# View only Frappe logs
docker compose logs -f frappe

# View last 100 lines
docker compose logs --tail=100 frappe
```

### Shell Access

```bash
# Enter Frappe container
docker compose exec frappe bash

# Enter as root
docker compose exec -u root frappe bash

# Run bench commands
docker compose exec frappe bench --site horizon.localhost console
docker compose exec frappe bench --site horizon.localhost migrate
docker compose exec frappe bench build
```

### Database

```bash
# Access MariaDB console
docker compose exec mariadb mysql -u root -pfrappe

# Backup
docker compose exec frappe bench --site horizon.localhost backup

# Restore
docker compose exec frappe bench --site horizon.localhost restore <backup-file>
```

## First-Time Setup (Manual)

If `docker/init.sh` does not run automatically, execute these steps inside the Frappe container:

```bash
docker compose exec frappe bash

# Initialize bench
bench init --skip-redis-config-generation frappe-bench
cd frappe-bench

# Configure
bench set-config -g db_host mariadb
bench set-config -g redis_cache redis://redis-cache:6379
bench set-config -g redis_queue redis://redis-queue:6380

# Install app
bench get-app /workspace/horizon_crm   # or wherever it's mounted
bench new-site horizon.localhost \
  --mariadb-root-password frappe \
  --admin-password admin \
  --no-mariadb-socket
bench --site horizon.localhost install-app horizon_crm
bench use horizon.localhost
```

## Hot-Reload Workflow

The `horizon_crm` app source is bind-mounted into the container. Changes to Python files are picked up by the bench development server automatically.

For JavaScript/CSS changes:
```bash
# Rebuild assets
docker compose exec frappe bench build --app horizon_crm

# Or build in watch mode
docker compose exec frappe bench watch
```

## Troubleshooting Docker

| Problem | Solution |
|---------|----------|
| Port 8000 in use | `docker compose down` then `lsof -i :8000` to find conflict |
| MariaDB won't start | Check `docker compose logs mariadb`. Often disk space or permissions. |
| Redis connection refused | Ensure redis services are running: `docker compose ps` |
| bench init hangs | May be network issue pulling frappe; check `docker compose logs frappe` |
| Permission denied | Files may be owned by container user. Run `sudo chown -R $USER:$USER .` |
| Site not found | Run `bench use horizon.localhost` inside container |
| Assets 404 | Run `bench build --app horizon_crm` inside container |
