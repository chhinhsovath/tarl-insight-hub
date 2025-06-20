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

async function checkRemainingTables() {
  let localPool, neonPool;

  try {
    localPool = new Pool(localConfig);
    neonPool = new Pool(neonConfig);
    
    await localPool.query('SELECT 1');
    await neonPool.query('SELECT 1');

    const localTables = await localPool.query(`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
    `);
    
    const neonTables = await neonPool.query(`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
    `);

    const localTableNames = localTables.rows.map(r => r.tablename);
    const neonTableNames = neonTables.rows.map(r => r.tablename);
    
    const missing = localTableNames.filter(t => !neonTableNames.includes(t));
    
    console.log('📊 Migration Status:');
    console.log(`   Local: ${localTableNames.length} tables`);
    console.log(`   Neon: ${neonTableNames.length} tables`);
    console.log(`   Missing: ${missing.length} tables\n`);

    if (missing.length > 0) {
      console.log('📋 Remaining tables to migrate:');
      for (const tableName of missing) {
        try {
          const count = await localPool.query(`SELECT COUNT(*) FROM "${tableName}"`);
          console.log(`   ${tableName}: ${parseInt(count.rows[0].count).toLocaleString()} rows`);
        } catch (error) {
          console.log(`   ${tableName}: Error getting count`);
        }
      }
    } else {
      console.log('🎉 All tables migrated!');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (localPool) await localPool.end();
    if (neonPool) await neonPool.end();
  }
}

checkRemainingTables();