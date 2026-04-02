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
PIN_STATE_FILE="${BENCH_DIR}/.frappe-pinned-commit"
PRIMARY_SITE_NAME="${PRIMARY_SITE_NAME:-${SITE_NAME:-horizon.localhost}}"
SECONDARY_SITE_NAME="${SECONDARY_SITE_NAME:-tenant2.localhost}"
DB_ROOT_PASSWORD="${DB_ROOT_PASSWORD:-123}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin}"
FRAPPE_BRANCH="${FRAPPE_BRANCH:-develop}"
FRAPPE_COMMIT="${FRAPPE_COMMIT:-0afbf2a98e00288bba20a3a6231b7dabe31df69f}"
SITE_SETUP_LANGUAGE="${SITE_SETUP_LANGUAGE:-English}"
SITE_SETUP_COUNTRY="${SITE_SETUP_COUNTRY:-United States}"
SITE_SETUP_TIMEZONE="${SITE_SETUP_TIMEZONE:-America/New_York}"
SITE_SETUP_CURRENCY="${SITE_SETUP_CURRENCY:-USD}"

complete_site_setup() {
    local site_name="${1:-}"
    local setup_complete=""
    local setup_args=""

    if [ -z "$site_name" ]; then
        return
    fi

    setup_complete="$(
        bench --site "$site_name" execute frappe.db.get_single_value --args '["System Settings", "setup_complete"]' 2>/dev/null \
            | tail -n 1 \
            | tr -d '\r'
    )"

    if [ "$setup_complete" = "1" ]; then
        return
    fi

    echo "       Completing setup wizard on $site_name..."
    setup_args="$(
        python3 - <<'PY'
import json
import os

print(
    json.dumps(
        [
            {
                "language": os.environ.get("SITE_SETUP_LANGUAGE", "English"),
                "email": "Administrator",
                "full_name": "Administrator",
                "password": os.environ.get("ADMIN_PASSWORD", "admin"),
                "country": os.environ.get("SITE_SETUP_COUNTRY", "United States"),
                "timezone": os.environ.get("SITE_SETUP_TIMEZONE", "America/New_York"),
                "currency": os.environ.get("SITE_SETUP_CURRENCY", "USD"),
                "enable_telemetry": 0,
            }
        ]
    )
)
PY
    )"
    bench --site "$site_name" execute frappe.desk.page.setup_wizard.setup_wizard.setup_complete --args "$setup_args"
}

ensure_site() {
    local site_name="${1:-}"
    local seed_demo="${2:-0}"

    if [ -z "$site_name" ]; then
        return
    fi

    if [ ! -d "$BENCH_DIR/sites/$site_name" ]; then
        echo "       Creating site: $site_name..."
        bench new-site "$site_name" \
            --db-root-username root \
            --db-root-password "$DB_ROOT_PASSWORD" \
            --admin-password "$ADMIN_PASSWORD" \
            --mariadb-user-host-login-scope='%'
        bench --site "$site_name" install-app horizon_crm
        bench --site "$site_name" set-config developer_mode 1
        bench --site "$site_name" set-config mute_emails 1
        complete_site_setup "$site_name"

        if [ "$seed_demo" = "1" ]; then
            echo "       Seeding demo data on $site_name..."
            bench --site "$site_name" execute horizon_crm.setup.demo.seed
        fi
    else
        echo "       Site $site_name exists, running migrate..."
        bench --site "$site_name" migrate 2>/dev/null || true
        complete_site_setup "$site_name"
    fi
}

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
    echo "[1/8] Initializing Frappe bench..."
    bash /workspace/horizon_crm/docker/retry.sh bench init \
        --skip-redis-config-generation \
        --ignore-exist \
        --skip-assets \
        --frappe-branch "$FRAPPE_BRANCH" \
        "$BENCH_DIR"
else
    echo "[1/8] Bench already initialized, skipping..."
fi

cd "$BENCH_DIR"

# ── Step 2: Pin Frappe checkout ─────────────────────────
echo "[2/8] Pinning Frappe checkout..."
PREVIOUS_PIN="$(cat "$PIN_STATE_FILE" 2>/dev/null || true)"
bash /workspace/horizon_crm/docker/pin-frappe.sh "$BENCH_DIR"
if [ "$PREVIOUS_PIN" != "$FRAPPE_COMMIT" ]; then
    echo "[2/8] Syncing Frappe requirements..."
    bash /workspace/horizon_crm/docker/retry.sh bench setup requirements --dev
    printf '%s' "$FRAPPE_COMMIT" > "$PIN_STATE_FILE"
fi

# ── Step 3: Configure services ──────────────────────────
echo "[3/8] Configuring services..."
bench set-config -g db_host mariadb
bench set-config -g db_port 3306
bench set-config -g db_root_password "$DB_ROOT_PASSWORD"
bench set-config -g redis_cache  "redis://redis-cache:6379"
bench set-config -g redis_queue  "redis://redis-queue:6379"
bench set-config -g redis_socketio "redis://redis-queue:6379"
bench set-config -g developer_mode 1
bench set-config -g serve_default_site true

# ── Step 4: Remove redis from Procfile (Docker provides them) ─
echo "[4/8] Cleaning Procfile..."
sed -i '/redis/d' ./Procfile 2>/dev/null || true

# ── Step 5: Install app via symlink (live source for dev) ──
if [ ! -d "$BENCH_DIR/apps/horizon_crm" ]; then
    echo "[5/8] Installing Horizon CRM (symlink)..."
    ln -s /workspace/horizon_crm "$BENCH_DIR/apps/horizon_crm"
    "$BENCH_DIR/env/bin/pip" install -q -e /workspace/horizon_crm
    # Register in apps.txt (ensure trailing newline before appending)
    sed -i -e '$a\' "$BENCH_DIR/sites/apps.txt"
    echo "horizon_crm" >> "$BENCH_DIR/sites/apps.txt"
else
    echo "[5/8] App already installed, skipping..."
fi

# ── Step 6: Build frontend assets ──────────────────────
echo "[6/8] Building assets..."
bench build --app horizon_crm

# ── Step 7: Create / migrate sites ─────────────────────
echo "[7/8] Ensuring tenant sites exist..."
ensure_site "$PRIMARY_SITE_NAME" "${SEED_DEMO:-0}"
if [ "$SECONDARY_SITE_NAME" != "$PRIMARY_SITE_NAME" ]; then
    ensure_site "$SECONDARY_SITE_NAME" "0"
fi
bench use "$PRIMARY_SITE_NAME"

# ── Step 8: Start bench ────────────────────────────────
echo "[8/8] Starting bench..."
echo ""
echo "  Site:  http://localhost:8080 (nginx) / :8000 (bench direct)"
echo "  Login: Administrator / $ADMIN_PASSWORD"
if [ "${SEED_DEMO:-0}" = "1" ]; then
    echo "         demo@horizon.com / demo1234"
fi
echo "  Primary site:   $PRIMARY_SITE_NAME"
if [ "$SECONDARY_SITE_NAME" != "$PRIMARY_SITE_NAME" ]; then
    echo "  Secondary site: $SECONDARY_SITE_NAME"
fi
echo "============================================"
bench start
