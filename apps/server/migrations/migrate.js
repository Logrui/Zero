#!/usr/bin/env node

/**
 * Zero OS Notifications Migration Runner
 * Handles database migrations for the notifications system
 */

import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Mock PostgreSQL client for development
class MockPostgreSQLClient {
  async query(text, params) {
    console.log('Executing SQL:', text.substring(0, 100) + (text.length > 100 ? '...' : ''));
    if (params) {
      console.log('Parameters:', params);
    }
    return { rows: [], rowCount: 0 };
  }

  async end() {
    console.log('Database connection closed');
  }
}

class MigrationRunner {

  constructor(config) {
    this.config = config;
    this.client = new MockPostgreSQLClient(); // Replace with actual pg.Client in production
    this.migrationsDir = dirname(fileURLToPath(import.meta.url));
  }

  /**
   * Create migrations table to track applied migrations
   */
  async createMigrationsTable() {
    const sql = `
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename TEXT UNIQUE NOT NULL,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        checksum TEXT NOT NULL,
        execution_time_ms INTEGER
      );
      
      CREATE INDEX IF NOT EXISTS migrations_filename_idx ON migrations(filename);
      CREATE INDEX IF NOT EXISTS migrations_applied_at_idx ON migrations(applied_at);
    `;

    await this.client.query(sql);
    console.log('✓ Migrations table ready');
  }

  /**
   * Calculate checksum for migration file
   */
  calculateChecksum(content) {
    // Simple hash implementation for demo - use crypto in production
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Check if migration has already been applied
   */
  async isMigrationApplied(filename) {
    const result = await this.client.query(
      'SELECT id FROM migrations WHERE filename = $1',
      [filename]
    );
    return result.rows.length > 0;
  }

  /**
   * Record migration as applied
   */
  async recordMigration(filename, checksum, executionTime) {
    await this.client.query(
      `INSERT INTO migrations (filename, checksum, execution_time_ms) 
       VALUES ($1, $2, $3)`,
      [filename, checksum, executionTime]
    );
  }

  /**
   * Remove migration record (for rollbacks)
   */
  async removeMigrationRecord(filename) {
    await this.client.query(
      'DELETE FROM migrations WHERE filename = $1',
      [filename]
    );
  }

  /**
   * Run a single migration file
   */
  async runMigration(filename) {
    const filePath = join(this.migrationsDir, filename);
    
    try {
      console.log(`\n📁 Loading migration: ${filename}`);
      const content = await readFile(filePath, 'utf-8');
      const checksum = this.calculateChecksum(content);

      // Check if already applied
      if (await this.isMigrationApplied(filename)) {
        console.log(`⏭️  Migration ${filename} already applied, skipping`);
        return;
      }

      console.log(`⚡ Executing migration: ${filename}`);
      const startTime = Date.now();

      // Execute the migration
      await this.client.query(content);

      const executionTime = Date.now() - startTime;
      
      // Record the migration
      await this.recordMigration(filename, checksum, executionTime);
      
      console.log(`✅ Migration ${filename} completed in ${executionTime}ms`);
    } catch (error) {
      console.error(`❌ Migration ${filename} failed:`, error);
      throw error;
    }
  }

  /**
   * Run rollback migration
   */
  async rollbackMigration(filename) {
    const downFilename = filename.replace('.sql', '-down.sql');
    const filePath = join(this.migrationsDir, downFilename);
    
    try {
      console.log(`\n📁 Loading rollback: ${downFilename}`);
      const content = await readFile(filePath, 'utf-8');

      console.log(`⚡ Executing rollback: ${downFilename}`);
      const startTime = Date.now();

      // Execute the rollback
      await this.client.query(content);

      const executionTime = Date.now() - startTime;
      
      // Remove migration record
      await this.removeMigrationRecord(filename);
      
      console.log(`✅ Rollback ${downFilename} completed in ${executionTime}ms`);
    } catch (error) {
      console.error(`❌ Rollback ${downFilename} failed:`, error);
      throw error;
    }
  }

  /**
   * Run all pending migrations
   */
  async migrate() {
    console.log('🚀 Starting Zero OS Notifications migration...\n');

    try {
      await this.createMigrationsTable();
      
      // List of migrations in order
      const migrations = [
        '001-notifications.sql'
      ];

      let appliedCount = 0;
      for (const migration of migrations) {
        const wasApplied = await this.isMigrationApplied(migration);
        await this.runMigration(migration);
        if (!wasApplied) appliedCount++;
      }

      console.log(`\n🎉 Migration completed! Applied ${appliedCount} new migration(s)`);
      
    } catch (error) {
      console.error('\n💥 Migration failed:', error);
      throw error;
    }
  }

  /**
   * Rollback the last migration
   */
  async rollback() {
    console.log('🔄 Starting rollback...\n');

    try {
      await this.createMigrationsTable();
      
      // Get the most recent migration
      const result = await this.client.query(
        'SELECT filename FROM migrations ORDER BY applied_at DESC LIMIT 1'
      );

      if (result.rows.length === 0) {
        console.log('ℹ️  No migrations to rollback');
        return;
      }

      const latestMigration = result.rows[0].filename;
      await this.rollbackMigration(latestMigration);

      console.log('\n✅ Rollback completed!');
      
    } catch (error) {
      console.error('\n💥 Rollback failed:', error);
      throw error;
    }
  }

  /**
   * Show migration status
   */
  async status() {
    console.log('📊 Migration Status\n');

    try {
      await this.createMigrationsTable();
      
      const result = await this.client.query(
        `SELECT filename, applied_at, execution_time_ms 
         FROM migrations 
         ORDER BY applied_at DESC`
      );

      if (result.rows.length === 0) {
        console.log('ℹ️  No migrations have been applied yet');
        return;
      }

      console.log('Applied migrations:');
      result.rows.forEach((row, index) => {
        const date = new Date(row.applied_at).toLocaleString();
        console.log(`${index + 1}. ${row.filename} (${date}) - ${row.execution_time_ms}ms`);
      });
      
    } catch (error) {
      console.error('\n💥 Status check failed:', error);
      throw error;
    }
  }

  /**
   * Close database connection
   */
  async close() {
    await this.client.end();
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'migrate';

  // Load configuration from environment
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'zero_notifications',
    user: process.env.DB_USER || 'zero_user',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true'
  };

  console.log(`🔧 Database: ${config.host}:${config.port}/${config.database}`);
  console.log(`👤 User: ${config.user}\n`);

  const runner = new MigrationRunner(config);

  try {
    switch (command) {
      case 'migrate':
      case 'up':
        await runner.migrate();
        break;
      
      case 'rollback':
      case 'down':
        await runner.rollback();
        break;
      
      case 'status':
        await runner.status();
        break;
      
      default:
        console.log(`
Usage: node migrate.js [command]

Commands:
  migrate, up     Run all pending migrations
  rollback, down  Rollback the last migration
  status         Show migration status

Environment Variables:
  DB_HOST        Database host (default: localhost)
  DB_PORT        Database port (default: 5432)
  DB_NAME        Database name (default: zero_notifications)
  DB_USER        Database user (default: zero_user)
  DB_PASSWORD    Database password
  DB_SSL         Use SSL connection (default: false)
        `);
    }
  } catch (error) {
    process.exit(1);
  } finally {
    await runner.close();
  }
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { MigrationRunner };