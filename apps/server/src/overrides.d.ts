/**
 * Type declarations and module overrides for Zero Email Server
 * Fixes TypeScript module resolution and Cloudflare Workers compatibility
 */

import type { Connection } from 'agents';
import { DurableObject } from 'cloudflare:workers';
import type { OutgoingMessage } from './routes/agent/types';

// Module declaration for 'agents' package
declare module 'agents/ai-chat-agent' {
    import type { Message } from 'ai';
    import type { WSMessage } from 'partyserver';

    export class AIChatAgent<TEnv = any> extends DurableObject<TEnv> {
        messages: Message[];
        sql: SqlStorage;
        name: string;
        ctx: DurableObjectState;
        env: TEnv;
        mcp: {
            connect(url: string, options?: any): Promise<void>;
            unstable_getAITools(): Record<string, any>;
        };

        constructor(ctx: DurableObjectState, env: TEnv);

        onStart?(): void | Promise<void>;
        onConnect?(connection: Connection): void | Promise<void>;
        onMessage(connection: Connection, message: WSMessage): void | Promise<void>;
        onError(error: any): Error;

        persistMessages(messages: Message[], exclude?: string[]): Promise<void>;
        broadcast(message: string, exclude?: string[]): void;
        broadcastChatMessage(message: OutgoingMessage, exclude?: string[]): void;
    }
}

declare module 'agents/mcp/do-oauth-client-provider' {
    export class DurableObjectOAuthClientProvider {
        constructor(storage: DurableObjectStorage, clientId: string, baseUrl: string);
    }
}

declare module 'agents' {
    export interface Connection {
        id: string;
        send(message: string): void;
    }
}

// Cloudflare Workers type augmentations
declare global {
    // Fix ReadableStream async iteration for Cloudflare Workers
    interface ReadableStream<R = any> {
        [Symbol.asyncIterator](): AsyncIterableIterator<R>;
        getReader(): ReadableStreamDefaultReader<R>;
    }

    // Durable Object branding fix
    const __DURABLE_OBJECT_BRAND: unique symbol;

    interface DurableObjectBranded {
        readonly [__DURABLE_OBJECT_BRAND]: true;
    }
}

// Export the brand symbol for use in classes
export const __DURABLE_OBJECT_BRAND: unique symbol = Symbol('DURABLE_OBJECT_BRAND');

// Module augmentation for existing modules
declare module 'cloudflare:workers' {
    interface DurableObjectStub<T> {
        broadcastChatMessage?(message: OutgoingMessage): Promise<void>;
    }
}