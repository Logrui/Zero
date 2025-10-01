# ========================================
# Base Stage: Node.js with pnpm
# ========================================
FROM node:22-slim AS base

# ========================================
# Dependencies Stage: Install Dependencies
# ========================================
FROM base AS deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Install pnpm and turbo globally
RUN npm install -g pnpm turbo

# Copy workspace configuration
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/server/package.json ./apps/server/
COPY packages/ ./packages/
COPY patches/ ./patches/

# Install dependencies
RUN pnpm install --frozen-lockfile

# ========================================
# Builder Stage: Build the Server
# ========================================
FROM base AS builder
WORKDIR /app

RUN npm install -g pnpm wrangler

# Copy workspace configuration and dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=deps /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=deps /app/turbo.json ./turbo.json

# Copy source code
COPY apps/server/ ./apps/server/
COPY packages/ ./packages/

# Set environment variables for build
ENV NODE_ENV=production \
    CI=true

# Expose root node_modules inside apps/server via symlink (harmless if already present)
RUN ln -s /app/node_modules /app/apps/server/node_modules 2>/dev/null || true \
    && echo "Using root node_modules via symlink for Cloudflare Workers development"

# ========================================
# Runner Stage: Production Environment
# ========================================
FROM base AS runner
WORKDIR /app

RUN npm install -g wrangler pnpm

RUN groupadd --gid 1001 pnpm && \
    useradd --uid 1001 --gid pnpm --shell /bin/bash --create-home worker

# Set environment variables
ENV NODE_ENV=production \
    PORT=8787 \
    HOSTNAME="0.0.0.0" \
    NODE_PATH=/app/node_modules \
    WRANGLER_LOG=debug

# Copy the server application
COPY --from=builder --chown=worker:pnpm /app ./

# Switch to non-root user
USER worker

# Expose server port
EXPOSE 8787

# For production, we need to build and run the worker
# Use wrangler dev with --remote to connect to real Cloudflare services
WORKDIR /app/apps/server
# Production environment (default) - using local mode for testing
CMD ["sh", "-c", "cd /app/apps/server && pnpm exec wrangler dev --local --port 8787 --host 0.0.0.0 --env local"]