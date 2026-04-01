#!/bin/bash
# ─────────────────────────────────────────────────────────────
# Horizon CRM — Production Entrypoint
# Configures bench for external DB/Redis, then starts the
# requested service role (web, socketio, worker, scheduler).
# ─────────────────────────────────────────────────────────────
set -eo pipefail

BENCH_DIR="/home/frappe/frappe-bench"
cd "$BENCH_DIR"

# ── Configure common_site_config.json ───────────────────────
configure_bench() {
    echo "▸ Configuring bench for environment..."

    # Database
    bench set-config -g db_host "${DB_HOST:?DB_HOST is required}"
    bench set-config -g db_port "${DB_PORT:-3306}"

    if [ -n "$DB_ROOT_PASSWORD" ]; then
        bench set-config -g db_root_password "$DB_ROOT_PASSWORD"
    fi

    # Redis
    bench set-config -g redis_cache "redis://${REDIS_CACHE_HOST:-redis-cache}:${REDIS_CACHE_PORT:-6379}"
    bench set-config -g redis_queue "redis://${REDIS_QUEUE_HOST:-redis-queue}:${REDIS_QUEUE_PORT:-6379}"
    bench set-config -g redis_socketio "redis://${REDIS_QUEUE_HOST:-redis-queue}:${REDIS_QUEUE_PORT:-6379}"

    # Production settings
    bench set-config -g developer_mode 0
    bench set-config -g serve_default_site true
    bench set-config -g maintenance_mode 0

    # Logging
    bench set-config -g logging 1

    # Allowed hosts (for CSRF protection behind proxy)
    if [ -n "$FRAPPE_SITE_NAME" ]; then
        bench use "$FRAPPE_SITE_NAME"
    fi
}

# ── Wait for dependencies  ──────────────────────────────────
wait_for_db() {
    echo "▸ Waiting for database at ${DB_HOST}:${DB_PORT:-3306}..."
    local retries=30
    while ! python3 -c "
import socket
s = socket.socket()
s.settimeout(2)
try:
    s.connect(('${DB_HOST}', ${DB_PORT:-3306}))
    s.close()
except Exception:
    raise SystemExit(1)
" 2>/dev/null; do
        retries=$((retries - 1))
        if [ $retries -le 0 ]; then
            echo "✗ Database not reachable after 30 attempts"
            exit 1
        fi
        sleep 2
    done
    echo "✓ Database is ready"
}

wait_for_redis() {
    local host="${1:-redis-cache}"
    local port="${2:-6379}"
    echo "▸ Waiting for Redis at ${host}:${port}..."
    local retries=15
    while ! python3 -c "
import socket
s = socket.socket()
s.settimeout(2)
try:
    s.connect(('${host}', ${port}))
    s.close()
except Exception:
    raise SystemExit(1)
" 2>/dev/null; do
        retries=$((retries - 1))
        if [ $retries -le 0 ]; then
            echo "✗ Redis not reachable at ${host}:${port}"
            exit 1
        fi
        sleep 1
    done
    echo "✓ Redis at ${host}:${port} is ready"
}

# ── Create site if it doesn't exist ─────────────────────────
maybe_create_site() {
    local site_name="${FRAPPE_SITE_NAME:-horizon.localhost}"

    if [ ! -d "sites/$site_name" ]; then
        echo "▸ Creating site: $site_name..."
        bench new-site "$site_name" \
            --db-host "${DB_HOST}" \
            --db-port "${DB_PORT:-3306}" \
            --db-root-password "${DB_ROOT_PASSWORD:?DB_ROOT_PASSWORD required for site creation}" \
            --admin-password "${ADMIN_PASSWORD:-admin}" \
            --mariadb-user-host-login-scope='%'

        # Set mandatory System Settings required by after_install hooks
        bench --site "$site_name" execute "frappe.db.set_value" --args '("System Settings", "System Settings", "language", "en")'
        bench --site "$site_name" execute "frappe.db.set_value" --args '("System Settings", "System Settings", "time_zone", "Asia/Kolkata")'
        bench --site "$site_name" execute "frappe.db.commit"

        bench --site "$site_name" install-app horizon_crm
        bench --site "$site_name" set-config mute_emails 1
        bench use "$site_name"
        echo "✓ Site created: $site_name"
    else
        echo "▸ Site $site_name exists, running migrate..."
        bench --site "$site_name" migrate --skip-failing 2>/dev/null || true
    fi
}

# ── Service runners ─────────────────────────────────────────
start_web() {
    echo "═══════════════════════════════════════"
    echo "  Horizon CRM — Web Server"
    echo "═══════════════════════════════════════"

    local workers="${GUNICORN_WORKERS:-$(( $(nproc) * 2 + 1 ))}"
    # Cap workers for small instances
    if [ "$workers" -gt 4 ]; then
        workers=4
    fi

    cd "$BENCH_DIR/sites"
    exec "$BENCH_DIR/env/bin/gunicorn" \
        --bind 0.0.0.0:8000 \
        --workers "$workers" \
        --timeout 120 \
        --worker-class gthread \
        --threads 2 \
        --worker-tmp-dir /dev/shm \
        --preload \
        frappe.app:application
}

start_socketio() {
    echo "═══════════════════════════════════════"
    echo "  Horizon CRM — Socketio Server"
    echo "═══════════════════════════════════════"
    cd "$BENCH_DIR"
    exec node apps/frappe/socketio.js
}

start_worker() {
    local queue="${WORKER_QUEUE:-short,default,long}"
    echo "═══════════════════════════════════════"
    echo "  Horizon CRM — Worker [$queue]"
    echo "═══════════════════════════════════════"
    exec bench worker --queue "$queue"
}

start_scheduler() {
    echo "═══════════════════════════════════════"
    echo "  Horizon CRM — Scheduler"
    echo "═══════════════════════════════════════"
    exec bench schedule
}

# ── Main ────────────────────────────────────────────────────
ROLE="${1:-web}"
echo "Starting Horizon CRM — role: $ROLE"

# All roles need config
configure_bench

case "$ROLE" in
    web)
        wait_for_db
        wait_for_redis "${REDIS_CACHE_HOST:-redis-cache}" "${REDIS_CACHE_PORT:-6379}"
        wait_for_redis "${REDIS_QUEUE_HOST:-redis-queue}" "${REDIS_QUEUE_PORT:-6379}"
        maybe_create_site
        start_web
        ;;
    socketio)
        wait_for_redis "${REDIS_QUEUE_HOST:-redis-queue}" "${REDIS_QUEUE_PORT:-6379}"
        start_socketio
        ;;
    worker)
        wait_for_db
        wait_for_redis "${REDIS_QUEUE_HOST:-redis-queue}" "${REDIS_QUEUE_PORT:-6379}"
        start_worker
        ;;
    scheduler)
        wait_for_db
        wait_for_redis "${REDIS_QUEUE_HOST:-redis-queue}" "${REDIS_QUEUE_PORT:-6379}"
        start_scheduler
        ;;
    migrate)
        wait_for_db
        bench --site "${FRAPPE_SITE_NAME:-horizon.localhost}" migrate
        ;;
    new-site)
        wait_for_db
        maybe_create_site
        ;;
    *)
        echo "Unknown role: $ROLE"
        echo "Valid roles: web, socketio, worker, scheduler, migrate, new-site"
        exit 1
        ;;
esac
