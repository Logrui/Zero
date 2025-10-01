FROM node:20-slim

# Install wrangler
RUN npm i -g wrangler@4.38.0 \
    && apt-get update && apt-get install -y ca-certificates && update-ca-certificates

WORKDIR /app

# Copy workspace configuration and shared packages
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/tsconfig ./packages/tsconfig
COPY patches ./patches

# Copy server app
COPY apps/server ./apps/server

# Install workspace deps (adjust if you use workspaces at root)
RUN npm i -g pnpm && SKIP_ROOT_POSTINSTALL=1 pnpm install --filter @zero/server...

WORKDIR /app/apps/server

# Expose Wrangler dev port
EXPOSE 8787

# Default to a production-like local run inside the container
# You can switch to --env staging to mirror staging bindings
CMD [ "wrangler", "dev", "--env", "production", "--show-interactive-dev-session=false" ]
