#!/bin/bash

# =============================================================================
# LOCAL POSTGRESQL DATABASE BACKUP SCRIPT (PostgreSQL 17 Compatible)
# Exports all table structures and data for restoration to Neon.tech
# =============================================================================

# Use PostgreSQL 17 tools
export PATH="/usr/local/opt/postgresql@17/bin:$PATH"

# Database connection details from .env.local
export PGUSER=postgres
export PGHOST=localhost
export PGDATABASE=pratham_tarl
export PGPASSWORD=12345
export PGPORT=5432

# Create backup directory
BACKUP_DIR="database-backup-v17-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "🗄️  Starting PostgreSQL database backup with v17 tools..."
echo "📍 Database: $PGDATABASE on $PGHOST:$PGPORT"
echo "📁 Backup directory: $BACKUP_DIR"
echo "🔧 Using pg_dump: $(which pg_dump)"
echo "=================================================="

# Verify pg_dump version
pg_dump --version

# 1. Full database dump (schema + data) - Custom format
echo "📊 Creating complete database dump (custom format)..."
pg_dump \
  --host=$PGHOST \
  --port=$PGPORT \
  --username=$PGUSER \
  --dbname=$PGDATABASE \
  --verbose \
  --clean \
  --if-exists \
  --format=custom \
  --file="$BACKUP_DIR/complete_database.dump"

if [ $? -eq 0 ]; then
    echo "✅ Custom format dump completed successfully"
else
    echo "❌ Custom format dump failed"
fi

# 2. Full database dump (schema + data) - Plain SQL
echo "📝 Creating complete database dump (SQL format)..."
pg_dump \
  --host=$PGHOST \
  --port=$PGPORT \
  --username=$PGUSER \
  --dbname=$PGDATABASE \
  --verbose \
  --clean \
  --if-exists \
  --file="$BACKUP_DIR/complete_database.sql"

if [ $? -eq 0 ]; then
    echo "✅ SQL format dump completed successfully"
else
    echo "❌ SQL format dump failed"
fi

# 3. Schema-only dump
echo "🏗️  Creating schema-only dump..."
pg_dump \
  --host=$PGHOST \
  --port=$PGPORT \
  --username=$PGUSER \
  --dbname=$PGDATABASE \
  --schema-only \
  --verbose \
  --clean \
  --if-exists \
  --file="$BACKUP_DIR/schema_only.sql"

if [ $? -eq 0 ]; then
    echo "✅ Schema-only dump completed successfully"
else
    echo "❌ Schema-only dump failed"
fi

# 4. Data-only dump
echo "📄 Creating data-only dump..."
pg_dump \
  --host=$PGHOST \
  --port=$PGPORT \
  --username=$PGUSER \
  --dbname=$PGDATABASE \
  --data-only \
  --verbose \
  --file="$BACKUP_DIR/data_only.sql"

if [ $? -eq 0 ]; then
    echo "✅ Data-only dump completed successfully"
else
    echo "❌ Data-only dump failed"
fi

# 5. Get database statistics
echo "📊 Collecting database statistics..."
psql \
  --host=$PGHOST \
  --port=$PGPORT \
  --username=$PGUSER \
  --dbname=$PGDATABASE \
  --command="
    SELECT 
      schemaname, 
      tablename, 
      pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
      (xpath('/row/cnt/text()', 
             query_to_xml(format('select count(*) as cnt from %I.%I', 
                               schemaname, tablename), false, true, ''))
      )[1]::text::int as row_count
    FROM pg_tables 
    WHERE schemaname = 'public'
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
  " \
  --output="$BACKUP_DIR/table_statistics.txt"

# 6. Get database metadata
echo "ℹ️  Collecting database metadata..."
psql \
  --host=$PGHOST \
  --port=$PGPORT \
  --username=$PGUSER \
  --dbname=$PGDATABASE \
  --command="
    SELECT 
      current_database() as database_name,
      current_user as current_user,
      version() as postgresql_version,
      pg_database_size(current_database()) as database_size_bytes,
      pg_size_pretty(pg_database_size(current_database())) as database_size_readable,
      now() as backup_timestamp;
  " \
  --output="$BACKUP_DIR/database_metadata.txt"

# 7. Create Neon-specific restoration script
cat > "$BACKUP_DIR/restore-to-neon.sh" << 'EOF'
#!/bin/bash

# =============================================================================
# NEON.TECH RESTORATION SCRIPT
# Run this script to restore your local data to Neon.tech
# =============================================================================

# Neon.tech connection details
NEON_HOST="ep-flat-firefly-a4zesph4-pooler.us-east-1.aws.neon.tech"
NEON_DATABASE="neondb"
NEON_USER="neondb_owner"
NEON_PORT="5432"

echo "🚀 Starting restoration to Neon.tech..."
echo "📍 Target: $NEON_DATABASE on $NEON_HOST"
echo "=================================================="

# Prompt for password
echo "Please enter your Neon.tech database password:"
read -s NEON_PASSWORD
export PGPASSWORD="$NEON_PASSWORD"

# Option 1: Restore using custom format (recommended)
echo "🔄 Attempting restoration using custom format..."
pg_restore \
  --host=$NEON_HOST \
  --port=$NEON_PORT \
  --username=$NEON_USER \
  --dbname=$NEON_DATABASE \
  --verbose \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  complete_database.dump

if [ $? -eq 0 ]; then
    echo "✅ Custom format restoration completed successfully!"
    exit 0
fi

echo "⚠️  Custom format failed, trying SQL format..."

# Option 2: Restore using SQL format
psql \
  --host=$NEON_HOST \
  --port=$NEON_PORT \
  --username=$NEON_USER \
  --dbname=$NEON_DATABASE \
  --file=complete_database.sql

if [ $? -eq 0 ]; then
    echo "✅ SQL format restoration completed successfully!"
else
    echo "❌ Restoration failed. Please check the logs above for errors."
    echo "You may need to manually restore schema first, then data."
fi
EOF

chmod +x "$BACKUP_DIR/restore-to-neon.sh"

# 8. Create restoration instructions
cat > "$BACKUP_DIR/README.md" << EOF
# Database Backup and Restoration Guide

## Backup Information
- **Source Database**: $PGDATABASE
- **Backup Date**: $(date)
- **PostgreSQL Version**: $(pg_dump --version)
- **Total Tables**: $(psql --host=$PGHOST --port=$PGPORT --username=$PGUSER --dbname=$PGDATABASE --tuples-only --command="SELECT count(*) FROM pg_tables WHERE schemaname = 'public'")

## Files Included

### Main Backup Files
- \`complete_database.dump\` - Full backup in PostgreSQL custom format (recommended)
- \`complete_database.sql\` - Full backup in plain SQL format  
- \`schema_only.sql\` - Database structure only
- \`data_only.sql\` - Data only (requires existing schema)

### Metadata Files
- \`table_statistics.txt\` - Table sizes and row counts
- \`database_metadata.txt\` - Database information
- \`restore-to-neon.sh\` - Automated restoration script
- \`README.md\` - This file

## Quick Restoration to Neon.tech

### Automated Method (Recommended)
\`\`\`bash
./restore-to-neon.sh
\`\`\`

### Manual Methods

#### Method 1: Using pg_restore (Custom format)
\`\`\`bash
pg_restore \\
  --host=ep-flat-firefly-a4zesph4-pooler.us-east-1.aws.neon.tech \\
  --port=5432 \\
  --username=neondb_owner \\
  --dbname=neondb \\
  --verbose \\
  --clean \\
  --if-exists \\
  --no-owner \\
  --no-privileges \\
  complete_database.dump
\`\`\`

#### Method 2: Using psql (SQL format)
\`\`\`bash
psql \\
  --host=ep-flat-firefly-a4zesph4-pooler.us-east-1.aws.neon.tech \\
  --port=5432 \\
  --username=neondb_owner \\
  --dbname=neondb \\
  --file=complete_database.sql
\`\`\`

#### Method 3: Schema first, then data
\`\`\`bash
# First restore schema
psql \\
  --host=ep-flat-firefly-a4zesph4-pooler.us-east-1.aws.neon.tech \\
  --port=5432 \\
  --username=neondb_owner \\
  --dbname=neondb \\
  --file=schema_only.sql

# Then restore data
psql \\
  --host=ep-flat-firefly-a4zesph4-pooler.us-east-1.aws.neon.tech \\
  --port=5432 \\
  --username=neondb_owner \\
  --dbname=neondb \\
  --file=data_only.sql
\`\`\`

## Important Notes
- Always test restoration on a development database first
- The \`--clean\` flag will drop existing objects before creating them
- Use \`--no-owner\` and \`--no-privileges\` for cloud databases like Neon
- Make sure to set the environment variable: \`export PGPASSWORD="your_neon_password"\`

## Troubleshooting
- If you get permission errors, remove \`--clean\` flag
- If schema conflicts occur, use schema-only + data-only approach
- For large databases, consider using pg_restore with \`--jobs=4\` for parallel restoration
EOF

# 9. Create checksums
echo "🔐 Creating file checksums..."
find "$BACKUP_DIR" -type f \( -name "*.sql" -o -name "*.dump" \) -exec shasum -a 256 {} \; > "$BACKUP_DIR/checksums.txt"

# 10. Show file sizes
echo "📊 Backup file sizes:"
ls -lah "$BACKUP_DIR"

# 11. Compress backup
echo "🗜️  Compressing backup..."
tar -czf "${BACKUP_DIR}.tar.gz" "$BACKUP_DIR"

echo "=================================================="
echo "✅ Backup completed successfully!"
echo "📁 Compressed backup: $PWD/${BACKUP_DIR}.tar.gz"
echo "📁 Uncompressed backup: $PWD/$BACKUP_DIR"
echo ""
echo "🚀 Next steps to restore to Neon.tech:"
echo "1. Extract: tar -xzf ${BACKUP_DIR}.tar.gz"
echo "2. Run: cd $BACKUP_DIR && ./restore-to-neon.sh"
echo "3. Or manually use the files as described in README.md"
echo "=================================================="