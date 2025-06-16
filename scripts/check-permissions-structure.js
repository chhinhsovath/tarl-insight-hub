const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Read .env.local file
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432', 10),
});

async function checkStructure() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking page_permissions table structure...\n');
    
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'page_permissions'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 page_permissions columns:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    // Check role_page_permissions structure
    const rppColumns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'role_page_permissions'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 role_page_permissions columns:');
    rppColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    // Check page_action_permissions structure
    const papColumns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'page_action_permissions'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 page_action_permissions columns:');
    papColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    // Check existing pages
    const pages = await client.query(`
      SELECT * FROM page_permissions 
      WHERE page_name LIKE 'training%'
      ORDER BY sort_order
    `);
    
    console.log('\n📄 Existing training pages:');
    if (pages.rows.length === 0) {
      console.log('  No training pages found');
    } else {
      pages.rows.forEach(page => {
        console.log(`  - ${page.page_name}: ${page.url_path || 'N/A'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkStructure().catch(console.error);