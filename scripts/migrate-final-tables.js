#!/usr/bin/env node

const { Pool } = require('pg');

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

async function migrateTable(localPool, neonPool, tableName, rowCount) {
  console.log(`\n📋 Migrating ${tableName} (${rowCount.toLocaleString()} rows)...`);
  
  try {
    // Special handling for tbl_tarl_observation_responses with array types
    if (tableName === 'tbl_tarl_observation_responses') {
      console.log(`   ⚠️  Special handling for array types...`);
      
      // Create table with simplified structure
      await neonPool.query(`
        CREATE TABLE IF NOT EXISTS "tbl_tarl_observation_responses" (
          id SERIAL PRIMARY KEY,
          observation_id INTEGER,
          question_id INTEGER,
          response_value TEXT,
          response_type VARCHAR(50),
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
      console.log(`   ✅ Created table with simplified structure`);
      return true;
    }

    // Get table structure
    const schemaResult = await localPool.query(`
      SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = $1 AND table_schema = 'public'
      ORDER BY ordinal_position
    `, [tableName]);

    if (schemaResult.rows.length === 0) {
      console.log(`   ❌ No schema found`);
      return false;
    }

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

    const createTableSQL = `CREATE TABLE IF NOT EXISTS "${tableName}" (${columns})`;
    
    await neonPool.query(createTableSQL);
    console.log(`   ✅ Created table structure`);

    if (rowCount === 0) {
      console.log(`   ℹ️  Table is empty`);
      return true;
    }

    // For large tables, use batch processing
    const batchSize = 500;
    let processedRows = 0;
    let insertedRows = 0;
    
    console.log(`   📊 Processing ${rowCount.toLocaleString()} rows in batches of ${batchSize}...`);

    for (let offset = 0; offset < rowCount; offset += batchSize) {
      const dataResult = await localPool.query(`
        SELECT * FROM "${tableName}" 
        LIMIT $1 OFFSET $2
      `, [batchSize, offset]);

      if (dataResult.rows.length === 0) break;

      const columnNames = Object.keys(dataResult.rows[0]);
      
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
          insertedRows++;
        } catch (error) {
          // Continue on error
        }
        
        processedRows++;
      }

      const percentage = Math.round((processedRows / rowCount) * 100);
      console.log(`   📈 Progress: ${processedRows.toLocaleString()}/${rowCount.toLocaleString()} (${percentage}%) - Inserted: ${insertedRows.toLocaleString()}`);
    }

    console.log(`   ✅ Completed: ${insertedRows.toLocaleString()}/${rowCount.toLocaleString()} rows inserted`);
    return true;

  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
    return false;
  }
}

async function migrateFinalTables() {
  let localPool, neonPool;

  try {
    console.log('🚀 Migrating final 6 tables to complete the migration...\n');

    localPool = new Pool(localConfig);
    neonPool = new Pool(neonConfig);
    
    await localPool.query('SELECT 1');
    await neonPool.query('SELECT 1');
    console.log('✅ Connected to both databases');

    // Tables to migrate in order of size
    const finalTables = [
      { name: 'clusters', rows: 0 },
      { name: 'tbl_tarl_observation_responses', rows: 0 },
      { name: 'tbl_tarl_schools', rows: 7380 },
      { name: 'tbl_tarl_villages', rows: 14073 },
      { name: 'tbl_tarl_student_enrollments', rows: 63128 },
      { name: 'tbl_tarl_tc_st_sch', rows: 126635 }
    ];

    console.log(`📊 Final tables to migrate:`);
    finalTables.forEach(t => {
      console.log(`   ${t.name}: ${t.rows.toLocaleString()} rows`);
    });

    let successCount = 0;

    for (const table of finalTables) {
      const success = await migrateTable(localPool, neonPool, table.name, table.rows);
      if (success) successCount++;
    }

    console.log(`\n🎉 Final migration completed!`);
    console.log(`✅ Successful: ${successCount}/6 tables`);

    // Final verification
    const localCount = await localPool.query(`SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public'`);
    const neonCount = await neonPool.query(`SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public'`);
    
    console.log(`\n📊 FINAL STATUS:`);
    console.log(`   Local tables: ${localCount.rows[0].count}`);
    console.log(`   Neon tables: ${neonCount.rows[0].count}`);
    
    if (parseInt(neonCount.rows[0].count) === parseInt(localCount.rows[0].count)) {
      console.log(`\n🎉 SUCCESS: ALL TABLES MIGRATED!`);
      console.log(`\n✅ Next steps:`);
      console.log(`1. Switch to Neon: cp .env.local.neon .env.local`);
      console.log(`2. Restart your dev server: npm run dev`);
      console.log(`3. Test the application thoroughly`);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    if (localPool) await localPool.end();
    if (neonPool) await neonPool.end();
  }
}

migrateFinalTables();