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

async function simpleCleanNeon(pool) {
  console.log('🧹 Simple Neon database cleanup...');
  
  // Get all tables
  const result = await pool.query(`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
  `);
  
  const tables = result.rows.map(r => r.tablename);
  console.log(`Found ${tables.length} tables to drop`);
  
  // Multiple passes to handle dependencies
  let remaining = [...tables];
  let attempts = 0;
  const maxAttempts = 10;
  
  while (remaining.length > 0 && attempts < maxAttempts) {
    attempts++;
    console.log(`Pass ${attempts}: ${remaining.length} tables remaining`);
    
    const dropped = [];
    
    for (const table of remaining) {
      try {
        await pool.query(`DROP TABLE "${table}" CASCADE`);
        console.log(`✅ Dropped ${table}`);
        dropped.push(table);
      } catch (error) {
        // Skip for now, will try again
      }
    }
    
    if (dropped.length === 0) {
      // Force drop remaining tables
      console.log('🔨 Force dropping remaining tables...');
      for (const table of remaining) {
        try {
          await pool.query(`DROP TABLE IF EXISTS "${table}" CASCADE`);
          console.log(`🔨 Force dropped ${table}`);
        } catch (error) {
          console.log(`⚠️  Could not drop ${table}: ${error.message}`);
        }
      }
      break;
    }
    
    remaining = remaining.filter(t => !dropped.includes(t));
  }
  
  // Verify cleanup
  const finalCheck = await pool.query(`
    SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public'
  `);
  
  console.log(`✅ Cleanup complete. ${finalCheck.rows[0].count} tables remaining`);
}

async function exportAndImport() {
  let localPool, neonPool;

  try {
    console.log('🚀 Simple migration from local PostgreSQL to Neon...\n');

    // Connect to databases
    localPool = new Pool(localConfig);
    neonPool = new Pool(neonConfig);
    
    await localPool.query('SELECT 1');
    await neonPool.query('SELECT 1');
    console.log('✅ Connected to both databases\n');

    // Clean Neon
    await simpleCleanNeon(neonPool);

    // Get tables from local
    const tablesResult = await localPool.query(`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
    `);
    const tables = tablesResult.rows.map(r => r.tablename);
    console.log(`\n📋 Found ${tables.length} tables in local database\n`);

    // Process each table
    let totalSuccess = 0;
    let totalErrors = 0;

    for (const tableName of tables) {
      console.log(`📋 Processing ${tableName}...`);
      
      try {
        // Get table structure
        const schemaResult = await localPool.query(`
          SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = $1 AND table_schema = 'public'
          ORDER BY ordinal_position
        `, [tableName]);

        if (schemaResult.rows.length > 0) {
          // Create table
          const columns = schemaResult.rows.map(col => {
            let colDef = `"${col.column_name}" ${col.data_type}`;
            
            if (col.data_type === 'character varying' && col.character_maximum_length) {
              colDef += `(${col.character_maximum_length})`;
            }
            
            if (col.is_nullable === 'NO') {
              colDef += ' NOT NULL';
            }
            
            if (col.column_default && !col.column_default.includes('nextval')) {
              colDef += ` DEFAULT ${col.column_default}`;
            }
            
            return colDef;
          }).join(', ');

          const createTableSQL = `CREATE TABLE "${tableName}" (${columns})`;
          
          try {
            await neonPool.query(createTableSQL);
            console.log(`✅ Created table structure for ${tableName}`);
          } catch (error) {
            console.log(`⚠️  Warning creating ${tableName}: ${error.message}`);
          }

          // Get and insert data
          const dataResult = await localPool.query(`SELECT * FROM "${tableName}"`);
          
          if (dataResult.rows.length > 0) {
            const columnNames = Object.keys(dataResult.rows[0]);
            let insertedCount = 0;
            
            // Insert in batches
            const batchSize = 100;
            for (let i = 0; i < dataResult.rows.length; i += batchSize) {
              const batch = dataResult.rows.slice(i, i + batchSize);
              
              for (const row of batch) {
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

                const insertSQL = `INSERT INTO "${tableName}" ("${columnNames.join('", "')}") VALUES (${values.join(', ')})`;
                
                try {
                  await neonPool.query(insertSQL);
                  insertedCount++;
                } catch (error) {
                  // Skip problematic rows
                }
              }
            }
            
            console.log(`✅ Inserted ${insertedCount}/${dataResult.rows.length} rows into ${tableName}`);
            totalSuccess++;
          } else {
            console.log(`ℹ️  Table ${tableName} is empty`);
            totalSuccess++;
          }
        }
      } catch (error) {
        console.log(`❌ Error processing ${tableName}: ${error.message}`);
        totalErrors++;
      }
    }

    console.log(`\n🎉 Migration completed!`);
    console.log(`✅ Successful tables: ${totalSuccess}`);
    console.log(`❌ Failed tables: ${totalErrors}`);

    // Quick verification
    const localTableCount = await localPool.query(`SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public'`);
    const neonTableCount = await neonPool.query(`SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public'`);
    
    console.log(`\n📊 Verification:`);
    console.log(`Local tables: ${localTableCount.rows[0].count}`);
    console.log(`Neon tables: ${neonTableCount.rows[0].count}`);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    if (localPool) await localPool.end();
    if (neonPool) await neonPool.end();
  }
}

exportAndImport().catch(console.error);