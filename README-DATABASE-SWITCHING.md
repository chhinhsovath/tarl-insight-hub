# Database Switching Guide

You now have a dual database setup that allows you to work with both local PostgreSQL and Neon cloud database.

## Quick Setup

### 🔄 Easy Database Switching

Use the database switcher script:

```bash
./switch-database.sh
```

This interactive script lets you:
- Switch to local PostgreSQL
- Switch to Neon cloud database  
- View current configuration
- Test database connections

### 📁 Configuration Files

- `.env.local.postgres` - Local PostgreSQL configuration
- `.env.local.neon` - Neon cloud database configuration
- `.env.local` - Active configuration (gets overwritten by switcher)

### 🎯 Manual Switching

#### Switch to Local PostgreSQL:
```bash
cp .env.local.postgres .env.local
npm run dev
```

#### Switch to Neon Cloud:
```bash
cp .env.local.neon .env.local
npm run dev
```

## Database Information

### Local PostgreSQL
- **Host**: localhost:5432
- **Database**: pratham_tarl
- **User**: postgres
- **Password**: 12345
- **Tables**: 71 tables
- **Use for**: Local development, testing, offline work

### Neon Cloud Database
- **Host**: ep-bold-sun-a55wq826-pooler.us-east-2.aws.neon.tech
- **Database**: neondb
- **User**: neondb_owner
- **Tables**: 71 tables (synced from local)
- **Use for**: Production testing, cloud development

## Testing Connections

### Test Local PostgreSQL:
```bash
PGPASSWORD="12345" psql -h localhost -p 5432 -U postgres -d pratham_tarl -c "SELECT version();"
```

### Test Neon Database:
```bash
PGPASSWORD="npg_U9lFscTri3yk" psql --host=ep-bold-sun-a55wq826-pooler.us-east-2.aws.neon.tech --port=5432 --username=neondb_owner --dbname=neondb --command="SELECT version();"
```

### Test Application Connection:
```bash
# Start your dev server
npm run dev

# Test in another terminal
curl http://localhost:3000/api/test-db
```

## Workflow Recommendations

### For Local Development:
1. Use local PostgreSQL for daily development
2. Make database changes locally first
3. Test thoroughly with local data

### For Production Testing:
1. Switch to Neon database
2. Test with production-like data
3. Verify cloud compatibility

### For Deployment:
- Vercel automatically uses Neon database (configured in .env.production)
- No changes needed for deployment

## Synchronization

If you make schema changes locally and want to sync to Neon:

```bash
# Create backup of local changes
pg_dump -h localhost -p 5432 -U postgres -d pratham_tarl -f local_changes.sql

# Apply to Neon
PGPASSWORD="npg_U9lFscTri3yk" psql --host=ep-bold-sun-a55wq826-pooler.us-east-2.aws.neon.tech --port=5432 --username=neondb_owner --dbname=neondb --file=local_changes.sql
```

## Troubleshooting

### PostgreSQL Service Issues:
```bash
# Check service status
brew services list | grep postgresql

# Restart service
brew services restart postgresql@14

# Start if stopped
brew services start postgresql@14
```

### Connection Issues:
1. Check if the database service is running
2. Verify credentials in environment files
3. Test connection using the switcher script
4. Restart your development server after switching

## Admin Credentials

Both databases have the same admin user:
- **Username**: admin1
- **Password**: admin123

This works for both local and Neon databases since we migrated the complete user data.