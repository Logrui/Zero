# Zero OS: Incremental Path from Dev-in-Docker to Actual Self‑Hosted Production

> This document explains the differences between the current "pseudo production" (dev commands inside long‑lived containers + Cloudflare Tunnel) and a staged roadmap toward a real, reproducible, secure, and performant self‑hosted production deployment of Zero OS.

---
## 1. Current Operating Model (Today)
**Pattern:** "Living development workspace exposed remotely"

| Aspect | What Happens Now |
|--------|------------------|
| Frontend | `pnpm dev` (Vite + React Router dev server) runs inside a container with source bind-mounted. HMR, on-demand unbundled ESM, no asset hashing. |
| Backend Worker | `wrangler dev` (local simulation) instead of an optimized deployed Worker bundle. |
| Install Process | Each container start triggers `pnpm install`; filesystem is mutable. |
| Artifacts | No discrete build artifact boundary; build & run phases are conflated. |
| Caching | Browser receives many small module requests; weak or no long-term caching. |
| Security | Source + full stack traces potentially exposed; dev dependencies loaded. |
| Observability | Ad-hoc console logs; no version identifiers or structured telemetry. |
| Rollbacks | Change = editing source + restart; no immutable historical artifact list. |
| Performance | Extra latency from dev server transformation pipeline & module graph resolution. |
| Determinism | Re-installs + watchers → greater variance and potential drift. |

**Why it's fine right now:** Fast iteration, simple mental model, low setup overhead while core features stabilize.

**Why it won't scale:** Performance, security posture, reproducibility, caching strategy, and operational control degrade as real users or higher traffic arrive.

---
## 2. What a Production SaaS Pipeline Typically Provides
| Dimension | Production Expectation |
|-----------|------------------------|
| Build Separation | CI builds immutable, versioned artifacts (frontend `dist/`, worker bundle). |
| Deployment | Artifact promotion (image digest / commit SHA) - not ad-hoc source push. |
| Runtime | No watchers; minimal process hosting only optimized compiled output. |
| Performance | Bundled + minified + tree-shaken code, hashed filenames, CDN edge caching. |
| Security | Limited surface; source maps private (if retained) and dev tooling removed. |
| Observability | Logs, metrics, traces, release version tagging, error aggregation. |
| Rollback | Repoint to previous artifact instantly. |
| Config | Managed secrets, typed/runtime validated environment variables. |
| Testing Gates | Type check, unit/integration tests, lint, maybe e2e before release. |
| Infra as Code | Dockerfiles, Compose/Stack, or Terraform describe immutable infrastructure. |

---
## 3. Core Differences (Side-by-Side Summary)
| Area | Dev-in-Docker (Current) | Real Production |
|------|-------------------------|-----------------|
| Artifact Boundary | None | Explicit (image + static bundle + worker build) |
| Startup | Install + watch + transform | Start pre-built optimized code |
| Client Delivery | Many unbundled modules | Few hashed bundles (code splitting) |
| Caching Strategy | Weak, changes invalid unpredictably | Strong immutable caching + cache bust via hash |
| Security | Dev dependencies + verbose errors | Pruned dependencies + controlled error surfaces |
| Scale Footprint | Higher CPU/memory (watchers) | Lower baseline, predictable resource profile |
| Reproducibility | Drift risk per boot | Deterministic by artifact digest |
| Rollbacks | Manual revert of source | Deploy previous artifact instantly |
| Observability | Console only | Structured logs + metrics + version tags |
| Latency | Transform-time overhead | Pre-optimized delivery |

---
## 4. Risks of Remaining on Dev Mode Long-Term
1. Performance ceiling (TTFB, hydration time, extra round trips).
2. Security exposure (source maps, stack traces, dev endpoints).
3. Harder incident response (no versioned artifacts → ambiguous cause vs commit).
4. Hidden production-only bugs (minification, tree-shaking side effects, edge runtime nuances) discovered late.
5. Higher operational cost per user due to unoptimized pipeline.
6. Harder to scale infra (stateful file mounts & mutable installs impede horizontal scaling and autoscaling).

---
## 5. Incremental Stage Roadmap
You can evolve without a full rewrite by introducing one production characteristic per stage.

### Stage 0 (Baseline – Current)
- Dev servers inside containers, Cloudflare Tunnel for remote access.
- Goal: Maintain velocity while preparing next steps.

### Stage 1: Introduce Build Artifacts
Deliverable Highlights:
- Add `build` script to `apps/mail` (`react-router build`). (Already exists in package.json)
- Run `wrangler deploy --dry-run` or bundle step for Worker (no live deploy yet). 
- Confirm build reproducibility under CI-like command locally.

Outcomes:
- Separation of build vs run emerges.
- First opportunity to measure prod bundle size & performance.

### Stage 2: Immutable Runtime Containers
Deliverable Highlights:
- Multi-stage Dockerfiles: builder → runtime (copy only `dist/`, prune dev deps).
- Remove bind mounts for application code in production profile.
- Frontend served by Nginx/Cloudflare Pages/Worker static handler.
- Worker deployed via `wrangler deploy` instead of `wrangler dev` in container.

Outcomes:
- Deterministic runtime, faster startups, smaller attack surface.

### Stage 3: CI/CD Pipeline & Promotion
Deliverable Highlights:
- Git push triggers: lint → test → build → artifact publish.
- Image tags: `zero-mail:<git-sha>`, `zero-worker:<git-sha>`.
- Provenance recorded (build metadata, commit ref, timestamp).

Outcomes:
- Rollbacks trivial; audit trail established.

### Stage 4: Observability & Operational Hardening
Deliverable Highlights:
- Health endpoints (`/healthz`, `/version`).
- Structured logging (JSON) + log shipping or Cloudflare Logpush.
- Error tracking (Sentry / Honeycomb / OpenTelemetry traces). 
- Metrics (request counts, latency percentiles, worker invocation errors).

Outcomes:
- Faster MTTR, proactive performance insights.

### Stage 5: Performance & Edge Optimization
Deliverable Highlights:
- Long-term immutable caching of hashed assets.
- Optional pre-render/SSR or static generation of critical routes.
- Asset compression (brotli/gzip) + image optimization pipeline.
- CDN/Edge cache rules & purge automation.

Outcomes:
- Minimal latency globally, predictable performance under load.

### Stage 6 (Optional Evolution)
- Feature flags + gradual rollouts.
- Blue/green or canary deployment strategies.
- Security scanning (SAST/Dependency + runtime policy enforcement).

---
## 6. Tactical Action List (Prioritized)
| Priority | Action | Rationale |
|----------|--------|-----------|
| High | Add `pnpm build` + commit hashed `dist/` to .dockerignore (avoid bloat) | Enables artifact pipeline |
| High | Multi-stage Dockerfile for `apps/mail` | Separate build dependencies |
| High | Worker: script `pnpm run worker:build` vs `worker:deploy` | Clarifies modes |
| Medium | Introduce `docker-compose.prod.yaml` | Clean separation of dev vs prod |
| Medium | Add `VERSION` (commit SHA) file injected at build | Debug & rollback mapping |
| Medium | Healthcheck & simple uptime probe | Basic ops baseline |
| Low | Logging format standardization (JSON + request IDs) | Future observability tooling |
| Low | CI stub (GitHub Actions / other) that only builds & lints first | Foundation for full pipeline |

---
## 7. Example Future Artifacts
(These are conceptual; actual files can be generated when you decide to start Stage 1)

### Sample Multi-Stage Frontend Dockerfile (Concept)
```
FROM node:22-slim AS deps
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages ./packages
COPY apps/mail/package.json ./apps/mail/package.json
RUN corepack enable && corepack prepare pnpm@10.12.1 --activate \
  && pnpm fetch \
  && pnpm install --frozen-lockfile --filter @zero/mail... --prod=false

FROM deps AS build
COPY apps/mail ./apps/mail
# (Optional) copy shared libs if imported
RUN pnpm --filter @zero/mail build

FROM nginx:alpine AS runtime
COPY --from=build /app/apps/mail/dist /usr/share/nginx/html
# Inject version metadata if available
ARG GIT_SHA
RUN echo ${GIT_SHA:-dev} > /usr/share/nginx/html/version.txt
EXPOSE 80
HEALTHCHECK CMD wget -qO- http://localhost/version.txt || exit 1
```

### Minimal Production Compose Fragment (Concept)
```
services:
  mail:
    build:
      context: .
      dockerfile: apps/mail/Dockerfile
      args:
        - GIT_SHA=${GIT_SHA}
    image: zero-mail:${GIT_SHA}
    ports:
      - "8080:80"
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost/version.txt"]
      interval: 30s
      timeout: 2s
      retries: 3
```

### Worker Build vs Deploy Scripts (package.json conceptual)
```
"scripts": {
  "worker:build": "wrangler deploy --dry-run --outdir ./dist-worker", 
  "worker:deploy": "wrangler deploy --env production"
}
```

---
## 8. Cloudflare Tunnel vs CDN Edge
| Tunnel | CDN / Pages / Worker Assets |
|--------|-----------------------------|
| Persistent proxied TCP | Globally replicated edge cache |
| Good for dev/demo access | Optimal for user latency + scale |
| No automatic static asset caching policies | Built-in caching + purge API |
| Single origin dependency | Multi-pop delivery |

**Migration Path:** Keep Tunnel for secure admin/dev; serve public user traffic from edge CDN + hashed artifacts.

---
## 9. Decision Framework
Ask for each upcoming feature: 
- Does it need reproducibility? (If yes → push further down roadmap.)
- Does it change asset shape or runtime behavior? (Add build validation.)
- Is latency/user experience impacted? (Prioritize performance stage.)
- Is it a security-affecting surface? (Fast-track hardening.)

---
## 10. Quick FAQ
**Q: Can we hybridize (dev frontend + prod worker)?**  
Yes, but treat hybrid as transitional; maintain separate build flows to avoid coupling dev assumptions to prod.

**Q: When to add tests?**  
Before Stage 3; otherwise CI has nothing meaningful to gate.

**Q: Should we prune dependencies now?**  
Not required yet—but track optional vs runtime dependencies to prevent bundle bloat.

**Q: What about database migrations?**  
Introduce a "migration runner" job/container before Stage 3. Ensure idempotent migration scripts.

---
## 11. Summary
You currently trade performance, security, and reproducibility for iteration speed. The staged roadmap lets you introduce production characteristics incrementally without losing momentum. Stage 1 (build artifacts) is the pivotal inflection—once you have immutable outputs, you unlock reliability, observability, and safe rollout mechanics.

> When you’re ready, ask to "Generate Stage 1 scaffolding" and the necessary Dockerfile(s), scripts, and compose variants can be added directly.
