# Debugging Docker Deployments for the Zero Backend (Cloudflare Workers + pnpm Monorepo)

This document captures the architectural pitfalls and resolution strategies discovered while attempting to run the `@zero/server` Cloudflare Worker inside Docker. Locally (`pnpm run dev`), the backend works; inside Docker it failed with repeated module resolution errors (e.g. `Could not resolve "@trpc/server"`, `"hono/cloudflare-workers"`, `"drizzle-orm"`, `"superjson"`). Those were **environment divergence issues**, not real TypeScript or dependency problems.

> GOAL: A self‑hosted Docker setup for Zero OS working in conjunction with existing Redis / Upstash-proxy, PostgreSQL database, and related containers (frontend + backend) in a reproducible, production-like environment.

---
## 1. High-Level Summary
**Problem:** Using `wrangler dev` inside a multi-stage Docker image with a pnpm hoisted workspace produced cascading module resolution failures.

**Core Issue:** The development-time bundler (esbuild via wrangler) was invoked in an environment whose filesystem + dependency layout differed from the local monorepo assumptions (hoisted `node_modules`, missing patch artifacts, altered working directory). The dev-mode bundler is not a stable production/runtime mechanism.

**Key Lesson:** Treat Worker code like any other build artifact—produce a deterministic bundle first, then run it. Do not rely on live, dev-mode rebundling inside Docker.

---
## 2. Symptoms Observed
- Repeated esbuild errors during `wrangler dev`:
  - `Could not resolve "@trpc/server"`
  - `Could not resolve "hono/cloudflare-workers"`
  - `Could not resolve "drizzle-orm"` / `"superjson"` / `"@upstash/ratelimit"`
- Errors appeared for many unrelated packages simultaneously (strong hint of resolution root/path issue, not missing installs).
- Attempting a filtered install inside the builder stage failed with: `ENOENT: no such file or directory, open '/app/patches/novel.patch'`.
- Local development (`pnpm run dev`) worked fine.

---
## 3. Root Causes
| Category | Cause | Effect |
|----------|-------|--------|
| Runtime Mode | Using `wrangler dev` (dev server) as production runtime | Bundler re-runs & stricter sandbox assumptions |
| Workspace Layout | pnpm hoisted `node_modules` only at repo root | Esbuild failed to discover modules from service directory |
| Partial Copy | Some stages missed supporting files (e.g. `patches/novel.patch`) | Filtered reinstalls failed |
| Coupled Build/Run | No pre-built Worker bundle; relied on live transform | Any resolution failure aborted startup |
| Advanced Features | `catalog:` versions + patches + exports maps | Increased fragility under partial copies |
| TS Config | `moduleResolution: bundler` with mis-rooted bundler context | Removed fallback to classic node resolution |
| Docker Misfit | Workers platform emulated locally when it's deploy-centric | Extra complexity without strong benefit |

---
## 4. Anti-Pattern: Dev Bundler as Runtime
`wrangler dev --local` is optimized for rapid iteration, not for a deterministic container runtime. Inside Docker it:
- Performs fresh dependency graph analysis.
- Assumes full project root + typical Node-style layout.
- Adds overhead and brittle failure points.

**Replace with:** explicit build (dry-run deploy or esbuild) → run stable artifact.

---
## 5. pnpm Hoisting & Resolution Fragility
pnpm places dependencies in a content-addressable store and creates symlinks. Tools expecting a flat `node_modules` under the working directory may struggle if:
- Execution directory ≠ install directory.
- Local service folder lacks its own `node_modules` symlink set.
- You copy only slices of the workspace into later stages.

**Mitigations:**
- Use `pnpm deploy --filter @zero/server` (pruned install).
- Or run wrangler from the repo root with `--config apps/server/wrangler.jsonc`.
- Or vendor a flattened `node_modules` via a one-off `npm install --package-lock-only && npm ci` (heavier; usually not needed if deploy strategy adopted).

---
## 6. Missing Patch Artifacts
The lockfile referenced `patches/novel.patch`. A late-stage filtered install skip-copied the `patches/` directory → pnpm failed (ENOENT). Any time you enable patching or catalog features, ensure the **same build context** (manifest + lockfile + patches + workspace file) is present where you run installs.

---
## 7. Why Errors Looked Like Real TS/Module Issues
The bundler logs suggested direct dependency absence. But **all key packages failing together** signals a resolver root mismatch, not multiple independent missing packages.

Heuristics:
- Many unrelated, widely-used packages all missing at once → environment.
- Only deep subpaths missing → possibly exports mismatch.
- Only a single custom package missing → real dependency/typing issue.

---
## 8. Recommended Architecture (Three Tracks)
### Track A (Recommended – Deterministic Build)
1. Build step creates bundle: `wrangler deploy --dry-run --outdir dist` (or esbuild script).
2. Copy `dist/worker.mjs` + minimal config into a slim runtime image.
3. For local integration: run Node adapter OR `wrangler dev --no-bundle` referencing the prebuilt artifact.
4. Deploy via `wrangler deploy` (no Docker dependency for the worker itself).

### Track B (Expedient Patch – Keep Current Style)
1. Copy full repo (including `patches/`) into image.
2. Single root `pnpm install --frozen-lockfile` only.
3. Run wrangler from repo root with explicit `--config`.
4. (Optional) Symlink `apps/server/node_modules` to root for clarity.
**Still brittle**, but faster to enable.

### Track C (Hybrid – Node Adapter for Integration)
1. Provide a Node server shim (e.g. `@hono/node-server`).
2. Container runs the shim for DB/Redis integration testing.
3. Actual deployment remains via Cloudflare's native platform.
4. Use wrangler only for preview/deploy.

---
## 9. Step-by-Step Debug Checklist
Use this when resolution errors appear:
1. Confirm packages exist: `grep "@trpc/server" pnpm-lock.yaml` or `pnpm list @trpc/server`.
2. Print working dir in container: `pwd` and verify expected root.
3. List `node_modules` from wrangler’s perspective: `ls -1 ./node_modules | head`.
4. Check if running from service root or monorepo root; adjust.
5. Ensure `patches/` and lockfile are present if any patching or catalogs are used.
6. Run a dry-run build outside Docker: `pnpm --filter @zero/server exec wrangler deploy --dry-run --outdir dist`.
7. If dry-run succeeds but Docker fails: compare file tree diffs (`find . -maxdepth 3`).
8. If still failing, drop `moduleResolution: bundler` temporarily → retest.
9. Last resort: prebundle with esbuild manually and point wrangler `main` to built file.

---
## 10. Quick Triage Flow
```
Many packages unresolved → Check working dir & node_modules presence
Single package unresolved → Check import path / exports
Patch-related ENOENT → Ensure patches/ copied before install
Alpine runtime crash (glibc symbols) → Switch to Debian/Ubuntu base
Repeat bundling loop → Prebuild then run artifact
```

---
## 11. Common Error Messages & Meaning
| Message Snippet | Likely Meaning | Action |
|-----------------|----------------|--------|
| Could not resolve "@trpc/server" (plus many others) | Resolver root mismatch | Run from repo root or provide local node_modules |
| ENOENT patches/*.patch | Patch artifact missing in stage | Copy patches earlier |
| Error relocating workerd (fcntl64 / _dl_find_object) | musl vs glibc mismatch | Use non-Alpine base |
| Unexpected token / TypeScript compile error only in Docker | Wrong tsconfig paths or missing types | Copy tsconfig & root refs |

---
## 12. Future Hardening
- Add CI job: `pnpm --filter @zero/server exec wrangler deploy --dry-run` to catch resolution issues before Docker.
- Introduce `pnpm deploy` step to prune & flatten dependencies for each deployable target.
- Document a canonical build pipeline in `README` (Build → Test → Deploy).
- Add a smoke test that imports the built worker and simulates a `fetch` event.
- Consider removing Docker for the worker unless you need sidecar instrumentation or local network integration.

---
## 13. Minimal Example: Track A Implementation Sketch
```bash
# Build
pnpm --filter @zero/server exec wrangler deploy --dry-run --outdir apps/server/dist
# Test (pseudo)
node scripts/smoke-worker.js  # imports dist module and calls exported fetch
# Deploy
pnpm --filter @zero/server deploy
```

Docker (optional) runtime image could simply host a Node adapter for integration tests, not the real edge runtime.

---
## 14. Decision Guidance
| If You Need | Choose | Rationale |
|-------------|--------|-----------|
| Fastest pass to “it runs” | Track B | Minimal refactor, still dev-mode
| Stability + portability | Track A | Clear build/run separation
| Local integration tests with DB | Track C hybrid | Node adapter control
| Lowest maintenance | Track A (no Docker for worker) | Lean on Cloudflare platform

---
## 15. Executive Takeaway
The build failures were *not* about missing dependencies—they were about **where** and **how** the bundler looked for them. Stabilize by separating build from run, running wrangler from the monorepo root (or producing a prebuilt bundle), and ensuring all workspace metadata (patches, lockfile, catalog) is present in any image layer that performs installs or bundling.

---
## 16. Action Plan Toward the Goal (Self-Hosted Docker Setup)

Below are concrete, sequenced action items to move from the current brittle dev-mode container to a stable, self-hosted Docker deployment of Zero OS.

### Phase 1: Establish Deterministic Backend Build (Track A)
1. Add build script:
   - In `apps/server/package.json`: `"build:worker": "wrangler deploy --dry-run --outdir dist --env local"`.
2. Run locally: `pnpm --filter @zero/server build:worker` → verify `apps/server/dist/*` output (single bundled module + metadata).
3. Create `apps/server/wrangler.docker.jsonc` (or adjust existing) with `main: "dist/<generated>.js"` so runtime does not perform fresh bundling.
4. Add a smoke test script (`scripts/smoke-worker.mjs`) that imports the built file and simulates a `fetch` event to ensure bundle integrity pre-Docker.
5. (Optional) If wrangler dry-run output structure changes, document expected files.

### Phase 2: Pruned Dependency Deployment
6. Use pnpm deploy pruning:
   - `pnpm deploy --filter @zero/server --prod` (creates `.pnpm/deploy` structure with only needed packages).
7. Copy pruned output + `dist/` + `wrangler.docker.jsonc` into a slim runtime image (e.g. `node:22-slim` or scratch + minimal Node if using a Node adapter; wrangler itself only if needed for local simulation).
8. Do **not** run `pnpm install` again in the runtime stage—only copy artifacts.
9. Set `NODE_ENV=production` and minimal env variables required (others injected via compose).

### Phase 3: Runtime Strategy Decision
Choose one runtime path:
| Option | Description | When to Use |
|--------|-------------|-------------|
| A1: Edge Emulation | `wrangler dev --local --config wrangler.docker.jsonc --no-bundle` | Need near-edge parity locally |
| A2: Node Adapter | Run a small Hono Node server shim mapping Worker handlers | Faster & simpler integration tests |
| A3: Direct Deploy (No wrangler in Docker) | Omit backend container; deploy with `wrangler deploy` and only Dockerize DB/Redis/frontend | If self-host only needs data services |

For full self-host in a private network: A2 often easiest (you control process lifecycle, can add diagnostics). Keep A1 available for parity checks.

### Phase 4: Compose Integration
10. Update `docker-compose.prod.yaml` (or a new `docker-compose.selfhost.yaml`):
  - Backend service uses new image: `zero-backend:bundled`.
  - Attach environment (Redis URL, Postgres DSN, internal service URLs).
  - Add healthcheck (e.g. curl `http://backend:8787/healthz`).
11. Frontend `VITE_PUBLIC_BACKEND_URL` points to internal network name (e.g. `http://backend:8787`).
12. Ensure Redis/Upstash proxy + Postgres defined with named volumes for persistence.
13. Optional: Add Traefik / Nginx reverse proxy configuration (TLS termination) in same compose file.

### Phase 5: Migrations & Schema Management
14. Create a one-shot migrations container:
  - Image uses same pruned dependencies; command: `pnpm --filter @zero/server exec drizzle-kit migrate` (or a wrapper script requiring env).
15. Add `depends_on: [migrations]` so backend starts after schema is applied.
16. Optionally add a startup guard in backend health endpoint verifying table presence before returning 200.

### Phase 6: Observability & Hardening
17. Enable OpenTelemetry exporter env (as already configured) only when variables provided.
18. Add structured logging (JSON) toggle via env `LOG_FORMAT=json`.
19. Add circuit-breaker / rate limit configuration validation during startup, log warnings not silent failures.

### Phase 7: CI Pipeline Alignment
20. CI Steps:
  1. `pnpm install --frozen-lockfile`
  2. `pnpm --filter @zero/server build:worker`
  3. Run smoke test script.
  4. Build Docker images (`frontend`, `backend`).
  5. Spin compose stack in ephemeral network; run integration tests.
  6. Push images (optional) only if tests pass.
21. Add a dedicated job executing `wrangler deploy --dry-run` to catch resolution regressions separate from Docker concerns.

### Phase 8: Documentation & Developer Experience
22. Update root `README.md` with a concise “Self-Hosted” section referencing this document.
23. Provide a `make selfhost` or `pnpm selfhost:up` script wrapping compose commands.
24. Include troubleshooting table (common errors → fix) excerpted from earlier sections.

### Phase 9: Stretch Enhancements
25. Add hot-reload dev profile: separate compose override mounting source + using `wrangler dev` (strictly for iterative local hacking, not prod).
26. Introduce image slimming: multi-stage build that copies only dist + pruned node_modules (target <200MB uncompressed if feasible).
27. Supply SBOM generation step (`syft packages dir:` or `pnpm licenses list`) for compliance.

---
## 17. Condensed Checklist (Execution Order)
1. Add build script & produce `dist/`.
2. Prune dependencies (`pnpm deploy --filter @zero/server`).
3. Create Dockerfile using prebuilt bundle (no live bundling).
4. Add migrations container & healthcheck.
5. Integrate into compose (backend + frontend + db + redis + proxy).
6. Add smoke test + CI dry-run build.
7. Document self-host usage.
8. Optional: Add Node adapter mode for faster integration testing.

---
## 18. Risk Mitigation Matrix (Key Remaining Risks)
| Risk | Mitigation | Trigger to Revisit |
|------|------------|--------------------|
| Future dependency deep-import breaks bundler | Prebuild via dry-run + CI smoke test | Any new bundler resolution error |
| Drift between dry-run & actual deploy | Pin wrangler version; track in `eng/versions.md` | Wrangler major/minor update |
| Patch file accidentally removed | CI step validating presence of `patches/*` referenced in lockfile | Failed `pnpm install` in CI |
| Migrations race | Dedicated migrations service with explicit dependency ordering | Startup healthcheck fails due to missing tables |
| Over-reliance on `wrangler dev` in prod | Document approved runtime modes | Developer attempts to revert to dev mode for prod |

---
## 19. Final Objective Restated
Deliver a **repeatable, observable, self-hosted stack** where:
* A prebuilt Worker bundle starts instantly (no runtime bundling).
* Database schema is ensured before backend readiness.
* Frontend ↔ backend comms rely on internal service discovery.
* CI catches dependency graph or bundling regressions before deploy.
* Local dev remains fast (wrangler dev), while production-like runs are stable.

---
## 20. Next Immediate Steps (If Not Yet Executed)
1. Implement `build:worker` + generate `dist/`.
2. Draft pruned-deploy Dockerfile variant.
3. Add smoke test script harness.
4. Report back with bundle file name + any bundler warnings to finalize runtime config.

Once those are done, we can mark the “Fix wrangler dependency bundling” task as permanently closed and move on to migrations stabilization.

---
## 21. (Phase 0) Minimal Self-Hosted Setup Notes
These notes supplement earlier sections and describe the absolute smallest viable local/infra setup when the Cloudflare Worker stays remote.

### Purpose
Provide a reproducible environment for UI + data services without reproducing the Worker runtime.

### Include Only
- Frontend static build (Vite output)
- Postgres (local persistence)
- Redis / Valkey (caching + rate limit state if adapter added later)
- Optional Upstash HTTP proxy (only if existing code expects that endpoint shape)
- One-shot migrations container

### Exclude
- wrangler dev inside Docker
- Emulated Durable Objects / KV / R2 / Vectorize
- Local edge bundling loops

### Env Contracts
| Variable | Consumer | Example |
|----------|----------|---------|
| VITE_PUBLIC_BACKEND_URL | Frontend | https://sapi.0.email |
| DATABASE_URL | Migrations / (future adapter) | postgres://postgres:postgres@db:5432/zerodotemail |
| REDIS_URL | (future adapter) | redis://redis:6379 |

### Sample Compose Snippet
```
services:
  db:
    image: postgres:17-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: zerodotemail
    volumes: [pgdata:/var/lib/postgresql/data]
  redis:
    image: valkey/valkey:7-alpine
  migrations:
    build:
      context: .
      dockerfile: docker/migrations/Dockerfile
    environment:
      DATABASE_URL: postgres://postgres:postgres@db:5432/zerodotemail
    depends_on: [db]
    restart: "no"
  frontend:
    build:
      context: .
      dockerfile: docker/app/Dockerfile
    environment:
      VITE_PUBLIC_BACKEND_URL: https://sapi.0.email
    ports: ["3000:3000"]
volumes:
  pgdata:
```

### Workflow (Repeatable)
1. Ensure Worker deployed (staging/prod).
2. Build frontend (or rely on Dockerfile multi-stage build).
3. `docker compose -f docker-compose.selfhost.yml up -d --build`.
4. Access `http://localhost:3500` – network calls hit real Worker.
5. Confirm migrations container exits successfully (code 0).

### When to Evolve Beyond Phase 0
| Trigger | Addition |
|---------|----------|
| Need background processing | Add adapter Node service |
| Want single origin domain | Add reverse proxy (Nginx/Traefik) |
| Need offline edge parity | Introduce prebuilt worker bundle + local wrangler `--no-bundle` |
| Observability requirements | Add OTEL collector / log forwarder sidecar |

### Common Pitfalls (Phase 0)
| Pitfall | Avoidance |
|---------|-----------|
| Accidentally pointing frontend to localhost Worker URL | Always set `VITE_PUBLIC_BACKEND_URL` to deployed Worker domain |
| Schema drift | Run migrations container on each fresh env bring-up |
| Attempting DO logic locally | Keep tests that require DO in a separate suite hitting staging Worker |

### Fast Sanity Checklist
- [ ] Frontend builds
- [ ] Worker URL reachable (curl health endpoint)
- [ ] Postgres volume persists data across restarts
- [ ] Migrations exit 0
- [ ] Frontend network tab shows 2xx from Worker domain

### Upgrade Path Summary
Minimal → Add deterministic worker build (CI only) → Introduce adapter (if needed) → Add proxy (optional) → Observability.

---
*Last updated: 2025-09-28*
