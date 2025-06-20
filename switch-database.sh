#!/bin/bash

# =============================================================================
# DATABASE SWITCHER SCRIPT
# Easily switch between local PostgreSQL and Neon database for development
# =============================================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔄 TaRL Insight Hub - Database Switcher${NC}"
echo "========================================"

# Check current configuration
if [ -f ".env.local" ]; then
    if grep -q "localhost" .env.local; then
        CURRENT="PostgreSQL (Local)"
        CURRENT_COLOR="${GREEN}"
    elif grep -q "neon.tech" .env.local; then
        CURRENT="Neon (Cloud)"
        CURRENT_COLOR="${BLUE}"
    else
        CURRENT="Unknown"
        CURRENT_COLOR="${YELLOW}"
    fi
else
    CURRENT="No configuration"
    CURRENT_COLOR="${RED}"
fi

echo -e "${YELLOW}Current database:${NC} ${CURRENT_COLOR}${CURRENT}${NC}"
echo ""

# Show options
echo "Select database configuration:"
echo "1) Local PostgreSQL (localhost:5432/pratham_tarl)"
echo "2) Neon Cloud Database (neon.tech)"
echo "3) Show current configuration"
echo "4) Test current database connection"
echo "5) Exit"
echo ""

read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo -e "${YELLOW}Switching to Local PostgreSQL...${NC}"
        cp .env.local.postgres .env.local
        echo -e "${GREEN}✅ Switched to Local PostgreSQL${NC}"
        echo -e "${YELLOW}Database:${NC} localhost:5432/pratham_tarl"
        echo -e "${YELLOW}User:${NC} postgres"
        echo ""
        echo -e "${BLUE}Next steps:${NC}"
        echo "1. Make sure PostgreSQL is running: brew services start postgresql@14"
        echo "2. Restart your development server: npm run dev"
        echo "3. Test connection: curl http://localhost:3000/api/test-db"
        ;;
    2)
        echo -e "${YELLOW}Switching to Neon Cloud Database...${NC}"
        cp .env.local.neon .env.local
        echo -e "${GREEN}✅ Switched to Neon Cloud Database${NC}"
        echo -e "${YELLOW}Database:${NC} neondb@neon.tech"
        echo -e "${YELLOW}User:${NC} neondb_owner"
        echo ""
        echo -e "${BLUE}Next steps:${NC}"
        echo "1. Restart your development server: npm run dev"
        echo "2. Test connection: curl http://localhost:3000/api/test-db"
        ;;
    3)
        echo -e "${YELLOW}Current .env.local configuration:${NC}"
        if [ -f ".env.local" ]; then
            echo "----------------------------------------"
            cat .env.local
            echo "----------------------------------------"
        else
            echo -e "${RED}No .env.local file found${NC}"
        fi
        ;;
    4)
        echo -e "${YELLOW}Testing current database connection...${NC}"
        if [ -f ".env.local" ]; then
            # Source the environment file
            source .env.local
            
            echo "Testing connection to: $PGHOST:$PGPORT/$PGDATABASE"
            if PGPASSWORD="$PGPASSWORD" psql \
                --host="$PGHOST" \
                --port="$PGPORT" \
                --username="$PGUSER" \
                --dbname="$PGDATABASE" \
                --command="SELECT current_database(), current_user, version();" > /dev/null 2>&1; then
                echo -e "${GREEN}✅ Database connection successful${NC}"
                
                # Show basic stats
                echo -e "${YELLOW}Database statistics:${NC}"
                PGPASSWORD="$PGPASSWORD" psql \
                    --host="$PGHOST" \
                    --port="$PGPORT" \
                    --username="$PGUSER" \
                    --dbname="$PGDATABASE" \
                    --command="
                        SELECT 
                            (SELECT count(*) FROM pg_tables WHERE schemaname = 'public') as total_tables,
                            (SELECT count(*) FROM tbl_tarl_users) as users,
                            (SELECT count(*) FROM tbl_tarl_schools) as schools;
                    " 2>/dev/null || echo "Could not fetch statistics"
            else
                echo -e "${RED}❌ Database connection failed${NC}"
                echo "Please check your configuration and ensure the database is running"
            fi
        else
            echo -e "${RED}No .env.local file found${NC}"
        fi
        ;;
    5)
        echo -e "${YELLOW}Exiting...${NC}"
        exit 0
        ;;
    *)
        echo -e "${RED}Invalid option. Please try again.${NC}"
        ;;
esac

echo ""
echo "========================================"