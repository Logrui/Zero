# Zero OS Notifications Database Migrations

This directory contains the database migration system for the Zero OS Notifications feature.

## Quick Start

### Prerequisites
- PostgreSQL 15+ running
- Node.js 18+ installed
- Environment variables configured

### Environment Setup

Create a `.env` file or set environment variables:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=zero_notifications
DB_USER=zero_user
DB_PASSWORD=your_secure_password
DB_SSL=false
```

### Install Dependencies

```bash
cd apps/server/migrations
npm install
```

### Run Migrations

```bash
# Run all pending migrations
npm run migrate

# Check migration status
npm run migrate:status

# Rollback last migration (be careful!)
npm run migrate:rollback
```

## Migration Files

### 001-notifications.sql
The main migration that creates:
- `notifications` table with full schema and constraints
- `api_keys` table for API authentication
- `tags` table for categorization
- Indexes for optimal query performance
- Triggers for automatic timestamp updates
- Functions for data cleanup
- Default seed data (system tags and setup API key)

### 001-notifications-down.sql
Rollback migration that safely removes:
- All tables created by the up migration
- All indexes, triggers, and functions
- Does not affect other database objects

## Migration Runner Features

### Commands

```bash
# Available commands
node migrate.js migrate     # Run all pending migrations
node migrate.js up          # Same as migrate
node migrate.js rollback    # Rollback the last migration
node migrate.js down        # Same as rollback
node migrate.js status      # Show migration status
```

### Safety Features

- **Idempotent**: Migrations can be run multiple times safely
- **Transactional**: Each migration runs in a transaction
- **Checksums**: Validates migration file integrity
- **Tracking**: Records applied migrations with timestamps
- **Rollback**: Safe rollback capability with down migrations

### Migration Tracking

The system creates a `migrations` table to track:
- Which migrations have been applied
- When they were applied
- Execution time
- File checksums for integrity

## Database Schema Overview

### Core Tables

**notifications**
- Primary entity for notification messages
- User-scoped with read status tracking
- Supports tagging and source attribution
- Automatic timestamp management

**api_keys**
- Secure API authentication
- Per-user key management with permissions
- Usage tracking and expiration support
- Key prefix for efficient lookups

**tags**
- Categorization system for notifications
- System and user-defined tags
- Color coding support

### Performance Optimizations

**Indexes**
- Composite index on (user_id, created_at) for user feeds
- GIN index on tags array for fast tag queries
- Unique constraints for data integrity

**Functions**
- Automatic `updated_at` timestamp updates
- Cleanup function for 30-day retention policy

**Views**
- `notification_stats` - System-wide statistics
- `api_key_stats` - API usage analytics

## Seed Data

The migration includes default seed data:

### System Tags
- System, Security, Updates, Maintenance, API (system tags)
- User, Important, Info (user-modifiable tags)

### Setup API Key
- Initial administrative API key for system setup
- **⚠️ SECURITY**: Change the default API key in production!
- Default key hash represents: `setup_key_change_in_production`

## Production Deployment

### Before Deployment

1. **Backup Database**: Always backup before running migrations
   ```bash
   pg_dump -h localhost -U zero_user zero_notifications > backup.sql
   ```

2. **Test in Staging**: Run migrations in a staging environment first

3. **Review SQL**: Examine migration files for any environment-specific changes needed

### Environment Variables

Set these in production:

```env
DB_HOST=your-prod-db-host
DB_PORT=5432
DB_NAME=zero_notifications_prod
DB_USER=zero_user_prod
DB_PASSWORD=very_secure_production_password
DB_SSL=true
```

### Migration Execution

```bash
# In production
cd apps/server/migrations
npm install --production
npm run migrate:status  # Check current state
npm run migrate         # Apply migrations
```

### Post-Migration Tasks

1. **Update API Key**: Replace the default setup API key
2. **Verify Data**: Check that seed data is properly inserted
3. **Performance Check**: Monitor query performance with new indexes
4. **Backup**: Take a fresh backup of the migrated database

## Troubleshooting

### Common Issues

**Connection Errors**
```
Error: Connection refused
```
- Check database is running
- Verify connection parameters
- Ensure user has proper permissions

**Permission Errors**
```
Error: permission denied for table
```
- Grant necessary permissions to database user
- Check if user can create tables and indexes

**Migration Already Applied**
```
Migration 001-notifications.sql already applied, skipping
```
- Normal behavior - migrations are idempotent
- Check `migrations` table for history

### Recovery

**Rollback Issues**
If rollback fails, manually clean up:
```sql
-- Connect as superuser and clean up
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS api_keys CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DELETE FROM migrations WHERE filename = '001-notifications.sql';
```

**Partial Migration Failure**
If migration fails partway through:
```bash
# Check what was created
npm run migrate:status

# If needed, manually rollback and retry
npm run migrate:rollback
npm run migrate
```

## Development

### Adding New Migrations

1. Create new SQL files with sequential numbers:
   - `002-add-feature.sql` (up migration)
   - `002-add-feature-down.sql` (down migration)

2. Update the migrations array in `migrate.js`:
   ```javascript
   const migrations = [
     '001-notifications.sql',
     '002-add-feature.sql'  // Add new migration
   ];
   ```

3. Test thoroughly in development before committing

### Best Practices

- **Small Changes**: Keep migrations focused and small
- **Backwards Compatible**: Avoid breaking changes when possible
- **Test Rollbacks**: Always test down migrations
- **Document Changes**: Include comments explaining complex changes
- **Validate Data**: Add constraints and validation in migrations

## Support

For issues with migrations:
1. Check this README first
2. Review migration logs and error messages
3. Test in a development environment
4. Contact the Zero OS development team

## Files

```
migrations/
├── README.md                     # This file
├── package.json                  # Migration dependencies
├── migrate.js                    # Migration runner script
├── 001-notifications.sql         # Main migration (up)
├── 001-notifications-down.sql    # Rollback migration (down)
└── .env.example                  # Environment template
```