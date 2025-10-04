-- Insert a test API key for development
-- This creates a valid API key that can be used with the notifications API

-- First, create a test user if it doesn't exist
INSERT INTO "user" (id, email, name, "emailVerified", image, "createdAt", "updatedAt")
VALUES (
  'test-user-123',
  'test@example.com',
  'Test User',
  true,
  null,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Insert the test API key
-- The keyHash is SHA-256 hash of: zro_test_dev_key_1234567890abcdef
INSERT INTO api_keys (
  id,
  "userId",
  name,
  "keyHash",
  "keyPrefix",
  permissions,
  "isActive",
  "createdAt",
  "updatedAt"
)
VALUES (
  gen_random_uuid(),
  'test-user-123',
  'Development Test Key',
  'b5a2c96250612366ea272ffac6d9744aaf4b45aacd96aa7cfcb931ee3b558259',  -- Hash of zro_test_dev_key_1234567890abcdef
  'zro_test',
  ARRAY['*']::text[],  -- All permissions
  true,
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;

-- Verify the insertion
SELECT 
  id,
  "userId",
  name,
  "keyPrefix",
  permissions,
  "isActive",
  "createdAt"
FROM api_keys
WHERE "userId" = 'test-user-123';
