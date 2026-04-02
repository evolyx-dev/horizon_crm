#!/bin/bash
# ─────────────────────────────────────────────────────
# Horizon CRM — Start bench on each codespace resume
# Runs every time the codespace starts (postStartCommand)
# ─────────────────────────────────────────────────────
BENCH_DIR="/workspace/frappe-bench"

export NVM_DIR="/home/frappe/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 18 2>/dev/null || true

cd "$BENCH_DIR"

# Ensure redis lines are removed from Procfile
sed -i '/redis/d' ./Procfile 2>/dev/null || true

echo "============================================"
echo "  Horizon CRM — Starting..."
echo ""
echo "  Login: Administrator / admin"
echo "         demo@horizon.com / demo1234"
echo "============================================"

# Start in background so postStartCommand returns
nohup bench start > /tmp/bench.log 2>&1 &

# Wait a moment for Gunicorn to bind
sleep 5
echo "Bench started (PID $!). Logs: /tmp/bench.log"
