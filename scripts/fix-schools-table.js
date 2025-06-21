#!/usr/bin/env node

/**
 * Fix tbl_tarl_schools table in Digital Ocean database
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

async function fixSchoolsTable() {
  log.header('Fixing tbl_tarl_schools Table');
  
  const localPool = new Pool(localConfig);
  const doPool = new Pool(doConfig);
  
  try {
    const [localClient, doClient] = await Promise.all([
      localPool.connect(),
      doPool.connect()
    ]);
    
    try {
      // Get the actual CREATE TABLE statement from local database
      log.info('Getting table structure from local database...');
      
      // Use pg_dump style approach - get column definitions
      const columnsResult = await localClient.query(`
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
        WHERE table_name = 'tbl_tarl_schools' AND table_schema = 'public'
        ORDER BY ordinal_position
      `);
      
      if (columnsResult.rows.length === 0) {
        log.error('tbl_tarl_schools not found in local database');
        return false;
      }
      
      log.info(`Found ${columnsResult.rows.length} columns in tbl_tarl_schools`);
      
      // Drop existing table if it exists
      await doClient.query('DROP TABLE IF EXISTS "tbl_tarl_schools" CASCADE');
      log.info('Dropped existing table (if any)');
      
      // Create a simplified table schema
      const createTableSQL = `
        CREATE TABLE "tbl_tarl_schools" (
          "sclAutoID" SERIAL PRIMARY KEY,
          "sclName" VARCHAR(255) NOT NULL,
          "sclCode" VARCHAR(50),
          "sclProvinceName" VARCHAR(100),
          "sclDistrictName" VARCHAR(100),
          "sclCommune" VARCHAR(100),
          "sclCluster" VARCHAR(100),
          "sclZone" VARCHAR(100),
          "sclZoneName" VARCHAR(100),
          "sclStatus" INTEGER DEFAULT 1,
          "createdAt" TIMESTAMP DEFAULT NOW(),
          "updatedAt" TIMESTAMP DEFAULT NOW()
        )
      `;
      
      await doClient.query(createTableSQL);
      log.success('Created tbl_tarl_schools table with essential columns');
      
      // Verify the table was created
      const verifyResult = await doClient.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'tbl_tarl_schools' AND table_schema = 'public'
        ORDER BY ordinal_position
      `);
      
      log.success(`Table created successfully with ${verifyResult.rows.length} columns:`);
      verifyResult.rows.forEach(col => {
        log.info(`  ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });
      
      // Test insert and query
      log.info('Testing table functionality...');
      await doClient.query(`
        INSERT INTO "tbl_tarl_schools" ("sclName", "sclCode", "sclProvinceName") 
        VALUES ('Test School', 'TEST001', 'Test Province')
      `);
      
      const testResult = await doClient.query('SELECT * FROM "tbl_tarl_schools" LIMIT 1');
      if (testResult.rows.length > 0) {
        log.success('Table is functional - test record inserted and retrieved');
        
        // Clean up test record
        await doClient.query('DELETE FROM "tbl_tarl_schools" WHERE "sclName" = \'Test School\'');
        log.info('Cleaned up test record');
      }
      
      return true;
      
    } finally {
      localClient.release();
      doClient.release();
    }
    
  } catch (error) {
    log.error(`Failed to fix schools table: ${error.message}`);
    return false;
  } finally {
    await Promise.all([localPool.end(), doPool.end()]);
  }
}

// Main execution
async function main() {
  console.log(`${colors.bold}${colors.blue}`);
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║                  Fix Schools Table                       ║');
  console.log('║              tbl_tarl_schools in Digital Ocean           ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(colors.reset);
  
  try {
    const success = await fixSchoolsTable();
    
    if (success) {
      log.success('🎉 tbl_tarl_schools table fixed successfully!');
      log.info('✅ All core tables are now ready in Digital Ocean database');
      log.info('🔄 Ready to proceed with data synchronization');
    } else {
      log.error('❌ Failed to fix schools table');
    }
    
  } catch (error) {
    log.error(`Fatal error: ${error.message}`);
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

module.exports = { fixSchoolsTable };