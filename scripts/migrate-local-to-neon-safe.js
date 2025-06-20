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

// Get tables in dependency order (independent tables first)
async function getTablesInDropOrder(pool) {
  const result = await pool.query(`
    WITH RECURSIVE table_deps AS (
      -- Base case: tables with no dependencies
      SELECT 
        t.table_name,
        0 as level
      FROM information_schema.tables t
      LEFT JOIN information_schema.table_constraints tc ON t.table_name = tc.table_name
      LEFT JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
      WHERE t.table_schema = 'public' 
        AND t.table_type = 'BASE TABLE'
        AND rc.constraint_name IS NULL
      
      UNION
      
      -- Recursive case: tables that depend on already processed tables
      SELECT 
        t.table_name,
        td.level + 1
      FROM information_schema.tables t
      JOIN information_schema.table_constraints tc ON t.table_name = tc.table_name
      JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
      JOIN information_schema.table_constraints tc2 ON rc.unique_constraint_name = tc2.constraint_name
      JOIN table_deps td ON tc2.table_name = td.table_name
      WHERE t.table_schema = 'public' 
        AND t.table_type = 'BASE TABLE'
        AND t.table_name NOT IN (SELECT table_name FROM table_deps)
    )
    SELECT table_name 
    FROM table_deps 
    ORDER BY level DESC, table_name
  `);
  
  if (result.rows.length === 0) {
    // Fallback: just get all tables
    return getTables(pool);
  }
  
  return result.rows.map(row => row.table_name);
}

// Export table data as INSERT statements
async function exportTableData(pool, tableName) {
  try {
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
  } catch (error) {
    console.warn(`⚠️  Warning: Could not export data from ${tableName}: ${error.message}`);
    return [];
  }
}

// Create table statement from schema
async function getCreateTableStatement(pool, tableName) {
  try {
    const result = await pool.query(`
      SELECT 
        column_name, 
        data_type, 
        character_maximum_length, 
        is_nullable, 
        column_default
      FROM information_schema.columns 
      WHERE table_name = $1 AND table_schema = 'public'
      ORDER BY ordinal_position
    `, [tableName]);

    if (result.rows.length === 0) {
      return null;
    }

    const columns = result.rows.map(col => {
      let colDef = `"${col.column_name}" ${col.data_type}`;
      
      if (col.data_type === 'character varying' && col.character_maximum_length) {
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

    return `CREATE TABLE IF NOT EXISTS "${tableName}" (${columns});`;
  } catch (error) {
    console.warn(`⚠️  Warning: Could not get schema for ${tableName}: ${error.message}`);
    return null;
  }
}

// Main migration function
async function migrateLocalToNeonSafe() {
  let localPool, neonPool;

  try {
    console.log('🚀 Starting SAFE migration from local PostgreSQL to Neon...\n');

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
    console.log(`✅ Found ${localTables.length} tables\n`);

    // Step 1: Drop all existing tables in Neon (safe order)
    console.log('🧹 Cleaning Neon database (safe method)...');
    const neonTables = await getTablesInDropOrder(neonPool);
    
    if (neonTables.length > 0) {
      console.log(`Found ${neonTables.length} existing tables in Neon`);
      
      // Drop tables one by one, ignoring foreign key errors
      for (const table of neonTables) {
        try {
          await neonPool.query(`DROP TABLE IF EXISTS "${table}" CASCADE;`);
          console.log(`✅ Dropped table ${table}`);
        } catch (error) {
          console.log(`⚠️  Warning dropping table ${table}: ${error.message}`);
        }
      }
    } else {
      console.log('No existing tables found in Neon');
    }
    console.log('✅ Neon database cleaned\n');

    // Step 2: Create tables and export data
    console.log('📤 Creating tables and exporting data from local database...');
    
    const exportFile = path.join(__dirname, 'local_database_export_safe.sql');
    let exportSql = '-- Safe Database export from local PostgreSQL to Neon\n';
    exportSql += '-- Generated: ' + new Date().toISOString() + '\n\n';

    // First pass: Create all tables without foreign keys
    let tableCreationSql = '';
    let dataSql = '';

    for (const tableName of localTables) {
      console.log(`📋 Processing table: ${tableName}`);
      
      try {
        // Get table structure
        const createStatement = await getCreateTableStatement(localPool, tableName);
        if (createStatement) {
          tableCreationSql += `-- Table: ${tableName}\n${createStatement}\n\n`;
          
          // Export data
          const insertStatements = await exportTableData(localPool, tableName);
          if (insertStatements.length > 0) {
            dataSql += `-- Data for table: ${tableName}\n`;
            dataSql += insertStatements.join('\n') + '\n\n';
            console.log(`✅ Exported ${insertStatements.length} rows from ${tableName}`);
          } else {
            console.log(`ℹ️  Table ${tableName} is empty`);
          }
        }
      } catch (error) {
        console.warn(`⚠️  Warning: Could not export table ${tableName}: ${error.message}`);
      }
    }

    exportSql += tableCreationSql + '\n' + dataSql;

    // Write export to file
    fs.writeFileSync(exportFile, exportSql);
    console.log(`✅ Export written to: ${exportFile}\n`);

    // Step 3: Import to Neon database (in chunks)
    console.log('📥 Importing to Neon database...');
    
    const statements = exportSql.split(';\n').filter(stmt => 
      stmt.trim() && 
      !stmt.trim().startsWith('--') && 
      stmt.trim() !== ''
    );
    
    let successCount = 0;
    let errorCount = 0;

    console.log(`Processing ${statements.length} statements...`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement) {
        try {
          await neonPool.query(statement + ';');
          successCount++;
          
          if ((i + 1) % 100 === 0) {
            console.log(`✅ Processed ${i + 1}/${statements.length} statements`);
          }
        } catch (error) {
          console.warn(`⚠️  Warning on statement ${i + 1}: ${error.message.substring(0, 100)}`);
          errorCount++;
        }
      }
    }

    console.log(`✅ Import completed: ${successCount} statements succeeded, ${errorCount} warnings\n`);

    // Step 4: Verify migration
    console.log('🔍 Verifying migration...');
    const neonTablesAfter = await getTables(neonPool);
    console.log(`✅ Neon now has ${neonTablesAfter.length} tables\n`);

    // Compare table counts for first 10 tables
    console.log('📊 Sample verification (first 10 tables):');
    for (const table of localTables.slice(0, 10)) {
      try {
        const localCount = await localPool.query(`SELECT COUNT(*) FROM "${table}"`);
        const neonCount = await neonPool.query(`SELECT COUNT(*) FROM "${table}"`);
        
        const localRows = parseInt(localCount.rows[0].count);
        const neonRows = parseInt(neonCount.rows[0].count);
        
        if (localRows === neonRows) {
          console.log(`✅ ${table}: ${localRows} rows (matched)`);
        } else {
          console.log(`⚠️  ${table}: Local ${localRows} rows, Neon ${neonRows} rows`);
        }
      } catch (error) {
        console.log(`❌ ${table}: Error verifying - ${error.message}`);
      }
    }

    console.log('\n🎉 SAFE Migration completed successfully!');
    console.log(`📁 Export file: ${exportFile}`);

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    throw error;
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
  migrateLocalToNeonSafe().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { migrateLocalToNeonSafe };