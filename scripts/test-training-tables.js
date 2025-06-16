const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432', 10),
});

async function testTrainingTables() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Testing training tables existence...');
    
    // Test programs table
    try {
      const programsResult = await client.query(`
        SELECT COUNT(*) as count, 
               array_agg(column_name) as columns
        FROM information_schema.columns 
        WHERE table_name = 'tbl_tarl_training_programs'
        GROUP BY table_name
      `);
      
      if (programsResult.rows.length > 0) {
        console.log('✅ tbl_tarl_training_programs table exists');
        console.log(`   Columns: ${programsResult.rows[0].columns.join(', ')}`);
      } else {
        console.log('❌ tbl_tarl_training_programs table does NOT exist');
      }
    } catch (error) {
      console.log('❌ Error checking programs table:', error.message);
    }

    // Test materials table
    try {
      const materialsResult = await client.query(`
        SELECT COUNT(*) as count,
               array_agg(column_name) as columns
        FROM information_schema.columns 
        WHERE table_name = 'tbl_tarl_training_materials'
        GROUP BY table_name
      `);
      
      if (materialsResult.rows.length > 0) {
        console.log('✅ tbl_tarl_training_materials table exists');
        console.log(`   Columns: ${materialsResult.rows[0].columns.join(', ')}`);
      } else {
        console.log('❌ tbl_tarl_training_materials table does NOT exist');
      }
    } catch (error) {
      console.log('❌ Error checking materials table:', error.message);
    }

    // Test creating a sample program
    try {
      console.log('\n🧪 Testing program creation...');
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
        1  // Assuming user ID 1 exists
      ]);
      
      console.log('✅ Program creation successful:', testProgram.rows[0]);
      
      // Clean up test program
      await client.query('DELETE FROM tbl_tarl_training_programs WHERE id = $1', [testProgram.rows[0].id]);
      console.log('🧹 Test program cleaned up');
      
    } catch (error) {
      console.log('❌ Program creation failed:', error.message);
    }

  } catch (error) {
    console.error('❌ Error testing training tables:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the test
if (require.main === module) {
  testTrainingTables()
    .then(() => {
      console.log('\n✅ Training tables test complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Training tables test failed:', error);
      process.exit(1);
    });
}

module.exports = { testTrainingTables };