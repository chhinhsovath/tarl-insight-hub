#!/usr/bin/env node

/**
 * Database Schema Synchronization Script
 * Copies complete schema from local database to Digital Ocean database
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

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
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
};

const digitalOceanConfig = {
  user: 'postgres',
  host: '137.184.109.21',
  database: 'tarl_ptom',
  password: 'P@ssw0rd',
  port: 5432,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
  ssl: {
    rejectUnauthorized: false
  }
};

// Export schema from local database
async function exportLocalSchema() {
  log.header('Exporting Local Database Schema');
  
  const pool = new Pool(localConfig);
  
  try {
    const client = await pool.connect();
    
    try {
      // Get all tables
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `);
      
      const tables = tablesResult.rows.map(row => row.table_name);
      log.info(`Found ${tables.length} tables to export`);
      
      let schemaSQL = '';
      
      // Add header comment
      schemaSQL += '-- TaRL Insight Hub Database Schema\n';
      schemaSQL += `-- Exported from local database: ${new Date().toISOString()}\n`;
      schemaSQL += '-- This file contains the complete database schema\n\n';
      
      // Drop existing tables (in reverse order to handle dependencies)
      schemaSQL += '-- Drop existing tables\n';
      for (const tableName of tables.reverse()) {
        schemaSQL += `DROP TABLE IF EXISTS "${tableName}" CASCADE;\n`;
      }
      schemaSQL += '\n';
      
      // Reverse back to original order
      tables.reverse();
      
      // Get table schemas
      for (const tableName of tables) {
        log.info(`Exporting table: ${tableName}`);
        
        // Get table definition
        const tableDefResult = await client.query(`
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
          log.warning(`No columns found for table ${tableName}`);
          continue;
        }
        
        // Build CREATE TABLE statement
        schemaSQL += `-- Table: ${tableName}\n`;
        schemaSQL += `CREATE TABLE "${tableName}" (\n`;
        
        const columns = tableDefResult.rows.map(col => {
          let columnDef = `  "${col.column_name}" `;
          
          // Data type
          if (col.data_type === 'character varying') {
            columnDef += `VARCHAR(${col.character_maximum_length || 255})`;
          } else if (col.data_type === 'numeric') {
            columnDef += `NUMERIC(${col.numeric_precision},${col.numeric_scale})`;
          } else if (col.data_type === 'timestamp without time zone') {
            columnDef += 'TIMESTAMP';
          } else if (col.data_type === 'timestamp with time zone') {
            columnDef += 'TIMESTAMPTZ';
          } else {
            columnDef += col.data_type.toUpperCase();
          }
          
          // Nullable
          if (col.is_nullable === 'NO') {
            columnDef += ' NOT NULL';
          }
          
          // Default
          if (col.column_default) {
            columnDef += ` DEFAULT ${col.column_default}`;
          }
          
          return columnDef;
        });
        
        schemaSQL += columns.join(',\n');
        schemaSQL += '\n);\n\n';
        
        // Get indexes
        const indexesResult = await client.query(`
          SELECT 
            indexname,
            indexdef
          FROM pg_indexes
          WHERE tablename = $1 AND schemaname = 'public'
          AND indexname NOT LIKE '%_pkey'
        `, [tableName]);
        
        if (indexesResult.rows.length > 0) {
          schemaSQL += `-- Indexes for ${tableName}\n`;
          for (const index of indexesResult.rows) {
            schemaSQL += `${index.indexdef};\n`;
          }
          schemaSQL += '\n';
        }
        
        // Get primary key
        const pkResult = await client.query(`
          SELECT a.attname
          FROM pg_index i
          JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
          WHERE i.indrelid = $1::regclass AND i.indisprimary
        `, [tableName]);
        
        if (pkResult.rows.length > 0) {
          const pkColumns = pkResult.rows.map(row => `"${row.attname}"`).join(', ');
          schemaSQL += `-- Primary key for ${tableName}\n`;
          schemaSQL += `ALTER TABLE "${tableName}" ADD PRIMARY KEY (${pkColumns});\n\n`;
        }
      }
      
      // Get sequences
      const sequencesResult = await client.query(`
        SELECT sequence_name 
        FROM information_schema.sequences 
        WHERE sequence_schema = 'public'
      `);
      
      if (sequencesResult.rows.length > 0) {
        schemaSQL += '-- Sequences\n';
        for (const seq of sequencesResult.rows) {
          const seqDefResult = await client.query(`
            SELECT * FROM "${seq.sequence_name}"
          `);
          
          if (seqDefResult.rows.length > 0) {
            const seqInfo = seqDefResult.rows[0];
            schemaSQL += `CREATE SEQUENCE IF NOT EXISTS "${seq.sequence_name}" `;
            schemaSQL += `START WITH ${seqInfo.last_value} `;
            schemaSQL += `INCREMENT BY ${seqInfo.increment_by};\n`;
          }
        }
        schemaSQL += '\n';
      }
      
      // Get foreign keys
      const foreignKeysResult = await client.query(`
        SELECT
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name,
          tc.constraint_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
      `);
      
      if (foreignKeysResult.rows.length > 0) {
        schemaSQL += '-- Foreign Keys\n';
        for (const fk of foreignKeysResult.rows) {
          schemaSQL += `ALTER TABLE "${fk.table_name}" `;
          schemaSQL += `ADD CONSTRAINT "${fk.constraint_name}" `;
          schemaSQL += `FOREIGN KEY ("${fk.column_name}") `;
          schemaSQL += `REFERENCES "${fk.foreign_table_name}" ("${fk.foreign_column_name}");\n`;
        }
        schemaSQL += '\n';
      }
      
      // Save to file
      const outputPath = path.join(__dirname, '../database/complete_schema.sql');
      fs.writeFileSync(outputPath, schemaSQL);
      
      log.success(`Schema exported to: ${outputPath}`);
      log.info(`Schema file size: ${(schemaSQL.length / 1024).toFixed(1)} KB`);
      
      return { success: true, schemaSQL, outputPath };
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    log.error(`Schema export failed: ${error.message}`);
    return { success: false, error: error.message };
  } finally {
    await pool.end();
  }
}

// Apply schema to Digital Ocean database
async function applySchemaToDigitalOcean(schemaSQL) {
  log.header('Applying Schema to Digital Ocean Database');
  
  const pool = new Pool(digitalOceanConfig);
  
  try {
    const client = await pool.connect();
    
    try {
      log.warning('This will DROP ALL EXISTING TABLES in the Digital Ocean database');
      log.info('Starting schema application...');
      
      // Split SQL into individual statements
      const statements = schemaSQL.split(';').filter(stmt => stmt.trim().length > 0);
      
      log.info(`Executing ${statements.length} SQL statements...`);
      
      let successCount = 0;
      let errorCount = 0;
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i].trim();
        if (!statement) continue;
        
        try {
          await client.query(statement);
          successCount++;
          
          // Log progress for large operations
          if (i % 10 === 0) {
            log.info(`Progress: ${i + 1}/${statements.length} statements executed`);
          }
        } catch (error) {
          errorCount++;
          log.warning(`Statement ${i + 1} failed: ${error.message.substring(0, 100)}...`);
        }
      }
      
      log.success(`Schema application completed: ${successCount} successful, ${errorCount} errors`);
      
      return { success: errorCount === 0, successCount, errorCount };
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    log.error(`Schema application failed: ${error.message}`);
    return { success: false, error: error.message };
  } finally {
    await pool.end();
  }
}

// Verify schema consistency
async function verifySchemaConsistency() {
  log.header('Verifying Schema Consistency');
  
  const localPool = new Pool(localConfig);
  const doPool = new Pool(digitalOceanConfig);
  
  try {
    const [localClient, doClient] = await Promise.all([
      localPool.connect(),
      doPool.connect()
    ]);
    
    try {
      // Compare table counts
      const [localTables, doTables] = await Promise.all([
        localClient.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
          ORDER BY table_name
        `),
        doClient.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
          ORDER BY table_name
        `)
      ]);
      
      const localTableNames = localTables.rows.map(r => r.table_name).sort();
      const doTableNames = doTables.rows.map(r => r.table_name).sort();
      
      log.info(`Local database: ${localTableNames.length} tables`);
      log.info(`Digital Ocean database: ${doTableNames.length} tables`);
      
      // Check for missing tables
      const missingInDO = localTableNames.filter(table => !doTableNames.includes(table));
      const extraInDO = doTableNames.filter(table => !localTableNames.includes(table));
      
      if (missingInDO.length > 0) {
        log.error(`Tables missing in DO: ${missingInDO.join(', ')}`);
      }
      
      if (extraInDO.length > 0) {
        log.warning(`Extra tables in DO: ${extraInDO.join(', ')}`);
      }
      
      // Compare column structures for common tables
      const commonTables = localTableNames.filter(table => doTableNames.includes(table));
      let schemaMismatchCount = 0;
      
      for (const tableName of commonTables.slice(0, 10)) { // Check first 10 tables
        const [localCols, doCols] = await Promise.all([
          localClient.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = $1 AND table_schema = 'public'
            ORDER BY ordinal_position
          `, [tableName]),
          doClient.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = $1 AND table_schema = 'public'
            ORDER BY ordinal_position
          `, [tableName])
        ]);
        
        const localSchema = JSON.stringify(localCols.rows);
        const doSchema = JSON.stringify(doCols.rows);
        
        if (localSchema !== doSchema) {
          schemaMismatchCount++;
          log.warning(`Schema mismatch in table: ${tableName}`);
        }
      }
      
      // Summary
      const tablesMatch = localTableNames.length === doTableNames.length && 
                         missingInDO.length === 0 && 
                         extraInDO.length === 0;
      
      const schemasMatch = schemaMismatchCount === 0;
      
      if (tablesMatch && schemasMatch) {
        log.success('✅ Schemas are consistent between both databases');
      } else {
        log.warning(`⚠️ Schema inconsistencies detected:`);
        log.warning(`  Table count match: ${tablesMatch}`);
        log.warning(`  Column structure match: ${schemasMatch}`);
      }
      
      return {
        success: tablesMatch && schemasMatch,
        tablesMatch,
        schemasMatch,
        localTables: localTableNames.length,
        doTables: doTableNames.length,
        schemaMismatches: schemaMismatchCount
      };
      
    } finally {
      localClient.release();
      doClient.release();
    }
    
  } catch (error) {
    log.error(`Schema verification failed: ${error.message}`);
    return { success: false, error: error.message };
  } finally {
    await Promise.all([localPool.end(), doPool.end()]);
  }
}

// Main execution
async function main() {
  console.log(`${colors.bold}${colors.blue}`);
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║              Database Schema Synchronization             ║');
  console.log('║         Local PostgreSQL → Digital Ocean PostgreSQL      ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(colors.reset);
  
  try {
    // Step 1: Export local schema
    const exportResult = await exportLocalSchema();
    if (!exportResult.success) {
      log.error('Schema export failed, aborting');
      return;
    }
    
    // Step 2: Apply schema to Digital Ocean
    const applyResult = await applySchemaToDigitalOcean(exportResult.schemaSQL);
    if (!applyResult.success) {
      log.error('Schema application failed');
    } else {
      log.success('Schema application completed');
    }
    
    // Step 3: Verify consistency
    const verifyResult = await verifySchemaConsistency();
    
    // Final summary
    log.header('Schema Synchronization Summary');
    log.info(`Export: ${exportResult.success ? '✅ Success' : '❌ Failed'}`);
    log.info(`Apply: ${applyResult.success ? '✅ Success' : '❌ Failed'}`);
    log.info(`Verify: ${verifyResult.success ? '✅ Consistent' : '⚠️ Issues detected'}`);
    
    if (exportResult.success && applyResult.success && verifyResult.success) {
      log.success('🎉 Database schemas are now synchronized!');
      log.info('You can now proceed with data synchronization');
    } else {
      log.warning('⚠️ Schema synchronization completed with issues');
      log.info('Please review the logs above and fix any issues before data sync');
    }
    
  } catch (error) {
    log.error(`Schema synchronization failed: ${error.message}`);
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

module.exports = { exportLocalSchema, applySchemaToDigitalOcean, verifySchemaConsistency };