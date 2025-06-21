#!/usr/bin/env node

/**
 * Simple Database Connection Test
 * Tests both local and Digital Ocean PostgreSQL connections
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

// Local Database Configuration
const localConfig = {
  user: 'postgres',
  host: 'localhost',
  database: 'pratham_tarl',
  password: '12345',
  port: 5432,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
};

// Digital Ocean Database Configuration
const digitalOceanConfig = {
  user: 'postgres',
  host: '137.184.109.21',
  database: 'tarl_ptom',
  password: 'P@ssw0rd',
  port: 5432,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: {
    rejectUnauthorized: false
  }
};

// Test a database connection
async function testConnection(name, config) {
  log.info(`Testing ${name} database connection...`);
  
  const pool = new Pool(config);
  
  try {
    // Test basic connection
    const client = await pool.connect();
    
    try {
      // Test query
      const result = await client.query('SELECT NOW() as current_time, current_database() as db_name, current_user as user_name');
      
      if (result.rows && result.rows.length > 0) {
        const info = result.rows[0];
        log.success(`${name} connection successful`);
        log.info(`  Database: ${info.db_name}`);
        log.info(`  User: ${info.user_name}`);
        log.info(`  Time: ${info.current_time}`);
        
        // Test table existence
        const tableCheck = await client.query(`
          SELECT COUNT(*) as table_count 
          FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name LIKE 'tbl_tarl_%'
        `);
        
        log.info(`  TaRL Tables: ${tableCheck.rows[0].table_count}`);
        
        // Test specific important tables
        const importantTables = ['tbl_tarl_schools', 'tbl_tarl_users', 'tbl_tarl_demographics'];
        
        for (const tableName of importantTables) {
          try {
            const countResult = await client.query(`SELECT COUNT(*) as count FROM ${tableName}`);
            log.info(`  ${tableName}: ${countResult.rows[0].count} records`);
          } catch (tableError) {
            log.warning(`  ${tableName}: Table not found or accessible`);
          }
        }
        
        return true;
      } else {
        log.error(`${name} connection failed - no response`);
        return false;
      }
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    log.error(`${name} connection failed: ${error.message}`);
    return false;
  } finally {
    await pool.end();
  }
}

// Test synchronization potential
async function testSyncCompatibility() {
  log.header('Testing Synchronization Compatibility');
  
  const localPool = new Pool(localConfig);
  const doPool = new Pool(digitalOceanConfig);
  
  try {
    const [localClient, doClient] = await Promise.all([
      localPool.connect(),
      doPool.connect()
    ]);
    
    try {
      // Compare schemas
      const schemaQuery = `
        SELECT table_name, column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name IN ('tbl_tarl_schools', 'tbl_tarl_demographics')
        ORDER BY table_name, ordinal_position
      `;
      
      const [localSchema, doSchema] = await Promise.all([
        localClient.query(schemaQuery),
        doClient.query(schemaQuery)
      ]);
      
      log.info('Schema comparison:');
      log.info(`  Local tables: ${new Set(localSchema.rows.map(r => r.table_name)).size}`);
      log.info(`  DO tables: ${new Set(doSchema.rows.map(r => r.table_name)).size}`);
      
      // Check if schemas match
      const localSchemaStr = JSON.stringify(localSchema.rows.sort());
      const doSchemaStr = JSON.stringify(doSchema.rows.sort());
      
      if (localSchemaStr === doSchemaStr) {
        log.success('Schemas match - synchronization compatible');
      } else {
        log.warning('Schema differences detected');
        
        // Show differences
        const localTables = new Set(localSchema.rows.map(r => r.table_name));
        const doTables = new Set(doSchema.rows.map(r => r.table_name));
        
        const onlyLocal = [...localTables].filter(t => !doTables.has(t));
        const onlyDO = [...doTables].filter(t => !localTables.has(t));
        
        if (onlyLocal.length > 0) {
          log.warning(`  Tables only in local: ${onlyLocal.join(', ')}`);
        }
        if (onlyDO.length > 0) {
          log.warning(`  Tables only in DO: ${onlyDO.join(', ')}`);
        }
      }
      
    } finally {
      localClient.release();
      doClient.release();
    }
    
  } catch (error) {
    log.error(`Sync compatibility test failed: ${error.message}`);
  } finally {
    await Promise.all([localPool.end(), doPool.end()]);
  }
}

// Test data integrity
async function testDataIntegrity() {
  log.header('Testing Data Integrity');
  
  const localPool = new Pool(localConfig);
  
  try {
    const client = await localPool.connect();
    
    try {
      // Test critical data relationships
      const integrityTests = [
        {
          name: 'Users with valid roles',
          query: `
            SELECT COUNT(*) as count 
            FROM tbl_tarl_users u 
            LEFT JOIN tbl_tarl_roles r ON u.role = r.role_name 
            WHERE r.role_name IS NULL
          `,
          expectZero: true
        },
        {
          name: 'Schools with valid provinces',
          query: `
            SELECT COUNT(*) as count 
            FROM tbl_tarl_schools 
            WHERE "sclProvinceName" IS NOT NULL AND "sclProvinceName" != ''
          `,
          expectZero: false
        },
        {
          name: 'Demographics data completeness',
          query: `
            SELECT COUNT(*) as count 
            FROM tbl_tarl_demographics 
            WHERE pro_name IS NULL OR dis_name IS NULL OR com_name IS NULL OR vil_name IS NULL
          `,
          expectZero: true
        }
      ];
      
      for (const test of integrityTests) {
        try {
          const result = await client.query(test.query);
          const count = parseInt(result.rows[0].count);
          
          if (test.expectZero && count === 0) {
            log.success(`${test.name}: OK (${count})`);
          } else if (!test.expectZero && count > 0) {
            log.success(`${test.name}: OK (${count} records)`);
          } else {
            log.warning(`${test.name}: Issue detected (${count})`);
          }
        } catch (error) {
          log.error(`${test.name}: Test failed - ${error.message}`);
        }
      }
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    log.error(`Data integrity test failed: ${error.message}`);
  } finally {
    await localPool.end();
  }
}

// Main test function
async function runTests() {
  console.log(`${colors.bold}${colors.blue}`);
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║                Database Connection Test Suite             ║');
  console.log('║           Local PostgreSQL & Digital Ocean Tests         ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(colors.reset);
  
  try {
    log.header('Database Connection Tests');
    
    // Test local database
    const localSuccess = await testConnection('Local PostgreSQL', localConfig);
    
    // Test Digital Ocean database
    const doSuccess = await testConnection('Digital Ocean PostgreSQL', digitalOceanConfig);
    
    // Test synchronization compatibility
    if (localSuccess && doSuccess) {
      await testSyncCompatibility();
    } else {
      log.warning('Skipping sync tests - one or both connections failed');
    }
    
    // Test data integrity on local database
    if (localSuccess) {
      await testDataIntegrity();
    }
    
    log.header('Test Summary');
    log.info(`Local Database: ${localSuccess ? 'Connected' : 'Failed'}`);
    log.info(`Digital Ocean Database: ${doSuccess ? 'Connected' : 'Failed'}`);
    
    if (localSuccess && doSuccess) {
      log.success('Both databases are accessible - ready for synchronization');
    } else if (localSuccess) {
      log.warning('Only local database accessible - check DO configuration');
    } else if (doSuccess) {
      log.warning('Only Digital Ocean accessible - check local configuration');
    } else {
      log.error('No databases accessible - check all configurations');
    }
    
  } catch (error) {
    log.error(`Test suite failed: ${error.message}`);
    process.exit(1);
  }
}

// Run tests if called directly
if (require.main === module) {
  runTests().catch(error => {
    log.error(`Fatal error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { runTests, testConnection };