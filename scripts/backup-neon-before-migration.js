#!/usr/bin/env node

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Neon database configuration
const neonConfig = {
  user: 'neondb_owner',
  host: 'ep-bold-sun-a55wq826-pooler.us-east-2.aws.neon.tech',
  database: 'neondb',
  password: 'npg_U9lFscTri3yk',
  port: 5432,
  ssl: { rejectUnauthorized: false }
};

async function backupNeonDatabase() {
  let neonPool;

  try {
    console.log('🔄 Starting Neon database backup...\n');

    // Connect to Neon database
    console.log('📡 Connecting to Neon database...');
    neonPool = new Pool(neonConfig);
    await neonPool.query('SELECT 1');
    console.log('✅ Connected to Neon database\n');

    // Get all tables
    const tablesResult = await neonPool.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `);
    const tables = tablesResult.rows.map(row => row.tablename);
    console.log(`📋 Found ${tables.length} tables: ${tables.join(', ')}\n`);

    if (tables.length === 0) {
      console.log('ℹ️  No tables found in Neon database. Backup not needed.');
      return;
    }

    // Create backup
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(__dirname, `neon_backup_${timestamp}.sql`);
    
    let backupSql = '-- Neon Database Backup\n';
    backupSql += `-- Created: ${new Date().toISOString()}\n\n`;

    for (const tableName of tables) {
      console.log(`📋 Backing up table: ${tableName}`);
      
      try {
        // Get table structure
        const structureResult = await neonPool.query(`
          SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = $1 AND table_schema = 'public'
          ORDER BY ordinal_position
        `, [tableName]);

        if (structureResult.rows.length > 0) {
          // Create table statement
          const columns = structureResult.rows.map(col => {
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

          backupSql += `-- Table: ${tableName}\n`;
          backupSql += `CREATE TABLE IF NOT EXISTS "${tableName}" (${columns});\n\n`;

          // Get data
          const dataResult = await neonPool.query(`SELECT * FROM "${tableName}"`);
          
          if (dataResult.rows.length > 0) {
            const columnNames = Object.keys(dataResult.rows[0]);
            backupSql += `-- Data for table: ${tableName}\n`;
            
            for (const row of dataResult.rows) {
              const values = columnNames.map(col => {
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

              backupSql += `INSERT INTO "${tableName}" ("${columnNames.join('", "')}") VALUES (${values.join(', ')});\n`;
            }
            
            console.log(`✅ Backed up ${dataResult.rows.length} rows from ${tableName}`);
          } else {
            console.log(`ℹ️  Table ${tableName} is empty`);
          }
          
          backupSql += '\n';
        }
      } catch (error) {
        console.warn(`⚠️  Warning: Could not backup table ${tableName}: ${error.message}`);
      }
    }

    // Write backup to file
    fs.writeFileSync(backupFile, backupSql);
    console.log(`\n✅ Backup completed successfully!`);
    console.log(`📁 Backup saved to: ${backupFile}`);
    console.log(`📊 Backup size: ${(fs.statSync(backupFile).size / 1024 / 1024).toFixed(2)} MB`);

  } catch (error) {
    console.error('\n❌ Backup failed:', error.message);
    throw error;
  } finally {
    if (neonPool) {
      await neonPool.end();
      console.log('\n📡 Neon database connection closed');
    }
  }
}

// Run backup
if (require.main === module) {
  backupNeonDatabase().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { backupNeonDatabase };