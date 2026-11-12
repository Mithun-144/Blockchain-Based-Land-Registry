#!/usr/bin/env bash
set -euo pipefail

# Ensure NBF-Lite compiled binaries expecting loopback addresses (localhost / 127.0.0.1)
# reach containerized sibling services transparently.
if [ -n "${LOOPBACK_FORWARDS:-}" ]; then
  for mapping in $LOOPBACK_FORWARDS; do
    local_port="${mapping%%=*}"
    target="${mapping#*=}"
    socat "TCP-LISTEN:${local_port},bind=127.0.0.1,fork,reuseaddr" "TCP:${target}" &
  done
  sleep 0.3
fi

exec "$@"

