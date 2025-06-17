#!/bin/bash

# Export PostgreSQL Database for Supabase Migration
# This script exports schema and data for Vercel + Supabase deployment

echo "🚀 Exporting TARL Insight Hub Database for Supabase"
echo "=================================================="

# Create export directory
mkdir -p supabase-export
cd supabase-export

# Export schema with custom approach (avoiding version mismatch)
echo "📋 Exporting database schema..."
PGPASSWORD=12345 psql -U postgres -h localhost -d pratham_tarl -c "
-- Export table creation statements
SELECT 
    'CREATE TABLE ' || schemaname || '.' || tablename || ' (' ||
    string_agg(
        column_name || ' ' || data_type ||
        CASE 
            WHEN character_maximum_length IS NOT NULL 
            THEN '(' || character_maximum_length || ')'
            WHEN numeric_precision IS NOT NULL AND numeric_scale IS NOT NULL
            THEN '(' || numeric_precision || ',' || numeric_scale || ')'
            ELSE ''
        END ||
        CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END,
        ', '
    ) || ');'
FROM information_schema.tables t
JOIN information_schema.columns c ON c.table_name = t.tablename AND c.table_schema = t.schemaname
WHERE schemaname = 'public' 
GROUP BY schemaname, tablename
ORDER BY tablename;
" > schema_info.sql

echo "✅ Schema export completed"

# Export core tables data
echo "📊 Exporting table data..."

# Export users and roles
PGPASSWORD=12345 psql -U postgres -h localhost -d pratham_tarl -c "\copy tbl_tarl_users TO 'users.csv' WITH CSV HEADER"
PGPASSWORD=12345 psql -U postgres -h localhost -d pratham_tarl -c "\copy tbl_tarl_roles TO 'roles.csv' WITH CSV HEADER"

# Export permissions
PGPASSWORD=12345 psql -U postgres -h localhost -d pratham_tarl -c "\copy page_permissions TO 'page_permissions.csv' WITH CSV HEADER"
PGPASSWORD=12345 psql -U postgres -h localhost -d pratham_tarl -c "\copy role_page_permissions TO 'role_page_permissions.csv' WITH CSV HEADER"
PGPASSWORD=12345 psql -U postgres -h localhost -d pratham_tarl -c "\copy page_action_permissions TO 'page_action_permissions.csv' WITH CSV HEADER"

# Export geographic data
PGPASSWORD=12345 psql -U postgres -h localhost -d pratham_tarl -c "\copy tbl_tarl_countries TO 'countries.csv' WITH CSV HEADER"
PGPASSWORD=12345 psql -U postgres -h localhost -d pratham_tarl -c "\copy tbl_tarl_zones TO 'zones.csv' WITH CSV HEADER"
PGPASSWORD=12345 psql -U postgres -h localhost -d pratham_tarl -c "\copy tbl_tarl_provinces TO 'provinces.csv' WITH CSV HEADER"
PGPASSWORD=12345 psql -U postgres -h localhost -d pratham_tarl -c "\copy tbl_tarl_districts TO 'districts.csv' WITH CSV HEADER"
PGPASSWORD=12345 psql -U postgres -h localhost -d pratham_tarl -c "\copy tbl_tarl_communes TO 'communes.csv' WITH CSV HEADER"
PGPASSWORD=12345 psql -U postgres -h localhost -d pratham_tarl -c "\copy tbl_tarl_villages TO 'villages.csv' WITH CSV HEADER"

# Export schools and education data
PGPASSWORD=12345 psql -U postgres -h localhost -d pratham_tarl -c "\copy tbl_tarl_schools TO 'schools.csv' WITH CSV HEADER"
PGPASSWORD=12345 psql -U postgres -h localhost -d pratham_tarl -c "\copy tbl_tarl_classes TO 'classes.csv' WITH CSV HEADER"
PGPASSWORD=12345 psql -U postgres -h localhost -d pratham_tarl -c "\copy tbl_tarl_students TO 'students.csv' WITH CSV HEADER"
PGPASSWORD=12345 psql -U postgres -h localhost -d pratham_tarl -c "\copy tbl_tarl_subjects TO 'subjects.csv' WITH CSV HEADER"

# Export training data
PGPASSWORD=12345 psql -U postgres -h localhost -d pratham_tarl -c "\copy tbl_tarl_training_programs TO 'training_programs.csv' WITH CSV HEADER"
PGPASSWORD=12345 psql -U postgres -h localhost -d pratham_tarl -c "\copy tbl_tarl_training_sessions TO 'training_sessions.csv' WITH CSV HEADER"
PGPASSWORD=12345 psql -U postgres -h localhost -d pratham_tarl -c "\copy tbl_tarl_training_participants TO 'training_participants.csv' WITH CSV HEADER"
PGPASSWORD=12345 psql -U postgres -h localhost -d pratham_tarl -c "\copy tbl_tarl_training_feedback TO 'training_feedback.csv' WITH CSV HEADER"
PGPASSWORD=12345 psql -U postgres -h localhost -d pratham_tarl -c "\copy tbl_tarl_qr_codes TO 'qr_codes.csv' WITH CSV HEADER"

# Export system configuration
PGPASSWORD=12345 psql -U postgres -h localhost -d pratham_tarl -c "\copy user_sessions TO 'user_sessions.csv' WITH CSV HEADER"
PGPASSWORD=12345 psql -U postgres -h localhost -d pratham_tarl -c "\copy user_menu_order TO 'user_menu_order.csv' WITH CSV HEADER"

echo "✅ Data export completed"
echo "📁 Files exported to supabase-export directory"
echo "🎯 Ready for Supabase import"

cd ..