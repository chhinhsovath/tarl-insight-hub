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

async function migrateLargeTable(localPool, neonPool, tableName, totalRows) {
  console.log(`\n📋 Migrating ${tableName} (${totalRows.toLocaleString()} rows)...`);
  
  try {
    // Get table structure
    const schemaResult = await localPool.query(`
      SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = $1 AND table_schema = 'public'
      ORDER BY ordinal_position
    `, [tableName]);

    if (schemaResult.rows.length === 0) {
      console.log(`   ❌ No schema found for ${tableName}`);
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

    const createTableSQL = `CREATE TABLE "${tableName}" (${columns})`;
    
    await neonPool.query(createTableSQL);
    console.log(`   ✅ Created table structure`);

    if (totalRows === 0) {
      console.log(`   ℹ️  Table is empty`);
      return true;
    }

    // Get data in batches
    const batchSize = 1000; // Process 1000 rows at a time
    let processedRows = 0;
    let insertedRows = 0;
    
    console.log(`   📊 Processing ${totalRows.toLocaleString()} rows in batches of ${batchSize}...`);

    for (let offset = 0; offset < totalRows; offset += batchSize) {
      try {
        // Get batch of data
        const dataResult = await localPool.query(`
          SELECT * FROM "${tableName}" 
          ORDER BY (SELECT NULL) 
          LIMIT $1 OFFSET $2
        `, [batchSize, offset]);

        if (dataResult.rows.length === 0) break;

        const columnNames = Object.keys(dataResult.rows[0]);
        
        // Insert each row in the batch
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
            // Skip problematic rows but don't stop the process
            if (processedRows % 1000 === 0) {
              console.log(`   ⚠️  Row error at ${processedRows}: ${error.message.substring(0, 60)}`);
            }
          }
          
          processedRows++;
        }

        // Progress update
        const percentage = Math.round((processedRows / totalRows) * 100);
        console.log(`   📈 Progress: ${processedRows.toLocaleString()}/${totalRows.toLocaleString()} rows (${percentage}%) - Inserted: ${insertedRows.toLocaleString()}`);

      } catch (error) {
        console.log(`   ⚠️  Batch error at offset ${offset}: ${error.message}`);
        // Continue with next batch
      }
    }

    console.log(`   ✅ Completed: ${insertedRows.toLocaleString()}/${totalRows.toLocaleString()} rows inserted`);
    return true;

  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
    return false;
  }
}

async function migrateLargeTables() {
  let localPool, neonPool;

  try {
    console.log('🚀 Migrating large tables (≥ 100 rows)...\n');

    // Connect to databases
    localPool = new Pool(localConfig);
    neonPool = new Pool(neonConfig);
    
    await localPool.query('SELECT 1');
    await neonPool.query('SELECT 1');
    console.log('✅ Connected to both databases');

    // Get existing tables in Neon
    const neonTablesResult = await neonPool.query(`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    `);
    const existingTables = neonTablesResult.rows.map(r => r.tablename);
    
    // Define large tables that need migration (≥ 100 rows)
    const largeTablesToCheck = [
      'tbl_tarl_districts',
      'tbl_tarl_demographics', 
      'tbl_tarl_schools',
      'tbl_tarl_villages',
      'tbl_tarl_student_enrollments',
      'tbl_tarl_tc_st_sch',
      'tbl_tarl_communes' // In case it wasn't fully migrated
    ];
    
    // Get actual row counts and filter
    const largeTables = [];
    for (const tableName of largeTablesToCheck) {
      if (!existingTables.includes(tableName)) {
        try {
          const countResult = await localPool.query(`SELECT COUNT(*) FROM "${tableName}"`);
          const rowCount = parseInt(countResult.rows[0].count);
          if (rowCount >= 100) {
            largeTables.push({ name: tableName, rows: rowCount });
          }
        } catch (error) {
          console.log(`⚠️  Could not check ${tableName}: ${error.message}`);
        }
      }
    }
    
    // Sort by size (smallest first)
    largeTables.sort((a, b) => a.rows - b.rows);
    
    console.log(`\n📊 Large tables to migrate:`);
    largeTables.forEach(t => {
      console.log(`   ${t.name}: ${t.rows.toLocaleString()} rows`);
    });
    
    if (largeTables.length === 0) {
      console.log('\n✅ No large tables to migrate!');
      return;
    }

    console.log(`\n🚀 Starting migration of ${largeTables.length} large tables...`);

    let successCount = 0;
    let errorCount = 0;

    for (const tableInfo of largeTables) {
      const success = await migrateLargeTable(localPool, neonPool, tableInfo.name, tableInfo.rows);
      if (success) {
        successCount++;
      } else {
        errorCount++;
      }
    }

    console.log(`\n🎉 Large tables migration completed!`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);

    // Final status
    const finalNeonCount = await neonPool.query(`
      SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public'
    `);
    
    const localCount = await localPool.query(`
      SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public'
    `);
    
    console.log(`\n📊 Final migration status:`);
    console.log(`   Local tables: ${localCount.rows[0].count}`);
    console.log(`   Neon tables: ${finalNeonCount.rows[0].count}`);
    
    if (parseInt(finalNeonCount.rows[0].count) === parseInt(localCount.rows[0].count)) {
      console.log(`🎉 SUCCESS: All tables migrated!`);
      console.log(`\nNext steps:`);
      console.log(`1. Switch environment to Neon: cp .env.local.neon .env.local`);
      console.log(`2. Test your application`);
      console.log(`3. Verify data integrity`);
    } else {
      console.log(`⚠️  ${parseInt(localCount.rows[0].count) - parseInt(finalNeonCount.rows[0].count)} tables still missing`);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    if (localPool) await localPool.end();
    if (neonPool) await neonPool.end();
  }
}

migrateLargeTables().catch(console.error);