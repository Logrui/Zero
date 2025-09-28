# ========================================
# Base Stage: Node.js with pnpm
# ========================================
FROM node:22-alpine AS base

# ========================================
# Dependencies Stage: Install Dependencies
# ========================================
FROM base AS deps
RUN apk add --no-cache libc6-compat
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

# Build the server application
RUN cd apps/server && pnpm run build || echo "No build step defined, using source files"

# ========================================
# Runner Stage: Production Environment
# ========================================
FROM base AS runner
WORKDIR /app

RUN npm install -g wrangler

RUN addgroup -S -g 1001 pnpm && \
    adduser -S -u 1001 worker -G pnpm

# Set environment variables
ENV NODE_ENV=production \
    PORT=8787 \
    HOSTNAME="0.0.0.0"

# Copy the server application
COPY --from=builder --chown=worker:pnpm /app ./

# Switch to non-root user
USER worker

# Expose server port
EXPOSE 8787

# Start the Cloudflare Workers server connected to cloud services
WORKDIR /app/apps/server
CMD ["wrangler", "dev", "--port", "8787", "--host", "0.0.0.0", "--config", "wrangler.prod.jsonc", "--remote", "--env", "production"]