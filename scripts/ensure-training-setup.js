const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Create a simple pool for testing
const testPool = () => {
  try {
    return new Pool({
      user: process.env.PGUSER || 'user',
      host: process.env.PGHOST || 'localhost',
      database: process.env.PGDATABASE || 'tarl_insight_hub',
      password: process.env.PGPASSWORD || '',
      port: parseInt(process.env.PGPORT || '5432', 10),
    });
  } catch (error) {
    console.error('Failed to create pool:', error);
    return null;
  }
};

async function ensureTrainingSetup() {
  console.log('🚀 Ensuring training system setup...');
  
  const pool = testPool();
  if (!pool) {
    console.error('❌ Could not create database pool. Please check your database configuration.');
    return;
  }

  const client = await pool.connect().catch(error => {
    console.error('❌ Database connection failed:', error.message);
    return null;
  });

  if (!client) {
    console.error('❌ Could not connect to database. Skipping database setup.');
    await pool.end();
    return;
  }
  
  try {
    await client.query('BEGIN');

    // 1. Ensure training programs table exists
    console.log('📋 Checking training programs table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS tbl_tarl_training_programs (
          id SERIAL PRIMARY KEY,
          program_name VARCHAR(255) NOT NULL,
          description TEXT,
          program_type VARCHAR(50) DEFAULT 'standard',
          duration_hours INTEGER DEFAULT 8,
          created_by INTEGER,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Training programs table ready');

    // 2. Ensure training materials table exists
    console.log('📁 Checking training materials table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS tbl_tarl_training_materials (
          id SERIAL PRIMARY KEY,
          program_id INTEGER NOT NULL,
          material_name VARCHAR(255) NOT NULL,
          material_type VARCHAR(50) NOT NULL CHECK (material_type IN ('file', 'link')),
          file_path VARCHAR(500),
          file_size BIGINT,
          file_type VARCHAR(100),
          original_filename VARCHAR(255),
          external_url VARCHAR(1000),
          description TEXT,
          is_required BOOLEAN DEFAULT false,
          sort_order INTEGER DEFAULT 0,
          created_by INTEGER,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          is_active BOOLEAN DEFAULT true
      );
    `);

    // Add foreign key constraint if it doesn't exist
    await client.query(`
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.table_constraints 
              WHERE constraint_name = 'fk_materials_program_id'
          ) THEN
              ALTER TABLE tbl_tarl_training_materials 
              ADD CONSTRAINT fk_materials_program_id 
              FOREIGN KEY (program_id) REFERENCES tbl_tarl_training_programs(id) ON DELETE CASCADE;
          END IF;
      END $$;
    `);
    console.log('✅ Training materials table ready');

    // 3. Create uploads directory
    const uploadsDir = path.join(__dirname, '..', 'uploads', 'training-materials');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('✅ Created uploads directory');
    } else {
      console.log('✅ Uploads directory exists');
    }

    // 4. Test basic operations
    console.log('🧪 Testing basic operations...');
    
    // Test program creation
    const testProgram = await client.query(`
      INSERT INTO tbl_tarl_training_programs (
        program_name, description, program_type, duration_hours, created_by, is_active
      ) VALUES ($1, $2, $3, $4, $5, true)
      RETURNING id, program_name
    `, [
      'Test Program ' + Date.now(),
      'Test description',
      'standard',
      8,
      1
    ]);
    
    const programId = testProgram.rows[0].id;
    console.log('✅ Program creation test passed');

    // Test material creation
    await client.query(`
      INSERT INTO tbl_tarl_training_materials (
        program_id, material_name, material_type, external_url, created_by
      ) VALUES ($1, $2, $3, $4, $5)
    `, [
      programId,
      'Test Material',
      'link',
      'https://example.com',
      1
    ]);
    console.log('✅ Material creation test passed');

    // Clean up test data
    await client.query('DELETE FROM tbl_tarl_training_materials WHERE program_id = $1', [programId]);
    await client.query('DELETE FROM tbl_tarl_training_programs WHERE id = $1', [programId]);
    console.log('🧹 Test data cleaned up');

    await client.query('COMMIT');
    console.log('🎉 Training system setup completed successfully!');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error during setup:', error.message);
    console.log('\n🔧 Manual Setup Instructions:');
    console.log('1. Ensure PostgreSQL is running');
    console.log('2. Check database connection settings in .env.local');
    console.log('3. Verify database exists and user has proper permissions');
    console.log('4. Run: psql -d your_database -f scripts/training_management_schema.sql');
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the setup
if (require.main === module) {
  ensureTrainingSetup()
    .then(() => {
      console.log('\n✅ Setup process complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Setup process failed:', error);
      process.exit(1);
    });
}

module.exports = { ensureTrainingSetup };