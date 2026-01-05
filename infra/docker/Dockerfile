# ─────────────────────────────────────────────────────────────────────────────
# AddressKit Production Dockerfile
# Multi-stage, security-hardened build for the address validation API
# ─────────────────────────────────────────────────────────────────────────────
# Build: docker build --build-arg PACKAGE_TGZ=... -t addresskit .
# Run:   docker run -p 8080:8080 addresskit
# ─────────────────────────────────────────────────────────────────────────────

ARG BASE_IMAGE=node:24-alpine
ARG NODE_VERSION=24

# ─────────────────────────────────────────────────────────────────────────────
# Base stage: Common setup for all stages
# ─────────────────────────────────────────────────────────────────────────────
FROM ${BASE_IMAGE} AS base

# OCI Image Specification labels for container metadata
ARG MAINTAINER="Bradley Hodges"
ARG BUILD_DATE
ARG VCS_REF
ARG VERSION

LABEL maintainer="${MAINTAINER}" \
      org.opencontainers.image.title="AddressKit" \
      org.opencontainers.image.description="Australian address validation, search, and autocomplete API" \
      org.opencontainers.image.vendor="Bradley Hodges" \
      org.opencontainers.image.licenses="GPL-2.0-only" \
      org.opencontainers.image.source="https://github.com/bradleyhodges/addresskit" \
      org.opencontainers.image.documentation="https://github.com/bradleyhodges/addresskit#readme" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.version="${VERSION}"

# Install runtime dependencies:
# - dumb-init: Proper PID 1 signal handling for graceful shutdown
# - curl: Health check probes
# - ca-certificates: HTTPS connections for G-NAF downloads
RUN apk add --no-cache \
    dumb-init \
    curl \
    ca-certificates \
    && rm -rf /var/cache/apk/*

# Create application directories with proper permissions before switching users
RUN mkdir -p /home/node/gnaf /home/node/app /home/node/.npm \
    && chown -R node:node /home/node

# Switch to non-root user for security (principle of least privilege)
USER node
WORKDIR /home/node

# ─────────────────────────────────────────────────────────────────────────────
# Builder stage: Install package from tarball
# ─────────────────────────────────────────────────────────────────────────────
FROM base AS builder

ARG PACKAGE
ARG VERSION
ARG PACKAGE_TGZ

# Validate required build arguments
RUN if [ -z "${PACKAGE_TGZ}" ]; then \
        echo "ERROR: PACKAGE_TGZ build argument is required" >&2; \
        exit 1; \
    fi

LABEL package="${PACKAGE}" \
      version="${VERSION}" \
      stage="builder"

# Configure npm for non-root global installs and performance
RUN npm config set prefix "/home/node/.npm" \
    && npm config set update-notifier false \
    && npm config set fund false

# Copy package tarball (separate layer for cache optimization)
COPY --chown=node:node "${PACKAGE_TGZ}" "/tmp/${PACKAGE_TGZ}"

# Install the package globally with production optimizations
RUN npm install \
    --prefer-offline \
    --no-audit \
    --no-fund \
    --omit=dev \
    --global \
    "/tmp/${PACKAGE_TGZ}" \
    && npm cache clean --force \
    && rm -f "/tmp/${PACKAGE_TGZ}"

# ─────────────────────────────────────────────────────────────────────────────
# Runtime stage: Minimal production image
# ─────────────────────────────────────────────────────────────────────────────
FROM base AS runtime

ARG PACKAGE
ARG VERSION

LABEL package="${PACKAGE}" \
      version="${VERSION}" \
      stage="runtime"

# Copy only the installed npm packages from builder (minimal image)
COPY --from=builder --chown=node:node /home/node/.npm /home/node/.npm

# Copy entrypoint and healthcheck scripts from build context
COPY --chown=node:node infra/docker/scripts/entrypoint.sh /home/node/entrypoint.sh
COPY --chown=node:node infra/docker/scripts/healthcheck.sh /home/node/healthcheck.sh

# Ensure scripts are executable (fix potential Windows line endings too)
USER root
RUN chmod +x /home/node/entrypoint.sh /home/node/healthcheck.sh \
    && sed -i 's/\r$//' /home/node/entrypoint.sh /home/node/healthcheck.sh \
    && chown node:node /home/node/entrypoint.sh /home/node/healthcheck.sh
USER node

# Add npm bin to PATH
ENV PATH="/home/node/.npm/bin:$PATH"

# ─────────────────────────────────────────────────────────────────────────────
# Environment Configuration (with secure defaults)
# ─────────────────────────────────────────────────────────────────────────────

# OpenSearch connection settings
ENV ELASTIC_PORT="9200" \
    ELASTIC_HOST="opensearch" \
    ELASTIC_USERNAME="" \
    ELASTIC_PASSWORD="" \
    ELASTIC_PROTOCOL="http"

# Index configuration
ENV ES_INDEX_NAME="addresskit"

# Indexing retry configuration (production-tuned for reliability)
ENV ADDRESSKIT_INDEX_TIMEOUT="300s" \
    ADDRESSKIT_INDEX_BACKOFF="30000" \
    ADDRESSKIT_INDEX_BACKOFF_INCREMENT="30000" \
    ADDRESSKIT_INDEX_BACKOFF_MAX="600000" \
    ADDRESSKIT_INDEX_MAX_RETRIES="10"

# Server configuration
ENV PORT="8080" \
    NODE_ENV="production"

# Caching configuration (optimized for production)
ENV ADDRESSKIT_CACHE_ENABLED="true" \
    ADDRESSKIT_CACHE_MAX_ENTRIES="1000" \
    ADDRESSKIT_CACHE_TTL_MS="300000"

# G-NAF data directory (persistent storage for loader)
ENV GNAF_DIR="/home/node/gnaf"

# Resource management (dynamic scaling based on container limits)
ENV ADDRESSKIT_DYNAMIC_RESOURCES="true" \
    ADDRESSKIT_TARGET_MEMORY_UTILIZATION="0.7"

# Node.js production optimizations
ENV NODE_OPTIONS="--max-old-space-size=512 --enable-source-maps"

# Security: Disable npm update checks and telemetry
ENV NPM_CONFIG_UPDATE_NOTIFIER="false" \
    NPM_CONFIG_FUND="false"

# ─────────────────────────────────────────────────────────────────────────────
# Health check configuration
# ─────────────────────────────────────────────────────────────────────────────
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD ["/home/node/healthcheck.sh"]

# ─────────────────────────────────────────────────────────────────────────────
# Container configuration
# ─────────────────────────────────────────────────────────────────────────────

# Expose the API port (documentation only, use -p to publish)
EXPOSE 8080

# Volume for persistent G-NAF data
VOLUME ["/home/node/gnaf"]

# Use dumb-init as PID 1 for proper signal handling
ENTRYPOINT ["/usr/bin/dumb-init", "--", "/home/node/entrypoint.sh"]

# Default command: Start the API server in daemon mode
CMD ["addresskit", "start", "--daemon"]
