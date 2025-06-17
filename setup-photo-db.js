const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection using environment variables
const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432', 10),
});

async function setupPhotoActivitiesTable() {
  const client = await pool.connect();
  
  try {
    console.log('Setting up photo activities table...');
    
    // Read and execute the SQL setup script
    const sqlScript = fs.readFileSync(path.join(__dirname, 'setup-photo-activities.sql'), 'utf8');
    
    await client.query(sqlScript);
    
    console.log('✅ Photo activities table setup completed successfully!');
    
    // Verify the table was created
    const checkTable = await client.query(
      "SELECT to_regclass('public.tbl_training_photo_activities') AS table_exists"
    );
    
    if (checkTable.rows[0].table_exists) {
      console.log('✅ Table tbl_training_photo_activities confirmed to exist');
    } else {
      console.log('❌ Table creation may have failed');
    }
    
  } catch (error) {
    console.error('❌ Error setting up photo activities table:', error.message);
    console.error('Full error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the setup
setupPhotoActivitiesTable();