#!/bin/bash
set -e

echo "============================================"
echo "  Horizon CRM - Docker Environment Setup"
echo "============================================"

BENCH_DIR="/workspace/frappe-bench"
DEFAULT_SITE="horizon.localhost"
DB_ROOT_PASSWORD="${DB_ROOT_PASSWORD:-123}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin}"

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

# Create default site if not exists
if [ ! -d "$BENCH_DIR/sites/$DEFAULT_SITE" ]; then
    echo "[5/6] Creating default site: $DEFAULT_SITE..."
    bench new-site "$DEFAULT_SITE" \
        --db-root-password "$DB_ROOT_PASSWORD" \
        --admin-password "$ADMIN_PASSWORD" \
        --mariadb-user-host-login-scope='%' \
        --no-setup
    bench --site "$DEFAULT_SITE" set-config developer_mode 1
else
    echo "[5/6] Site $DEFAULT_SITE already exists, skipping..."
fi

# Install app on default site
if [ -d "$BENCH_DIR/apps/horizon_crm" ]; then
    echo "[6/6] Installing horizon_crm on default site..."
    bench --site "$DEFAULT_SITE" install-app horizon_crm 2>/dev/null || true
else
    echo "[6/6] Skipping app install (app not found)..."
fi

echo ""
echo "============================================"
echo "  Setup Complete!"
echo "  Default Site: $DEFAULT_SITE"
echo "  URL:          http://localhost:8000"
echo "  User:         Administrator"
echo "  Pass:         $ADMIN_PASSWORD"
echo ""
echo "  To create additional tenant sites:"
echo "    bench new-site agency2.localhost \\"
echo "      --db-root-password $DB_ROOT_PASSWORD \\"
echo "      --admin-password <password>"
echo "    bench --site agency2.localhost install-app horizon_crm"
echo "    bench --site agency2.localhost horizon-crm create-tenant \\"
echo "      --agency-name 'Agency Two' \\"
echo "      --admin-email admin@agency2.com \\"
echo "      --admin-password <password>"
echo ""
echo "  Run: bench start"
echo "============================================"
