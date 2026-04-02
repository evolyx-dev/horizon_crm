#!/bin/bash

set -euo pipefail

MAX_ATTEMPTS="${MAX_ATTEMPTS:-5}"
SLEEP_SECONDS="${SLEEP_SECONDS:-5}"

if [ "$#" -eq 0 ]; then
    echo "usage: retry.sh <command> [args...]" >&2
    exit 64
fi

attempt=1
while true; do
    if "$@"; then
        exit 0
    fi

    if [ "$attempt" -ge "$MAX_ATTEMPTS" ]; then
        echo "Command failed after ${attempt} attempts: $*" >&2
        exit 1
    fi

    echo "Command failed (attempt ${attempt}/${MAX_ATTEMPTS}): $*" >&2
    sleep "$SLEEP_SECONDS"
    attempt=$((attempt + 1))
done
