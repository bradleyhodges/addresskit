#!/bin/sh
# ─────────────────────────────────────────────────────────────────────────────
# AddressKit Container Entrypoint Script
# Handles initialization, environment validation, and graceful startup
# ─────────────────────────────────────────────────────────────────────────────
set -e

# ─────────────────────────────────────────────────────────────────────────────
# Color codes for terminal output
# ─────────────────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ─────────────────────────────────────────────────────────────────────────────
# Logging functions
# ─────────────────────────────────────────────────────────────────────────────
log_info() {
    printf '%b[INFO]%b %s\n' "${BLUE}" "${NC}" "$1"
}

log_success() {
    printf '%b[OK]%b %s\n' "${GREEN}" "${NC}" "$1"
}

log_warn() {
    printf '%b[WARN]%b %s\n' "${YELLOW}" "${NC}" "$1"
}

log_error() {
    printf '%b[ERROR]%b %s\n' "${RED}" "${NC}" "$1" >&2
}

# ─────────────────────────────────────────────────────────────────────────────
# Environment validation
# ─────────────────────────────────────────────────────────────────────────────
validate_environment() {
    log_info "Validating environment configuration..."
    
    local has_errors=0
    
    # Required: OpenSearch connection
    if [ -z "${ELASTIC_HOST}" ]; then
        log_error "ELASTIC_HOST is required but not set"
        has_errors=1
    fi
    
    if [ -z "${ELASTIC_PORT}" ]; then
        log_error "ELASTIC_PORT is required but not set"
        has_errors=1
    fi
    
    # Validate port is numeric
    if [ -n "${PORT}" ] && ! echo "${PORT}" | grep -qE '^[0-9]+$'; then
        log_error "PORT must be a valid number (got: ${PORT})"
        has_errors=1
    fi
    
    # Warn about insecure configurations
    if [ "${ELASTIC_PROTOCOL}" = "http" ] && [ "${NODE_ENV}" = "production" ]; then
        log_warn "Using HTTP for OpenSearch in production is not recommended"
    fi
    
    if [ "${ADDRESSKIT_ACCESS_CONTROL_ALLOW_ORIGIN}" = "*" ] && [ "${NODE_ENV}" = "production" ]; then
        log_warn "CORS is set to allow all origins (*) in production"
    fi
    
    if [ $has_errors -eq 1 ]; then
        log_error "Environment validation failed. Please check your configuration."
        exit 1
    fi
    
    log_success "Environment validation passed"
}

# ─────────────────────────────────────────────────────────────────────────────
# Wait for OpenSearch to be ready
# ─────────────────────────────────────────────────────────────────────────────
wait_for_opensearch() {
    local max_attempts="${ADDRESSKIT_STARTUP_MAX_RETRIES:-60}"
    local wait_seconds="${ADDRESSKIT_STARTUP_RETRY_INTERVAL:-5}"
    local attempt=1
    
    local opensearch_url="${ELASTIC_PROTOCOL}://${ELASTIC_HOST}:${ELASTIC_PORT}"
    
    log_info "Waiting for OpenSearch at ${opensearch_url}..."
    
    while [ $attempt -le $max_attempts ]; do
        # Build curl command with optional authentication
        local curl_cmd="curl -fsS --max-time 5"
        
        if [ -n "${ELASTIC_USERNAME}" ] && [ -n "${ELASTIC_PASSWORD}" ]; then
            curl_cmd="${curl_cmd} -u ${ELASTIC_USERNAME}:${ELASTIC_PASSWORD}"
        fi
        
        if ${curl_cmd} "${opensearch_url}/_cluster/health" >/dev/null 2>&1; then
            log_success "OpenSearch is ready (attempt ${attempt}/${max_attempts})"
            return 0
        fi
        
        log_info "OpenSearch not ready yet (attempt ${attempt}/${max_attempts}), waiting ${wait_seconds}s..."
        sleep $wait_seconds
        attempt=$((attempt + 1))
    done
    
    log_error "OpenSearch did not become ready after ${max_attempts} attempts"
    return 1
}

# ─────────────────────────────────────────────────────────────────────────────
# Ensure GNAF directory exists and is writable
# ─────────────────────────────────────────────────────────────────────────────
setup_gnaf_directory() {
    log_info "Setting up GNAF data directory..."
    
    if [ -z "${GNAF_DIR}" ]; then
        export GNAF_DIR="/home/node/gnaf"
    fi
    
    if [ ! -d "${GNAF_DIR}" ]; then
        log_info "Creating GNAF directory: ${GNAF_DIR}"
        mkdir -p "${GNAF_DIR}" 2>/dev/null || {
            log_error "Failed to create GNAF directory: ${GNAF_DIR}"
            return 1
        }
    fi
    
    if [ ! -w "${GNAF_DIR}" ]; then
        log_error "GNAF directory is not writable: ${GNAF_DIR}"
        return 1
    fi
    
    log_success "GNAF directory ready: ${GNAF_DIR}"
}

# ─────────────────────────────────────────────────────────────────────────────
# Display startup banner
# ─────────────────────────────────────────────────────────────────────────────
show_banner() {
    echo ""
    echo "╔═══════════════════════════════════════════════════════════════════╗"
    echo "║            ___       __    __                    __ __ _ __       ║"
    echo "║           /   | ____/ /___/ /_______  __________/ //_/(_) /_      ║"
    echo "║          / /| |/ __  / __  / ___/ _ \/ ___/ ___/ ,<  / / __/      ║"
    echo "║         / ___ / /_/ / /_/ / /  /  __(__  |__  ) /| |/ / /_        ║"
    echo "║        /_/  |_\__,_/\__,_/_/   \___/____/____/_/ |_/_/\__/        ║"
    echo "║                                                                   ║"
    echo "║              Australian Address Validation API                    ║"
    echo "║                                                                   ║"
    echo "╚═══════════════════════════════════════════════════════════════════╝"
    echo ""
    log_info "Environment: ${NODE_ENV:-development}"
    log_info "OpenSearch: ${ELASTIC_PROTOCOL}://${ELASTIC_HOST}:${ELASTIC_PORT}"
    log_info "Index: ${ES_INDEX_NAME:-addresskit}"
    echo ""
}

# ─────────────────────────────────────────────────────────────────────────────
# Graceful shutdown handler
# ─────────────────────────────────────────────────────────────────────────────
shutdown_handler() {
    log_info "Received shutdown signal, cleaning up..."
    # Kill child processes gracefully
    if [ -n "${PID}" ]; then
        kill -TERM "${PID}" 2>/dev/null || true
        wait "${PID}" 2>/dev/null || true
    fi
    log_info "Shutdown complete"
    exit 0
}

# Register shutdown handlers
trap shutdown_handler SIGTERM SIGINT SIGQUIT

# ─────────────────────────────────────────────────────────────────────────────
# Main entrypoint logic
# ─────────────────────────────────────────────────────────────────────────────
main() {
    # Show banner unless running in quiet mode
    if [ "${ADDRESSKIT_QUIET}" != "true" ]; then
        show_banner
    fi
    
    # Validate environment
    validate_environment
    
    # Setup GNAF directory
    setup_gnaf_directory
    
    # Wait for OpenSearch (skip if explicitly disabled)
    if [ "${ADDRESSKIT_SKIP_OPENSEARCH_WAIT}" != "true" ]; then
        wait_for_opensearch || exit 1
    fi
    
    log_info "Starting AddressKit with command: $*"
    echo ""
    
    # Execute the command passed to the container
    exec "$@"
}

# Run main function with all passed arguments
main "$@"

