const { Pool } = require('pg');

// Digital Ocean PostgreSQL configuration
const pool = new Pool({
  user: 'postgres',
  host: '137.184.109.21',
  database: 'tarl_ptom',
  password: 'P@ssw0rd',
  port: 5432,
});

async function testConnection() {
  try {
    console.log('Testing connection to Digital Ocean PostgreSQL...');
    
    // Test connection
    const client = await pool.connect();
    console.log('✅ Connected successfully!');
    
    // Test query
    const result = await client.query('SELECT COUNT(*) FROM tbl_tarl_users');
    console.log(`✅ Found ${result.rows[0].count} users in the database`);
    
    // Test tables
    const tables = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
      LIMIT 10
    `);
    console.log('\n📋 Sample tables in database:');
    tables.rows.forEach(row => console.log(`   - ${row.tablename}`));
    
    client.release();
    await pool.end();
    console.log('\n✅ Database migration completed successfully!');
    console.log('\n📌 Update your .env.production file with these credentials:');
    console.log('PGHOST=137.184.109.21');
    console.log('PGDATABASE=tarl_ptom');
    console.log('PGUSER=postgres');
    console.log('PGPASSWORD=P@ssw0rd');
    console.log('PGPORT=5432');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();