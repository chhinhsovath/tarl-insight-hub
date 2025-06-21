#!/usr/bin/env node

/**
 * Core Tables Schema Synchronization
 * Focuses on essential tables for school registration and core functionality
 */

const { Pool } = require('pg');

// Colors for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  header: (msg) => console.log(`\n${colors.bold}${colors.blue}=== ${msg} ===${colors.reset}\n`)
};

// Database configurations
const localConfig = {
  user: 'postgres',
  host: 'localhost',
  database: 'pratham_tarl',
  password: '12345',
  port: 5432,
};

const doConfig = {
  user: 'postgres',
  host: '137.184.109.21',
  database: 'tarl_ptom',
  password: 'P@ssw0rd',
  port: 5432,
  ssl: { rejectUnauthorized: false }
};

// Core tables that must exist for the application to work
const CORE_TABLES = [
  'tbl_tarl_schools',
  'tbl_tarl_demographics', 
  'tbl_tarl_users',
  'tbl_tarl_roles',
  'tbl_tarl_school_registrations',
  'tbl_tarl_students',
  'tbl_tarl_classes',
  'tbl_tarl_training_programs',
  'tbl_tarl_training_sessions',
  'tbl_tarl_training_participants',
  'page_permissions',
  'role_page_permissions'
];

// Create a specific table in Digital Ocean database
async function createTableInDO(tableName, localClient, doClient) {
  log.info(`Creating table: ${tableName}`);
  
  try {
    // Get table definition from local database
    const tableDefResult = await localClient.query(`
      SELECT 
        column_name,
        data_type,
        character_maximum_length,
        numeric_precision,
        numeric_scale,
        is_nullable,
        column_default,
        ordinal_position
      FROM information_schema.columns
      WHERE table_name = $1 AND table_schema = 'public'
      ORDER BY ordinal_position
    `, [tableName]);
    
    if (tableDefResult.rows.length === 0) {
      log.warning(`Table ${tableName} not found in local database`);
      return false;
    }
    
    // Drop table if exists
    await doClient.query(`DROP TABLE IF EXISTS "${tableName}" CASCADE`);
    
    // Build CREATE TABLE statement
    let createSQL = `CREATE TABLE "${tableName}" (\n`;
    
    const columns = tableDefResult.rows.map(col => {
      let columnDef = `  "${col.column_name}" `;
      
      // Data type mapping
      if (col.data_type === 'character varying') {
        columnDef += `VARCHAR(${col.character_maximum_length || 255})`;
      } else if (col.data_type === 'numeric') {
        columnDef += `NUMERIC(${col.numeric_precision},${col.numeric_scale})`;
      } else if (col.data_type === 'timestamp without time zone') {
        columnDef += 'TIMESTAMP';
      } else if (col.data_type === 'timestamp with time zone') {
        columnDef += 'TIMESTAMPTZ';
      } else if (col.data_type === 'integer') {
        columnDef += 'INTEGER';
      } else if (col.data_type === 'bigint') {
        columnDef += 'BIGINT';
      } else if (col.data_type === 'smallint') {
        columnDef += 'SMALLINT';
      } else if (col.data_type === 'boolean') {
        columnDef += 'BOOLEAN';
      } else if (col.data_type === 'text') {
        columnDef += 'TEXT';
      } else if (col.data_type === 'date') {
        columnDef += 'DATE';
      } else if (col.data_type === 'real') {
        columnDef += 'REAL';
      } else if (col.data_type === 'double precision') {
        columnDef += 'DOUBLE PRECISION';
      } else {
        columnDef += col.data_type.toUpperCase();
      }
      
      // Nullable
      if (col.is_nullable === 'NO') {
        columnDef += ' NOT NULL';
      }
      
      // Default value
      if (col.column_default && !col.column_default.includes('nextval')) {
        columnDef += ` DEFAULT ${col.column_default}`;
      }
      
      return columnDef;
    });
    
    createSQL += columns.join(',\n');
    createSQL += '\n)';
    
    // Execute CREATE TABLE
    await doClient.query(createSQL);
    log.success(`  Created table structure for ${tableName}`);
    
    // Add primary key
    const pkResult = await localClient.query(`
      SELECT a.attname
      FROM pg_index i
      JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
      WHERE i.indrelid = $1::regclass AND i.indisprimary
    `, [tableName]);
    
    if (pkResult.rows.length > 0) {
      const pkColumns = pkResult.rows.map(row => `"${row.attname}"`).join(', ');
      await doClient.query(`ALTER TABLE "${tableName}" ADD PRIMARY KEY (${pkColumns})`);
      log.success(`  Added primary key to ${tableName}`);
    }
    
    // Add sequences for auto-increment columns
    const sequenceResult = await localClient.query(`
      SELECT 
        column_name,
        column_default
      FROM information_schema.columns
      WHERE table_name = $1 
      AND column_default LIKE 'nextval%'
    `, [tableName]);
    
    for (const seqCol of sequenceResult.rows) {
      const seqName = `${tableName}_${seqCol.column_name}_seq`;
      try {
        await doClient.query(`CREATE SEQUENCE IF NOT EXISTS "${seqName}"`);
        await doClient.query(`ALTER TABLE "${tableName}" ALTER COLUMN "${seqCol.column_name}" SET DEFAULT nextval('"${seqName}"')`);
        log.success(`  Added sequence for ${tableName}.${seqCol.column_name}`);
      } catch (seqError) {
        log.warning(`  Could not create sequence for ${tableName}.${seqCol.column_name}: ${seqError.message}`);
      }
    }
    
    return true;
    
  } catch (error) {
    log.error(`Failed to create ${tableName}: ${error.message}`);
    return false;
  }
}

// Sync core tables
async function syncCoreTables() {
  log.header('Core Tables Schema Synchronization');
  
  const localPool = new Pool(localConfig);
  const doPool = new Pool(doConfig);
  
  try {
    const [localClient, doClient] = await Promise.all([
      localPool.connect(),
      doPool.connect()
    ]);
    
    try {
      const results = {
        successful: [],
        failed: []
      };
      
      for (const tableName of CORE_TABLES) {
        const success = await createTableInDO(tableName, localClient, doClient);
        
        if (success) {
          results.successful.push(tableName);
        } else {
          results.failed.push(tableName);
        }
      }
      
      log.header('Core Tables Sync Summary');
      log.success(`Successfully created: ${results.successful.length} tables`);
      log.error(`Failed: ${results.failed.length} tables`);
      
      if (results.successful.length > 0) {
        log.info('Successful tables:');
        results.successful.forEach(table => log.info(`  ✓ ${table}`));
      }
      
      if (results.failed.length > 0) {
        log.info('Failed tables:');
        results.failed.forEach(table => log.info(`  ✗ ${table}`));
      }
      
      return {
        success: results.failed.length === 0,
        successful: results.successful.length,
        failed: results.failed.length
      };
      
    } finally {
      localClient.release();
      doClient.release();
    }
    
  } catch (error) {
    log.error(`Core tables sync failed: ${error.message}`);
    return { success: false, error: error.message };
  } finally {
    await Promise.all([localPool.end(), doPool.end()]);
  }
}

// Verify core tables exist
async function verifyCoreTablesExist() {
  log.header('Verifying Core Tables');
  
  const doPool = new Pool(doConfig);
  
  try {
    const client = await doPool.connect();
    
    try {
      const existingTablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN (${CORE_TABLES.map((_, i) => `$${i + 1}`).join(',')})
      `, CORE_TABLES);
      
      const existingTables = existingTablesResult.rows.map(row => row.table_name);
      const missingTables = CORE_TABLES.filter(table => !existingTables.includes(table));
      
      log.info(`Core tables found: ${existingTables.length}/${CORE_TABLES.length}`);
      
      if (existingTables.length > 0) {
        log.success('Existing core tables:');
        existingTables.forEach(table => log.info(`  ✓ ${table}`));
      }
      
      if (missingTables.length > 0) {
        log.warning('Missing core tables:');
        missingTables.forEach(table => log.info(`  ✗ ${table}`));
      }
      
      // Test a simple query on each existing table
      for (const tableName of existingTables) {
        try {
          const countResult = await client.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
          log.info(`  ${tableName}: ${countResult.rows[0].count} records`);
        } catch (error) {
          log.warning(`  ${tableName}: Query failed - ${error.message}`);
        }
      }
      
      return {
        success: missingTables.length === 0,
        existing: existingTables.length,
        missing: missingTables.length,
        existingTables,
        missingTables
      };
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    log.error(`Verification failed: ${error.message}`);
    return { success: false, error: error.message };
  } finally {
    await doPool.end();
  }
}

// Main execution
async function main() {
  console.log(`${colors.bold}${colors.blue}`);
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║              Core Tables Schema Synchronization          ║');
  console.log('║            Essential Tables for TaRL System              ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(colors.reset);
  
  try {
    // First verify what exists
    log.info(`Target tables: ${CORE_TABLES.length}`);
    CORE_TABLES.forEach(table => log.info(`  - ${table}`));
    
    const verifyBefore = await verifyCoreTablesExist();
    
    if (verifyBefore.missing > 0) {
      // Sync missing tables
      const syncResult = await syncCoreTables();
      
      if (syncResult.success) {
        log.success('🎉 All core tables synchronized successfully!');
      } else {
        log.warning('⚠️ Core tables sync completed with some issues');
      }
      
      // Verify after sync
      await verifyCoreTablesExist();
    } else {
      log.success('✅ All core tables already exist in Digital Ocean database');
    }
    
    log.header('Next Steps');
    log.info('1. ✅ Core schema synchronized');
    log.info('2. 🔄 Ready for data synchronization');
    log.info('3. 📝 Run: npm run sync:init (to sync data)');
    
  } catch (error) {
    log.error(`Core tables sync failed: ${error.message}`);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  main().catch(error => {
    log.error(`Fatal error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { syncCoreTables, verifyCoreTablesExist };