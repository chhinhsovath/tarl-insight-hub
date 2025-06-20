#!/bin/bash

# =============================================================================
# DIRECT LOCAL TO NEON MIGRATION SCRIPT
# Migrates your local PostgreSQL database directly to Neon.tech
# =============================================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Database connection details
LOCAL_HOST="localhost"
LOCAL_PORT="5432"
LOCAL_DATABASE="pratham_tarl"
LOCAL_USER="postgres"

NEON_HOST="ep-bold-sun-a55wq826-pooler.us-east-2.aws.neon.tech"
NEON_DATABASE="neondb"
NEON_USER="neondb_owner"
NEON_PASSWORD="npg_U9lFscTri3yk"
NEON_PORT="5432"

echo -e "${BLUE}🚀 TaRL Insight Hub - Direct Database Migration${NC}"
echo "=================================================="
echo -e "${YELLOW}Source:${NC} $LOCAL_DATABASE@$LOCAL_HOST"
echo -e "${YELLOW}Target:${NC} $NEON_DATABASE@$NEON_HOST"
echo -e "${YELLOW}Migration Method:${NC} Direct pg_dump | pg_restore pipeline"
echo "=================================================="

# Get local database password
echo -e "${YELLOW}🔐 Enter your LOCAL PostgreSQL password:${NC}"
read -s LOCAL_PASSWORD
export LOCAL_PGPASSWORD="$LOCAL_PASSWORD"

# Get Neon database password
echo -e "${YELLOW}🔐 Enter your NEON database password:${NC}"
read -s NEON_PASSWORD
export NEON_PGPASSWORD="$NEON_PASSWORD"

echo ""
echo -e "${BLUE}🔍 Testing database connections...${NC}"

# Test local connection
echo -e "${YELLOW}Testing local database connection...${NC}"
if PGPASSWORD="$LOCAL_PASSWORD" psql \
  --host=$LOCAL_HOST \
  --port=$LOCAL_PORT \
  --username=$LOCAL_USER \
  --dbname=$LOCAL_DATABASE \
  --command="SELECT version();" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Local connection successful${NC}"
else
    echo -e "${RED}❌ Local connection failed. Please check credentials.${NC}"
    exit 1
fi

# Test Neon connection
echo -e "${YELLOW}Testing Neon database connection...${NC}"
if PGPASSWORD="$NEON_PASSWORD" psql \
  --host=$NEON_HOST \
  --port=$NEON_PORT \
  --username=$NEON_USER \
  --dbname=$NEON_DATABASE \
  --command="SELECT version();" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Neon connection successful${NC}"
else
    echo -e "${RED}❌ Neon connection failed. Please check credentials.${NC}"
    exit 1
fi

# Show current database sizes
echo ""
echo -e "${YELLOW}📊 Source database information:${NC}"
PGPASSWORD="$LOCAL_PASSWORD" psql \
  --host=$LOCAL_HOST \
  --port=$LOCAL_PORT \
  --username=$LOCAL_USER \
  --dbname=$LOCAL_DATABASE \
  --command="
    SELECT 
      count(*) as total_tables,
      pg_size_pretty(pg_database_size('$LOCAL_DATABASE')) as database_size
    FROM pg_tables 
    WHERE schemaname = 'public';"

echo -e "${YELLOW}📊 Target database current content:${NC}"
PGPASSWORD="$NEON_PASSWORD" psql \
  --host=$NEON_HOST \
  --port=$NEON_PORT \
  --username=$NEON_USER \
  --dbname=$NEON_DATABASE \
  --command="
    SELECT 
      count(*) as existing_tables,
      pg_size_pretty(pg_database_size('$NEON_DATABASE')) as database_size
    FROM pg_tables 
    WHERE schemaname = 'public';"

echo ""
echo -e "${YELLOW}⚠️  WARNING: This will replace ALL data in your Neon database!${NC}"
echo -e "${YELLOW}Are you sure you want to continue? (yes/no):${NC}"
read -r confirm

if [ "$confirm" != "yes" ]; then
    echo -e "${YELLOW}❌ Migration cancelled${NC}"
    exit 0
fi

echo ""
echo -e "${BLUE}🔄 Starting direct migration...${NC}"

# Create temporary dump file
TEMP_DUMP="/tmp/tarl_migration_$(date +%Y%m%d_%H%M%S).dump"

echo -e "${YELLOW}📤 Creating database dump from local PostgreSQL...${NC}"
if PGPASSWORD="$LOCAL_PASSWORD" pg_dump \
  --host=$LOCAL_HOST \
  --port=$LOCAL_PORT \
  --username=$LOCAL_USER \
  --dbname=$LOCAL_DATABASE \
  --format=custom \
  --verbose \
  --no-owner \
  --no-privileges \
  --file="$TEMP_DUMP"; then
    echo -e "${GREEN}✅ Local dump created successfully${NC}"
else
    echo -e "${RED}❌ Failed to create local dump${NC}"
    exit 1
fi

echo -e "${YELLOW}📥 Restoring dump to Neon database...${NC}"
if PGPASSWORD="$NEON_PASSWORD" pg_restore \
  --host=$NEON_HOST \
  --port=$NEON_PORT \
  --username=$NEON_USER \
  --dbname=$NEON_DATABASE \
  --verbose \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  --no-comments \
  "$TEMP_DUMP"; then
    echo -e "${GREEN}✅ Neon restoration completed successfully!${NC}"
else
    echo -e "${YELLOW}⚠️  pg_restore encountered issues, trying alternative method...${NC}"
    
    # Try with SQL format
    TEMP_SQL="/tmp/tarl_migration_$(date +%Y%m%d_%H%M%S).sql"
    
    echo -e "${YELLOW}📤 Creating SQL dump from local PostgreSQL...${NC}"
    PGPASSWORD="$LOCAL_PASSWORD" pg_dump \
      --host=$LOCAL_HOST \
      --port=$LOCAL_PORT \
      --username=$LOCAL_USER \
      --dbname=$LOCAL_DATABASE \
      --format=plain \
      --no-owner \
      --no-privileges \
      --file="$TEMP_SQL"
    
    echo -e "${YELLOW}📥 Restoring SQL to Neon database...${NC}"
    PGPASSWORD="$NEON_PASSWORD" psql \
      --host=$NEON_HOST \
      --port=$NEON_PORT \
      --username=$NEON_USER \
      --dbname=$NEON_DATABASE \
      --file="$TEMP_SQL"
    
    # Clean up SQL file
    rm -f "$TEMP_SQL"
fi

# Clean up dump file
rm -f "$TEMP_DUMP"

# Verify migration
echo ""
echo -e "${BLUE}🔍 Verifying migration...${NC}"

# Check table count
TABLE_COUNT=$(PGPASSWORD="$NEON_PASSWORD" psql \
  --host=$NEON_HOST \
  --port=$NEON_PORT \
  --username=$NEON_USER \
  --dbname=$NEON_DATABASE \
  --tuples-only \
  --command="SELECT count(*) FROM pg_tables WHERE schemaname = 'public';" | tr -d ' ')

echo -e "${YELLOW}📊 Tables migrated:${NC} $TABLE_COUNT"

# Check key tables
echo -e "${YELLOW}🔍 Verifying key data:${NC}"
PGPASSWORD="$NEON_PASSWORD" psql \
  --host=$NEON_HOST \
  --port=$NEON_PORT \
  --username=$NEON_USER \
  --dbname=$NEON_DATABASE \
  --command="
    SELECT 
      'Users' as data_type, 
      count(*) as count 
    FROM tbl_tarl_users
    UNION ALL
    SELECT 
      'Schools', 
      count(*) 
    FROM tbl_tarl_schools
    UNION ALL
    SELECT 
      'Training Sessions', 
      count(*) 
    FROM tbl_tarl_training_sessions
    UNION ALL
    SELECT 
      'Permissions', 
      count(*) 
    FROM page_permissions
    ORDER BY data_type;"

# Check admin user
echo -e "${YELLOW}👤 Verifying admin user:${NC}"
PGPASSWORD="$NEON_PASSWORD" psql \
  --host=$NEON_HOST \
  --port=$NEON_PORT \
  --username=$NEON_USER \
  --dbname=$NEON_DATABASE \
  --command="
    SELECT u.username, u.full_name, r.name as role, u.is_active
    FROM tbl_tarl_users u
    JOIN tbl_tarl_roles r ON u.role_id = r.id
    WHERE u.username = 'admin1';"

echo ""
echo "=================================================="
echo -e "${GREEN}🎉 Direct migration completed successfully!${NC}"
echo ""
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "1. Test your application: https://tarl-insight-hub.vercel.app"
echo "2. Login with: admin1 / admin123"
echo "3. Verify all training functions are working"
echo "4. Check that all your data is properly migrated"
echo ""
echo -e "${BLUE}📊 Migration Summary:${NC}"
echo "- Tables migrated: $TABLE_COUNT"
echo "- Source: $LOCAL_DATABASE@$LOCAL_HOST"
echo "- Target: $NEON_DATABASE@$NEON_HOST"
echo "- Migration completed: $(date)"
echo "=================================================="

# Clean up environment variables
unset LOCAL_PGPASSWORD
unset NEON_PGPASSWORD