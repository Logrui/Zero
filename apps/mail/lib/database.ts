/**
 * Database Connection and Configuration
 * Mock implementation for development - replace with actual Drizzle ORM in production
 */

// Mock types for development
interface MockPostgresResult {
  [key: string]: any;
}

// Mock postgres function for development
const mockPostgres = (connectionString: string, options?: any) => {
  const mockSql = async (query: TemplateStringsArray | string, ...params: any[]): Promise<MockPostgresResult[]> => {
    // Mock implementation for development
    console.log('Mock SQL query:', query, params);
    
    // Return mock data based on query type
    if (typeof query === 'string' && query.includes('SELECT 1')) {
      return [{ result: 1 }];
    }
    
    if (typeof query === 'string' && query.includes('version()')) {
      return [{
        version: 'PostgreSQL 15.0 (Mock)',
        database: 'zero_notifications',
        current_user: 'postgres',
        current_time: new Date()
      }];
    }
    
    if (typeof query === 'string' && query.includes('information_schema.tables')) {
      return [
        { table_name: 'notifications' },
        { table_name: 'api_keys' },
        { table_name: 'users' }
      ];
    }
    
    if (typeof query === 'string' && query.includes('COUNT(*)')) {
      return [{ count: 0 }];
    }
    
    if (typeof query === 'string' && query.includes('pg_database_size')) {
      return [{ size: '1024 kB' }];
    }
    
    return [];
  };
  
  // Add methods to mock sql function
  (mockSql as any).end = async () => {};
  (mockSql as any).unsafe = async (query: string, params: any[]) => mockSql([query] as any, ...params);
  
  return mockSql;
};

// Mock drizzle function
const mockDrizzle = (sql: any) => {
  return {
    transaction: async (callback: (tx: any) => Promise<any>) => {
      return await callback(sql);
    }
  };
};

// Mock migrate function
const mockMigrate = async (db: any, options: any) => {
  console.log('Mock migration executed');
};

// Database configuration
const config = {
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  database: process.env.DATABASE_NAME || 'zero_notifications',
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: parseInt(process.env.DATABASE_MAX_CONNECTIONS || '10'),
  idle_timeout: parseInt(process.env.DATABASE_IDLE_TIMEOUT || '30'),
  connect_timeout: parseInt(process.env.DATABASE_CONNECT_TIMEOUT || '10')
};

// Create PostgreSQL connection
const connectionString = process.env.DATABASE_URL || 
  `postgresql://${config.username}:${config.password}@${config.host}:${config.port}/${config.database}`;

// Development vs Production connection handling
const isDevelopment = process.env.NODE_ENV === 'development';

// For development, use a single connection
// For production, use connection pooling
const sql = mockPostgres(connectionString, {
  max: config.max,
  idle_timeout: config.idle_timeout,
  connect_timeout: config.connect_timeout,
  ssl: config.ssl,
  // In development, allow single connection reuse
  max_lifetime: isDevelopment ? 0 : 60 * 60, // 1 hour in production
  prepare: !isDevelopment // Prepare statements in production only
});

// Create Drizzle instance
export const db = mockDrizzle(sql);

/**
 * Database connection utilities
 */
export const dbUtils = {
  /**
   * Test database connection
   */
  async testConnection(): Promise<{ connected: boolean; error?: string }> {
    try {
      await sql`SELECT 1`;
      return { connected: true };
    } catch (error) {
      return {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown connection error'
      };
    }
  },

  /**
   * Get database info
   */
  async getDatabaseInfo(): Promise<{
    version: string;
    database: string;
    currentUser: string;
    currentTime: Date;
  }> {
    const result = await sql`
      SELECT 
        version() as version,
        current_database() as database,
        current_user as current_user,
        now() as current_time
    `;
    
    return {
      version: result[0].version,
      database: result[0].database,
      currentUser: result[0].current_user,
      currentTime: result[0].current_time
    };
  },

  /**
   * Run database migrations
   */
  async runMigrations(): Promise<{ success: boolean; error?: string }> {
    try {
      await mockMigrate(db, { migrationsFolder: './drizzle/migrations' });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Migration failed'
      };
    }
  },

  /**
   * Close database connection
   */
  async closeConnection(): Promise<void> {
    await (sql as any).end();
  },

  /**
   * Execute raw SQL query (use with caution)
   */
  async executeRaw(query: string, params: any[] = []): Promise<any[]> {
    return await (sql as any).unsafe(query, params);
  },

  /**
   * Check if tables exist
   */
  async checkTablesExist(): Promise<{
    notifications: boolean;
    apiKeys: boolean;
    users: boolean;
  }> {
    const result = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      AND table_name IN ('notifications', 'api_keys', 'users')
    `;
    
    const tableNames = result.map((row: any) => row.table_name);
    
    return {
      notifications: tableNames.includes('notifications'),
      apiKeys: tableNames.includes('api_keys'),
      users: tableNames.includes('users')
    };
  },

  /**
   * Get database statistics
   */
  async getDatabaseStats(): Promise<{
    totalNotifications: number;
    totalApiKeys: number;
    totalUsers: number;
    databaseSize: string;
  }> {
    try {
      // Check if tables exist first
      const tables = await this.checkTablesExist();
      
      const notificationCount = tables.notifications ? 
        (await sql`SELECT COUNT(*) as count FROM notifications`)[0].count : 0;
      
      const apiKeyCount = tables.apiKeys ? 
        (await sql`SELECT COUNT(*) as count FROM api_keys`)[0].count : 0;
      
      const userCount = tables.users ? 
        (await sql`SELECT COUNT(*) as count FROM users`)[0].count : 0;
      
      const sizeResult = await sql`
        SELECT pg_size_pretty(pg_database_size(current_database())) as size
      `;
      
      return {
        totalNotifications: parseInt(notificationCount),
        totalApiKeys: parseInt(apiKeyCount),
        totalUsers: parseInt(userCount),
        databaseSize: sizeResult[0].size
      };
    } catch (error) {
      return {
        totalNotifications: 0,
        totalApiKeys: 0,
        totalUsers: 0,
        databaseSize: 'Unknown'
      };
    }
  }
};

/**
 * Transaction helper
 */
export async function withTransaction<T>(
  callback: (tx: typeof db) => Promise<T>
): Promise<T> {
  return await db.transaction(callback);
}

/**
 * Health check for database
 */
export async function healthCheck(): Promise<{
  status: 'healthy' | 'unhealthy';
  checks: {
    connection: boolean;
    migrations: boolean;
    tables: boolean;
  };
  details?: any;
}> {
  const checks = {
    connection: false,
    migrations: false,
    tables: false
  };
  
  try {
    // Test connection
    const connectionTest = await dbUtils.testConnection();
    checks.connection = connectionTest.connected;
    
    if (!checks.connection) {
      return {
        status: 'unhealthy',
        checks,
        details: { connectionError: connectionTest.error }
      };
    }
    
    // Check if required tables exist
    const tablesExist = await dbUtils.checkTablesExist();
    checks.tables = tablesExist.notifications && tablesExist.apiKeys;
    
    // For migrations, we assume they're good if tables exist
    // In a real implementation, you might check a migrations table
    checks.migrations = checks.tables;
    
    const status = Object.values(checks).every(Boolean) ? 'healthy' : 'unhealthy';
    
    return {
      status,
      checks,
      details: {
        tables: tablesExist,
        database: await dbUtils.getDatabaseInfo()
      }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      checks,
      details: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

// Export the connection for direct use if needed
export { sql };

// Default export
export default db;