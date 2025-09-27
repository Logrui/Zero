# Zero OS Notifications System - Deployment Guide

## Overview

This guide covers deploying the Zero OS Notifications System in production environments. The system is designed to be highly scalable, secure, and maintainable.

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │────│  Next.js App    │────│   PostgreSQL    │
│   (Nginx/CF)    │    │   (Frontend)    │    │   (Database)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                               │                        │
                       ┌─────────────────┐    ┌─────────────────┐
                       │  Node.js API    │────│     Redis       │
                       │  (Backend)      │    │    (Cache)      │
                       └─────────────────┘    └─────────────────┘
                               │
                       ┌─────────────────┐
                       │  Queue System   │
                       │ (Bull/Redis)    │
                       └─────────────────┘
```

## Prerequisites

### System Requirements

**Minimum Configuration**:
- CPU: 2 cores
- RAM: 4GB
- Disk: 20GB SSD
- Network: 1Gbps

**Recommended Configuration**:
- CPU: 4+ cores
- RAM: 8GB+
- Disk: 50GB+ SSD
- Network: 1Gbps+

### Software Dependencies

- **Node.js**: 18.x or later
- **npm/pnpm**: Latest stable version
- **PostgreSQL**: 15.x or later
- **Redis**: 7.x or later
- **Docker**: 24.x or later (optional)
- **Nginx**: 1.20+ or Cloudflare (load balancer)

## Environment Setup

### 1. Server Preparation

#### Update System
```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# CentOS/RHEL
sudo yum update -y
```

#### Install Node.js
```bash
# Using NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

#### Install PostgreSQL
```bash
# Ubuntu/Debian
sudo apt install postgresql postgresql-contrib

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql
CREATE DATABASE zero_notifications;
CREATE USER zero_user WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE zero_notifications TO zero_user;
\q
```

#### Install Redis
```bash
# Ubuntu/Debian
sudo apt install redis-server

# Start and enable Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Configure Redis for production
sudo nano /etc/redis/redis.conf
# Set: maxmemory 2gb
# Set: maxmemory-policy allkeys-lru
# Set: requirepass your_redis_password

sudo systemctl restart redis-server
```

### 2. Application Deployment

#### Clone Repository
```bash
cd /opt
sudo git clone https://github.com/your-org/zero-notifications.git
sudo chown -R $USER:$USER zero-notifications
cd zero-notifications
```

#### Install Dependencies
```bash
# Install pnpm globally
npm install -g pnpm

# Install project dependencies
pnpm install

# Build the application
pnpm build
```

#### Environment Configuration

Create production environment file:
```bash
cp .env.example .env.production
```

Configure environment variables:
```env
# .env.production

# Application
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database
DATABASE_URL=postgresql://zero_user:secure_password@localhost:5432/zero_notifications
DATABASE_SSL=true

# Redis
REDIS_URL=redis://:your_redis_password@localhost:6379
REDIS_TLS=false

# Security
JWT_SECRET=your_super_secure_jwt_secret_here
API_KEY_SECRET=your_api_key_signing_secret_here
ENCRYPTION_KEY=your_32_character_encryption_key_here

# External Services
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your_sendgrid_api_key
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token

# Monitoring
SENTRY_DSN=your_sentry_dsn_here
NEW_RELIC_LICENSE_KEY=your_newrelic_key_here

# Rate Limiting
RATE_LIMIT_WINDOW_MS=3600000
RATE_LIMIT_MAX_REQUESTS=1000

# CORS
CORS_ORIGIN=https://your-domain.com,https://admin.your-domain.com

# Logging
LOG_LEVEL=info
LOG_FILE=/var/log/zero-notifications/app.log
```

#### Database Migration
```bash
# Run database migrations
pnpm run db:migrate

# Seed initial data (optional)
pnpm run db:seed
```

### 3. Process Management

#### Using PM2 (Recommended)

Install PM2:
```bash
npm install -g pm2
```

Create PM2 ecosystem file:
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'zero-notifications-web',
    script: './apps/mail/server.js',
    cwd: '/opt/zero-notifications',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_file: '.env.production',
    log_file: '/var/log/zero-notifications/web.log',
    error_file: '/var/log/zero-notifications/web-error.log',
    out_file: '/var/log/zero-notifications/web-out.log',
    merge_logs: true,
    max_memory_restart: '1G'
  }, {
    name: 'zero-notifications-api',
    script: './apps/server/index.js',
    cwd: '/opt/zero-notifications',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    env_file: '.env.production',
    log_file: '/var/log/zero-notifications/api.log',
    error_file: '/var/log/zero-notifications/api-error.log',
    out_file: '/var/log/zero-notifications/api-out.log',
    merge_logs: true,
    max_memory_restart: '512M'
  }, {
    name: 'zero-notifications-worker',
    script: './apps/server/worker.js',
    cwd: '/opt/zero-notifications',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production'
    },
    env_file: '.env.production',
    log_file: '/var/log/zero-notifications/worker.log',
    max_memory_restart: '256M',
    restart_delay: 5000
  }]
};
```

Start applications:
```bash
# Create log directory
sudo mkdir -p /var/log/zero-notifications
sudo chown -R $USER:$USER /var/log/zero-notifications

# Start applications
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Generate startup script
pm2 startup

# Monitor applications
pm2 monit
```

#### Using systemd

Create systemd service files:

```ini
# /etc/systemd/system/zero-notifications-web.service
[Unit]
Description=Zero Notifications Web App
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=nodeuser
WorkingDirectory=/opt/zero-notifications
ExecStart=/usr/bin/node apps/mail/server.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=3000
EnvironmentFile=/opt/zero-notifications/.env.production
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

```ini
# /etc/systemd/system/zero-notifications-api.service
[Unit]
Description=Zero Notifications API Server
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=nodeuser
WorkingDirectory=/opt/zero-notifications
ExecStart=/usr/bin/node apps/server/index.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=3001
EnvironmentFile=/opt/zero-notifications/.env.production
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

Enable and start services:
```bash
sudo systemctl daemon-reload
sudo systemctl enable zero-notifications-web zero-notifications-api
sudo systemctl start zero-notifications-web zero-notifications-api
sudo systemctl status zero-notifications-web zero-notifications-api
```

### 4. Load Balancer Configuration

#### Nginx Configuration

Install Nginx:
```bash
sudo apt install nginx
```

Create Nginx configuration:
```nginx
# /etc/nginx/sites-available/zero-notifications
upstream web_backend {
    server 127.0.0.1:3000;
    # Add more servers for horizontal scaling
    # server 127.0.0.1:3002;
}

upstream api_backend {
    server 127.0.0.1:3001;
    # Add more API servers
    # server 127.0.0.1:3003;
}

# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=web:10m rate=30r/s;

server {
    listen 80;
    server_name notifications.your-domain.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name notifications.your-domain.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/notifications.your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/notifications.your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';" always;
    
    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # API routes
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://api_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 5s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # WebSocket support for real-time notifications
    location /ws {
        proxy_pass http://web_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Static files
    location /_next/static/ {
        alias /opt/zero-notifications/apps/mail/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Main application
    location / {
        limit_req zone=web burst=50 nodelay;
        proxy_pass http://web_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the configuration:
```bash
sudo ln -s /etc/nginx/sites-available/zero-notifications /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5. SSL Certificate Setup

#### Using Let's Encrypt (Recommended)

Install Certbot:
```bash
sudo apt install certbot python3-certbot-nginx
```

Obtain SSL certificate:
```bash
sudo certbot --nginx -d notifications.your-domain.com
```

Set up automatic renewal:
```bash
sudo crontab -e
# Add this line:
0 12 * * * /usr/bin/certbot renew --quiet
```

### 6. Database Optimization

#### PostgreSQL Configuration

Edit PostgreSQL configuration:
```bash
sudo nano /etc/postgresql/15/main/postgresql.conf
```

Optimize for production:
```conf
# Memory settings
shared_buffers = 256MB                  # 25% of RAM for dedicated server
effective_cache_size = 1GB              # 75% of RAM
work_mem = 4MB                          # Per connection
maintenance_work_mem = 64MB

# Checkpoint settings
checkpoint_completion_target = 0.9
wal_buffers = 16MB
checkpoint_timeout = 10min
max_wal_size = 1GB
min_wal_size = 80MB

# Connection settings
max_connections = 200
listen_addresses = 'localhost'

# Logging
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
log_checkpoints = on
log_connections = on
log_disconnections = on
log_lock_waits = on
log_temp_files = 10240
log_autovacuum_min_duration = 0
```

Create database indexes:
```sql
-- Connect to the database
sudo -u postgres psql -d zero_notifications

-- Create indexes for better performance
CREATE INDEX CONCURRENTLY idx_notifications_created_at ON notifications(created_at);
CREATE INDEX CONCURRENTLY idx_notifications_status ON notifications(status);
CREATE INDEX CONCURRENTLY idx_notifications_type ON notifications(type);
CREATE INDEX CONCURRENTLY idx_notifications_priority ON notifications(priority);
CREATE INDEX CONCURRENTLY idx_notifications_channel ON notifications(channel);
CREATE INDEX CONCURRENTLY idx_notifications_tags ON notifications USING GIN(tags);
CREATE INDEX CONCURRENTLY idx_api_keys_key_hash ON api_keys(key_hash);
```

Set up connection pooling:
```bash
# Install pgbouncer
sudo apt install pgbouncer

# Configure pgbouncer
sudo nano /etc/pgbouncer/pgbouncer.ini
```

```ini
[databases]
zero_notifications = host=localhost port=5432 dbname=zero_notifications user=zero_user

[pgbouncer]
listen_port = 6432
listen_addr = 127.0.0.1
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt
logfile = /var/log/postgresql/pgbouncer.log
pidfile = /var/run/postgresql/pgbouncer.pid
admin_users = postgres
stats_users = stats, postgres
pool_mode = transaction
server_reset_query = DISCARD ALL
max_client_conn = 100
default_pool_size = 20
min_pool_size = 5
reserve_pool_size = 10
server_lifetime = 3600
server_idle_timeout = 600
log_connections = 1
log_disconnections = 1
log_pooler_errors = 1
```

Update application to use pgbouncer:
```env
# Update DATABASE_URL in .env.production
DATABASE_URL=postgresql://zero_user:secure_password@localhost:6432/zero_notifications
```

### 7. Monitoring and Logging

#### Application Monitoring

Install monitoring tools:
```bash
# Install Node.js monitoring
npm install -g clinic
npm install -g autocannon

# System monitoring
sudo apt install htop iotop nethogs
```

Set up health checks:
```bash
# Create health check script
cat > /opt/zero-notifications/health-check.sh << 'EOF'
#!/bin/bash

# Check web application
WEB_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health)
if [ $WEB_STATUS -ne 200 ]; then
    echo "Web app health check failed: $WEB_STATUS"
    exit 1
fi

# Check API
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health)
if [ $API_STATUS -ne 200 ]; then
    echo "API health check failed: $API_STATUS"
    exit 1
fi

# Check database
DB_STATUS=$(pg_isready -h localhost -p 5432 -U zero_user)
if [ $? -ne 0 ]; then
    echo "Database health check failed"
    exit 1
fi

# Check Redis
REDIS_STATUS=$(redis-cli -p 6379 ping)
if [ "$REDIS_STATUS" != "PONG" ]; then
    echo "Redis health check failed"
    exit 1
fi

echo "All services healthy"
EOF

chmod +x /opt/zero-notifications/health-check.sh

# Add to crontab for monitoring
echo "*/5 * * * * /opt/zero-notifications/health-check.sh >> /var/log/zero-notifications/health-check.log 2>&1" | crontab -
```

#### Log Management

Configure log rotation:
```bash
sudo nano /etc/logrotate.d/zero-notifications
```

```
/var/log/zero-notifications/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 nodeuser nodeuser
    postrotate
        pm2 reload all
    endscript
}
```

Set up centralized logging (optional):
```bash
# Install rsyslog for centralized logging
sudo apt install rsyslog

# Configure application to use syslog
# Add to .env.production
SYSLOG_ENABLED=true
SYSLOG_FACILITY=local0
```

### 8. Backup Strategy

#### Database Backup

Create backup script:
```bash
cat > /opt/zero-notifications/backup-db.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/opt/backups/zero-notifications"
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/zero_notifications_$DATE.sql.gz"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Create database backup
pg_dump -h localhost -U zero_user -d zero_notifications | gzip > $BACKUP_FILE

# Remove backups older than 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

# Upload to cloud storage (optional)
# aws s3 cp $BACKUP_FILE s3://your-backup-bucket/

echo "Database backup completed: $BACKUP_FILE"
EOF

chmod +x /opt/zero-notifications/backup-db.sh

# Schedule daily backups
echo "0 2 * * * /opt/zero-notifications/backup-db.sh >> /var/log/zero-notifications/backup.log 2>&1" | crontab -
```

#### Application Backup

Create application backup script:
```bash
cat > /opt/zero-notifications/backup-app.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/opt/backups/zero-notifications"
DATE=$(date +"%Y%m%d_%H%M%S")
APP_BACKUP="$BACKUP_DIR/app_$DATE.tar.gz"

# Create backup directory
mkdir -p $BACKUP_DIR

# Create application backup (excluding node_modules and logs)
tar -czf $APP_BACKUP --exclude='node_modules' --exclude='*.log' --exclude='.git' /opt/zero-notifications/

# Remove backups older than 7 days
find $BACKUP_DIR -name "app_*.tar.gz" -mtime +7 -delete

echo "Application backup completed: $APP_BACKUP"
EOF

chmod +x /opt/zero-notifications/backup-app.sh

# Schedule weekly backups
echo "0 3 * * 0 /opt/zero-notifications/backup-app.sh >> /var/log/zero-notifications/backup.log 2>&1" | crontab -
```

### 9. Security Hardening

#### Firewall Configuration

```bash
# Install and configure UFW
sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow internal services (restrict to localhost)
sudo ufw allow from 127.0.0.1 to any port 3000
sudo ufw allow from 127.0.0.1 to any port 3001
sudo ufw allow from 127.0.0.1 to any port 5432
sudo ufw allow from 127.0.0.1 to any port 6379

# Enable firewall
sudo ufw --force enable
sudo ufw status
```

#### Application Security

Update environment with security settings:
```env
# Security settings in .env.production

# HTTPS only
SECURE_COOKIES=true
SECURE_HEADERS=true

# Rate limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# API key security
API_KEY_ROTATION_ENABLED=true
API_KEY_MAX_AGE_DAYS=90

# Input validation
STRICT_INPUT_VALIDATION=true
XSS_PROTECTION=true
CSRF_PROTECTION=true

# Database security
DATABASE_SSL_MODE=require
DATABASE_STATEMENT_TIMEOUT=30000
```

### 10. Performance Tuning

#### Application Optimization

```env
# Performance settings in .env.production

# Caching
CACHE_TTL=300000
CACHE_MAX_SIZE=100

# Connection pooling
DB_POOL_MIN=5
DB_POOL_MAX=20
DB_POOL_IDLE_TIMEOUT=10000

# Queue optimization
QUEUE_CONCURRENCY=10
QUEUE_ATTEMPTS=3
QUEUE_DELAY=5000

# Memory limits
NODE_OPTIONS=--max-old-space-size=1024
```

#### Redis Optimization

```bash
# Edit Redis configuration
sudo nano /etc/redis/redis.conf
```

```conf
# Memory optimization
maxmemory 512mb
maxmemory-policy allkeys-lru

# Persistence (for cache data, you might disable)
save ""
appendonly no

# Network
tcp-keepalive 300
timeout 300

# Security
requirepass your_strong_redis_password
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command DEBUG ""
```

## Deployment Checklist

### Pre-Deployment
- [ ] Environment variables configured
- [ ] Database migrations completed
- [ ] SSL certificates installed
- [ ] Firewall rules configured
- [ ] Monitoring tools installed
- [ ] Backup scripts configured
- [ ] Health checks implemented

### Post-Deployment
- [ ] Application health verified
- [ ] SSL certificate validity confirmed
- [ ] Performance benchmarks executed
- [ ] Security scan completed
- [ ] Monitoring alerts configured
- [ ] Backup restoration tested
- [ ] Load testing performed

### Ongoing Maintenance
- [ ] Regular security updates
- [ ] Performance monitoring
- [ ] Log analysis
- [ ] Backup verification
- [ ] Certificate renewal
- [ ] Capacity planning
- [ ] Incident response procedures

## Scaling Considerations

### Horizontal Scaling

When you need to scale beyond a single server:

1. **Load Balancer**: Use dedicated load balancer (AWS ALB, GCP Load Balancer)
2. **Multiple App Servers**: Deploy to multiple instances
3. **Database**: Consider read replicas or clustering
4. **Redis**: Use Redis Cluster for high availability
5. **Queue System**: Distribute workers across instances

### Vertical Scaling

Before horizontal scaling, consider:

1. **Increase server resources** (CPU, RAM, disk)
2. **Optimize database queries** and add indexes
3. **Implement caching** at application and database levels
4. **Optimize images and static assets**
5. **Use CDN** for static content delivery

## Troubleshooting

### Common Issues

#### Application Won't Start
```bash
# Check logs
pm2 logs zero-notifications-web
journalctl -u zero-notifications-web -f

# Check port conflicts
sudo netstat -tlnp | grep :3000

# Check file permissions
ls -la /opt/zero-notifications/
```

#### Database Connection Issues
```bash
# Test database connection
pg_isready -h localhost -p 5432 -U zero_user

# Check PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-15-main.log

# Verify connection string
echo $DATABASE_URL
```

#### High Memory Usage
```bash
# Check memory usage
free -h
ps aux --sort=-%mem | head

# Check for memory leaks
pm2 show zero-notifications-web
```

#### Performance Issues
```bash
# Check system resources
htop
iotop
nethogs

# Database performance
sudo -u postgres psql -d zero_notifications -c "SELECT * FROM pg_stat_activity;"
```

For additional support and advanced deployment scenarios, contact the Zero OS support team at support@zero-os.com.