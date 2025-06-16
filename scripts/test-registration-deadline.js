const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432', 10),
});

async function testRegistrationDeadline() {
  const client = await pool.connect();
  
  try {
    console.log('🧪 Testing Registration Deadline Functionality...\n');

    // 1. Check table schema for registration_deadline column
    console.log('1️⃣ Checking database schema...');
    const schemaResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'tbl_tarl_training_sessions'
      AND column_name = 'registration_deadline'
    `);

    if (schemaResult.rows.length > 0) {
      const column = schemaResult.rows[0];
      console.log(`✅ Column exists: ${column.column_name}`);
      console.log(`   Data type: ${column.data_type}`);
      console.log(`   Nullable: ${column.is_nullable}`);
    } else {
      console.log('❌ registration_deadline column not found!');
      return;
    }

    // 2. Check current sessions and their registration deadlines
    console.log('\n2️⃣ Checking existing sessions...');
    const sessionsResult = await client.query(`
      SELECT id, session_title, registration_deadline 
      FROM tbl_tarl_training_sessions 
      WHERE is_active = true 
      ORDER BY id
      LIMIT 5
    `);

    console.log(`Found ${sessionsResult.rows.length} active sessions:`);
    sessionsResult.rows.forEach(session => {
      console.log(`   ID ${session.id}: "${session.session_title}"`);
      console.log(`   Registration deadline: ${session.registration_deadline || 'NULL'}`);
    });

    // 3. Test update with different registration deadline values
    if (sessionsResult.rows.length > 0) {
      const testSession = sessionsResult.rows[0];
      console.log(`\n3️⃣ Testing update on session ID ${testSession.id}...`);

      // Test 1: Set a specific date
      const testDate = '2024-12-20';
      console.log(`   Testing with date: ${testDate}`);
      
      const updateResult1 = await client.query(`
        UPDATE tbl_tarl_training_sessions 
        SET registration_deadline = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING id, registration_deadline
      `, [testDate, testSession.id]);

      if (updateResult1.rows.length > 0) {
        console.log(`   ✅ Update successful: ${updateResult1.rows[0].registration_deadline}`);
      } else {
        console.log('   ❌ Update failed');
      }

      // Test 2: Set to NULL
      console.log('   Testing with NULL value...');
      const updateResult2 = await client.query(`
        UPDATE tbl_tarl_training_sessions 
        SET registration_deadline = NULL, updated_at = NOW()
        WHERE id = $1
        RETURNING id, registration_deadline
      `, [testSession.id]);

      if (updateResult2.rows.length > 0) {
        console.log(`   ✅ NULL update successful: ${updateResult2.rows[0].registration_deadline || 'NULL'}`);
      } else {
        console.log('   ❌ NULL update failed');
      }

      // Test 3: Set empty string (should be converted to NULL)
      console.log('   Testing with empty string...');
      const updateResult3 = await client.query(`
        UPDATE tbl_tarl_training_sessions 
        SET registration_deadline = CASE WHEN $1 = '' THEN NULL ELSE $1 END, updated_at = NOW()
        WHERE id = $2
        RETURNING id, registration_deadline
      `, ['', testSession.id]);

      if (updateResult3.rows.length > 0) {
        console.log(`   ✅ Empty string update successful: ${updateResult3.rows[0].registration_deadline || 'NULL'}`);
      } else {
        console.log('   ❌ Empty string update failed');
      }
    }

    console.log('\n4️⃣ Testing API payload format...');
    
    // Test different payload formats
    const testPayloads = [
      { registration_deadline: '2024-12-25', description: 'Valid date string' },
      { registration_deadline: null, description: 'Explicit null' },
      { registration_deadline: '', description: 'Empty string' },
      { registration_deadline: undefined, description: 'Undefined value' }
    ];

    testPayloads.forEach((test, index) => {
      console.log(`   Test ${index + 1}: ${test.description}`);
      console.log(`   Value: ${JSON.stringify(test.registration_deadline)}`);
      console.log(`   Type: ${typeof test.registration_deadline}`);
      
      // Show how it should be processed
      const processed = test.registration_deadline && test.registration_deadline.trim() !== '' 
        ? test.registration_deadline 
        : null;
      console.log(`   Processed: ${JSON.stringify(processed)}`);
      console.log('');
    });

    console.log('🎯 Debugging Steps:');
    console.log('1. Check browser console for form data and payload logs');
    console.log('2. Check server console for "Received update data" logs');
    console.log('3. Verify the registration_deadline value in both logs');
    console.log('4. Test with different date values in the form');
    console.log('5. Test clearing the field (should set to null)');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    client.release();
    pool.end();
  }
}

// Run the test
testRegistrationDeadline();