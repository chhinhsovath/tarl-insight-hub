# Manual Production Database Update Instructions

## 🚨 IMPORTANT: Complete Database Synchronization Required

The production database on openplp.com needs to be manually updated to ensure all training system tables and latest schema changes are applied.

## Steps to Update Production Database:

### 1. Connect to Production Database
```bash
# Use your production database credentials
psql "your_production_database_url_here"
```

### 2. Apply Database Schema Updates (in order)

#### A. Master Schema
```sql
\i scripts/99_master_schema.sql
```

#### B. Training Management Schema  
```sql
\i scripts/training_management_schema.sql
```

#### C. Comprehensive Production Sync
```sql
\i scripts/sync-production-database.sql
```

### 3. Verify Critical Tables Exist

Run this query to check all required tables are present:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'tbl_tarl_%' 
  OR table_name IN ('page_permissions', 'role_page_permissions', 'page_action_permissions')
ORDER BY table_name;
```

Expected tables include:
- `tbl_tarl_training_programs`
- `tbl_tarl_training_sessions` 
- `tbl_tarl_training_participants`
- `tbl_tarl_training_materials`
- `tbl_tarl_training_feedback`
- `tbl_tarl_training_flow`
- `tbl_tarl_qr_codes`
- `tbl_tarl_qr_usage_log`
- `tbl_tarl_training_registrations`
- `page_permissions`
- `role_page_permissions`
- `page_action_permissions`
- `user_menu_order`
- `tbl_tarl_sessions`

### 4. Test Training APIs

After database update, test the training endpoints:

```bash
# Test (should return 401 with authentication error - this is correct)
curl "https://www.openplp.com/api/training/programs"
curl "https://www.openplp.com/api/training/sessions" 
curl "https://www.openplp.com/api/training/participants"
```

### 5. Insert Sample Data (Optional)

If you want to test with sample data:

```sql
-- Insert sample training program
INSERT INTO tbl_tarl_training_programs (program_name, description, program_type, duration_hours, created_by)
SELECT 
    'TaRL Teaching Methodology Workshop',
    'Comprehensive workshop on Teaching at the Right Level methodology for educators',
    'workshop',
    8,
    id
FROM tbl_tarl_users 
WHERE role = 'admin' 
LIMIT 1
ON CONFLICT DO NOTHING;
```

## 🎯 What This Update Provides:

1. **Complete Training System**: All CRUD operations for programs, sessions, participants, feedback, materials
2. **QR Code Functionality**: Generate and track QR codes for registration, attendance, feedback
3. **Three-Stage Training Flow**: Before/During/After workflow management
4. **Permission System**: Role-based access control for all training features
5. **Session Management**: Proper authentication and authorization
6. **Performance Optimization**: Indexes and query optimizations

## 🚀 Deployment Status:

✅ **Code Deployed**: Latest code is live on openplp.com  
⏳ **Database Update**: Needs manual schema application  
✅ **API Endpoints**: Working with proper authentication  

## 📞 Next Steps:

1. Apply the database schema updates using the scripts above
2. Test login and training system functionality
3. Verify all CRUD operations work as expected
4. Check that the global loading system and language switching work properly

Once database is updated, the complete training system will be fully functional on production!