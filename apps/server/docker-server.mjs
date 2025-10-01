#!/usr/bin/env node

// Simple Node.js server for Docker development (replaces wrangler dev)
import { serve } from "@hono/node-server";

const port = parseInt(process.env.PORT || "8787");

console.log(`🚀 Starting Zero Server on port ${port}`);

// Mock Cloudflare environment for local development
const env = {
    // Database
    DATABASE_URL: process.env.DATABASE_URL,

    // Redis
    REDIS_URL: process.env.REDIS_URL,
    REDIS_TOKEN: process.env.REDIS_TOKEN,

    // Authentication
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,

    // AI Services
    GOOGLE_GENERATIVE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    GEMINI_MODEL: process.env.GEMINI_MODEL || "gemini-1.5-flash-002",
    GEMINI_FLASH_MODEL: process.env.GEMINI_FLASH_MODEL || "gemini-1.5-flash-002",
    PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    USE_OPENAI: process.env.USE_OPENAI,

    // Email Service
    RESEND_API_KEY: process.env.RESEND_API_KEY,

    // Twilio
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
    TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER,

    // Environment
    NODE_ENV: process.env.NODE_ENV || "production",
    ENVIRONMENT: process.env.ENVIRONMENT || "docker",
};

// Mock ExecutionContext for local development
class MockExecutionContext {
    waitUntil(promise) {
        // In real Cloudflare Workers, this schedules work to continue after response
        return promise.catch((error) => {
            console.error("Background task error:", error);
        });
    }

    passThroughOnException() {
        // Mock implementation
    }
}

// Import the worker handler
async function startServer() {
    try {
        console.log("📦 Loading worker module...");

        // Try to import the handler from the worker
        const workerModule = await import("./src/main.ts");

        // Get the handler - it should be exported from main.ts
        let handlerFetch;

        if (workerModule.handler && typeof workerModule.handler.fetch === 'function') {
            // Use the handler object
            handlerFetch = workerModule.handler.fetch;
            console.log("✅ Found handler object");
        } else if (workerModule.default) {
            // Use the default export (Entry class)
            const WorkerEntry = workerModule.default;
            const worker = new WorkerEntry();
            handlerFetch = worker.fetch.bind(worker);
            console.log("✅ Found Entry class");
        } else {
            throw new Error("No valid handler found in worker module");
        }

        // Create server
        const server = serve({
            fetch: async (request) => {
                const ctx = new MockExecutionContext();
                try {
                    return await handlerFetch(request, env, ctx);
                } catch (error) {
                    console.error("Request handling error:", error);
                    return new Response("Internal Server Error", { status: 500 });
                }
            },
            port,
        });

        console.log(`✅ Zero Server is running on http://localhost:${port}`);
        console.log(`📍 Health check: http://localhost:${port}/health`);

    } catch (error) {
        console.error("❌ Failed to start server:", error);
        console.error("Stack:", error.stack);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down server...');
    process.exit(0);
});

startServer();