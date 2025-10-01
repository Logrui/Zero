# Production Environment Setup

This directory contains Docker configurations for a production-like environment that demonstrates containerized deployment capabilities while maintaining compatibility with Cloudflare Workers development.

## Architecture Overview

The production setup consists of:

1. **Frontend Container**: React Router application built and served via static file server
2. **Database Container**: PostgreSQL 17 with health checks and persistent volumes
3. **Redis Container**: Valkey (Redis-compatible) for caching and sessions
4. **Upstash Proxy**: HTTP-based Redis interface for Cloudflare Workers compatibility
5. **Backend Development**: Cloudflare Workers via Wrangler (host-based for flexibility)

## Quick Start

### Start Full Production Environment
```bash
# Build and start all containerized services
npm run prod:build
npm run prod:deploy

# View logs
npm run prod:logs

# Stop services
npm run prod:down
```

### Start Database-Only (for development)
```bash
# Start just database and Redis for local development
docker compose -f docker-compose.db.yaml up -d
```

## Environment Configurations

### Production (.env.prod)
- Uses production Cloudflare resources (vectorize, R2, etc.)
- Real API tokens and service bindings
- Containerized database with persistent volumes

### Development (.env)
- Uses staging Cloudflare resources
- Development API tokens
- Local database connection

## Service Access

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:3000 | React Router application |
| Backend API | http://localhost:8787 | Cloudflare Workers API |
| Database | localhost:5432 | PostgreSQL connection |
| Redis HTTP | http://localhost:8079 | Upstash-compatible Redis API |
| Redis Direct | localhost:6379 | Direct Redis connection |

## Notes

### Cloudflare Workers Limitations
Cloudflare Workers cannot run in true "production" mode within Docker containers due to:
- Domain/route configuration requirements
- Cloudflare's runtime environment dependencies
- Authentication and token management complexity

### Recommended Workflow
1. Use containerized database/Redis for consistent infrastructure
2. Run Cloudflare Workers via `wrangler dev --remote` on host for production connectivity
3. Use containerized frontend for production build testing
4. Deploy actual production to Cloudflare Workers + Vercel/similar for frontend

### Security Considerations
- `.env.prod` contains real API tokens - never commit to version control
- Use secrets management in actual production deployments
- Rotate API tokens regularly

## Troubleshooting

### Backend Container Issues
If the backend container fails to start:
1. Check Cloudflare API token validity
2. Verify resource names match production configuration
3. Ensure domain/route settings are correct

### Database Connection Issues
- Verify PostgreSQL is healthy: `docker compose -f docker-compose.prod.yaml ps`
- Check logs: `docker compose -f docker-compose.prod.yaml logs db`
- Test connection: `psql -h localhost -U postgres -d zerodotemail`

### Frontend Build Issues
- Clear build cache: `rm -rf apps/mail/build`
- Rebuild: `cd apps/mail && pnpm run build`
- Check for dependency issues: `pnpm install`