#!/bin/bash

# Zero Email Production Deployment Script
# This script helps deploy the Zero email application to production

set -e

echo "🚀 Zero Email Production Deployment"
echo "=================================="

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found!"
    echo "Please copy .env.prod to .env and configure your environment variables:"
    echo "cp .env.prod .env"
    exit 1
fi

# Check if required environment variables are set
required_vars=(
    "NEXT_PUBLIC_APP_URL"
    "NEXT_PUBLIC_BACKEND_URL"
    "POSTGRES_PASSWORD"
    "RESEND_API_KEY"
    "OPENAI_API_KEY"
    "BETTER_AUTH_SECRET"
)

echo "🔍 Checking environment variables..."
for var in "${required_vars[@]}"; do
    if ! grep -q "^${var}=" .env; then
        echo "⚠️  Warning: $var is not set in .env file"
    fi
done

# Create necessary directories
echo "📁 Creating SSL directory..."
mkdir -p ssl

# Generate self-signed SSL certificate for initial setup
if [ ! -f "ssl/cert.pem" ] || [ ! -f "ssl/key.pem" ]; then
    echo "🔐 Generating self-signed SSL certificate..."
    openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes -subj "/CN=yourdomain.com"
    echo "✅ SSL certificate generated. Replace with Let's Encrypt certificate in production."
fi

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker compose -f docker-compose.prod.yaml down

# Pull latest images
echo "📥 Pulling latest images..."
docker compose -f docker-compose.prod.yaml pull

# Build and start services
echo "🔨 Building and starting services..."
docker compose -f docker-compose.prod.yaml up -d --build

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 30

# Run database migrations
echo "🗄️  Running database migrations..."
docker compose -f docker-compose.prod.yaml up migrations

# Check service health
echo "🏥 Checking service health..."
if curl -f http://localhost/health > /dev/null 2>&1; then
    echo "✅ Application is healthy!"
else
    echo "⚠️  Application health check failed. Checking logs..."
    docker compose -f docker-compose.prod.yaml logs
fi

echo ""
echo "🎉 Deployment completed!"
echo ""
echo "📊 Service Status:"
docker compose -f docker-compose.prod.yaml ps

echo ""
echo "🌐 Access your application:"
if grep -q "NEXT_PUBLIC_APP_URL=https://" .env; then
    app_url=$(grep "NEXT_PUBLIC_APP_URL=" .env | cut -d'=' -f2)
    echo "   Main app: $app_url"
fi

echo ""
echo "🔧 Useful commands:"
echo "   View logs: docker compose -f docker-compose.prod.yaml logs -f"
echo "   Stop:      docker compose -f docker-compose.prod.yaml down"
echo "   Restart:   docker compose -f docker-compose.prod.yaml restart"
echo "   Update:    ./deploy.sh"
echo ""
echo "🔒 Security reminders:"
echo "   1. Replace self-signed SSL certificate with Let's Encrypt"
echo "   2. Use strong passwords for PostgreSQL"
echo "   3. Regularly backup your database"
echo "   4. Monitor application logs"
echo ""
echo "📖 For production setup with Let's Encrypt SSL:"
echo "   1. Update yourdomain.com in nginx.conf and docker-compose.prod.yaml"
echo "   2. Install certbot: sudo apt-get install certbot"
echo "   3. Get SSL certificate: sudo certbot certonly --webroot -w /path/to/webroot -d yourdomain.com"
echo "   4. Update nginx.conf to use the Let's Encrypt certificate"
echo "   5. Restart nginx: docker compose -f docker-compose.prod.yaml restart nginx"
