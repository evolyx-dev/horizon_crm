#!/bin/bash
# ─────────────────────────────────────────────────────
# Horizon CRM — Local Development Init Script
#
# Used by the root docker-compose.yml for local development.
# The app source is bind-mounted at /workspace/horizon_crm.
#
# Environment variables (set in docker-compose.yml):
#   SITE_NAME          — Frappe site name (default: horizon.localhost)
#   DB_ROOT_PASSWORD   — MariaDB root password (default: 123)
#   ADMIN_PASSWORD     — Frappe admin password (default: admin)
#   SEED_DEMO          — Set to "1" to seed demo data on first run
# ─────────────────────────────────────────────────────
set -e

BENCH_DIR="/workspace/frappe-bench"
SITE_NAME="${SITE_NAME:-horizon.localhost}"
DB_ROOT_PASSWORD="${DB_ROOT_PASSWORD:-123}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin}"

echo "============================================"
echo "  Horizon CRM — Local Development Setup"
echo "============================================"

# ── Step 0: Fix Docker volume permissions ───────────────
# Named volumes are created as root; ensure the frappe user
# (uid 1000) owns the bench directory.
if [ ! -w "$BENCH_DIR" ]; then
    echo "[0/7] Fixing volume permissions..."
    sudo mkdir -p "$BENCH_DIR"
    sudo chown -R frappe:frappe "$BENCH_DIR"
fi

# ── Step 1: Initialize bench ────────────────────────────
if [ ! -f "$BENCH_DIR/Procfile" ]; then
    echo "[1/7] Initializing Frappe bench..."
    bench init \
        --skip-redis-config-generation \
        --ignore-exist \
        --frappe-branch version-15 \
        "$BENCH_DIR"
else
    echo "[1/7] Bench already initialized, skipping..."
fi

cd "$BENCH_DIR"

# ── Step 2: Configure services ──────────────────────────
echo "[2/7] Configuring services..."
bench set-config -g db_host mariadb
bench set-config -g db_port 3306
bench set-config -g db_root_password "$DB_ROOT_PASSWORD"
bench set-config -g redis_cache  "redis://redis-cache:6379"
bench set-config -g redis_queue  "redis://redis-queue:6379"
bench set-config -g redis_socketio "redis://redis-queue:6379"
bench set-config -g developer_mode 1
bench set-config -g serve_default_site true

# ── Step 3: Remove redis from Procfile (Docker provides them) ─
echo "[3/7] Cleaning Procfile..."
sed -i '/redis/d' ./Procfile 2>/dev/null || true

# ── Step 4: Install app via symlink (live source for dev) ──
if [ ! -d "$BENCH_DIR/apps/horizon_crm" ]; then
    echo "[4/7] Installing Horizon CRM (symlink)..."
    ln -s /workspace/horizon_crm "$BENCH_DIR/apps/horizon_crm"
    "$BENCH_DIR/env/bin/pip" install -q -e /workspace/horizon_crm
    # Register in apps.txt (ensure trailing newline before appending)
    sed -i -e '$a\' "$BENCH_DIR/sites/apps.txt"
    echo "horizon_crm" >> "$BENCH_DIR/sites/apps.txt"
else
    echo "[4/7] App already installed, skipping..."
fi

# ── Step 5: Build frontend assets ──────────────────────
echo "[5/7] Building assets..."
bench build --app horizon_crm

# ── Step 6: Create site ────────────────────────────────
if [ ! -d "$BENCH_DIR/sites/$SITE_NAME" ]; then
    echo "[6/7] Creating site: $SITE_NAME..."
    bench new-site "$SITE_NAME" \
        --db-root-password "$DB_ROOT_PASSWORD" \
        --admin-password "$ADMIN_PASSWORD" \
        --no-mariadb-socket
    bench --site "$SITE_NAME" install-app horizon_crm
    bench --site "$SITE_NAME" set-config developer_mode 1
    bench --site "$SITE_NAME" set-config mute_emails 1
    bench use "$SITE_NAME"

    # Optional: seed demo data on first run
    if [ "${SEED_DEMO:-0}" = "1" ]; then
        echo "       Seeding demo data..."
        bench --site "$SITE_NAME" execute horizon_crm.setup.demo.seed
    fi
else
    echo "[6/7] Site already exists, running migrate..."
    bench --site "$SITE_NAME" migrate 2>/dev/null || true
fi

# ── Step 6: Start bench ────────────────────────────────
echo "[7/7] Starting bench..."
echo ""
echo "  Site:  http://localhost:8080 (nginx) / :8000 (bench direct)"
echo "  Login: Administrator / $ADMIN_PASSWORD"
if [ "${SEED_DEMO:-0}" = "1" ]; then
    echo "         demo@horizon.com / demo1234"
fi
echo "============================================"
bench start
