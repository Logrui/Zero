# Cloudflare Services Summary

This document provides a comprehensive overview of all Cloudflare services used in the Zero Email application.

## Architecture Overview

```
Your Local Machine (Development)
├── Frontend (localhost:3500) - Vite dev server
├── Backend (localhost:8787) - Wrangler local runtime
│   ├── LOCAL: PostgreSQL (localhost:5432) - Docker
│   ├── LOCAL: Redis/Upstash Proxy (localhost:8079) - Docker
│   ├── REMOTE: Cloudflare Workers AI
│   ├── REMOTE: Vectorize
│   ├── REMOTE: R2 Buckets
│   ├── REMOTE: KV Namespaces
│   ├── REMOTE: Durable Objects
│   ├── REMOTE: Workflows
│   └── REMOTE: Queues
```

**Important**: When running `pnpm run dev`, the Wrangler dev server connects to **real Cloudflare services** for certain bindings, which may incur usage charges even in local development.

---

## 1. Cloudflare Workers (Core Runtime)

**Type**: Serverless compute  
**Configuration**: Main application runtime  
**Local Dev**: `localhost:8787`

### What It Does
- Serverless JavaScript execution environment running on Cloudflare's edge network
- Your entire backend (`@zero/server`) runs as a Cloudflare Worker
- Handles all API requests, authentication, email processing

### Usage in Application
- Backend API server
- tRPC endpoints
- Authentication via better-auth
- Email synchronization logic

---

## 2. Workers AI

**Type**: AI/ML inference  
**Configuration**: 
```jsonc
"ai": { "binding": "AI" }
```

### What It Does
- GPU-powered AI inference service
- Pre-trained models available without managing infrastructure
- Low-latency AI at the edge

### Usage in Application
- Email classification and categorization
- Email summarization
- AI-powered chat features
- Content analysis

### ⚠️ Important Notes
- **Always connects to real Cloudflare** even in local dev
- **Incurs usage charges** during local development
- Cannot be simulated locally due to GPU requirements

---

## 3. Vectorize (Vector Database)

**Type**: Vector storage and semantic search  
**Configuration**:
```jsonc
"vectorize": [
  { "binding": "VECTORIZE", "index_name": "threads-vector-staging" },
  { "binding": "VECTORIZE_MESSAGE", "index_name": "messages-vector-staging" }
]
```

### What It Does
- Vector database for storing embeddings
- Enables semantic search across emails
- Fast nearest-neighbor search

### Usage in Application
- **VECTORIZE**: Stores email thread embeddings for semantic search
- **VECTORIZE_MESSAGE**: Stores individual message embeddings
- Powers AI-driven email search and recommendations

### ⚠️ Important Notes
- Uses `--experimental-vectorize-bind-to-prod` flag in local dev
- **Connects to production/staging indexes** even locally
- May modify databases during local development

---

## 4. R2 Buckets (Object Storage)

**Type**: Object storage (S3-compatible)  
**Configuration**:
```jsonc
"r2_buckets": [
  { "binding": "THREADS_BUCKET", "bucket_name": "threads-staging" }
]
```

### What It Does
- S3-compatible object storage
- Zero egress fees
- Global distribution

### Usage in Application
- **THREADS_BUCKET**: Stores email thread data and attachments
- Large file storage
- Email archive data

### Benefits
- Cheaper than AWS S3
- No egress fees for data retrieval
- Edge-optimized storage

---

## 5. Durable Objects (Stateful Serverless)

**Type**: Strongly consistent, stateful compute  
**Configuration**: 8 different Durable Object classes

### What It Does
- Provides strong consistency guarantees
- Each instance has its own SQLite database
- State persists across requests
- Single-threaded execution within each instance

### Durable Objects in Application

#### **ZeroAgent**
- AI agent instances with persistent state
- Manages agent memory and conversation history
- Coordinates AI operations

#### **ZeroMCP**
- Model Context Protocol instances
- Manages AI model context and state
- Handles multi-turn conversations

#### **ZeroDB**
- Database coordination and caching layer
- Manages connection pooling
- Query caching and optimization

#### **ZeroDriver**
- Email driver/connection management
- Per-user email account state
- Gmail/Microsoft connection handlers

#### **ThinkingMCP**
- AI thinking and reasoning instances
- Manages complex AI reasoning workflows
- Stores thinking process state

#### **WorkflowRunner**
- Workflow execution state management
- Orchestrates long-running processes
- Handles workflow resumption after interruptions

#### **ThreadSyncWorker**
- Email thread synchronization coordination
- Manages sync state per account
- Prevents duplicate syncs

#### **ShardRegistry**
- Distributed shard management
- Load balancing across Durable Object instances
- Registry for object location

---

## 6. Workflows (Orchestration)

**Type**: Durable workflow orchestration (beta)  
**Configuration**:
```jsonc
"workflows": [
  { "binding": "SYNC_THREADS_WORKFLOW", "class_name": "SyncThreadsWorkflow" },
  { "binding": "SYNC_THREADS_COORDINATOR_WORKFLOW", "class_name": "SyncThreadsCoordinatorWorkflow" }
]
```

### What It Does
- Durable, resumable workflow execution
- Survives failures and restarts
- Handles long-running processes

### Usage in Application
- **SyncThreadsWorkflow**: Orchestrates email thread synchronization for individual accounts
- **SyncThreadsCoordinatorWorkflow**: Coordinates multiple sync workflows across accounts
- Handles retry logic and error recovery

---

## 7. Queues (Message Queue)

**Type**: Distributed message queue  
**Configuration**:
```jsonc
"queues": {
  "producers": [
    { "queue": "thread-queue", "binding": "thread_queue" },
    { "queue": "subscribe-queue", "binding": "subscribe_queue" },
    { "queue": "send-email-queue", "binding": "send_email_queue" }
  ]
}
```

### What It Does
- Asynchronous message processing
- Decouples request handling from heavy processing
- Guaranteed delivery with retries

### Queues in Application

#### **thread_queue**
- Queues email threads for asynchronous processing
- Handles bulk email imports
- Processes emails in background

#### **subscribe_queue**
- Manages Gmail push notification subscriptions
- Handles subscription renewal
- Processes webhook registrations

#### **send_email_queue**
- Queues emails for sending
- Handles scheduled email delivery
- Manages retry logic for failed sends

---

## 8. KV Namespaces (Key-Value Store)

**Type**: Eventually consistent, distributed KV storage  
**Configuration**: 10 different namespaces

### What It Does
- Globally distributed key-value storage
- Eventually consistent (fast reads, slightly delayed writes)
- Low-latency access from edge

### KV Namespaces in Application

#### **gmail_history_id**
- Tracks Gmail sync position per account
- Stores historyId for incremental sync
- Prevents duplicate email fetches

#### **gmail_processing_threads**
- Temporary state during thread processing
- Deduplication during sync
- Processing locks

#### **subscribed_accounts**
- Tracks which accounts have active Gmail push notifications
- Subscription status per connection
- Expiration tracking

#### **connection_labels**
- Cached email labels per connection
- Reduces API calls to Gmail/Microsoft
- Label metadata cache

#### **prompts_storage**
- Stores AI prompt templates
- System prompts for different features
- Custom user prompts

#### **gmail_sub_age**
- Tracks Gmail subscription expiration times
- When to renew push notifications
- Subscription health monitoring

#### **pending_emails_status**
- Status of emails being sent
- Delivery tracking
- Sent/pending/failed states

#### **pending_emails_payload**
- Actual email content waiting to be sent
- Draft storage before sending
- Scheduled email content

#### **scheduled_emails**
- Emails scheduled for future delivery
- Send time metadata
- Scheduled send queue

#### **snoozed_emails**
- Emails that user has snoozed
- Wake-up times
- Snooze metadata

---

## 9. Hyperdrive (Database Proxy)

**Type**: PostgreSQL connection pooling and caching  
**Configuration**:
```jsonc
"hyperdrive": [
  { 
    "binding": "HYPERDRIVE",
    "localConnectionString": "postgresql://postgres@localhost:5432/zerodotemail"
  }
]
```

### What It Does
- Smart connection pooling for databases
- Query result caching
- Reduces latency between Workers and databases

### Usage in Application
- **Local Dev**: Connects to Docker PostgreSQL (localhost:5432)
- **Production**: Connects to cloud PostgreSQL with pooling
- Powers all database queries via Drizzle ORM

### Why It's Needed
- Cloudflare Workers can't maintain persistent database connections
- Provides connection pooling across Worker invocations
- Caches frequent queries for better performance

---

## Development vs Production

### Local Development (`pnpm run dev`)

**Runs Locally**:
- PostgreSQL (Docker - localhost:5432)
- Redis/Valkey (Docker - localhost:6379)
- Upstash Proxy (Docker - localhost:8079)
- Wrangler dev server simulates Workers runtime

**Connects to Real Cloudflare**:
- Workers AI (real GPU inference)
- Vectorize (staging indexes)
- R2 Buckets (staging buckets)
- KV Namespaces (staging namespaces)
- Durable Objects (real instances)
- Workflows (real orchestration)
- Queues (staging queues)

### Production Deployment

**Everything runs on Cloudflare**:
- Workers (global edge network)
- All services use production bindings
- Hyperdrive connects to production PostgreSQL
- No local Docker services

---

## Redis and Upstash Proxy

### What Redis Does (Local Docker)
1. **Rate Limiting**: Tracks API request counts using `@upstash/ratelimit`
2. **Auth Session Caching**: Caches better-auth sessions for faster authentication

### What Upstash Proxy Does
- HTTP REST API wrapper around Redis
- Enables Cloudflare Workers to connect to Redis (Workers can't use TCP)
- Mimics Upstash's production Redis service locally

### Connection Flow
```
Backend Worker (localhost:8787)
    ↓ HTTP REST calls
Upstash Proxy (localhost:8079)
    ↓ Redis protocol
Redis/Valkey (localhost:6379)
```

### Production
- Uses real Upstash Redis (cloud service)
- Direct HTTP REST connection
- No Docker containers

---

## Cost Considerations

### Free Tier Limits
Cloudflare provides generous free tiers, but be aware:

- **Workers**: 100,000 requests/day free
- **Workers AI**: Pay-per-request (charges in local dev!)
- **Vectorize**: Beta pricing
- **R2**: 10GB storage free, zero egress
- **KV**: 100,000 reads/day, 1,000 writes/day free
- **Durable Objects**: 1M requests/month free
- **Queues**: 1M operations/month free

### Development Warning
Some services incur charges even in local development:
- ⚠️ **Workers AI** - Always uses real models
- ⚠️ **Vectorize** - With `--experimental-vectorize-bind-to-prod` flag

---

## Service Categories Summary

| Category | Services |
|----------|----------|
| **Compute** | Workers (runtime) |
| **AI/ML** | Workers AI, Vectorize |
| **Storage** | R2 (objects), KV (key-value) |
| **State** | Durable Objects (8 classes) |
| **Orchestration** | Workflows (2), Queues (3) |
| **Database** | Hyperdrive (PostgreSQL proxy) |
| **Local Dev Only** | PostgreSQL, Redis, Upstash Proxy |

---

## Additional Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Durable Objects Guide](https://developers.cloudflare.com/durable-objects/)
- [Workers AI Documentation](https://developers.cloudflare.com/workers-ai/)
- [Vectorize Documentation](https://developers.cloudflare.com/vectorize/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)

---

**Last Updated**: 2025-10-03
