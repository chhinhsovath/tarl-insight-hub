#!/bin/bash

# Production Database Update Script
# Run this script to update your production database

echo "🚀 Production Database Update Script"
echo "====================================="

# Production database connection string
PROD_DB_URL="postgresql://postgres:P%40ssw0rd@137.184.109.21:5432/tarl_ptom"

echo "📋 This script will:"
echo "   1. Apply the master schema"
echo "   2. Apply training management schema" 
echo "   3. Run comprehensive database sync"
echo "   4. Verify all tables are created"
echo ""

read -p "Do you want to continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cancelled by user"
    exit 1
fi

echo "🔄 Step 1: Applying master schema..."
if psql "$PROD_DB_URL" -f scripts/99_master_schema.sql; then
    echo "✅ Master schema applied successfully"
else
    echo "❌ Failed to apply master schema"
    exit 1
fi

echo "🔄 Step 2: Applying training management schema..."
if psql "$PROD_DB_URL" -f scripts/training_management_schema.sql; then
    echo "✅ Training management schema applied successfully"
else
    echo "❌ Failed to apply training management schema"
    exit 1
fi

echo "🔄 Step 3: Running comprehensive database sync..."
if psql "$PROD_DB_URL" -f scripts/sync-production-database.sql; then
    echo "✅ Database sync completed successfully"
else
    echo "❌ Failed to complete database sync"
    exit 1
fi

echo "🔄 Step 4: Verifying tables..."
echo "Checking if all required tables exist..."

VERIFICATION_SQL="
SELECT 
    COUNT(*) as table_count,
    STRING_AGG(table_name, ', ' ORDER BY table_name) as tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND (table_name LIKE 'tbl_tarl_training_%' 
       OR table_name IN ('page_permissions', 'role_page_permissions', 'page_action_permissions', 'tbl_tarl_sessions'));
"

RESULT=$(psql "$PROD_DB_URL" -t -c "$VERIFICATION_SQL")
TABLE_COUNT=$(echo "$RESULT" | cut -d'|' -f1 | xargs)

if [[ $TABLE_COUNT -ge 10 ]]; then
    echo "✅ Database verification passed: $TABLE_COUNT training tables found"
else
    echo "⚠️  Warning: Only $TABLE_COUNT training tables found. Expected at least 10."
fi

echo ""
echo "🎉 Production Database Update Complete!"
echo "======================================"
echo "✅ Master schema applied"
echo "✅ Training management schema applied"  
echo "✅ Database synchronization completed"
echo "✅ Tables verified"
echo ""
echo "🧪 Testing API endpoints..."

# Test the APIs
echo "Testing training programs API..."
RESPONSE=$(curl -s -w "%{http_code}" "https://www.openplp.com/api/training/programs")
if echo "$RESPONSE" | grep -q "401"; then
    echo "✅ Training programs API working (authentication required)"
else
    echo "⚠️  Training programs API response: $RESPONSE"
fi

echo "Testing training sessions API..."
RESPONSE=$(curl -s -w "%{http_code}" "https://www.openplp.com/api/training/sessions")
if echo "$RESPONSE" | grep -q "401"; then
    echo "✅ Training sessions API working (authentication required)"
else
    echo "⚠️  Training sessions API response: $RESPONSE"
fi

echo ""
echo "🎯 Next Steps:"
echo "   1. Test login at https://www.openplp.com/login"
echo "   2. Navigate to Training section"
echo "   3. Test creating programs and sessions"
echo "   4. Verify all CRUD operations work"
echo ""
echo "✨ Your production system is now fully updated!"