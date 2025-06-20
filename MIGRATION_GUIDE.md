# Local PostgreSQL to Neon Migration Guide

This guide will help you migrate all your data from your local PostgreSQL database to Neon.tech.

## 🚨 Important Warning

**This process will DELETE ALL TABLES in your Neon database and replace them with your local data.**

## Prerequisites

✅ Local PostgreSQL running with database: `pratham_tarl`  
✅ Neon.tech database configured  
✅ Both databases accessible  
✅ Node.js installed  

## Quick Migration (Recommended)

Run the complete migration script that handles everything:

```bash
npm run migrate:to-neon
```

This will:
1. 📦 Create a backup of your Neon database
2. 🧹 Clean the Neon database (delete all tables)
3. 📥 Export all data from local PostgreSQL
4. 📤 Import all data to Neon
5. 🔄 Switch your environment to use Neon
6. ✅ Verify the migration

## Step-by-Step Migration

If you prefer to run each step manually:

### 1. Backup Neon Database (Optional but Recommended)

```bash
npm run backup:neon
```

### 2. Migrate Data

```bash
npm run migrate:local-to-neon
```

### 3. Switch Environment

After successful migration, copy Neon environment:
```bash
cp .env.local.neon .env.local
```

## Database Configurations

### Local PostgreSQL (Current)
- Host: localhost
- Database: pratham_tarl
- User: postgres
- Port: 5432

### Neon Database (Target)
- Host: ep-bold-sun-a55wq826-pooler.us-east-2.aws.neon.tech
- Database: neondb
- User: neondb_owner

## Environment Files

- `.env.local` - Currently active environment
- `.env.local.neon` - Neon configuration
- `.env.local.postgres` - Local PostgreSQL configuration
- `.env.local.backup` - Backup of current config (created during migration)

## What Gets Migrated

✅ All table structures  
✅ All data (INSERT statements)  
✅ Basic constraints  
✅ Indexes (basic)  

❌ Complex stored procedures  
❌ Triggers  
❌ Custom functions  

## Troubleshooting

### Connection Issues

If you get connection errors:

1. **Local PostgreSQL**: Ensure PostgreSQL is running
   ```bash
   brew services start postgresql
   # or
   pg_ctl -D /usr/local/var/postgres start
   ```

2. **Neon**: Check internet connection and credentials

### Migration Fails

1. Check the error message
2. Verify database connections
3. Look at backup files in `scripts/` directory
4. Restore from backup if needed

### Rolling Back

To switch back to local PostgreSQL:
```bash
cp .env.local.backup .env.local
```

## Files Created During Migration

- `scripts/neon_backup_TIMESTAMP.sql` - Neon database backup
- `scripts/local_database_export.sql` - Local database export
- `.env.local.backup` - Environment backup

## Post-Migration Steps

1. 🔄 Restart your development server
2. 🧪 Test your application thoroughly
3. 📋 Update deployment configurations
4. 🗑️ Remove backup files when satisfied
5. 🚀 Deploy with Neon configuration

## Verification

The migration script will show:
- Number of tables migrated
- Row counts for each table
- Any warnings or errors
- Connection test results

## Support

If you encounter issues:
1. Check the console output for specific errors
2. Verify your database credentials
3. Ensure both databases are accessible
4. Check the backup files for data integrity

## Security Notes

🔒 Environment files contain sensitive credentials  
🔒 Backup files may contain sensitive data  
🔒 Remove backup files from version control  
🔒 Never commit actual credentials to Git  

---

**Happy Migrating! 🚀**