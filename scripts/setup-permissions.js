const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432', 10),
});

async function setupPermissions() {
  const client = await pool.connect();
  
  try {
    console.log('Setting up permission system...');
    
    // Read the SQL schema file
    const schemaPath = path.join(__dirname, '../database/permissions_schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute the schema
    await client.query(schemaSql);
    
    console.log('✅ Permission system setup completed successfully!');
    console.log('');
    console.log('Default permission sets have been created:');
    console.log('- Admin: Full access to all pages');
    console.log('- Collector: Dashboard, Schools, Students, Observations, Collection, Visits');
    console.log('- Teacher: Dashboard, Students, Progress, Training');
    console.log('- Coordinator: Dashboard, Schools, Users, Students, Observations, Progress, Training, Visits');
    console.log('- Partner: Dashboard, Schools, Analytics, Reports, Progress');
    console.log('- Director: Dashboard, Schools, Users, Analytics, Reports, Progress, Settings');
    console.log('- Intern: Dashboard, Schools, Students, Training');
    
  } catch (error) {
    console.error('❌ Error setting up permissions:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

setupPermissions();