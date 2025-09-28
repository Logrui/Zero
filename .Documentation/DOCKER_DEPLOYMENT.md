# Docker Deployment Guide for Zero OS

## Overview

This guide provides comprehensive instructions for deploying Zero OS as a **hybrid cloud-edge solution** using Docker containers connected to Cloudflare's cloud services. Zero OS is a modern full-stack email management system built with Vite + React and Cloudflare Workers, designed for containerized deployment while leveraging Cloudflare's serverless infrastructure for advanced features.

## Architecture Overview

Zero OS uses a **hybrid deployment model** combining self-hosted containers with Cloudflare's cloud services:

### Self-Hosted Components
- **Frontend (Mail App)**: Vite + React-based email client interface
- **Backend (Server)**: Cloudflare Workers runtime connected to cloud services
- **PostgreSQL Database**: Primary data storage
- **Redis (Valkey)**: Caching and session management
- **Upstash Proxy**: Redis HTTP interface for serverless compatibility
- **Nginx**: Reverse proxy and SSL termination

### Cloudflare Cloud Services
- **Vectorize**: Vector database for AI-powered email search
- **R2 Buckets**: Object storage for email attachments
- **Durable Objects**: Stateful serverless compute for email processing
- **Workflows**: Distributed workflow orchestration for email sync
- **Queues**: Message queues for background job processing
- **AI Bindings**: Access to Cloudflare's AI models

## Prerequisites

Before starting the deployment, ensure you have:

- Docker Engine 24.0+ and Docker Compose v2
- At least 4GB RAM and 20GB disk space
- Domain name (optional, for SSL/production setup)
- **Cloudflare Account** with Workers Paid plan ($5/month minimum)
- Required API keys (see Environment Variables section)

### Cloudflare Services Setup

You'll need to create these resources in your Cloudflare account:

1. **Workers & Pages** → Create a new Worker
2. **R2 Object Storage** → Create bucket: `threads-production`
3. **Vectorize** → Create indexes: `threads-vector-production`, `messages-vector-production`
4. **Queues** → Create queues: `thread-queue-production`, `subscribe-queue-production`, `send-email-queue-production`
5. **D1 or external DB** → Configure database access
6. **API Token** → Create token with Workers, R2, Vectorize, and Queue permissions

## Production Deployment Requirements

### 🔧 **Technical Requirements**

**Hardware Requirements:**
- **CPU**: 2+ cores recommended
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 20GB+ SSD space
- **Network**: Stable internet connection for Cloudflare services

**Software Requirements:**
- **Docker**: 24.0+ with Docker Compose v2
- **Git**: For repository cloning
- **Node.js**: 18+ (for Wrangler CLI setup)
- **Domain**: Optional but recommended for SSL

### 🏗️ **Infrastructure Setup Checklist**

#### **Step 1: Cloudflare Account Setup**
```bash
# Required Cloudflare subscription
✅ Cloudflare Workers Paid Plan ($5/month minimum)
✅ Account ID and API Token ready
✅ Domain configured (optional but recommended)
```

#### **Step 2: External Service Accounts**
```bash
# Email Services
✅ Resend API Key (email delivery)
✅ Google Cloud Project (OAuth + AI)
   - Google OAuth Client ID/Secret
   - Google Generative AI API Key

# Optional Services
✅ Twilio Account (SMS notifications)
✅ Perplexity API (additional AI)
✅ OpenAI API (alternative AI provider)
```

#### **Step 3: Security Configuration**
```bash
# Generate secure secrets
✅ BETTER_AUTH_SECRET (32-character random string)
   Command: openssl rand -hex 32
   
✅ Strong database passwords
✅ Unique Redis tokens
✅ SSL certificates (if using custom domain)
```

### 📋 **Pre-Deployment Validation**

Before running `docker compose up`, ensure:

1. **✅ Environment File Ready**
   ```bash
   # Check .env file exists and contains all required variables
   ls -la .env
   grep -c "CLOUDFLARE_ACCOUNT_ID\|RESEND_API_KEY\|BETTER_AUTH_SECRET" .env
   ```

2. **✅ Cloudflare Resources Created**
   ```bash
   # Run setup script or verify resources exist
   ./scripts/setup-cloudflare.sh
   # OR manually verify with:
   wrangler vectorize list
   wrangler r2 bucket list
   wrangler queues list
   ```

3. **✅ Network Configuration**
   ```bash
   # Ensure ports are available
   netstat -tuln | grep -E ':80|:443|:3500|:8787|:5432'
   # Should show no conflicts
   ```

4. **✅ Docker Resources**
   ```bash
   # Check Docker has sufficient resources
   docker system df
   docker system prune -f  # Clean up if needed
   ```

### 🚀 **Deployment Process**

#### **Phase 1: Initial Deployment**
```bash
# 1. Clone and setup
git clone <your-zero-repo>
cd Zero
cp .env.example .env.prod

# 2. Configure environment (see sections below)
vim .env.prod

# 3. Setup Cloudflare resources
./scripts/setup-cloudflare.sh

# 4. Deploy infrastructure
docker compose -f docker-compose.prod.yaml up -d --build

# 5. Verify deployment
docker compose -f docker-compose.prod.yaml ps
docker compose -f docker-compose.prod.yaml logs -f
```

#### **Phase 2: Post-Deployment Validation**
```bash
# Check all services are healthy
docker compose -f docker-compose.prod.yaml ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

# Test connectivity
curl -f http://localhost:3500  # Frontend
curl -f http://localhost:8787/health  # Backend API
curl -f http://localhost:8079/ping  # Redis proxy

# Check logs for errors
docker compose -f docker-compose.prod.yaml logs --tail 50 backend
```

#### **Phase 3: Production Hardening**
```bash
# 1. Configure SSL (if using domain)
certbot certonly --standalone -d yourdomain.com

# 2. Update firewall rules
ufw allow 80/tcp
ufw allow 443/tcp
ufw deny 3500/tcp  # Block direct frontend access
ufw deny 8787/tcp  # Block direct backend access

# 3. Setup monitoring
docker compose -f docker-compose.prod.yaml logs -f > /var/log/zero-os.log &

# 4. Configure backups
crontab -e
# Add: 0 2 * * * docker compose -f /path/to/docker-compose.prod.yaml exec db pg_dump -U postgres zerodotemail > /backup/zero-$(date +%Y%m%d).sql
```

### ⚠️ **Common Deployment Issues & Solutions**

#### **Issue: Cloudflare Authentication Fails**
```bash
# Symptom: Backend container restarts continuously
# Solution: Verify API token permissions
wrangler whoami  # Should show your account

# Check token has required permissions:
# - Account: Cloudflare Workers:Edit
# - Zone: Zone Resources:Include All zones
# - Account Resources: Include All accounts
```

#### **Issue: Database Connection Errors**
```bash
# Symptom: Backend cannot connect to PostgreSQL
# Solution: Check database initialization
docker compose -f docker-compose.prod.yaml logs db
docker compose -f docker-compose.prod.yaml exec db pg_isready -U postgres

# Verify DATABASE_URL format:
# postgresql://user:password@host:port/database
```

#### **Issue: Frontend Build Failures**
```bash
# Symptom: Frontend container fails to start
# Solution: Check Vite build process
docker compose -f docker-compose.prod.yaml logs frontend

# Verify environment variables are set:
# VITE_PUBLIC_BACKEND_URL
# VITE_PUBLIC_APP_URL
```

#### **Issue: Cloudflare Services Unavailable**
```bash
# Symptom: AI features not working
# Solution: Verify Cloudflare resources exist
wrangler vectorize list | grep production
wrangler r2 bucket list | grep threads-production
wrangler queues list | grep production
```

### 💡 **Production Best Practices**

1. **🔐 Security**
   - Use strong, unique passwords for all services
   - Enable SSL/TLS for all external connections
   - Regularly rotate API keys and secrets
   - Use Docker secrets for sensitive data

2. **📊 Monitoring**
   - Setup log aggregation (ELK stack or similar)
   - Configure health check alerts
   - Monitor Cloudflare usage and costs
   - Track Docker resource usage

3. **🔄 Backups**
   - Daily automated database backups
   - Backup environment configuration
   - Document disaster recovery procedures
   - Test backup restoration process

4. **📈 Performance**
   - Use SSD storage for database
   - Configure appropriate resource limits
   - Monitor response times and optimize
   - Setup CDN for static assets (via Cloudflare)

## Quick Start

### 1. Clone and Setup

```bash
# Clone the repository
git clone <your-zero-repo-url>
cd Zero

# Copy environment template
cp .env.example .env.prod
```

### 🔄 **Migration from Original Zero Email**

If you're migrating from the original Zero Email (Next.js version):

```bash
# Auto-convert NEXT_PUBLIC_* to VITE_PUBLIC_* variables
pnpm exec nizzy fix-env

# Zero OS uses Vite + React Router (not Next.js)
# The CLI will automatically handle the conversion
```

### 2. Configure Environment Variables

**Production Environment Setup:**

Create a production environment file:
```bash
cp .env.example .env.prod
```

Edit the `.env.prod` file with your production configuration:

```env
# Database Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=zerodotemail

# Redis Configuration  
REDIS_URL=redis://valkey:6379
REDIS_TOKEN=upstash-local-token

# Application URLs
VITE_PUBLIC_BACKEND_URL=http://localhost:8787
VITE_PUBLIC_APP_URL=http://localhost:3500

# API Keys (Required)
RESEND_API_KEY=your_resend_api_key
GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_api_key
GEMINI_MODEL=gemini-2.5-pro
GEMINI_FLASH_MODEL=gemini-2.5-flash

# Authentication (Required)
BETTER_AUTH_SECRET=your_32_character_random_string
BETTER_AUTH_URL=http://localhost:8787
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret

# Optional: Additional AI Services
PERPLEXITY_API_KEY=your_perplexity_api_key
OPENAI_API_KEY=your_openai_api_key
USE_OPENAI=false

# Optional: Communication Services
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Cloudflare Workers Configuration (Required for Production)
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token
WRANGLER_API_TOKEN=your_cloudflare_api_token

# Cloudflare Service Resources (Production)
CF_VECTORIZE_INDEX_THREADS=threads-vector-production
CF_VECTORIZE_INDEX_MESSAGES=messages-vector-production
CF_R2_BUCKET_THREADS=threads-production
CF_QUEUE_THREAD=thread-queue-production
CF_QUEUE_SUBSCRIBE=subscribe-queue-production
CF_QUEUE_SEND_EMAIL=send-email-queue-production

# Optional: KV Storage
CF_KV_CACHE_ID=your_kv_namespace_id
CF_KV_CACHE_PREVIEW_ID=your_kv_preview_id

# Production URLs (Update for your domain)
# VITE_PUBLIC_BACKEND_URL=https://api.yourdomain.com
# VITE_PUBLIC_APP_URL=https://yourdomain.com
# BETTER_AUTH_URL=https://api.yourdomain.com
# COOKIE_DOMAIN=yourdomain.com

# Production Security (Generate secure values)
# POSTGRES_PASSWORD=your_very_secure_production_password
# REDIS_TOKEN=your_secure_redis_token_for_production
# BETTER_AUTH_SECRET=generate_with_openssl_rand_-hex_32
```

### 3. Deploy with Docker Compose

```bash
# Start the complete Zero OS stack with production configuration
docker compose -f docker-compose.prod.yaml --env-file .env.prod up -d --build

# Check service status
docker compose -f docker-compose.prod.yaml ps
```

### 4. Access the Application

- **Frontend**: http://localhost:3500 (React SPA) or http://localhost (via Nginx)
- **Backend API**: http://localhost:8787 (Cloudflare Workers server)
- **Database**: localhost:5432 (internal network only)
- **Redis**: localhost:6379 (internal network only)
- **Upstash Proxy**: http://localhost:8079 (Redis HTTP interface)

## Service Architecture

### Core Services

#### 1. Frontend Application (Vite + React SPA)
```yaml
frontend:
  build:
    context: .
    dockerfile: docker/app/Dockerfile
  ports:
    - "3500:3000"
  environment:
    - VITE_PUBLIC_BACKEND_URL=http://backend:8787
    - VITE_PUBLIC_APP_URL=http://localhost:3500
    - NODE_ENV=production
  depends_on:
    - backend
```

#### 2. Backend Server (Cloudflare Workers)
```yaml
backend:
  build:
    context: .
    dockerfile: docker/server/Dockerfile
  ports:
    - "8787:8787"
  environment:
    - DATABASE_URL=postgresql://postgres:password@db:5432/zerodotemail
    - REDIS_URL=http://upstash-proxy:80
    - GOOGLE_GENERATIVE_AI_API_KEY=your_api_key
  depends_on:
    - db
    - valkey
    - upstash-proxy
    - migrations
```

#### 3. Database Migration Service
```yaml
migrations:
  build:
    context: .
    dockerfile: docker/db/Dockerfile
  environment:
    - DATABASE_URL=postgresql://postgres:password@db:5432/zerodotemail
  depends_on:
    - db
  command: ['pnpm', 'run', 'db:migrate']
  restart: 'no'
```

#### 4. PostgreSQL Database
```yaml
db:
  image: postgres:17-alpine
  environment:
    POSTGRES_USER: postgres
    POSTGRES_PASSWORD: password
    POSTGRES_DB: zerodotemail
  volumes:
    - postgres-data:/var/lib/postgresql/data
  healthcheck:
    test: ['CMD', 'pg_isready', '-U', 'postgres', '-d', 'zerodotemail']
```

#### 5. Redis (Valkey)
```yaml
valkey:
  image: docker.io/bitnami/valkey:8.0
  environment:
    - ALLOW_EMPTY_PASSWORD=yes
  volumes:
    - valkey-data:/bitnami/valkey/data
```

#### 6. Upstash Proxy
```yaml
upstash-proxy:
  image: hiett/serverless-redis-http:latest
  ports:
    - '8787:8787'
  environment:
    SRH_MODE: env
    SRH_TOKEN: upstash-local-token
    SRH_CONNECTION_STRING: 'redis://valkey:6379'
```

#### 7. Nginx Reverse Proxy
```yaml
nginx:
  image: nginx:alpine
  ports:
    - '80:80'
    - '443:443'
  volumes:
    - ./nginx.conf:/etc/nginx/nginx.conf:ro
  depends_on:
    - zero
```

## Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `POSTGRES_USER` | Database username | `postgres` |
| `POSTGRES_PASSWORD` | Database password | `secure_password` |
| `POSTGRES_DB` | Database name | `zerodotemail` |
| `REDIS_URL` | Redis HTTP connection URL | `http://localhost:8079` |
| `REDIS_TOKEN` | Upstash proxy token | `upstash-local-token` |
| `RESEND_API_KEY` | Email service API key | `re_xxx` |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Google AI API key | `AIza...` |
| `BETTER_AUTH_SECRET` | Authentication secret | `32-character random string` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | `GOCSPX-xxx` |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account identifier | `abc123def456...` |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token with Workers permissions | `xyz789abc123...` |
| `WRANGLER_API_TOKEN` | Wrangler CLI API token (same as above) | `xyz789abc123...` |
| `CF_VECTORIZE_INDEX_THREADS` | Threads vector search index name | `threads-vector-production` |
| `CF_VECTORIZE_INDEX_MESSAGES` | Messages vector search index name | `messages-vector-production` |
| `CF_R2_BUCKET_THREADS` | R2 bucket for email attachments | `threads-production` |
| `CF_QUEUE_THREAD` | Background job queue for threads | `thread-queue-production` |
| `CF_QUEUE_SUBSCRIBE` | Background job queue for subscriptions | `subscribe-queue-production` |
| `CF_QUEUE_SEND_EMAIL` | Background job queue for email sending | `send-email-queue-production` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_PUBLIC_BACKEND_URL` | Backend service URL | `http://localhost:8787` |
| `VITE_PUBLIC_APP_URL` | Frontend app URL | `http://localhost:3500` |
| `PERPLEXITY_API_KEY` | Perplexity AI API key | - |
| `OPENAI_API_KEY` | OpenAI API key (optional) | - |
| `TWILIO_ACCOUNT_SID` | Twilio SMS service ID | - |
| `GEMINI_MODEL` | Primary Gemini model | `gemini-2.5-pro` |
| `GEMINI_FLASH_MODEL` | Fast Gemini model | `gemini-2.5-flash` |
| `NODE_ENV` | Environment mode | `production` |

## Production Configuration

### SSL/HTTPS Setup

1. **Obtain SSL certificates**:
   ```bash
   # Using Let's Encrypt with Certbot
   certbot certonly --standalone -d yourdomain.com
   ```

2. **Update nginx.conf**:
   ```nginx
   server {
       listen 443 ssl http2;
       server_name yourdomain.com;
       
       ssl_certificate /etc/nginx/ssl/fullchain.pem;
       ssl_certificate_key /etc/nginx/ssl/privkey.pem;
       
       location / {
           proxy_pass http://zero:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

3. **Mount SSL certificates**:
   ```yaml
   nginx:
     volumes:
       - ./ssl:/etc/nginx/ssl:ro
       - ./nginx.conf:/etc/nginx/nginx.conf:ro
   ```

### Domain Configuration

Update your environment for production domain:

```env
VITE_PUBLIC_BACKEND_URL=https://api.yourdomain.com
VITE_PUBLIC_APP_URL=https://yourdomain.com
BETTER_AUTH_URL=https://api.yourdomain.com
COOKIE_DOMAIN=yourdomain.com
```

### Traefik Integration (Alternative)

For automatic SSL and load balancing:

```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.zero.rule=Host(`yourdomain.com`)"
  - "traefik.http.routers.zero.entrypoints=websecure"
  - "traefik.http.routers.zero.tls.certresolver=letsencrypt"
```

## Monitoring and Maintenance

### Health Checks

All services include health checks for reliability:

```yaml
healthcheck:
  test: ['CMD', 'wget', '--no-verbose', '--tries=1', '--spider', 'http://127.0.0.1:3000']
  interval: 30s
  timeout: 10s
  retries: 3
```

### Log Management

View service logs:
```bash
# View all logs
docker compose -f docker-compose.prod.yaml logs -f

# View specific service logs
docker compose -f docker-compose.prod.yaml logs -f zero
docker compose -f docker-compose.prod.yaml logs -f db
```

### Database Management

#### Backup Database
```bash
# Create database backup
docker compose -f docker-compose.prod.yaml exec db pg_dump -U postgres zerodotemail > backup.sql

# Restore from backup
docker compose -f docker-compose.prod.yaml exec -T db psql -U postgres zerodotemail < backup.sql
```

#### Access Database Console
```bash
docker compose -f docker-compose.prod.yaml exec db psql -U postgres -d zerodotemail
```

### Performance Optimization

1. **Enable Redis persistence**:
   ```yaml
   valkey:
     command: ['redis-server', '--save', '60', '1000']
   ```

2. **Configure PostgreSQL optimization**:
   ```yaml
   db:
     environment:
       - POSTGRES_SHARED_PRELOAD_LIBRARIES=pg_stat_statements
       - POSTGRES_MAX_CONNECTIONS=200
   ```

3. **Resource limits**:
   ```yaml
   frontend:
     deploy:
       resources:
         limits:
           memory: 1G
           cpus: '0.5'
   backend:
     deploy:
       resources:
         limits:
           memory: 2G
           cpus: '1.0'
   ```

## Troubleshooting

### Common Issues

#### 1. Database Connection Errors
```bash
# Check database health
docker compose -f docker-compose.prod.yaml exec db pg_isready -U postgres

# Verify environment variables
docker compose -f docker-compose.prod.yaml exec backend printenv | grep DATABASE_URL
```

#### 2. Migration Failures
```bash
# Run migrations manually
docker compose -f docker-compose.prod.yaml run --rm migrations pnpm run db:migrate

# Check migration status
docker compose -f docker-compose.prod.yaml exec db psql -U postgres -d zerodotemail -c "SELECT * FROM __drizzle_migrations;"
```

#### 3. Redis Connection Issues
```bash
# Test Redis connectivity
docker compose -f docker-compose.prod.yaml exec valkey redis-cli ping

# Check upstash-proxy status
curl http://localhost:8079/ping
```

#### 4. Build Issues
```bash
# Clean and rebuild
docker compose -f docker-compose.prod.yaml down -v
docker system prune -f
docker compose -f docker-compose.prod.yaml build --no-cache
docker compose -f docker-compose.prod.yaml up -d
```

### Debug Mode

Enable debug logging:
```env
DEBUG=1
LOG_LEVEL=debug
NEXT_PUBLIC_DEBUG=true
```

## Development vs Production

### Development Setup
```bash
# Use development compose file
docker compose -f docker-compose.db.yaml up -d

# Run in development mode
pnpm run dev
```

### Production Setup
```bash
# Use production compose file with production environment
docker compose -f docker-compose.prod.yaml --env-file .env.prod up -d --build

# Monitor deployment
docker compose -f docker-compose.prod.yaml --env-file .env.prod logs -f

# Check service status
docker compose -f docker-compose.prod.yaml --env-file .env.prod ps
```

## Security Considerations

1. **Change default passwords**:
   - PostgreSQL password
   - Redis token (if authentication enabled)

2. **Network security**:
   - Use Docker networks to isolate services
   - Expose only necessary ports

3. **Environment variables**:
   - Store sensitive variables in `.env` files
   - Use Docker secrets for production

4. **Regular updates**:
   - Update base images regularly
   - Monitor security advisories

## API Keys and External Services

Zero OS integrates with several external services:

### Required Services
- **Resend**: Email delivery service
- **Google Generative AI**: Primary AI service for Gemini models
- **Google OAuth**: Authentication provider
- **PostgreSQL**: Primary database
- **Redis**: Caching and sessions

### Optional Services
- **Perplexity AI**: Additional AI capabilities
- **OpenAI**: Alternative AI provider (when USE_OPENAI=true)
- **Twilio**: SMS integration and notifications
- **Cloudflare**: Workers deployment and API management

## Scaling and High Availability

### Horizontal Scaling
```yaml
zero:
  deploy:
    replicas: 3
  depends_on:
    - db
    - valkey
```

### Load Balancing
Use Nginx or Traefik for load balancing multiple instances:

```nginx
upstream frontend_servers {
    server frontend_1:3000;
    server frontend_2:3000;
    server frontend_3:3000;
}

upstream backend_servers {
    server backend_1:8787;
    server backend_2:8787;
    server backend_3:8787;
}
```

### Database Clustering
For high availability, consider:
- PostgreSQL streaming replication
- Redis Sentinel for Redis HA
- External managed database services

## Detailed Project Architecture

Zero OS is deployed as separate containerized services:

### Production Containers
- **`zerodotemail-frontend`** - Vite-built React SPA served via static files
- **`zerodotemail-backend`** - Cloudflare Workers server for API endpoints
- **`zerodotemail-db`** - PostgreSQL database for data storage
- **`zerodotemail-redis`** - Valkey (Redis) for caching and sessions
- **`zerodotemail-upstash-proxy`** - HTTP interface for Redis access
- **`zerodotemail-migrations`** - Database migration runner (runs once)
- **`zerodotemail-nginx`** - Reverse proxy and load balancer

### Monorepo Structure
- **`apps/mail/`** - Vite + React frontend application
- **`apps/server/`** - Cloudflare Workers backend server
- **`packages/cli/`** - CLI tools (nizzy command)
- **`packages/db/`** - Database schemas and utilities
- Various shared configuration packages

### Service Communication
- **Frontend** (port 3500) serves the React SPA
- **Backend** (port 8787) provides tRPC API endpoints connected to Cloudflare services
- **Database** (port 5432) stores application data
- **Redis** (port 6379) handles caching and sessions
- **Upstash Proxy** (port 8079) provides HTTP access to Redis
- **Nginx** (ports 80/443) routes traffic and handles SSL
- **Cloudflare Services** (remote) provide vector search, object storage, workflows, and queues

### Hybrid Deployment Benefits

**✅ What You Get:**
- **Full Zero OS functionality** including AI-powered features
- **Vector search** for intelligent email discovery
- **Large attachment support** via R2 object storage
- **Background job processing** with Cloudflare Queues
- **Workflow orchestration** for complex email sync operations
- **Edge computing** performance with Durable Objects
- **Auto-scaling** serverless compute for peak loads

**💰 Cost Considerations:**
- **Cloudflare Workers**: $5/month minimum + usage
- **R2 Storage**: $0.015/GB/month + requests
- **Vectorize**: $0.040 per 1M query dimensions
- **Queues**: $0.50 per 1M requests
- **Total estimated**: $10-30/month for typical usage

**🔒 Data Flow:**
- **Sensitive data** (emails, credentials) stays in your infrastructure
- **Metadata and vectors** processed through Cloudflare services
- **Attachments** can be stored in Cloudflare R2 (encrypted)
- **Authentication** handled by your self-hosted backend

## Cloudflare Setup Guide

### 🚀 **Automated Setup Script**

For convenience, use the automated setup script:

```bash
# Make script executable
chmod +x scripts/setup-cloudflare.sh

# Run automated setup
./scripts/setup-cloudflare.sh

# Verify resources were created
wrangler vectorize list
wrangler r2 bucket list  
wrangler queues list
```

### 1. Create Required Resources (Manual)

Before deploying, set up these Cloudflare resources:

```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Create Vectorize indexes
wrangler vectorize create threads-vector-production --dimensions=1536 --metric=cosine
wrangler vectorize create messages-vector-production --dimensions=1536 --metric=cosine

# Create R2 bucket
wrangler r2 bucket create threads-production

# Create queues
wrangler queues create thread-queue-production
wrangler queues create subscribe-queue-production  
wrangler queues create send-email-queue-production

# Create KV namespace (optional)
wrangler kv:namespace create CACHE
```

### 2. Get Account Information

```bash
# Get your account ID
wrangler whoami

# Create API token with these permissions:
# - Account: Cloudflare Workers:Edit
# - Zone Resources: Include All zones
# - Account Resources: Include All accounts
```

## Migration from Development

1. **Export development data**:
   ```bash
   pnpm run db:generate
   pg_dump development_db > migration.sql
   ```

2. **Import to production**:
   ```bash
   docker compose -f docker-compose.prod.yaml exec -T db psql -U postgres zerodotemail < migration.sql
   ```

3. **Update environment variables** for production URLs and API keys

4. **Test all functionality** in the production environment

## Production Readiness Checklist

Before going live, ensure you've completed:

### ✅ **Core Functionality**
- [ ] All containers start successfully
- [ ] Frontend loads and displays properly
- [ ] User registration and login works
- [ ] Email sending/receiving functions
- [ ] AI features respond correctly
- [ ] Database migrations completed

### ✅ **Security & Performance**
- [ ] SSL certificates configured and valid
- [ ] Strong passwords for all services
- [ ] Firewall rules configured properly
- [ ] Environment variables secured
- [ ] Health checks passing
- [ ] Resource limits configured

### ✅ **Monitoring & Backup**
- [ ] Log aggregation setup
- [ ] Automated backups configured
- [ ] Monitoring alerts configured
- [ ] Disaster recovery plan documented
- [ ] Performance baseline established

### ✅ **Cloudflare Integration**
- [ ] All Cloudflare resources created
- [ ] API token permissions verified
- [ ] Vector search working
- [ ] File uploads to R2 successful
- [ ] Background queues processing
- [ ] Workflow orchestration active

### 🎯 **Go-Live Commands**

```bash
# Final deployment
docker compose -f docker-compose.prod.yaml --env-file .env.prod up -d --build

# Verify all services
docker compose -f docker-compose.prod.yaml ps

# Check logs for any errors
docker compose -f docker-compose.prod.yaml logs --tail 100

# Test functionality
curl -f https://yourdomain.com
curl -f https://api.yourdomain.com/health

# Monitor for 24 hours
docker compose -f docker-compose.prod.yaml logs -f
```

## Conclusion

This Docker deployment guide provides a complete **hybrid cloud-edge solution** for Zero OS. The containerized architecture ensures consistency across environments while leveraging Cloudflare's powerful serverless infrastructure for advanced features.

**What You've Achieved:**
- ✅ **Self-hosted core infrastructure** with full data control
- ✅ **Cloud-scale AI capabilities** via Cloudflare services
- ✅ **Production-ready deployment** with monitoring and security
- ✅ **Scalable architecture** ready for growth
- ✅ **Cost-effective solution** (~$15-40/month total)

**Key Files for Production:**
- `docker-compose.prod.yaml` - Production orchestration
- `.env.prod` - Production environment variables
- `scripts/setup-cloudflare.sh` - Automated Cloudflare resource setup
- `apps/server/wrangler.prod.jsonc` - Cloudflare Workers production config
- `nginx.conf` - Reverse proxy configuration

**Deployment Commands Summary:**
```bash
# 1. Setup environment
cp .env.example .env.prod
# Edit .env.prod with your values

# 2. Setup Cloudflare resources
./scripts/setup-cloudflare.sh

# 3. Deploy production stack
docker compose -f docker-compose.prod.yaml --env-file .env.prod up -d --build

# 4. Verify deployment
docker compose -f docker-compose.prod.yaml ps
curl -f http://localhost:3500
```

**Next Steps:**
1. Monitor usage and optimize resource allocation
2. Setup automated backups and disaster recovery
3. Configure custom domain and SSL certificates
4. Implement monitoring and alerting
5. Plan for horizontal scaling as usage grows

For additional support or advanced configurations, refer to the project documentation or open an issue in the repository.