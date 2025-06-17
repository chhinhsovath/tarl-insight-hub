# 🚀 Supabase Migration Guide

This directory contains all necessary files to migrate the TARL Insight Hub database to Supabase for Vercel deployment.

## 📋 Files Overview

### Schema
- **`schema.sql`** - Complete database schema with all tables, indexes, and constraints
- **`data-import.sql`** - Core data including roles, permissions, users, and geographic data

### Data Export (Optional)
- **`csv-data/`** - Directory containing CSV exports from local database
- **`export-script.sh`** - Script to export additional data from PostgreSQL

## 🔧 Migration Steps

### 1. Create Supabase Project
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Create new project: `tarl-insight-hub`
3. Choose a strong password
4. Wait for project to be ready

### 2. Import Schema
1. Go to SQL Editor in Supabase dashboard
2. Copy contents of `schema.sql`
3. Click "Run" to create all tables

### 3. Import Core Data
1. In SQL Editor, copy contents of `data-import.sql`
2. Click "Run" to insert core data
3. Verify data was imported correctly

### 4. Verify Import
```sql
-- Check tables were created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check users were imported
SELECT username, role, full_name FROM tbl_tarl_users;

-- Check permissions were imported
SELECT COUNT(*) as permission_count FROM role_page_permissions;
SELECT COUNT(*) as action_count FROM page_action_permissions;
```

## 👥 Default User Accounts

After importing, these test accounts will be available:

| Username | Role | Password | Email |
|----------|------|----------|-------|
| admin | admin | password123 | admin@tarl.org |
| director1 | director | password123 | director1@tarl.org |
| partner1 | partner | password123 | partner1@tarl.org |
| coordinator1 | coordinator | password123 | coordinator1@tarl.org |
| teacher1 | teacher | password123 | teacher1@tarl.org |
| collector1 | collector | password123 | collector1@tarl.org |
| intern1 | intern | password123 | intern1@tarl.org |

**⚠️ Important**: Change these passwords in production!

## 🔧 Connection Details

After migration, update your Vercel environment variables:

```bash
PGUSER=postgres
PGHOST=db.[your-project-ref].supabase.co
PGDATABASE=postgres
PGPASSWORD=[your-supabase-password]
PGPORT=5432
```

## 📊 What's Included

### Geographic Data
- ✅ Countries (Cambodia)
- ✅ Zones (6 zones)
- ✅ Provinces (25 provinces)
- ✅ Districts (sample data)
- ✅ Communes (sample data)

### Permission System
- ✅ 8 User roles with hierarchy
- ✅ 19 Page permissions
- ✅ 177 Role-page permissions
- ✅ 365+ Action permissions
- ✅ Training module permissions

### User Accounts
- ✅ 7 Test users (one per role)
- ✅ Proper role assignments
- ✅ Valid email addresses

### Training System
- ✅ Database structure ready
- ✅ Permission system configured
- ✅ Sample data can be added later

## 🛠️ Troubleshooting

### Common Issues

1. **Foreign Key Errors**
   - Run schema.sql first, then data-import.sql
   - Check that referenced tables exist

2. **Sequence Errors**
   - The data-import.sql includes sequence resets
   - If issues persist, manually reset sequences

3. **Permission Errors**
   - Verify all roles were imported first
   - Check page_permissions table exists

### Verification Queries

```sql
-- Check all tables exist
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';

-- Verify users and roles
SELECT u.username, u.role, r.hierarchy_level 
FROM tbl_tarl_users u 
JOIN tbl_tarl_roles r ON u.role = r.name;

-- Test permission system
SELECT COUNT(*) as total_permissions FROM role_page_permissions WHERE is_allowed = true;

-- Check training permissions
SELECT role, action_name, COUNT(*) 
FROM page_action_permissions pap
JOIN page_permissions pp ON pap.page_id = pp.id
WHERE pp.page_name LIKE '%បណ្តុះបណ្តាល%'
GROUP BY role, action_name;
```

## 🔄 Additional Data (Optional)

If you need to import additional data from your local PostgreSQL:

1. Use the CSV files in `csv-data/` directory
2. Import via Supabase dashboard or psql
3. Ensure foreign key relationships are maintained

## ✅ Migration Checklist

- [ ] Supabase project created
- [ ] Schema imported successfully
- [ ] Core data imported
- [ ] Test accounts working
- [ ] Permission system functional
- [ ] Environment variables configured
- [ ] Vercel deployment tested

## 🚀 Next Steps

1. Deploy to Vercel with Supabase connection
2. Test all functionality
3. Change default passwords
4. Add production data
5. Configure domain and SSL
6. Set up monitoring and backups

Your TARL Insight Hub is now ready for production! 🎉