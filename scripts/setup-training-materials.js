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

async function setupTrainingMaterials() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Setting up training materials table...');
    
    // Read and execute the SQL file
    const sqlFilePath = path.join(__dirname, 'create-training-materials-table.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    await client.query('BEGIN');
    await client.query(sqlContent);
    await client.query('COMMIT');
    
    console.log('✅ Training materials table created successfully!');
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(__dirname, '..', 'uploads', 'training-materials');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('✅ Created uploads directory for training materials');
    }
    
    console.log('🎉 Training materials setup completed successfully!');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error setting up training materials:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the setup
if (require.main === module) {
  setupTrainingMaterials()
    .then(() => {
      console.log('✅ Training materials setup complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Failed to setup training materials:', error);
      process.exit(1);
    });
}

module.exports = { setupTrainingMaterials };