#!/usr/bin/env node

const { Pool } = require('pg');

// Test both database connections
async function testConnections() {
  console.log('🔍 Testing Database Connections\n');

  // Local PostgreSQL
  console.log('📡 Testing Local PostgreSQL...');
  const localPool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'pratham_tarl',
    password: '12345',
    port: 5432,
  });

  try {
    const result = await localPool.query('SELECT NOW(), COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = \'public\'');
    console.log('✅ Local PostgreSQL: Connected');
    console.log(`   Time: ${result.rows[0].now}`);
    console.log(`   Tables: ${result.rows[0].table_count}`);
  } catch (error) {
    console.log('❌ Local PostgreSQL: Failed');
    console.log(`   Error: ${error.message}`);
  } finally {
    await localPool.end();
  }

  console.log('');

  // Neon Database
  console.log('📡 Testing Neon Database...');
  const neonPool = new Pool({
    user: 'neondb_owner',
    host: 'ep-bold-sun-a55wq826-pooler.us-east-2.aws.neon.tech',
    database: 'neondb',
    password: 'npg_U9lFscTri3yk',
    port: 5432,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const result = await neonPool.query('SELECT NOW(), COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = \'public\'');
    console.log('✅ Neon Database: Connected');
    console.log(`   Time: ${result.rows[0].now}`);
    console.log(`   Tables: ${result.rows[0].table_count}`);
  } catch (error) {
    console.log('❌ Neon Database: Failed');
    console.log(`   Error: ${error.message}`);
  } finally {
    await neonPool.end();
  }

  console.log('\n🎯 Connection test completed!');
}

testConnections().catch(console.error);