-- Down Migration: 001-notifications-down.sql
-- Description: Rollback Zero OS Notifications System tables
-- Created: 2025-09-27
-- Version: 1.0.0

-- Warning: This will permanently delete all notification data!
-- Only run this if you are certain you want to completely remove the notifications system.

DO $$
BEGIN
    RAISE NOTICE 'Starting rollback of Zero OS Notifications System...';
    RAISE NOTICE 'WARNING: This will permanently delete all notification data!';
END $$;

-- Drop views first (they depend on tables)
DROP VIEW IF EXISTS notification_stats;
DROP VIEW IF EXISTS api_key_stats;

-- Drop triggers
DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS cleanup_old_notifications();

-- Remove foreign key constraints first
ALTER TABLE IF EXISTS notifications DROP CONSTRAINT IF EXISTS fk_notifications_api_key;

-- Drop indexes (PostgreSQL will automatically drop them with tables, but being explicit)
DROP INDEX IF EXISTS notifications_user_created_idx;
DROP INDEX IF EXISTS notifications_uuid_idx;
DROP INDEX IF EXISTS notifications_read_status_idx;
DROP INDEX IF EXISTS notifications_source_idx;
DROP INDEX IF EXISTS notifications_tags_gin_idx;
DROP INDEX IF EXISTS api_keys_user_name_idx;
DROP INDEX IF EXISTS api_keys_prefix_idx;
DROP INDEX IF EXISTS api_keys_user_active_idx;
DROP INDEX IF EXISTS api_keys_expires_at_idx;
DROP INDEX IF EXISTS tags_name_idx;
DROP INDEX IF EXISTS tags_system_idx;
DROP INDEX IF EXISTS cleanup_log_date_idx;

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS api_keys CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS cleanup_log CASCADE;

-- Note: We don't drop the uuid-ossp extension as it might be used by other parts of the system

-- Revoke permissions (if needed)
-- REVOKE ALL ON notifications FROM zero_user;
-- REVOKE ALL ON api_keys FROM zero_user;
-- REVOKE ALL ON tags FROM zero_user;
-- REVOKE ALL ON cleanup_log FROM zero_user;

-- Output rollback status
DO $$
BEGIN
    RAISE NOTICE 'Rollback completed successfully!';
    RAISE NOTICE 'All notifications system tables, indexes, and functions have been removed';
    RAISE NOTICE 'The database has been restored to its pre-notifications state';
END $$;