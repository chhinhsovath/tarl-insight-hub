#!/bin/bash

# =============================================================================
# FINAL NEON.TECH RESTORATION SCRIPT
# Restore your complete local PostgreSQL database to Neon.tech
# =============================================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Neon.tech connection details
NEON_HOST="ep-flat-firefly-a4zesph4-pooler.us-east-1.aws.neon.tech"
NEON_DATABASE="neondb"
NEON_USER="neondb_owner"
NEON_PORT="5432"

# Backup directory
BACKUP_DIR="database-backup-v17-20250619_221518"

echo -e "${BLUE}🚀 TaRL Insight Hub - Database Restoration to Neon.tech${NC}"
echo "=================================================="
echo -e "${YELLOW}Source Database:${NC} pratham_tarl (local PostgreSQL)"
echo -e "${YELLOW}Target Database:${NC} $NEON_DATABASE on Neon.tech"
echo -e "${YELLOW}Total Tables:${NC} 71 tables"
echo -e "${YELLOW}Total Size:${NC} ~120MB"
echo "=================================================="

# Check if backup directory exists
if [ ! -d "$BACKUP_DIR" ]; then
    echo -e "${RED}❌ Backup directory not found: $BACKUP_DIR${NC}"
    echo "Please extract the backup first: tar -xzf database-backup-v17-20250619_221518.tar.gz"
    exit 1
fi

cd "$BACKUP_DIR"

# Check if required files exist
if [ ! -f "complete_database.dump" ] || [ ! -f "complete_database.sql" ]; then
    echo -e "${RED}❌ Required backup files not found${NC}"
    exit 1
fi

echo -e "${YELLOW}📂 Found backup files:${NC}"
ls -lh *.dump *.sql

# Prompt for password
echo ""
echo -e "${YELLOW}🔐 Please enter your Neon.tech database password:${NC}"
read -s NEON_PASSWORD
export PGPASSWORD="$NEON_PASSWORD"

echo ""
echo -e "${BLUE}🔄 Starting restoration process...${NC}"

# Test connection first
echo -e "${YELLOW}🔍 Testing database connection...${NC}"
if psql \
  --host=$NEON_HOST \
  --port=$NEON_PORT \
  --username=$NEON_USER \
  --dbname=$NEON_DATABASE \
  --command="SELECT version();" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Connection successful${NC}"
else
    echo -e "${RED}❌ Connection failed. Please check your credentials and try again.${NC}"
    exit 1
fi

# Show current database content
echo -e "${YELLOW}📊 Current Neon database content:${NC}"
psql \
  --host=$NEON_HOST \
  --port=$NEON_PORT \
  --username=$NEON_USER \
  --dbname=$NEON_DATABASE \
  --command="SELECT schemaname, tablename, 
             pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
             FROM pg_tables 
             WHERE schemaname = 'public'
             ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
             LIMIT 10;"

echo ""
echo -e "${YELLOW}⚠️  WARNING: This will replace all existing data in your Neon database!${NC}"
echo -e "${YELLOW}Are you sure you want to continue? (yes/no):${NC}"
read -r confirm

if [ "$confirm" != "yes" ]; then
    echo -e "${YELLOW}❌ Restoration cancelled${NC}"
    exit 0
fi

echo ""
echo -e "${BLUE}🗄️  Starting restoration...${NC}"

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
  complete_database.dump; then
    
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
      --file=complete_database.sql; then
        
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
          --file=schema_only.sql
          
        echo -e "${YELLOW}📥 Restoring data...${NC}"
        psql \
          --host=$NEON_HOST \
          --port=$NEON_PORT \
          --username=$NEON_USER \
          --dbname=$NEON_DATABASE \
          --file=data_only.sql
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
  --command="SELECT count(*) FROM pg_tables WHERE schemaname = 'public';")

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
      'tbl_tarl_users' as table_name, 
      count(*) as row_count 
    FROM tbl_tarl_users
    UNION ALL
    SELECT 
      'tbl_tarl_schools', 
      count(*) 
    FROM tbl_tarl_schools
    UNION ALL
    SELECT 
      'tbl_tarl_training_sessions', 
      count(*) 
    FROM tbl_tarl_training_sessions
    UNION ALL
    SELECT 
      'page_permissions', 
      count(*) 
    FROM page_permissions;
  "

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
    WHERE u.username = 'admin1';
  "

echo ""
echo "=================================================="
echo -e "${GREEN}🎉 Database restoration completed!${NC}"
echo ""
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "1. Test login at: https://tarl-insight-hub.vercel.app/login"
echo "2. Credentials: admin1 / admin123"
echo "3. Verify all training functions are working"
echo "4. Check that your local data is properly restored"
echo ""
echo -e "${BLUE}🗄️  Database Statistics:${NC}"
echo "- Total Tables: $TABLE_COUNT"
echo "- Source: Local PostgreSQL (pratham_tarl)"
echo "- Target: Neon.tech (neondb)"
echo "- Restoration Date: $(date)"
echo "=================================================="