#!/bin/bash
set -e

echo "============================================"
echo "  Horizon CRM - Docker Environment Setup"
echo "============================================"

BENCH_DIR="/workspace/frappe-bench"
SITE_NAME="horizon.localhost"

# Check if bench is already initialized
if [ ! -f "$BENCH_DIR/Procfile" ]; then
    echo "[1/6] Initializing Frappe bench..."
    cd /workspace
    bench init frappe-bench --skip-redis-config-generation --frappe-branch version-15
    cd "$BENCH_DIR"
else
    echo "[1/6] Bench already initialized, skipping..."
    cd "$BENCH_DIR"
fi

# Configure Redis and MariaDB hosts
echo "[2/6] Configuring external services..."
bench set-config -g db_host mariadb
bench set-config -g db_port 3306
bench set-config -g redis_cache "redis://redis-cache:6379"
bench set-config -g redis_queue "redis://redis-queue:6379"
bench set-config -g redis_socketio "redis://redis-queue:6379"
bench set-config -g developer_mode 1

# Remove Redis from Procfile (external containers handle it)
echo "[3/6] Updating Procfile..."
sed -i '/redis/d' ./Procfile 2>/dev/null || true

# Install horizon_crm app if link exists
if [ -d "$BENCH_DIR/apps/horizon_crm" ]; then
    echo "[4/6] Installing horizon_crm app..."
    cd "$BENCH_DIR"
    pip install -e apps/horizon_crm 2>/dev/null || bench pip install -e apps/horizon_crm 2>/dev/null || true
else
    echo "[4/6] horizon_crm app not found, skipping..."
fi

# Create site if not exists
if [ ! -d "$BENCH_DIR/sites/$SITE_NAME" ]; then
    echo "[5/6] Creating site: $SITE_NAME..."
    bench new-site "$SITE_NAME" \
        --db-root-password 123 \
        --admin-password admin \
        --mariadb-user-host-login-scope='%' \
        --no-setup
    bench --site "$SITE_NAME" set-config developer_mode 1
else
    echo "[5/6] Site $SITE_NAME already exists, skipping..."
fi

# Install app on site
if [ -d "$BENCH_DIR/apps/horizon_crm" ]; then
    echo "[6/6] Installing horizon_crm on site..."
    bench --site "$SITE_NAME" install-app horizon_crm 2>/dev/null || true
else
    echo "[6/6] Skipping app install (app not found)..."
fi

echo ""
echo "============================================"
echo "  Setup Complete!"
echo "  Site: $SITE_NAME"
echo "  URL:  http://localhost:8000"
echo "  User: Administrator"
echo "  Pass: admin"
echo ""
echo "  Run: bench start"
echo "============================================"
