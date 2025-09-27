-- Migration: 001-notifications.sql
-- Description: Create tables for Zero OS Notifications System
-- Created: 2025-09-27
-- Version: 1.0.0

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    subject TEXT NOT NULL CHECK (length(subject) <= 200 AND length(subject) > 0),
    body TEXT NOT NULL CHECK (length(body) <= 2000 AND length(body) > 0),
    tags TEXT[] NOT NULL CHECK (array_length(tags, 1) > 0),
    source TEXT NOT NULL CHECK (source IN ('internal', 'api')),
    api_key_id UUID,
    read_status BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create api_keys table
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    name TEXT NOT NULL CHECK (length(name) >= 1 AND length(name) <= 30),
    key_hash TEXT NOT NULL,
    key_prefix TEXT NOT NULL CHECK (length(key_prefix) = 8),
    permissions TEXT[] DEFAULT ARRAY['notifications:create']::TEXT[],
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE
);

-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL CHECK (length(name) >= 1 AND length(name) <= 30),
    color TEXT NOT NULL CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
    description TEXT CHECK (length(description) <= 100),
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraints
ALTER TABLE notifications 
ADD CONSTRAINT fk_notifications_api_key 
FOREIGN KEY (api_key_id) REFERENCES api_keys(id) ON DELETE SET NULL;

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS notifications_user_created_idx 
ON notifications(user_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS notifications_uuid_idx 
ON notifications(id);

CREATE INDEX IF NOT EXISTS notifications_read_status_idx 
ON notifications(read_status, created_at DESC);

CREATE INDEX IF NOT EXISTS notifications_source_idx 
ON notifications(source);

CREATE INDEX IF NOT EXISTS notifications_tags_gin_idx 
ON notifications USING GIN(tags);

CREATE UNIQUE INDEX IF NOT EXISTS api_keys_user_name_idx 
ON api_keys(user_id, name);

CREATE INDEX IF NOT EXISTS api_keys_prefix_idx 
ON api_keys(key_prefix);

CREATE INDEX IF NOT EXISTS api_keys_user_active_idx 
ON api_keys(user_id, is_active);

CREATE INDEX IF NOT EXISTS api_keys_expires_at_idx 
ON api_keys(expires_at) WHERE expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS tags_name_idx 
ON tags(name);

CREATE INDEX IF NOT EXISTS tags_system_idx 
ON tags(is_system);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for notifications table
DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;
CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function for cleanup of old notifications (30-day retention)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM notifications 
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    INSERT INTO cleanup_log (table_name, deleted_count, cleanup_date)
    VALUES ('notifications', deleted_count, NOW())
    ON CONFLICT DO NOTHING;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create cleanup log table
CREATE TABLE IF NOT EXISTS cleanup_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name TEXT NOT NULL,
    deleted_count INTEGER NOT NULL,
    cleanup_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for cleanup log
CREATE INDEX IF NOT EXISTS cleanup_log_date_idx 
ON cleanup_log(cleanup_date DESC);

-- Insert default system tags
INSERT INTO tags (name, color, description, is_system) VALUES
    ('System', '#3B82F6', 'System-generated notifications', TRUE),
    ('Security', '#EF4444', 'Security-related alerts and notifications', TRUE),
    ('Updates', '#10B981', 'Software updates and version changes', TRUE),
    ('Maintenance', '#F59E0B', 'Scheduled maintenance and downtime notices', TRUE),
    ('API', '#8B5CF6', 'API-related notifications and alerts', TRUE),
    ('User', '#06B6D4', 'User-generated or user-specific notifications', FALSE),
    ('Important', '#F97316', 'High-priority notifications requiring attention', FALSE),
    ('Info', '#6B7280', 'General informational notifications', FALSE)
ON CONFLICT (name) DO NOTHING;

-- Create sample admin API key (for initial setup - replace in production)
INSERT INTO api_keys (user_id, name, key_hash, key_prefix, permissions, is_active) VALUES
    ('system', 'Initial Setup Key', 
     '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewdBfrMAar/X1/1C', -- Hash of 'setup_key_change_in_production'
     'zr_setup', 
     ARRAY['notifications:create', 'notifications:read', 'notifications:update', 'notifications:delete', 'api-keys:manage']::TEXT[], 
     TRUE)
ON CONFLICT (user_id, name) DO NOTHING;

-- Create database stats view for monitoring
CREATE OR REPLACE VIEW notification_stats AS
SELECT 
    COUNT(*) as total_notifications,
    COUNT(*) FILTER (WHERE read_status = FALSE) as unread_count,
    COUNT(*) FILTER (WHERE read_status = TRUE) as read_count,
    COUNT(*) FILTER (WHERE source = 'api') as api_notifications,
    COUNT(*) FILTER (WHERE source = 'internal') as internal_notifications,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as notifications_last_24h,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as notifications_last_week,
    AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_time_to_read_seconds
FROM notifications;

-- Create API key usage stats view
CREATE OR REPLACE VIEW api_key_stats AS
SELECT 
    ak.id,
    ak.name,
    ak.user_id,
    ak.key_prefix,
    ak.is_active,
    ak.created_at,
    ak.last_used_at,
    ak.expires_at,
    COUNT(n.id) as notifications_created,
    COUNT(n.id) FILTER (WHERE n.created_at > NOW() - INTERVAL '24 hours') as notifications_last_24h
FROM api_keys ak
LEFT JOIN notifications n ON ak.id = n.api_key_id
GROUP BY ak.id, ak.name, ak.user_id, ak.key_prefix, ak.is_active, ak.created_at, ak.last_used_at, ak.expires_at;

-- Grant appropriate permissions (adjust for your user setup)
GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO zero_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON api_keys TO zero_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON tags TO zero_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON cleanup_log TO zero_user;
GRANT SELECT ON notification_stats TO zero_user;
GRANT SELECT ON api_key_stats TO zero_user;
GRANT USAGE ON SCHEMA public TO zero_user;

-- Create notification for successful migration
INSERT INTO notifications (user_id, subject, body, tags, source) VALUES
    ('system', 
     'Zero OS Notifications System Initialized', 
     'The notifications database has been successfully set up with all tables, indexes, and default data. The system is ready for use.',
     ARRAY['System', 'Setup']::TEXT[],
     'internal')
ON CONFLICT DO NOTHING;

-- Output migration status
DO $$
DECLARE
    notification_count INTEGER;
    api_key_count INTEGER;
    tag_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO notification_count FROM notifications;
    SELECT COUNT(*) INTO api_key_count FROM api_keys;
    SELECT COUNT(*) INTO tag_count FROM tags;
    
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'Created % notifications', notification_count;
    RAISE NOTICE 'Created % API keys', api_key_count;
    RAISE NOTICE 'Created % tags', tag_count;
    RAISE NOTICE 'All indexes and constraints have been applied';
END $$;