-- Insert a test notification directly into the database
-- This bypasses the API endpoint routing issue

INSERT INTO notifications (
  id,
  "userId",
  subject,
  body,
  tags,
  priority,
  source,
  "readStatus",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid(),
  'test-user-id',  -- Replace with actual user ID if you have one
  'Test Notification from Cascade AI - Direct Database Insert',
  'This is a test notification inserted directly into the PostgreSQL database to verify the notifications system is working correctly. The UI should display this notification!',
  ARRAY['Test', 'Database', 'Cascade', 'Demo'],
  'high',
  'api',
  false,
  NOW(),
  NOW()
);

-- Verify the insertion
SELECT 
  id,
  subject,
  priority,
  tags,
  "createdAt"
FROM notifications
ORDER BY "createdAt" DESC
LIMIT 5;
