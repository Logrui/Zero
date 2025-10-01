# Required Services for Local Development and Production Self Hosted

This document explains what services must be running for the Zero Email server to work locally, and what changes when you run in two common modes:

- Dev Mode (local development)
- Local "Production-like" Mode (using staging/production bindings locally)

Paths and configuration referenced below live in:
- `apps/server/wrangler.jsonc`
- `apps/server/src/env.ts`

---

## Overview

The Worker relies on three categories of dependencies locally:

- Cloudflare-simulated bindings provided by Wrangler:
  - **Durable Objects**, **Queues**, **Workflows**, **KV**, **R2**
- Locally provisioned services (Docker):
  - **Postgres** (primary SQL database)
  - **Valkey/Redis** (in-memory store)
  - **HTTP Redis Proxy** (Upstash-compatible HTTP layer)
- Frontend/other app packages (started via Turborepo when running `pnpm dev` at repo root)

Wrangler simulates Cloudflare resources in-process; Docker is used only for services that require TCP sockets (DB/cache).

---

## Services You Must Run (Docker)

- **zerodotemail-db**: Postgres 17
  - Image: `postgres:17`
  - Purpose: Primary SQL database.
  - Ports:
    - Dev Mode (`env.local`): Host `5433` → Container `5432`.
    - Staging/Production bindings (local run): Config also defines `localConnectionString` with port `5432` by default.
  - Used by Worker via `HYPERDRIVE` binding:
    - `apps/server/wrangler.jsonc` → `env.local.hyperdrive[0].localConnectionString`
    - Example (local): `postgresql://postgres:postgres@localhost:5433/zerodotemail`

- **zerodotemail-redis**: Valkey (Redis-compatible)
  - Image: `bitnami/valkey:8.0`
  - Purpose: In-memory key-value store for caching, rate limiting support, and other ephemeral state used by non-TCP Worker paths.
  - Ports: Host `6379` → Container `6379`.
  - Note: The Worker cannot speak Redis (TCP) directly. See the HTTP proxy below.

- **zerodotemail-upstash-proxy**: HTTP Proxy for Valkey/Redis
  - Image: `hiett/serverless-redis-http:latest`
  - Purpose: Exposes Redis operations over HTTP so the Worker (which only has HTTP access) can use Redis-like features (e.g., `@upstash/ratelimit`).
  - Ports: Host `8079` → Container `80`.
  - Typical usage: Worker hits `http://localhost:8079` to perform Redis commands via HTTP.

> You will NOT see **Hyperdrive** as a Docker container. Hyperdrive is a Cloudflare binding. Locally, Wrangler uses the `localConnectionString` to talk directly to your Postgres container; there is no separate Hyperdrive process.

---

## Cloudflare-Simulated Bindings (Wrangler)

Wrangler provides in-process simulations for these bindings in all environments:

- **R2 buckets** (e.g., `THREADS_BUCKET`)
- **KV namespaces** (e.g., `gmail_history_id`, `pending_emails_status`, etc.)
- **Durable Objects** (e.g., `ZERO_AGENT`, `ZERO_DB`, `ZERO_DRIVER`, etc.)
- **Queues** (producer/consumer bindings)
- **Workflows**

No Docker containers are required for these.

---

## Modes

### 1) Dev Mode (env.local)

- Start command:
  - From repo root: `pnpm dev` (preferred; starts all packages) OR
  - From `apps/server/`: `wrangler dev --env local --show-interactive-dev-session=false --experimental-vectorize-bind-to-prod`
- Required Docker services running:
  - Postgres (host port `5433`)
  - Valkey (host port `6379`)
  - Upstash HTTP proxy (host port `8079`)
- Key bindings/config:
  - `hyperdrive[0].localConnectionString`: `postgresql://postgres:postgres@localhost:5433/zerodotemail`
  - `r2_buckets`: includes `THREADS_BUCKET` (e.g., `threads-staging` name is fine for local; Wrangler simulates it)
  - `kv_namespaces`: multiple KV bindings available
  - Queues, Workflows, and Durable Objects are enabled and simulated
- Typical ports used by apps:
  - Worker (Wrangler): `8787`
  - App (React/Next or router): varies per app (e.g., `3500`) if started by `pnpm dev`

### 2) Local "Production-like" Mode (env.staging or env.production run locally)

- Goal: Run the Worker locally but with bindings/vars closer to staging or production.
- Start command (example):
  - From `apps/server/`: `wrangler dev --env staging` (or `--env production`)
- Required Docker services running:
  - Postgres. Note that these envs may default to `localhost:5432` in their `localConnectionString`.
    - You can either:
      - Map your Postgres container to host `5432`, or
      - Adjust the `localConnectionString` to whatever host port you’re using.
  - Valkey (host port `6379`)
  - Upstash HTTP proxy (host port `8079`)
- Key differences vs Dev Mode:
  - Different queue names (`*-staging` or `*-prod`)
  - Different `vars` (service names, app URLs, feature toggles)
  - Different R2 bucket names (still simulated locally)
  - Hyperdrive `id` differs, but locally Wrangler will still use `localConnectionString` if present

> Even in staging/production envs run locally, Wrangler simulates KV, R2, DOs, Queues, and Workflows. Only DB/cache need Docker.

---

## Quick Checklist

- Docker containers up:
  - Postgres: `localhost:5433` (dev) or `localhost:5432` (staging/prod local defaults) → container `5432`
  - Valkey: `localhost:6379`
  - HTTP Redis Proxy: `localhost:8079`
- Start the Worker:
  - Dev: `pnpm dev` at repo root, or `wrangler dev --env local` in `apps/server/`
  - Production-like: `wrangler dev --env staging` (or `--env production`) in `apps/server/`
- Verify ports/URLs referenced in code and env vars match your local mappings.

---

## References

- Worker entry & bindings:
  - `apps/server/wrangler.jsonc`
  - `apps/server/src/env.ts`
- R2 usage:
  - `apps/server/src/routes/agent/index.ts` (reads from `THREADS_BUCKET`)
  - `apps/server/src/routes/agent/sync-worker.ts` (writes to `THREADS_BUCKET`)

---

## Running Fully Self-Hosted in a Production-like Docker Setup

This section describes a pragmatic way to run the Worker locally inside a Docker container, alongside Postgres, Valkey, and an HTTP Redis proxy. This gives you a "self-hosted" environment that closely mirrors production bindings and variables, while still using Wrangler’s local simulator for Cloudflare resources (KV, R2, DOs, Queues, Workflows).

Important notes:

- This approach runs the Worker via `wrangler dev` inside a container. Wrangler provides the local simulation of Cloudflare services.
- You will not see a separate "Hyperdrive" container. The `HYPERDRIVE` binding uses `localConnectionString` to connect to your Dockerized Postgres directly.
- The Worker only talks HTTP; the Upstash-like HTTP proxy bridges HTTP to Valkey over TCP.

### 0) Prerequisites

- Docker and Docker Compose installed.
- A `.dev.vars` (or appropriate env file) available to provide required secrets and vars for the selected environment (e.g., `env.production` in `wrangler.jsonc`).
- Open the ports used below or adjust as needed.

### 1) Bundle the Worker (optional but recommended)

You can pre-bundle the Worker to ensure dependencies and TypeScript are compiled:

```bash
# From repo root or apps/server
pnpm --filter @zero/server install

# Produce a local build artifact (no deploy). This also validates the config.
# The --outdir flag writes the built worker into ./dist for inspection.
cd apps/server
wrangler deploy --env production --dry-run --outdir ./dist
```

This step is optional because `wrangler dev` will also bundle on the fly, but doing a dry-run build can catch issues early.

### 2) Example Dockerfile (Worker)

Create `apps/server/Dockerfile`:

```Dockerfile
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

# Default to a production-like local run
# You can switch to --env staging to mirror staging bindings
CMD [ "wrangler", "dev", "--env", "production", "--show-interactive-dev-session=false" ]
```

Notes:

- `--env production` uses the `production` section of `wrangler.jsonc` for vars and bindings. You can swap to `--env staging` for staging.
- Wrangler simulates KV/R2/DOs/Queues in-process; no extra containers are needed for those.
- The container exposes port `8787` for the Worker.

### 3) Example docker-compose.yml

Here’s an example `docker-compose.yml` that wires up Postgres, Valkey, the HTTP Redis proxy, and the Worker container:

```yaml
version: "3.9"
services:
  db:
    image: postgres:17
    container_name: zerodotemail-db
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: zerodotemail
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD", "pg_isready", "-U", "postgres"]
      interval: 5s
      timeout: 5s
      retries: 10

  valkey:
    image: bitnami/valkey:8.0
    container_name: zerodotemail-redis
    ports:
      - "6379:6379"

  upstash_proxy:
    image: hiett/serverless-redis-http:latest
    container_name: zerodotemail-upstash-proxy
    environment:
      SRH_MODE: single
      SRH_SINGLE_UPSTASH_REDIS_REST_URL: http://valkey:6379
      SRH_SINGLE_UPSTASH_REDIS_REST_TOKEN: test
    depends_on:
      - valkey
    ports:
      - "8079:80"

  worker:
    build:
      context: .
      dockerfile: apps/server/Dockerfile
    container_name: zerodotemail-worker
    depends_on:
      - db
      - valkey
      - upstash_proxy
    ports:
      - "8787:8787"
    environment:
      # Optional: make sure the env matches your wrangler.jsonc production vars
      NODE_ENV: production
    volumes:
      # If you want to supply local secrets/vars, mount them (adjust path)
      - ./apps/server/.dev.vars:/app/apps/server/.dev.vars:ro
```

Key points:

- The Worker uses `--env production` and will connect to Postgres at `db:5432` via `HYPERDRIVE.localConnectionString`. Update `apps/server/wrangler.jsonc` → `env.production.hyperdrive[0].localConnectionString` to `postgresql://postgres:postgres@db:5432/zerodotemail` for container-to-container networking.
- The Upstash proxy is reachable at `http://upstash_proxy:80` from inside the worker container. If your rate limiter expects `http://localhost:8079` in local dev, adjust your configuration to use the container DNS name when running in Compose.

### 4) Run It

From the repo root (or the directory where `docker-compose.yml` lives):

```bash
docker compose up --build
```

Then access the Worker on:

- http://localhost:8787

### 5) Environment & Config Tips

- **Select env**: Choose `--env production` (or `--env staging`) on the Worker container to align variables and bindings with that environment section in `wrangler.jsonc`.
- **Hyperdrive local connection**: Ensure the relevant `hyperdrive[].localConnectionString` entry points to the Compose service name `db` rather than `localhost` when running inside Docker.
- **HTTP Redis proxy URL**: Configure any code that talks to Upstash/Redis-over-HTTP to use `http://upstash_proxy:80` from within the container.
- **R2/KV/DOs/Queues/Workflows**: Remain simulated by Wrangler; no extra Compose services needed.

This setup gives you a single `docker compose up` workflow that runs the Worker and its backing services entirely on your own infrastructure, closely mirroring production behavior without deploying to Cloudflare.
- Rate limiting and HTTP proxy:
  - `@upstash/ratelimit` (via HTTP proxy on `localhost:8079`)

If you keep these services and port mappings consistent with the selected environment, the Worker should run locally without the opaque "internal error" crashes.

### If you are NOT using a Worker Dockerfile

If you prefer not to keep a dedicated `apps/server/Dockerfile` (or you removed it), you have two options:

1. Run the Worker on the host and keep only DB/Valkey/Proxy in Docker

   - Start backing services with the canonical compose file `docker-compose.prod.yaml` (it contains `db`, `valkey`, and `upstash-proxy`, plus app services).
   - In a separate terminal, run the Worker from the host:

     ```bash
     cd apps/server
     wrangler dev --env production --show-interactive-dev-session=false
     ```

   - In this mode, your browser and the web app can reach the Worker on the host at `http://localhost:8787`.

2. Build your own Worker image ad-hoc

   - Create a minimal Dockerfile locally (outside of the repo if desired), build and run it as in the examples above. You can point the `worker` service in Compose to `image: YOUR_IMAGE` instead of `build:`.

For either approach, ensure the Worker process can reach Postgres (`db:5432` if running inside Docker; `localhost:5433/5432` if running on the host according to your mapping) and the HTTP Redis proxy (`http://upstash-proxy:80` if inside Docker; `http://localhost:8079` if on the host).

---

## From Dev to Production: Build, Push, and Run as a Docker Service

This section explains two deployment paths:

1) Cloudflare-hosted production (recommended for true Workers production)
2) Self-hosted container production (run the Worker container plus backing services yourself)

Both approaches assume you have validated the app locally in dev mode and in the "production-like" Docker setup described above.

### 1) Cloudflare-Hosted Production

Use this if you intend to run on Cloudflare Workers in production.

- Entry points and bindings are configured in `apps/server/wrangler.jsonc` under `env.production`.
- Ensure secrets and vars for production are available (Wrangler supports `wrangler secret put` and `.dev.vars` for local only).

Deploy:

```bash
cd apps/server

# Optional: preview build without deploying
wrangler deploy --env production --dry-run

# Deploy to Cloudflare Workers production
wrangler deploy --env production
```

After deploy, confirm:

- Logs: `wrangler tail --env production`
- Routes / domain (if configured in wrangler or via Cloudflare dashboard)
- External dependencies (managed Postgres/Hyperdrive, queues, KV, R2) exist in your Cloudflare account

### 2) Self-Hosted Container Production

Use this if you want to run everything on your own infrastructure (VMs/on-prem) using Docker/Kubernetes. The Worker runs in a container using Wrangler’s local simulator for Cloudflare resources.

Prerequisites:

- A container registry (e.g., GHCR, ECR, GCR, Docker Hub)
- Production-ready Postgres
- Valkey/Redis and the HTTP Redis proxy reachable by the Worker container
- Proper production `env.production` values in `apps/server/wrangler.jsonc`

#### Build an image

```bash
# From repo root
docker build -f apps/server/Dockerfile -t YOUR_REGISTRY/zero-email-worker:latest .

# Optional: tag with commit/semver
GIT_SHA=$(git rev-parse --short HEAD)
docker tag YOUR_REGISTRY/zero-email-worker:latest YOUR_REGISTRY/zero-email-worker:${GIT_SHA}
```

#### Push the image

```bash
docker push YOUR_REGISTRY/zero-email-worker:latest
docker push YOUR_REGISTRY/zero-email-worker:${GIT_SHA}
```

#### Provision/point dependencies

- Postgres: Ensure the Worker can reach it. Update `apps/server/wrangler.jsonc` → `env.production.hyperdrive[0].localConnectionString` to your DB host inside the cluster/network (e.g., `postgresql://postgres:postgres@db:5432/zerodotemail`).
- Valkey/Redis: Ensure the HTTP proxy service is reachable from the Worker (e.g., `http://upstash_proxy:80`).
- Ports: Expose the Worker (default `8787`) via your ingress/reverse-proxy.

#### Run with docker compose (production)

Create a production compose file (example):

```yaml
version: "3.9"
services:
  db:
    image: postgres:17
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: zerodotemail
    volumes:
      - prod_db:/var/lib/postgresql/data

  valkey:
    image: bitnami/valkey:8.0
    restart: unless-stopped

  upstash_proxy:
    image: hiett/serverless-redis-http:latest
    restart: unless-stopped
    environment:
      SRH_MODE: single
      SRH_SINGLE_UPSTASH_REDIS_REST_URL: http://valkey:6379
      SRH_SINGLE_UPSTASH_REDIS_REST_TOKEN: ${REDIS_HTTP_TOKEN:-test}
    depends_on:
      - valkey

  worker:
    image: YOUR_REGISTRY/zero-email-worker:latest
    restart: unless-stopped
    depends_on:
      - db
      - valkey
      - upstash_proxy
    ports:
      - "8787:8787"
    environment:
      NODE_ENV: production
    # Supply secrets/vars for production if needed
    env_file:
      - ./apps/server/.prod.vars

volumes:
  prod_db:
```

Bring it up:

```bash
docker compose -f docker-compose.prod.yml up -d
```

#### Rolling updates

```bash
# Build & push a new image tag
docker build -f apps/server/Dockerfile -t YOUR_REGISTRY/zero-email-worker:${GIT_SHA} .
docker push YOUR_REGISTRY/zero-email-worker:${GIT_SHA}

# Update the running service to the new tag
sed -i.bak "s/zero-email-worker:latest/zero-email-worker:${GIT_SHA}/" docker-compose.prod.yml
docker compose -f docker-compose.prod.yml up -d worker
```

#### Operational checks

- Health/port: Ensure `http://YOUR_HOST:8787` responds to expected endpoints (e.g., `/api/trpc/...`).
- Logs: `docker logs -f zerodotemail-worker`
- Background tasks (queues/workflows) process as expected with your production `env.production` configuration.

#### Security & secrets

- Prefer `env_file` or a secret manager (Doppler, 1Password, AWS/GCP secrets) over inline variables.
- Do not commit real secrets to `.prod.vars`. Use CI/CD secret injection.

With this flow you can iteratively promote from dev to a production-ready self-hosted container deployment, or deploy to Cloudflare’s hosted Workers when that’s preferred.

---

## Choosing `VITE_PUBLIC_BACKEND_URL`

`VITE_PUBLIC_BACKEND_URL` is the URL your web app (service `zero`) uses to talk to the Worker's HTTP API. Choose one based on where the Worker is running:

- Worker runs INSIDE Docker Compose (service name `worker`, port 8787):
  - Use the internal DNS name from within other containers: `http://worker:8787`
  - If the browser (on your host) must call the Worker directly, expose `8787` and use: `http://localhost:8787`

- Worker runs ON THE HOST (you run `wrangler dev` from `apps/server`):
  - From the browser and from the `zero` container (if it proxies to host), use: `http://localhost:8787`

Tip: In `docker-compose.prod.yaml`, set

```yaml
services:
  zero:
    environment:
      VITE_PUBLIC_BACKEND_URL: ${VITE_PUBLIC_BACKEND_URL:-http://worker:8787}
```

Then override `VITE_PUBLIC_BACKEND_URL` to `http://localhost:8787` when you're running the Worker on the host.

---

## Canonical Compose File

Use `docker-compose.prod.yaml` as the canonical production-like compose file. If you had a second file (e.g., `docker-compose.prod.yml`), prefer removing it to avoid drift. Keep all services consolidated in the `.yaml` file.
