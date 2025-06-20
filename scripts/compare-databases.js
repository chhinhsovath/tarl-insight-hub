#!/usr/bin/env node

const { Pool } = require('pg');

async function compareDatabases() {
  console.log('🔍 Comparing Local PostgreSQL vs Neon Database\n');

  const localPool = new Pool({
    user: 'postgres',
    host: 'localhost', 
    database: 'pratham_tarl',
    password: '12345',
    port: 5432,
  });

  const neonPool = new Pool({
    user: 'neondb_owner',
    host: 'ep-bold-sun-a55wq826-pooler.us-east-2.aws.neon.tech',
    database: 'neondb',
    password: 'npg_U9lFscTri3yk',
    port: 5432,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Get tables from both databases
    const localTables = await localPool.query(`
      SELECT tablename, schemaname 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `);

    const neonTables = await neonPool.query(`
      SELECT tablename, schemaname 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `);

    const localTableNames = localTables.rows.map(r => r.tablename);
    const neonTableNames = neonTables.rows.map(r => r.tablename);

    console.log(`📊 Local PostgreSQL: ${localTableNames.length} tables`);
    console.log(`📊 Neon Database: ${neonTableNames.length} tables\n`);

    // Find differences
    const onlyInLocal = localTableNames.filter(t => !neonTableNames.includes(t));
    const onlyInNeon = neonTableNames.filter(t => !localTableNames.includes(t));
    const common = localTableNames.filter(t => neonTableNames.includes(t));

    if (onlyInLocal.length > 0) {
      console.log(`🔹 Tables only in Local (${onlyInLocal.length}):`);
      onlyInLocal.forEach(table => console.log(`   - ${table}`));
      console.log('');
    }

    if (onlyInNeon.length > 0) {
      console.log(`🔸 Tables only in Neon (${onlyInNeon.length}):`);
      onlyInNeon.forEach(table => console.log(`   - ${table}`));
      console.log('');
    }

    console.log(`✅ Common tables (${common.length}):`);
    
    // Compare row counts for common tables
    console.log('\n📈 Row Count Comparison:');
    console.log('Table'.padEnd(35) + 'Local'.padEnd(12) + 'Neon'.padEnd(12) + 'Status');
    console.log('-'.repeat(70));

    for (const table of common.slice(0, 10)) { // Show first 10 tables
      try {
        const localCount = await localPool.query(`SELECT COUNT(*) FROM "${table}"`);
        const neonCount = await neonPool.query(`SELECT COUNT(*) FROM "${table}"`);
        
        const local = parseInt(localCount.rows[0].count);
        const neon = parseInt(neonCount.rows[0].count);
        const status = local === neon ? '✅ Match' : '⚠️  Diff';
        
        console.log(
          table.padEnd(35) + 
          local.toString().padEnd(12) + 
          neon.toString().padEnd(12) + 
          status
        );
      } catch (error) {
        console.log(
          table.padEnd(35) + 
          'Error'.padEnd(12) + 
          'Error'.padEnd(12) + 
          '❌ Error'
        );
      }
    }

    if (common.length > 10) {
      console.log(`... and ${common.length - 10} more tables`);
    }

    console.log('\n📋 Summary:');
    console.log(`• Total tables in Local: ${localTableNames.length}`);
    console.log(`• Total tables in Neon: ${neonTableNames.length}`);
    console.log(`• Common tables: ${common.length}`);
    console.log(`• Local-only tables: ${onlyInLocal.length}`);
    console.log(`• Neon-only tables: ${onlyInNeon.length}`);

  } catch (error) {
    console.error('❌ Comparison failed:', error.message);
  } finally {
    await localPool.end();
    await neonPool.end();
  }
}

compareDatabases().catch(console.error);