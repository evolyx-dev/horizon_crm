#!/bin/bash
# Pin an initialized bench to an exact Frappe commit.
set -euo pipefail

BENCH_DIR="${1:?Usage: pin-frappe.sh <bench-dir>}"
FRAPPE_BRANCH="${FRAPPE_BRANCH:?FRAPPE_BRANCH is required}"
FRAPPE_COMMIT="${FRAPPE_COMMIT:?FRAPPE_COMMIT is required}"
FRAPPE_APP_DIR="${BENCH_DIR}/apps/frappe"

if [ ! -d "${FRAPPE_APP_DIR}/.git" ]; then
    echo "Frappe app checkout not found at ${FRAPPE_APP_DIR}" >&2
    exit 1
fi

cd "${FRAPPE_APP_DIR}"

if [ -n "${FRAPPE_REMOTE:-}" ]; then
    REMOTE_NAME="${FRAPPE_REMOTE}"
elif git remote get-url origin >/dev/null 2>&1; then
    REMOTE_NAME="origin"
elif git remote get-url upstream >/dev/null 2>&1; then
    REMOTE_NAME="upstream"
else
    REMOTE_NAME="$(git remote | head -n 1)"
fi

if [ -z "${REMOTE_NAME}" ]; then
    echo "No git remote configured for ${FRAPPE_APP_DIR}" >&2
    exit 1
fi

CURRENT_COMMIT="$(git rev-parse HEAD)"
if [ "${CURRENT_COMMIT}" = "${FRAPPE_COMMIT}" ]; then
    echo "Frappe already pinned to ${FRAPPE_COMMIT}"
    exit 0
fi

echo "Pinning Frappe to ${FRAPPE_BRANCH}@${FRAPPE_COMMIT}..."

if ! git cat-file -e "${FRAPPE_COMMIT}^{commit}" 2>/dev/null; then
    git fetch --depth 1 "${REMOTE_NAME}" "${FRAPPE_COMMIT}" || git fetch --depth 1 "${REMOTE_NAME}" "${FRAPPE_BRANCH}"
fi

if ! git cat-file -e "${FRAPPE_COMMIT}^{commit}" 2>/dev/null; then
    echo "Unable to fetch Frappe commit ${FRAPPE_COMMIT}" >&2
    exit 1
fi

git checkout --detach "${FRAPPE_COMMIT}"
echo "Pinned Frappe to $(git rev-parse HEAD)"
