#!/usr/bin/env node

const { Pool } = require('pg');

// Database configurations
const localConfig = {
  user: 'postgres',
  host: 'localhost',
  database: 'pratham_tarl',
  password: '12345',
  port: 5432,
};

const neonConfig = {
  user: 'neondb_owner',
  host: 'ep-bold-sun-a55wq826-pooler.us-east-2.aws.neon.tech',
  database: 'neondb',
  password: 'npg_U9lFscTri3yk',
  port: 5432,
  ssl: { rejectUnauthorized: false }
};

async function resumeMigration() {
  let localPool, neonPool;

  try {
    console.log('🔄 Resuming migration from local PostgreSQL to Neon...\n');

    // Connect to databases
    localPool = new Pool(localConfig);
    neonPool = new Pool(neonConfig);
    
    await localPool.query('SELECT 1');
    await neonPool.query('SELECT 1');
    console.log('✅ Connected to both databases\n');

    // Get tables from both databases
    const localTablesResult = await localPool.query(`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
    `);
    
    const neonTablesResult = await neonPool.query(`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
    `);

    const localTables = localTablesResult.rows.map(r => r.tablename);
    const neonTables = neonTablesResult.rows.map(r => r.tablename);
    
    // Find missing tables
    const missingTables = localTables.filter(t => !neonTables.includes(t));
    
    console.log(`📊 Status:`);
    console.log(`   Local tables: ${localTables.length}`);
    console.log(`   Neon tables: ${neonTables.length}`);
    console.log(`   Missing tables: ${missingTables.length}\n`);

    if (missingTables.length === 0) {
      console.log('🎉 All tables are already migrated!');
      return;
    }

    console.log(`📋 Migrating remaining ${missingTables.length} tables...\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const tableName of missingTables) {
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
          
          await neonPool.query(createTableSQL);
          console.log(`   ✅ Created table structure`);

          // Get and insert data
          const dataResult = await localPool.query(`SELECT * FROM "${tableName}"`);
          
          if (dataResult.rows.length > 0) {
            const columnNames = Object.keys(dataResult.rows[0]);
            let insertedCount = 0;
            
            console.log(`   📊 Inserting ${dataResult.rows.length} rows...`);
            
            // Insert one by one with progress
            for (let i = 0; i < dataResult.rows.length; i++) {
              const row = dataResult.rows[i];
              
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
                
                // Progress indicator
                if (insertedCount % 100 === 0 || insertedCount === dataResult.rows.length) {
                  console.log(`   📈 Progress: ${insertedCount}/${dataResult.rows.length} rows`);
                }
              } catch (error) {
                console.log(`   ⚠️  Row ${i + 1} error: ${error.message.substring(0, 80)}`);
              }
            }
            
            console.log(`   ✅ Inserted ${insertedCount}/${dataResult.rows.length} rows`);
          } else {
            console.log(`   ℹ️  Table is empty`);
          }
          
          successCount++;
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        errorCount++;
      }
      
      console.log(''); // Empty line for readability
    }

    console.log(`🎉 Resume migration completed!`);
    console.log(`✅ Successful tables: ${successCount}`);
    console.log(`❌ Failed tables: ${errorCount}`);

    // Final verification
    const finalNeonTablesResult = await neonPool.query(`
      SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public'
    `);
    
    console.log(`\n📊 Final status:`);
    console.log(`   Local tables: ${localTables.length}`);
    console.log(`   Neon tables: ${finalNeonTablesResult.rows[0].count}`);
    
    if (parseInt(finalNeonTablesResult.rows[0].count) === localTables.length) {
      console.log(`🎉 SUCCESS: All tables migrated!`);
    } else {
      console.log(`⚠️  Some tables may be missing. Run compare script to check.`);
    }

  } catch (error) {
    console.error('❌ Resume migration failed:', error.message);
    throw error;
  } finally {
    if (localPool) await localPool.end();
    if (neonPool) await neonPool.end();
  }
}

resumeMigration().catch(console.error);