#!/bin/bash
set -e

BENCH_DIR="/workspace/frappe-bench"
SITE_NAME="${SITE_NAME:-horizon.localhost}"
DB_ROOT_PASSWORD="${DB_ROOT_PASSWORD:-123}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin}"

echo "============================================"
echo "  Horizon CRM — Docker Development"
echo "============================================"

# ── Step 1: Initialize bench if needed ───────────────────
if [ ! -f "$BENCH_DIR/Procfile" ]; then
    echo "[1/6] Initializing Frappe bench..."
    bench init \
        --skip-redis-config-generation \
        --frappe-branch version-15 \
        "$BENCH_DIR"
else
    echo "[1/6] Bench already initialized, skipping..."
fi

cd "$BENCH_DIR"

# ── Step 2: Configure services ───────────────────────────
echo "[2/6] Configuring services..."
bench set-config -g db_host mariadb
bench set-config -g db_port 3306
bench set-config -g db_root_password "$DB_ROOT_PASSWORD"
bench set-config -g redis_cache "redis://redis-cache:6379"
bench set-config -g redis_queue "redis://redis-queue:6379"
bench set-config -g redis_socketio "redis://redis-queue:6379"
bench set-config -g developer_mode 1
bench set-config -g serve_default_site true

# ── Step 3: Clean Procfile ───────────────────────────────
echo "[3/6] Updating Procfile..."
sed -i '/redis/d' ./Procfile 2>/dev/null || true

# ── Step 4: Link app ────────────────────────────────────
if [ ! -d "$BENCH_DIR/apps/horizon_crm" ]; then
    echo "[4/6] Installing horizon_crm app..."
    bench get-app --resolve-deps file:///workspace/app
else
    echo "[4/6] App already linked, skipping..."
fi

# ── Step 5: Create site ─────────────────────────────────
if [ ! -d "$BENCH_DIR/sites/$SITE_NAME" ]; then
    echo "[5/6] Creating site: $SITE_NAME..."
    bench new-site "$SITE_NAME" \
        --db-root-password "$DB_ROOT_PASSWORD" \
        --admin-password "$ADMIN_PASSWORD" \
        --no-mariadb-socket
    bench --site "$SITE_NAME" install-app horizon_crm
    bench --site "$SITE_NAME" set-config developer_mode 1
    bench --site "$SITE_NAME" set-config mute_emails 1
    bench use "$SITE_NAME"
else
    echo "[5/6] Site already exists, running migrate..."
    bench --site "$SITE_NAME" migrate 2>/dev/null || true
fi

# ── Step 6: Start ───────────────────────────────────────
echo "[6/6] Starting bench..."
echo ""
echo "  Site:  http://localhost:8000"
echo "  Login: Administrator / $ADMIN_PASSWORD"
echo "============================================"
bench start
