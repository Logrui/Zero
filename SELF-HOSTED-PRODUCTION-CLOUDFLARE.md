# Self-Hosted Production Deployment with Cloudflare Workers

**Deployment Strategy**: Hybrid architecture with Cloudflare Workers backend and self-hosted frontend + databases.

## Architecture Overview

```
┌─────────────────────────────────────────────┐
│ Your Infrastructure (Docker)                │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ Frontend (React Router/Vite)        │   │
│  │ nginx:alpine serving static build   │   │
│  │ Port: 3500                          │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ PostgreSQL 17                       │   │
│  │ Port: 5432 (private)                │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ Redis 7 Alpine                      │   │
│  │ Port: 6379 (private)                │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ Upstash Proxy                       │   │
│  │ Port: 8079 (private)                │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ Cloudflare Tunnel (cloudflared)     │   │
│  │ - Exposes frontend publicly         │   │
│  │ - Tunnels DB to Cloudflare Workers  │   │
│  │ - Tunnels Redis to Workers          │   │
│  └─────────────────────────────────────┘   │
└─────────────────┬───────────────────────────┘
                  │ Encrypted tunnel (outbound only)
                  ↓
┌─────────────────────────────────────────────┐
│ Cloudflare Infrastructure                   │
│                                             │
│  Backend - Cloudflare Workers               │
│  ├─→ Via Tunnel: PostgreSQL                 │
│  ├─→ Via Tunnel: Redis/Upstash Proxy        │
│  ├─→ Durable Objects                        │
│  ├─→ Workflows                              │
│  ├─→ Queues (3)                             │
│  ├─→ KV Namespaces (10)                     │
│  ├─→ R2 Buckets                             │
│  ├─→ Vectorize                              │
│  └─→ Workers AI                             │
└─────────────────────────────────────────────┘
```

**Key Points**:
- ✅ Frontend and databases are self-hosted in Docker
- ✅ Backend runs on Cloudflare Workers (cannot be self-hosted due to Durable Objects)
- ✅ Cloudflare Tunnel provides secure connectivity without exposing ports
- ✅ No inbound firewall rules required
- ✅ Data stays on your infrastructure (PostgreSQL)

---

## Prerequisites

### Required Accounts
- [ ] Cloudflare account with Workers plan
- [ ] Domain name managed by Cloudflare DNS
- [ ] Server/VPS with Docker support (min 4GB RAM, 2 CPU cores)

### Required Tools
- [ ] Docker & Docker Compose installed
- [ ] Node.js 20+ and pnpm installed (for building)
- [ ] Git
- [ ] `wrangler` CLI: `npm install -g wrangler`
- [ ] `cloudflared` CLI

### Domain Setup
- [ ] Domain added to Cloudflare
- [ ] DNS managed by Cloudflare nameservers

---

## Step 1: Install Cloudflare Tunnel

### On Linux/WSL

```bash
# Download cloudflared
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared

# Make executable
chmod +x cloudflared

# Move to system path
sudo mv cloudflared /usr/local/bin/

# Verify installation
cloudflared --version
```

### On macOS

```bash
brew install cloudflared
```

### On Windows

Download from: https://github.com/cloudflare/cloudflared/releases/latest

---

## Step 2: Set Up Cloudflare Tunnel

### Authenticate

```bash
cloudflared tunnel login
```

This opens a browser for Cloudflare authentication and downloads credentials.

### Create Tunnel

```bash
# Create tunnel named "zero-production"
cloudflared tunnel create zero-production

# Note the tunnel ID from output
# Example: Created tunnel zero-production with id abc123-def456-ghi789
```

### Configure Tunnel

Create `cloudflared/config.yml` in your project root:

```yaml
tunnel: <YOUR-TUNNEL-ID>
credentials-file: /root/.cloudflared/<YOUR-TUNNEL-ID>.json

ingress:
  # Public frontend access
  - hostname: app.yourdomain.com
    service: http://frontend:3500
  
  # Private PostgreSQL access (only for Cloudflare Workers)
  - hostname: db-internal.yourdomain.com
    service: tcp://postgres:5432
  
  # Private Redis proxy access (only for Cloudflare Workers)
  - hostname: redis-internal.yourdomain.com
    service: http://upstash-proxy:80
  
  # Catch-all (required)
  - service: http_status:404
```

### Route DNS

```bash
# Create DNS records for tunnel
cloudflared tunnel route dns zero-production app.yourdomain.com
cloudflared tunnel route dns zero-production db-internal.yourdomain.com
cloudflared tunnel route dns zero-production redis-internal.yourdomain.com
```

### Get Tunnel Token

```bash
# Generate tunnel token for Docker deployment
cloudflared tunnel token zero-production
```

Copy the token - you'll need it for `.env.prod`.

---

## Step 3: Prepare Environment Configuration

### Create `.env.prod`

Copy `.env.prod.example` to `.env.prod` and configure:

```bash
cp .env.prod.example .env.prod
```

### Essential Variables in `.env.prod`

```bash
# ===========================================
# ENVIRONMENT
# ===========================================
NODE_ENV="production"

# ===========================================
# APPLICATION URLS
# ===========================================
VITE_PUBLIC_APP_URL=https://app.yourdomain.com
VITE_PUBLIC_BACKEND_URL=https://api.yourdomain.com
BASE_URL=https://api.yourdomain.com
BETTER_AUTH_URL=https://api.yourdomain.com

# ===========================================
# DATABASE (Via Cloudflare Tunnel)
# ===========================================
DATABASE_URL=postgresql://postgres:YOUR_SECURE_PASSWORD@db-internal.yourdomain.com:5432/zerodotemail

# ===========================================
# REDIS (Via Cloudflare Tunnel)
# ===========================================
REDIS_URL=https://redis-internal.yourdomain.com
REDIS_TOKEN=YOUR_SECURE_UPSTASH_TOKEN

# ===========================================
# AUTHENTICATION
# ===========================================
BETTER_AUTH_SECRET=YOUR_RANDOM_SECRET_HERE
COOKIE_DOMAIN=yourdomain.com
BETTER_AUTH_TRUSTED_ORIGINS=https://app.yourdomain.com,https://api.yourdomain.com

# ===========================================
# DOCKER PRODUCTION
# ===========================================
POSTGRES_PASSWORD=YOUR_SECURE_PASSWORD
UPSTASH_TOKEN=YOUR_SECURE_UPSTASH_TOKEN
TUNNEL_TOKEN=YOUR_CLOUDFLARE_TUNNEL_TOKEN

# ===========================================
# GOOGLE OAUTH
# ===========================================
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://api.yourdomain.com/api/auth/callback/google

# ===========================================
# MICROSOFT OAUTH (if using)
# ===========================================
MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret

# ===========================================
# EMAIL SERVICE
# ===========================================
RESEND_API_KEY=your_resend_api_key

# ===========================================
# AI SERVICES
# ===========================================
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_api_key
PERPLEXITY_API_KEY=your_perplexity_api_key
GROQ_API_KEY=your_groq_api_key

# ===========================================
# CLOUDFLARE ACCOUNT
# ===========================================
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token
```

### Generate Secure Secrets

```bash
# Generate BETTER_AUTH_SECRET
openssl rand -base64 64

# Generate POSTGRES_PASSWORD
openssl rand -base64 32

# Generate UPSTASH_TOKEN
openssl rand -base64 32
```

---

## Step 4: Build Frontend Docker Image

### Create Frontend Dockerfile

Create `apps/mail/Dockerfile.production`:

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/mail ./apps/mail
COPY packages ./packages

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build frontend
RUN pnpm --filter=@zero/mail build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/apps/mail/build /usr/share/nginx/html

# Copy nginx configuration
COPY apps/mail/nginx.conf /etc/nginx/nginx.conf

EXPOSE 3500

CMD ["nginx", "-g", "daemon off;"]
```

### Create Nginx Configuration

Create `apps/mail/nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript 
               application/json application/javascript application/xml+rss 
               application/rss+xml font/truetype font/opentype 
               application/vnd.ms-fontobject image/svg+xml;

    server {
        listen 3500;
        server_name _;
        root /usr/share/nginx/html;
        index index.html;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # React Router - serve index.html for all routes
        location / {
            try_files $uri $uri/ /index.html;
        }

        # Health check endpoint
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
```

---

## Step 5: Configure Cloudflare Workers (Backend)

### Update `apps/server/wrangler.jsonc`

Add production environment configuration:

```jsonc
{
  "env": {
    "production": {
      "name": "zero-server-production",
      "compatibility_date": "2025-05-01",
      
      "hyperdrive": [
        {
          "binding": "HYPERDRIVE",
          "id": "<YOUR_HYPERDRIVE_ID>",
          "localConnectionString": "postgresql://postgres:PASSWORD@db-internal.yourdomain.com:5432/zerodotemail"
        }
      ],
      
      "vars": {
        "NODE_ENV": "production",
        "REDIS_URL": "https://redis-internal.yourdomain.com",
        "REDIS_TOKEN": "<YOUR_UPSTASH_TOKEN>",
        "VITE_PUBLIC_BACKEND_URL": "https://api.yourdomain.com",
        "VITE_PUBLIC_APP_URL": "https://app.yourdomain.com",
        "COOKIE_DOMAIN": "yourdomain.com"
      },
      
      "routes": [
        { "pattern": "api.yourdomain.com/*", "zone_name": "yourdomain.com" }
      ]
    }
  }
}
```

### Create Hyperdrive Configuration

```bash
# Login to Cloudflare
wrangler login

# Create Hyperdrive for PostgreSQL
wrangler hyperdrive create zero-production-db \
  --connection-string="postgresql://postgres:PASSWORD@db-internal.yourdomain.com:5432/zerodotemail"

# Note the Hyperdrive ID from output
# Update wrangler.jsonc with this ID
```

---

## Step 6: Deploy Everything

### 6.1 Start Docker Services

```bash
# Build and start all services
docker-compose -f docker-compose.production.yaml --env-file .env.prod up -d

# Verify services are running
docker-compose -f docker-compose.production.yaml ps

# Check logs
docker-compose -f docker-compose.production.yaml logs -f
```

### 6.2 Run Database Migrations

```bash
# From your local machine (with .env.prod loaded)
pnpm db:migrate

# Or run migration manually
docker-compose -f docker-compose.production.yaml exec postgres psql -U postgres -d zerodotemail
```

### 6.3 Deploy Backend to Cloudflare Workers

```bash
# Deploy to production environment
wrangler deploy --env production

# Verify deployment
curl https://api.yourdomain.com/api/health
```

### 6.4 Verify Tunnel Connection

```bash
# Check tunnel status
docker-compose -f docker-compose.production.yaml logs cloudflared

# Test frontend access
curl https://app.yourdomain.com/health

# Test that Workers can reach PostgreSQL via tunnel
# (Check Cloudflare Workers logs in dashboard)
```

---

## Step 7: Configure OAuth Redirect URIs

### Google OAuth Console

Add authorized redirect URIs:
- `https://api.yourdomain.com/api/auth/callback/google`

### Microsoft Azure Portal (if using)

Add redirect URIs:
- `https://api.yourdomain.com/api/auth/callback/microsoft`

---

## Step 8: Set Up Monitoring

### Docker Health Checks

```bash
# Check service health
docker-compose -f docker-compose.production.yaml ps

# View resource usage
docker stats
```

### Cloudflare Workers Logs

```bash
# Tail production logs
wrangler tail --env production

# Or view in Cloudflare Dashboard:
# Workers & Pages > zero-server-production > Logs
```

### Application Logs

```bash
# Frontend logs
docker-compose -f docker-compose.production.yaml logs -f frontend

# PostgreSQL logs
docker-compose -f docker-compose.production.yaml logs -f postgres

# Redis logs
docker-compose -f docker-compose.production.yaml logs -f redis

# Tunnel logs
docker-compose -f docker-compose.production.yaml logs -f cloudflared
```

---

## Step 9: Backup Strategy

### Database Backups

Create `scripts/backup-db.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/backups/postgres"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/zerodotemail_$TIMESTAMP.sql.gz"

mkdir -p $BACKUP_DIR

docker-compose -f docker-compose.production.yaml exec -T postgres \
  pg_dump -U postgres zerodotemail | gzip > $BACKUP_FILE

echo "Backup created: $BACKUP_FILE"

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete
```

### Automated Backups (Cron)

```bash
# Add to crontab
crontab -e

# Daily backup at 2 AM
0 2 * * * /path/to/scripts/backup-db.sh
```

### Restore from Backup

```bash
gunzip -c /backups/postgres/zerodotemail_TIMESTAMP.sql.gz | \
  docker-compose -f docker-compose.production.yaml exec -T postgres \
  psql -U postgres zerodotemail
```

---

## Step 10: SSL/TLS Configuration

Cloudflare automatically provides SSL for:
- ✅ Frontend: `https://app.yourdomain.com`
- ✅ Backend: `https://api.yourdomain.com`
- ✅ Tunnel connections are encrypted

### SSL Mode Options

In Cloudflare Dashboard > SSL/TLS:
- **Recommended**: Full (strict)
- Automatic HTTPS Rewrites: On
- Always Use HTTPS: On

---

## Deployment Checklist

### Pre-Deployment
- [ ] Domain configured in Cloudflare DNS
- [ ] Cloudflare Tunnel created and configured
- [ ] `.env.prod` file populated with all secrets
- [ ] OAuth applications configured (Google, Microsoft)
- [ ] Hyperdrive created for PostgreSQL
- [ ] Frontend Docker image built successfully

### Deployment
- [ ] Docker services started (`docker-compose up -d`)
- [ ] Database migrations run successfully
- [ ] Backend deployed to Cloudflare Workers
- [ ] Cloudflare Tunnel connected (check logs)
- [ ] Frontend accessible at `https://app.yourdomain.com`
- [ ] Backend API accessible at `https://api.yourdomain.com`

### Post-Deployment
- [ ] OAuth login tested and working
- [ ] Email sync functionality verified
- [ ] AI features working (Workers AI, embeddings)
- [ ] Database backups configured
- [ ] Monitoring set up
- [ ] SSL certificates validated

---

## Maintenance Commands

### Update Frontend

```bash
# Rebuild frontend
pnpm --filter=@zero/mail build

# Rebuild Docker image
docker-compose -f docker-compose.production.yaml build frontend

# Restart frontend
docker-compose -f docker-compose.production.yaml up -d frontend
```

### Update Backend

```bash
# Deploy updated backend
wrangler deploy --env production
```

### Restart Services

```bash
# Restart all services
docker-compose -f docker-compose.production.yaml restart

# Restart specific service
docker-compose -f docker-compose.production.yaml restart postgres
```

### View Logs

```bash
# All services
docker-compose -f docker-compose.production.yaml logs -f

# Specific service
docker-compose -f docker-compose.production.yaml logs -f frontend
```

### Database Console

```bash
# Access PostgreSQL shell
docker-compose -f docker-compose.production.yaml exec postgres psql -U postgres zerodotemail
```

---

## Troubleshooting

### Frontend Not Accessible

```bash
# Check frontend container
docker-compose -f docker-compose.production.yaml logs frontend

# Check tunnel
docker-compose -f docker-compose.production.yaml logs cloudflared

# Verify DNS
nslookup app.yourdomain.com
```

### Backend Can't Connect to Database

```bash
# Verify tunnel is routing PostgreSQL
docker-compose -f docker-compose.production.yaml logs cloudflared | grep postgres

# Check PostgreSQL is accepting connections
docker-compose -f docker-compose.production.yaml exec postgres pg_isready

# Test connection from Workers
# Check Cloudflare Workers logs in dashboard
```

### Redis Connection Issues

```bash
# Check Redis is running
docker-compose -f docker-compose.production.yaml exec redis redis-cli ping

# Check Upstash proxy
curl http://localhost:8079

# Verify tunnel routing
docker-compose -f docker-compose.production.yaml logs cloudflared | grep redis
```

### OAuth Not Working

1. Verify redirect URIs in Google/Microsoft console match:
   - `https://api.yourdomain.com/api/auth/callback/google`
   - `https://api.yourdomain.com/api/auth/callback/microsoft`

2. Check environment variables:
   ```bash
   # In wrangler.jsonc or Cloudflare Dashboard
   GOOGLE_CLIENT_ID
   GOOGLE_CLIENT_SECRET
   BETTER_AUTH_URL=https://api.yourdomain.com
   ```

3. Verify cookie domain:
   ```bash
   COOKIE_DOMAIN=yourdomain.com
   ```

---

## Security Best Practices

### 1. Secret Management
- ✅ Never commit `.env.prod` to git
- ✅ Use strong, randomly generated passwords
- ✅ Rotate secrets periodically
- ✅ Use Cloudflare Workers secrets for sensitive data:
  ```bash
  wrangler secret put GOOGLE_CLIENT_SECRET --env production
  ```

### 2. Network Security
- ✅ Database only accessible via Cloudflare Tunnel
- ✅ Redis only accessible via Cloudflare Tunnel
- ✅ No public ports exposed except frontend (via tunnel)
- ✅ All traffic encrypted (HTTPS/TLS)

### 3. Database Security
- ✅ Strong PostgreSQL password
- ✅ Regular backups
- ✅ Connection only via Hyperdrive/Tunnel

### 4. Access Control
- ✅ Enable Cloudflare Access for admin routes (optional)
- ✅ Rate limiting via Redis (already implemented)
- ✅ Enable 2FA for Cloudflare account

---

## Cost Estimation

### Your Infrastructure Costs
- **VPS/Server**: $5-50/month (depending on provider and specs)
- **Bandwidth**: Usually included
- **Storage**: Included in VPS plan

### Cloudflare Costs
- **Workers**: $5/month (Workers Paid plan) + overages
- **Workers AI**: Pay per request (~$0.01 per 1K tokens)
- **Vectorize**: Beta pricing (check current rates)
- **R2 Storage**: $0.015/GB/month
- **KV**: Free tier generous, $0.50/GB/month after
- **Durable Objects**: $0.15 per million requests
- **Queues**: $0.40 per million operations

**Estimated Monthly Total**: $50-150/month (varies by usage)

---

## Scaling Considerations

### Horizontal Scaling

**Frontend**: 
```bash
# Scale frontend containers
docker-compose -f docker-compose.production.yaml up -d --scale frontend=3
```

**Backend**: 
- Cloudflare Workers automatically scale globally
- No configuration needed

### Database Scaling

If PostgreSQL becomes bottleneck:
1. Upgrade VPS resources
2. Enable PostgreSQL read replicas
3. Consider managed PostgreSQL (Neon, Supabase)

### Caching

- Already using Redis for rate limiting and sessions
- Consider adding application-level caching

---

## Disaster Recovery

### Full System Recovery

1. **Restore from backups**:
   ```bash
   # Restore database
   gunzip -c backup.sql.gz | docker-compose exec -T postgres psql -U postgres zerodotemail
   ```

2. **Redeploy services**:
   ```bash
   docker-compose -f docker-compose.production.yaml up -d
   wrangler deploy --env production
   ```

3. **Verify functionality**:
   - Test login
   - Test email sync
   - Verify AI features

---

## Additional Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Cloudflare Tunnel Guide](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [PostgreSQL Docker Documentation](https://hub.docker.com/_/postgres)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)

---

## Support and Contributing

For issues with this deployment setup:
1. Check troubleshooting section above
2. Review Cloudflare Workers logs
3. Check Docker container logs
4. Open issue in repository

---

**Last Updated**: 2025-10-03  
**Deployment Type**: Hybrid (Self-hosted + Cloudflare Workers)  
**Status**: Production-ready
