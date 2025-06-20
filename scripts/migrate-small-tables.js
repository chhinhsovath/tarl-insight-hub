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

async function getTableSizes(pool) {
  const result = await pool.query(`
    SELECT 
      schemaname,
      tablename,
      (SELECT COUNT(*) FROM pg_catalog.pg_class c WHERE c.relname = tablename) as row_count
    FROM pg_tables 
    WHERE schemaname = 'public'
    ORDER BY tablename
  `);
  
  // Get actual row counts
  const tableSizes = [];
  for (const table of result.rows) {
    try {
      const countResult = await pool.query(`SELECT COUNT(*) FROM "${table.tablename}"`);
      tableSizes.push({
        name: table.tablename,
        rows: parseInt(countResult.rows[0].count)
      });
    } catch (error) {
      tableSizes.push({
        name: table.tablename,
        rows: 0
      });
    }
  }
  
  return tableSizes.sort((a, b) => a.rows - b.rows);
}

async function migrateSmallTables() {
  let localPool, neonPool;

  try {
    console.log('🚀 Migrating small tables first...\n');

    // Connect to databases
    localPool = new Pool(localConfig);
    neonPool = new Pool(neonConfig);
    
    await localPool.query('SELECT 1');
    await neonPool.query('SELECT 1');
    console.log('✅ Connected to both databases\n');

    // Get table sizes from local database
    console.log('📊 Analyzing table sizes...');
    const tableSizes = await getTableSizes(localPool);
    
    // Get existing tables in Neon
    const neonTablesResult = await neonPool.query(`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    `);
    const existingTables = neonTablesResult.rows.map(r => r.tablename);
    
    // Filter out already migrated tables and get small tables (< 100 rows)
    const smallTables = tableSizes.filter(t => 
      !existingTables.includes(t.name) && t.rows < 100
    );
    
    console.log(`\n📋 Table size analysis:`);
    console.log(`   Total tables: ${tableSizes.length}`);
    console.log(`   Already migrated: ${existingTables.length}`);
    console.log(`   Small tables to migrate: ${smallTables.length} (< 100 rows)`);
    
    // Show table breakdown
    console.log(`\n📊 Small tables to migrate:`);
    smallTables.forEach(t => {
      console.log(`   ${t.name}: ${t.rows} rows`);
    });
    
    if (smallTables.length === 0) {
      console.log('\n✅ No small tables to migrate!');
      return;
    }

    console.log(`\n🚀 Starting migration of ${smallTables.length} small tables...\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const tableInfo of smallTables) {
      const tableName = tableInfo.name;
      const rowCount = tableInfo.rows;
      
      console.log(`📋 Migrating ${tableName} (${rowCount} rows)...`);
      
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

          // Get and insert data (since it's small, we can do it all at once)
          if (rowCount > 0) {
            const dataResult = await localPool.query(`SELECT * FROM "${tableName}"`);
            
            if (dataResult.rows.length > 0) {
              const columnNames = Object.keys(dataResult.rows[0]);
              let insertedCount = 0;
              
              // For small tables, insert all rows
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

                const insertSQL = `INSERT INTO "${tableName}" ("${columnNames.join('", "')}") VALUES (${values.join(', ')})`;
                
                try {
                  await neonPool.query(insertSQL);
                  insertedCount++;
                } catch (error) {
                  console.log(`   ⚠️  Row error: ${error.message.substring(0, 60)}`);
                }
              }
              
              console.log(`   ✅ Inserted ${insertedCount}/${dataResult.rows.length} rows`);
            }
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

    console.log(`🎉 Small tables migration completed!`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);

    // Show remaining large tables
    const largeTables = tableSizes.filter(t => 
      !existingTables.includes(t.name) && t.rows >= 100
    );
    
    if (largeTables.length > 0) {
      console.log(`\n📊 Remaining large tables (≥ 100 rows):`);
      largeTables.forEach(t => {
        console.log(`   ${t.name}: ${t.rows} rows`);
      });
      console.log(`\nTo migrate large tables, run: node scripts/migrate-large-tables.js`);
    }

    // Final status
    const finalNeonCount = await neonPool.query(`
      SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public'
    `);
    
    console.log(`\n📊 Current status:`);
    console.log(`   Local tables: ${tableSizes.length}`);
    console.log(`   Neon tables: ${finalNeonCount.rows[0].count}`);
    console.log(`   Remaining: ${tableSizes.length - parseInt(finalNeonCount.rows[0].count)}`);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    if (localPool) await localPool.end();
    if (neonPool) await neonPool.end();
  }
}

migrateSmallTables().catch(console.error);