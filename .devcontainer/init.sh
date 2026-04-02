#!/bin/bash
# ─────────────────────────────────────────────────────
# Horizon CRM — GitHub Codespace / Dev Container Init
#
# Runs ONCE on container creation (onCreateCommand).
# Sets up bench, installs the app via symlink, creates
# a demo site, and seeds sample data for client demos.
# ─────────────────────────────────────────────────────
set -e

BENCH_DIR="/workspace/frappe-bench"
SITE_NAME="horizon.localhost"
ADMIN_PASSWORD="admin"

echo "============================================"
echo "  Horizon CRM — Codespace Setup"
echo "============================================"

# ── NVM / Node ────────────────────────────────────
export NVM_DIR="/home/frappe/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 18 2>/dev/null || true

# ── Wait for MariaDB ─────────────────────────────
echo "[0/7] Waiting for MariaDB..."
for i in $(seq 1 30); do
    if mariadb -h mariadb -u root -p123 -e "SELECT 1" &>/dev/null; then
        echo "       MariaDB is ready."
        break
    fi
    if [ "$i" -eq 30 ]; then
        echo "       ERROR: MariaDB not reachable after 30 attempts."
        exit 1
    fi
    echo "       Attempt $i/30 — waiting..."
    sleep 2
done

# ── Fix volume permissions ───────────────────────
if [ ! -w "$BENCH_DIR" ]; then
    echo "       Fixing bench directory permissions..."
    sudo mkdir -p "$BENCH_DIR"
    sudo chown -R frappe:frappe "$BENCH_DIR"
fi

# ── 1. Init bench ────────────────────────────────
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

# ── 2. Configure services ────────────────────────
echo "[2/7] Configuring services..."
bench set-config -g db_host mariadb
bench set-config -g db_port 3306
bench set-config -g db_root_password 123
bench set-config -g redis_cache  "redis://redis-cache:6379"
bench set-config -g redis_queue  "redis://redis-queue:6379"
bench set-config -g redis_socketio "redis://redis-queue:6379"
bench set-config -g developer_mode 0
bench set-config -g serve_default_site true

# ── 3. Remove redis from Procfile (Docker provides them) ─
echo "[3/7] Cleaning Procfile..."
sed -i '/redis/d' ./Procfile 2>/dev/null || true

# ── 4. Install app via symlink ───────────────────
if [ ! -d "$BENCH_DIR/apps/horizon_crm" ]; then
    echo "[4/7] Installing Horizon CRM (symlink)..."
    # Symlink the bind-mounted app into bench (live source, no git clone needed)
    ln -s /workspace/horizon_crm "$BENCH_DIR/apps/horizon_crm"
    # Install Python dependencies in bench virtualenv
    "$BENCH_DIR/env/bin/pip" install -q -e /workspace/horizon_crm
    # Register in apps.txt (ensure trailing newline before appending)
    sed -i -e '$a\' "$BENCH_DIR/sites/apps.txt"
    echo "horizon_crm" >> "$BENCH_DIR/sites/apps.txt"
else
    echo "[4/7] App already installed, skipping..."
fi

# ── 5. Build frontend assets ────────────────────
echo "[5/7] Building assets..."
bench build --app horizon_crm

# ── 6. Create site ──────────────────────────────
if [ ! -d "$BENCH_DIR/sites/$SITE_NAME" ]; then
    echo "[6/7] Creating site: $SITE_NAME..."
    bench new-site "$SITE_NAME" \
        --db-root-password 123 \
        --admin-password "$ADMIN_PASSWORD" \
        --no-mariadb-socket
    bench --site "$SITE_NAME" install-app horizon_crm
    bench --site "$SITE_NAME" set-config mute_emails 1
    bench use "$SITE_NAME"
else
    echo "[6/7] Site exists, running migrate..."
    bench --site "$SITE_NAME" migrate 2>/dev/null || true
fi

# ── 7. Seed demo data ──────────────────────────
echo "[7/7] Seeding demo data..."
bench --site "$SITE_NAME" execute horizon_crm.setup.demo.seed

echo ""
echo "============================================"
echo "  Setup complete!"
echo ""
echo "  URL:   Port 8080 via nginx (see Ports tab)"
echo "  Login: Administrator / $ADMIN_PASSWORD"
echo "         demo@horizon.com / demo1234"
echo "============================================"
