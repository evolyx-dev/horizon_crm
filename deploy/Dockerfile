# ─────────────────────────────────────────────────────────────
# Horizon CRM — Production Docker Image
# Multi-stage build: bench init → app install → lean runtime
# Supports: linux/amd64, linux/arm64 (Oracle A1, Apple Silicon)
# ─────────────────────────────────────────────────────────────

# ── Stage 1: Build bench + install app ──────────────────────
FROM frappe/bench:latest AS builder

ARG FRAPPE_BRANCH=version-15
ARG APP_REPO=.

USER frappe
WORKDIR /home/frappe

# Initialize bench
RUN bench init \
    --skip-redis-config-generation \
    --frappe-branch ${FRAPPE_BRANCH} \
    frappe-bench

WORKDIR /home/frappe/frappe-bench

# Copy the app source into the image
COPY --chown=frappe:frappe . /tmp/horizon_crm

# bench get-app requires a git repo; create a throwaway one
RUN cd /tmp/horizon_crm \
    && git init \
    && git config user.email "build@docker" \
    && git config user.name "docker" \
    && git add -A \
    && git commit -m "build"

# Install the app from local source
RUN bench get-app file:///tmp/horizon_crm \
    && bench build --app horizon_crm

# Remove build artifacts to slim the image (keep frappe node_modules for socketio)
RUN rm -rf /tmp/horizon_crm \
    && find apps -path apps/frappe/node_modules -prune -o -name node_modules -type d -print -exec rm -rf {} + 2>/dev/null || true \
    && find apps -name .git -type d -exec rm -rf {} + 2>/dev/null || true \
    && rm -rf /home/frappe/.cache /home/frappe/.npm

# ── Stage 2: Production runtime ────────────────────────────
FROM frappe/bench:latest AS production

ARG FRAPPE_BRANCH=version-15

USER frappe
WORKDIR /home/frappe/frappe-bench

# Copy the fully built bench from builder
COPY --from=builder --chown=frappe:frappe /home/frappe/frappe-bench /home/frappe/frappe-bench

# Remove the Procfile (we run services individually via entrypoint)
RUN rm -f Procfile

# Copy production entrypoint and config
COPY --chown=frappe:frappe deploy/entrypoint.sh /home/frappe/entrypoint.sh
RUN chmod +x /home/frappe/entrypoint.sh

# Healthcheck endpoint
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD curl -fsS -H "Host: ${FRAPPE_SITE_NAME:-horizon.localhost}" http://localhost:8000/api/method/ping || exit 1

EXPOSE 8000 9000

ENTRYPOINT ["/home/frappe/entrypoint.sh"]
CMD ["web"]
