#!/bin/sh
# ─────────────────────────────────────────────────────────────────────────────
# AddressKit Health Check Script
# Used by Docker HEALTHCHECK instruction and orchestrators (K8s, ECS, etc.)
# ─────────────────────────────────────────────────────────────────────────────
set -e

# Configuration with sensible defaults
HEALTH_CHECK_PORT="${PORT:-8080}"
HEALTH_CHECK_PATH="${ADDRESSKIT_HEALTH_PATH:-/addresses?q=test}"
HEALTH_CHECK_TIMEOUT="${ADDRESSKIT_HEALTH_TIMEOUT:-5}"

# Build the health check URL
HEALTH_URL="http://localhost:${HEALTH_CHECK_PORT}${HEALTH_CHECK_PATH}"

# Perform the health check
# - Follow redirects (-L)
# - Fail silently on HTTP errors (-f)
# - Silent mode (-s)
# - Show errors (-S)
# - Set timeout (--max-time)
# - Output to null (we only care about exit code)
curl -LfsS --max-time "${HEALTH_CHECK_TIMEOUT}" "${HEALTH_URL}" >/dev/null 2>&1

# Exit code from curl:
# 0 = success (healthy)
# non-zero = failure (unhealthy)

