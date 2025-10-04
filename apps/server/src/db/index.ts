import { drizzle } from 'drizzle-orm/postgres-js';
import postgres, { type Sql } from 'postgres';
import * as schema from './schema';
import { env } from '../env';

const createDrizzle = (conn: Sql) => drizzle(conn, { schema });

export const createDb = (url: string) => {
  const conn = postgres(url);
  const db = createDrizzle(conn);
  return { db, conn };
};

/**
 * Get database connection with fallback to DATABASE_URL if HYPERDRIVE is not available
 * Useful for local development where HYPERDRIVE might not be fully initialized
 */
export const getDbConnection = () => {
  const connectionString = env.HYPERDRIVE?.connectionString || env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('No database connection string available. Check HYPERDRIVE or DATABASE_URL configuration.');
  }
  return createDb(connectionString);
};

export type DB = ReturnType<typeof createDrizzle>;
