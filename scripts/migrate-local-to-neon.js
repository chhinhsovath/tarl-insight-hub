#!/usr/bin/env node

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Local database configuration
const localConfig = {
  user: 'postgres',
  host: 'localhost',
  database: 'pratham_tarl',
  password: '12345',
  port: 5432,
};

// Neon database configuration
const neonConfig = {
  user: 'neondb_owner',
  host: 'ep-bold-sun-a55wq826-pooler.us-east-2.aws.neon.tech',
  database: 'neondb',
  password: 'npg_U9lFscTri3yk',
  port: 5432,
  ssl: { rejectUnauthorized: false }
};

// Utility function to execute SQL with better error handling
async function executeSql(pool, sql, description) {
  try {
    console.log(`📋 ${description}...`);
    const result = await pool.query(sql);
    console.log(`✅ ${description} completed`);
    return result;
  } catch (error) {
    console.error(`❌ Error during ${description}:`, error.message);
    throw error;
  }
}

// Get list of all tables in a database
async function getTables(pool) {
  const result = await pool.query(`
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    ORDER BY tablename
  `);
  return result.rows.map(row => row.tablename);
}

// Get CREATE TABLE statement for a table
async function getTableStructure(pool, tableName) {
  const result = await pool.query(`
    SELECT 
      'CREATE TABLE ' || schemaname || '.' || tablename || ' (' ||
      string_agg(column_name || ' ' || data_type || 
        CASE 
          WHEN character_maximum_length IS NOT NULL 
          THEN '(' || character_maximum_length || ')' 
          ELSE '' 
        END ||
        CASE 
          WHEN is_nullable = 'NO' THEN ' NOT NULL' 
          ELSE '' 
        END, ', ') || ');' as create_sql
    FROM information_schema.tables t
    JOIN information_schema.columns c ON c.table_name = t.tablename
    WHERE t.schemaname = 'public' AND t.tablename = $1
    GROUP BY schemaname, tablename
  `, [tableName]);
  
  return result.rows[0]?.create_sql || '';
}

// Export table data as INSERT statements
async function exportTableData(pool, tableName) {
  const result = await pool.query(`SELECT * FROM "${tableName}"`);
  
  if (result.rows.length === 0) {
    return [];
  }

  const columns = Object.keys(result.rows[0]);
  const insertStatements = [];

  for (const row of result.rows) {
    const values = columns.map(col => {
      const value = row[col];
      if (value === null) return 'NULL';
      if (typeof value === 'string') {
        return `'${value.replace(/'/g, "''")}'`;
      }
      if (typeof value === 'boolean') return value;
      if (value instanceof Date) return `'${value.toISOString()}'`;
      if (typeof value === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
      return value;
    });

    insertStatements.push(
      `INSERT INTO "${tableName}" ("${columns.join('", "')}") VALUES (${values.join(', ')});`
    );
  }

  return insertStatements;
}

// Main migration function
async function migrateLocalToNeon() {
  let localPool, neonPool;

  try {
    console.log('🚀 Starting migration from local PostgreSQL to Neon...\n');

    // Connect to local database
    console.log('📡 Connecting to local database...');
    localPool = new Pool(localConfig);
    await localPool.query('SELECT 1');
    console.log('✅ Connected to local database\n');

    // Connect to Neon database
    console.log('📡 Connecting to Neon database...');
    neonPool = new Pool(neonConfig);
    await neonPool.query('SELECT 1');
    console.log('✅ Connected to Neon database\n');

    // Get all tables from local database
    console.log('📋 Getting table list from local database...');
    const localTables = await getTables(localPool);
    console.log(`✅ Found ${localTables.length} tables: ${localTables.join(', ')}\n`);

    // Step 1: Drop all existing tables in Neon
    console.log('🧹 Cleaning Neon database...');
    const neonTables = await getTables(neonPool);
    
    if (neonTables.length > 0) {
      console.log(`Found ${neonTables.length} existing tables in Neon: ${neonTables.join(', ')}`);
      
      // Disable foreign key checks temporarily
      await executeSql(neonPool, 'SET session_replication_role = replica;', 'Disabling foreign key checks');
      
      // Drop all tables
      for (const table of neonTables) {
        await executeSql(neonPool, `DROP TABLE IF EXISTS "${table}" CASCADE;`, `Dropping table ${table}`);
      }
      
      // Re-enable foreign key checks
      await executeSql(neonPool, 'SET session_replication_role = DEFAULT;', 'Re-enabling foreign key checks');
    } else {
      console.log('No existing tables found in Neon');
    }
    console.log('✅ Neon database cleaned\n');

    // Step 2: Export schema and data from local database
    console.log('📤 Exporting schema and data from local database...');
    
    const exportFile = path.join(__dirname, 'local_database_export.sql');
    let exportSql = '-- Database export from local PostgreSQL to Neon\n';
    exportSql += '-- Generated: ' + new Date().toISOString() + '\n\n';
    exportSql += 'SET session_replication_role = replica;\n\n';

    // Export each table
    for (const tableName of localTables) {
      console.log(`📋 Processing table: ${tableName}`);
      
      try {
        // Get table structure (simplified approach)
        const tableResult = await localPool.query(`
          SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = $1 AND table_schema = 'public'
          ORDER BY ordinal_position
        `, [tableName]);

        if (tableResult.rows.length > 0) {
          // Create table statement
          const columns = tableResult.rows.map(col => {
            let colDef = `"${col.column_name}" ${col.data_type}`;
            if (col.character_maximum_length) {
              colDef += `(${col.character_maximum_length})`;
            }
            if (col.is_nullable === 'NO') {
              colDef += ' NOT NULL';
            }
            if (col.column_default) {
              colDef += ` DEFAULT ${col.column_default}`;
            }
            return colDef;
          }).join(', ');

          exportSql += `-- Table: ${tableName}\n`;
          exportSql += `CREATE TABLE IF NOT EXISTS "${tableName}" (${columns});\n\n`;

          // Export data
          const insertStatements = await exportTableData(localPool, tableName);
          if (insertStatements.length > 0) {
            exportSql += `-- Data for table: ${tableName}\n`;
            exportSql += insertStatements.join('\n') + '\n\n';
            console.log(`✅ Exported ${insertStatements.length} rows from ${tableName}`);
          } else {
            console.log(`ℹ️  Table ${tableName} is empty`);
          }
        }
      } catch (error) {
        console.warn(`⚠️  Warning: Could not export table ${tableName}: ${error.message}`);
      }
    }

    exportSql += 'SET session_replication_role = DEFAULT;\n';

    // Write export to file
    fs.writeFileSync(exportFile, exportSql);
    console.log(`✅ Export written to: ${exportFile}\n`);

    // Step 3: Import to Neon database
    console.log('📥 Importing to Neon database...');
    
    // Execute the export SQL in Neon
    const sqlStatements = exportSql.split(';\n').filter(stmt => stmt.trim() && !stmt.trim().startsWith('--'));
    
    let successCount = 0;
    let errorCount = 0;

    for (const statement of sqlStatements) {
      if (statement.trim()) {
        try {
          await neonPool.query(statement.trim() + ';');
          successCount++;
        } catch (error) {
          console.warn(`⚠️  Warning executing statement: ${error.message}`);
          console.warn(`Statement: ${statement.substring(0, 100)}...`);
          errorCount++;
        }
      }
    }

    console.log(`✅ Import completed: ${successCount} statements succeeded, ${errorCount} warnings\n`);

    // Step 4: Verify migration
    console.log('🔍 Verifying migration...');
    const neonTablesAfter = await getTables(neonPool);
    console.log(`✅ Neon now has ${neonTablesAfter.length} tables: ${neonTablesAfter.join(', ')}\n`);

    // Compare table counts
    for (const table of localTables) {
      try {
        const localCount = await localPool.query(`SELECT COUNT(*) FROM "${table}"`);
        const neonCount = await neonPool.query(`SELECT COUNT(*) FROM "${table}"`);
        
        const localRows = parseInt(localCount.rows[0].count);
        const neonRows = parseInt(neonCount.rows[0].count);
        
        if (localRows === neonRows) {
          console.log(`✅ ${table}: ${localRows} rows (matched)`);
        } else {
          console.log(`⚠️  ${table}: Local ${localRows} rows, Neon ${neonRows} rows (mismatch)`);
        }
      } catch (error) {
        console.log(`❌ ${table}: Error verifying - ${error.message}`);
      }
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Update your environment variables to use Neon');
    console.log('2. Test your application with the new database');
    console.log('3. Remove the export file if no longer needed');
    console.log(`4. Export file location: ${exportFile}`);

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    // Close connections
    if (localPool) {
      await localPool.end();
      console.log('\n📡 Local database connection closed');
    }
    if (neonPool) {
      await neonPool.end();
      console.log('📡 Neon database connection closed');
    }
  }
}

// Run migration
if (require.main === module) {
  migrateLocalToNeon().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { migrateLocalToNeon };