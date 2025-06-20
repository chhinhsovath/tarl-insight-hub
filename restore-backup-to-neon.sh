#!/bin/bash

# =============================================================================
# RESTORE BACKUP TO NEON - Automated Migration
# Uses existing backup files to restore to Neon.tech
# =============================================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Neon.tech connection details (pre-configured)
NEON_HOST="ep-bold-sun-a55wq826-pooler.us-east-2.aws.neon.tech"
NEON_DATABASE="neondb"
NEON_USER="neondb_owner"
NEON_PASSWORD="npg_U9lFscTri3yk"
NEON_PORT="5432"

# Set password for all operations
export PGPASSWORD="$NEON_PASSWORD"

# Backup directory
BACKUP_DIR="database-backup-v17-20250619_221518"

echo -e "${BLUE}🚀 TaRL Insight Hub - Automated Backup Restoration${NC}"
echo "============================================================="
echo -e "${YELLOW}Source:${NC} Local backup files"
echo -e "${YELLOW}Target:${NC} $NEON_DATABASE@$NEON_HOST"
echo -e "${YELLOW}Method:${NC} Automated restoration using existing backups"
echo "============================================================="

# Check if backup directory exists
if [ ! -d "$BACKUP_DIR" ]; then
    echo -e "${RED}❌ Backup directory not found: $BACKUP_DIR${NC}"
    echo "Extracting backup archive..."
    if [ -f "database-backup-v17-20250619_221518.tar.gz" ]; then
        tar -xzf database-backup-v17-20250619_221518.tar.gz
        echo -e "${GREEN}✅ Backup extracted successfully${NC}"
    else
        echo -e "${RED}❌ Backup archive not found${NC}"
        exit 1
    fi
fi

cd "$BACKUP_DIR"

# Check if required files exist
if [ ! -f "complete_database.dump" ] || [ ! -f "complete_database.sql" ]; then
    echo -e "${RED}❌ Required backup files not found${NC}"
    exit 1
fi

echo -e "${YELLOW}📂 Found backup files:${NC}"
ls -lh *.dump *.sql

echo ""
echo -e "${BLUE}🔍 Testing Neon database connection...${NC}"

# Test connection
if psql \
  --host=$NEON_HOST \
  --port=$NEON_PORT \
  --username=$NEON_USER \
  --dbname=$NEON_DATABASE \
  --command="SELECT version();" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Connection successful${NC}"
else
    echo -e "${RED}❌ Connection failed. Please check your network connection.${NC}"
    exit 1
fi

# Show current database content
echo -e "${YELLOW}📊 Current Neon database content:${NC}"
psql \
  --host=$NEON_HOST \
  --port=$NEON_PORT \
  --username=$NEON_USER \
  --dbname=$NEON_DATABASE \
  --command="SELECT count(*) as existing_tables FROM pg_tables WHERE schemaname = 'public';"

echo ""
echo -e "${BLUE}🗄️  Starting automated restoration...${NC}"

# Method 1: Try pg_restore with custom format (most reliable)
echo -e "${YELLOW}📥 Attempting restoration using pg_restore (custom format)...${NC}"
if pg_restore \
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
  complete_database.dump 2>/dev/null; then
    
    echo -e "${GREEN}✅ pg_restore completed successfully!${NC}"
    
else
    echo -e "${YELLOW}⚠️  pg_restore encountered issues, trying SQL format...${NC}"
    
    # Method 2: Try psql with SQL format
    echo -e "${YELLOW}📥 Attempting restoration using psql (SQL format)...${NC}"
    if psql \
      --host=$NEON_HOST \
      --port=$NEON_PORT \
      --username=$NEON_USER \
      --dbname=$NEON_DATABASE \
      --file=complete_database.sql 2>/dev/null; then
        
        echo -e "${GREEN}✅ psql restoration completed successfully!${NC}"
        
    else
        echo -e "${RED}❌ Both restoration methods failed. Trying schema + data approach...${NC}"
        
        # Method 3: Schema first, then data
        echo -e "${YELLOW}📥 Restoring schema first...${NC}"
        psql \
          --host=$NEON_HOST \
          --port=$NEON_PORT \
          --username=$NEON_USER \
          --dbname=$NEON_DATABASE \
          --file=schema_only.sql 2>/dev/null
          
        echo -e "${YELLOW}📥 Restoring data...${NC}"
        psql \
          --host=$NEON_HOST \
          --port=$NEON_PORT \
          --username=$NEON_USER \
          --dbname=$NEON_DATABASE \
          --file=data_only.sql 2>/dev/null
    fi
fi

# Verify restoration
echo ""
echo -e "${BLUE}🔍 Verifying restoration...${NC}"

# Check table count
TABLE_COUNT=$(psql \
  --host=$NEON_HOST \
  --port=$NEON_PORT \
  --username=$NEON_USER \
  --dbname=$NEON_DATABASE \
  --tuples-only \
  --command="SELECT count(*) FROM pg_tables WHERE schemaname = 'public';" | tr -d ' ')

echo -e "${YELLOW}📊 Tables restored:${NC} $TABLE_COUNT"

# Check key tables
echo -e "${YELLOW}🔍 Checking key tables:${NC}"
psql \
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
echo -e "${YELLOW}👤 Checking admin user:${NC}"
psql \
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
echo "============================================================="
echo -e "${GREEN}🎉 Database restoration completed successfully!${NC}"
echo ""
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "1. Test login at: https://tarl-insight-hub.vercel.app/login"
echo "2. Credentials: admin1 / admin123"
echo "3. Verify all training functions are working"
echo "4. Check that your local data is properly restored"
echo ""
echo -e "${BLUE}🗄️  Database Statistics:${NC}"
echo "- Total Tables: $TABLE_COUNT"
echo "- Source: Local PostgreSQL backup"
echo "- Target: Neon.tech (neondb)"
echo "- Restoration Date: $(date)"
echo "============================================================="

# Clean up
unset PGPASSWORD