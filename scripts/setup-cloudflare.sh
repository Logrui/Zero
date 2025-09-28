#!/bin/bash

# Zero OS Cloudflare Setup Script
# This script creates all required Cloudflare resources for Zero OS production deployment

set -e

echo "🚀 Zero OS Cloudflare Setup Script"
echo "=================================="

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Installing..."
    npm install -g wrangler
fi

# Login check
echo "🔐 Checking Cloudflare authentication..."
if ! wrangler whoami &> /dev/null; then
    echo "❌ Not logged in to Cloudflare. Please login:"
    wrangler login
fi

# Get account info
ACCOUNT_ID=$(wrangler whoami | grep "Account ID" | awk '{print $3}')
echo "✅ Using Cloudflare Account: $ACCOUNT_ID"

echo ""
echo "📦 Creating Cloudflare resources..."
echo "=================================="

# Create Vectorize indexes
echo "🔍 Creating Vectorize indexes..."
echo "Creating threads-vector-production..."
wrangler vectorize create threads-vector-production --dimensions=1536 --metric=cosine || echo "⚠️  Index may already exist"

echo "Creating messages-vector-production..."
wrangler vectorize create messages-vector-production --dimensions=1536 --metric=cosine || echo "⚠️  Index may already exist"

# Create R2 bucket
echo "🪣 Creating R2 bucket..."
wrangler r2 bucket create threads-production || echo "⚠️  Bucket may already exist"

# Create queues
echo "📬 Creating message queues..."
wrangler queues create thread-queue-production || echo "⚠️  Queue may already exist"
wrangler queues create subscribe-queue-production || echo "⚠️  Queue may already exist"
wrangler queues create send-email-queue-production || echo "⚠️  Queue may already exist"

# Create KV namespace
echo "🗄️  Creating KV namespace..."
KV_ID=$(wrangler kv:namespace create CACHE --preview=false 2>/dev/null | grep "id" | awk '{print $4}' | tr -d '"') || echo "⚠️  KV namespace may already exist"
KV_PREVIEW_ID=$(wrangler kv:namespace create CACHE --preview=true 2>/dev/null | grep "id" | awk '{print $4}' | tr -d '"') || echo "⚠️  KV preview namespace may already exist"

echo ""
echo "✅ Cloudflare resources created successfully!"
echo "=========================================="

echo ""
echo "📝 Add these environment variables to your .env file:"
echo "=================================================="
echo ""
echo "# Cloudflare Configuration"
echo "CLOUDFLARE_ACCOUNT_ID=$ACCOUNT_ID"
echo "CLOUDFLARE_API_TOKEN=<YOUR_API_TOKEN>"
echo ""
echo "# Cloudflare Resources"
echo "CF_VECTORIZE_INDEX_THREADS=threads-vector-production"
echo "CF_VECTORIZE_INDEX_MESSAGES=messages-vector-production"
echo "CF_R2_BUCKET_THREADS=threads-production"
echo "CF_QUEUE_THREAD=thread-queue-production"
echo "CF_QUEUE_SUBSCRIBE=subscribe-queue-production"
echo "CF_QUEUE_SEND_EMAIL=send-email-queue-production"

if [ ! -z "$KV_ID" ]; then
    echo "CF_KV_CACHE_ID=$KV_ID"
fi

if [ ! -z "$KV_PREVIEW_ID" ]; then
    echo "CF_KV_CACHE_PREVIEW_ID=$KV_PREVIEW_ID"
fi

echo ""
echo "🔑 Create your API token at: https://dash.cloudflare.com/profile/api-tokens"
echo "   Required permissions:"
echo "   - Account: Cloudflare Workers:Edit"
echo "   - Zone: Zone Resources:Include All zones"  
echo "   - Account Resources: Include All accounts"
echo ""
echo "🐳 You can now run: docker compose -f docker-compose.prod.yaml up -d"
echo ""
echo "✨ Setup complete! Your Zero OS deployment will have full functionality."