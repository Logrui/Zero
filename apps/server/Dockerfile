FROM node:20-slim

# Install wrangler
RUN npm i -g wrangler@4.38.0 \
    && apt-get update && apt-get install -y ca-certificates && update-ca-certificates

WORKDIR /app

# Copy only server workspace to keep image smaller (adjust if needed)
COPY apps/server ./apps/server
COPY package.json pnpm-lock.yaml ./

# Install workspace deps (adjust if you use workspaces at root)
RUN npm i -g pnpm && pnpm install --filter @zero/server...

WORKDIR /app/apps/server

# Expose Wrangler dev port
EXPOSE 8787

# Default to a production-like local run inside the container
# You can switch to --env staging to mirror staging bindings
CMD [ "wrangler", "dev", "--env", "production", "--show-interactive-dev-session=false" ]
