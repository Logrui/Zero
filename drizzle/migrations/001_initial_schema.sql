-- Migration: 001_initial_schema.sql
-- Description: Create initial tables for notifications system
-- Created: 2024-01-01

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (if not exists from auth system)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- API Keys table
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    key_hash VARCHAR(255) NOT NULL UNIQUE,
    key_prefix VARCHAR(20) NOT NULL,
    permissions TEXT[] DEFAULT ARRAY['notifications:create', 'notifications:read'],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    channel VARCHAR(20) DEFAULT 'system' CHECK (channel IN ('system', 'email', 'push', 'sms')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'read', 'archived')),
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    metadata JSONB DEFAULT '{}'::jsonb,
    scheduled_for TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    error_message TEXT
);

-- Notification Events table (for tracking state changes)
CREATE TABLE IF NOT EXISTS notification_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_created_at ON api_keys(created_at);
CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON api_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_api_keys_expires_at ON api_keys(expires_at);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_api_key_id ON notifications(api_key_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_channel ON notifications(channel);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled_for ON notifications(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON notifications(expires_at);
CREATE INDEX IF NOT EXISTS idx_notifications_tags ON notifications USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_notifications_metadata ON notifications USING GIN(metadata);

CREATE INDEX IF NOT EXISTS idx_notification_events_notification_id ON notification_events(notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_events_event_type ON notification_events(event_type);
CREATE INDEX IF NOT EXISTS idx_notification_events_created_at ON notification_events(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically log notification events
CREATE OR REPLACE FUNCTION log_notification_event()
RETURNS TRIGGER AS $$
BEGIN
    -- Log status changes
    IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO notification_events (notification_id, event_type, event_data)
        VALUES (NEW.id, 'status_changed', jsonb_build_object(
            'old_status', OLD.status,
            'new_status', NEW.status,
            'changed_at', NOW()
        ));
    END IF;
    
    -- Log when notification is read
    IF TG_OP = 'UPDATE' AND OLD.read_at IS NULL AND NEW.read_at IS NOT NULL THEN
        INSERT INTO notification_events (notification_id, event_type, event_data)
        VALUES (NEW.id, 'read', jsonb_build_object(
            'read_at', NEW.read_at
        ));
    END IF;
    
    -- Log when notification is sent
    IF TG_OP = 'UPDATE' AND OLD.sent_at IS NULL AND NEW.sent_at IS NOT NULL THEN
        INSERT INTO notification_events (notification_id, event_type, event_data)
        VALUES (NEW.id, 'sent', jsonb_build_object(
            'sent_at', NEW.sent_at,
            'channel', NEW.channel
        ));
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply notification event logging trigger
CREATE TRIGGER log_notification_changes AFTER UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION log_notification_event();

-- Create views for common queries
CREATE OR REPLACE VIEW active_notifications AS
SELECT 
    n.*,
    u.email as user_email,
    u.name as user_name,
    ak.name as api_key_name
FROM notifications n
JOIN users u ON n.user_id = u.id
LEFT JOIN api_keys ak ON n.api_key_id = ak.id
WHERE n.status NOT IN ('archived')
  AND (n.expires_at IS NULL OR n.expires_at > NOW());

CREATE OR REPLACE VIEW notification_stats AS
SELECT 
    user_id,
    COUNT(*) as total_notifications,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
    COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent_count,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count,
    COUNT(CASE WHEN status = 'read' THEN 1 END) as read_count,
    COUNT(CASE WHEN read_at IS NULL AND status = 'sent' THEN 1 END) as unread_count,
    MAX(created_at) as last_notification_at
FROM notifications
WHERE status NOT IN ('archived')
GROUP BY user_id;

-- Add comments for documentation
COMMENT ON TABLE users IS 'User accounts in the system';
COMMENT ON TABLE api_keys IS 'API keys for external integrations';
COMMENT ON TABLE notifications IS 'All notifications in the system';
COMMENT ON TABLE notification_events IS 'Event log for notification state changes';

COMMENT ON COLUMN notifications.retry_count IS 'Number of retry attempts made';
COMMENT ON COLUMN notifications.max_retries IS 'Maximum number of retries allowed';
COMMENT ON COLUMN notifications.metadata IS 'Additional data stored as JSON';
COMMENT ON COLUMN api_keys.permissions IS 'Array of permission strings';
COMMENT ON COLUMN api_keys.key_hash IS 'Hashed version of the API key for security';
COMMENT ON COLUMN api_keys.key_prefix IS 'First few characters of key for display';