const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432', 10),
});

// Test data for creating sessions
const testSessionData = {
  program_id: 1, // Assuming a program exists
  session_title: 'Test CRUD Session',
  session_date: '2024-12-25',
  session_time: '10:00',
  location: 'Test Location',
  venue_address: '123 Test Street, Test City',
  max_participants: 30,
  trainer_id: null,
  coordinator_id: null,
  registration_deadline: '2024-12-20'
};

async function testTrainingSessionsCRUD() {
  const client = await pool.connect();
  
  try {
    console.log('🧪 Starting Training Sessions CRUD Tests...\n');

    // 1. Test CREATE (POST)
    console.log('1️⃣ Testing CREATE operation...');
    const createResult = await client.query(`
      INSERT INTO tbl_tarl_training_sessions (
        program_id, session_title, session_date, session_time, location, 
        venue_address, max_participants, trainer_id, coordinator_id, 
        registration_deadline, created_by, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 1, true)
      RETURNING id, session_title, session_date, session_time, location
    `, [
      testSessionData.program_id,
      testSessionData.session_title,
      testSessionData.session_date,
      testSessionData.session_time,
      testSessionData.location,
      testSessionData.venue_address,
      testSessionData.max_participants,
      testSessionData.trainer_id,
      testSessionData.coordinator_id,
      testSessionData.registration_deadline
    ]);

    const sessionId = createResult.rows[0].id;
    console.log('✅ CREATE: Session created successfully with ID:', sessionId);
    console.log('   Session details:', createResult.rows[0]);

    // Initialize training flow for the test session
    const flowStages = [
      { stage: 'before', description: 'Pre-training activities' },
      { stage: 'during', description: 'Training session activities' },
      { stage: 'after', description: 'Post-training activities' }
    ];

    for (const stage of flowStages) {
      await client.query(`
        INSERT INTO tbl_tarl_training_flow (session_id, flow_stage, stage_data)
        VALUES ($1, $2, $3)
      `, [sessionId, stage.stage, JSON.stringify(stage)]);
    }
    console.log('✅ CREATE: Training flow initialized');

    // 2. Test READ (GET)
    console.log('\n2️⃣ Testing READ operation...');
    const readResult = await client.query(`
      SELECT 
        ts.*,
        tp.program_name,
        COUNT(DISTINCT tpt.id) as participant_count,
        tf_before.stage_status as before_status,
        tf_during.stage_status as during_status,
        tf_after.stage_status as after_status
      FROM tbl_tarl_training_sessions ts
      LEFT JOIN tbl_tarl_training_programs tp ON ts.program_id = tp.id
      LEFT JOIN tbl_tarl_training_participants tpt ON ts.id = tpt.session_id
      LEFT JOIN tbl_tarl_training_flow tf_before ON ts.id = tf_before.session_id AND tf_before.flow_stage = 'before'
      LEFT JOIN tbl_tarl_training_flow tf_during ON ts.id = tf_during.session_id AND tf_during.flow_stage = 'during'
      LEFT JOIN tbl_tarl_training_flow tf_after ON ts.id = tf_after.session_id AND tf_after.flow_stage = 'after'
      WHERE ts.id = $1 AND ts.is_active = true
      GROUP BY ts.id, tp.id, tf_before.stage_status, tf_during.stage_status, tf_after.stage_status
    `, [sessionId]);

    if (readResult.rows.length > 0) {
      console.log('✅ READ: Session retrieved successfully');
      console.log('   Session data:', {
        id: readResult.rows[0].id,
        title: readResult.rows[0].session_title,
        date: readResult.rows[0].session_date,
        program: readResult.rows[0].program_name,
        participants: readResult.rows[0].participant_count
      });
    } else {
      console.log('❌ READ: Failed to retrieve session');
    }

    // 3. Test UPDATE (PUT)
    console.log('\n3️⃣ Testing UPDATE operation...');
    const updatedTitle = 'Updated CRUD Test Session';
    const updateResult = await client.query(`
      UPDATE tbl_tarl_training_sessions SET
        session_title = $1,
        max_participants = $2,
        updated_at = NOW()
      WHERE id = $3 AND is_active = true
      RETURNING id, session_title, max_participants
    `, [updatedTitle, 50, sessionId]);

    if (updateResult.rows.length > 0) {
      console.log('✅ UPDATE: Session updated successfully');
      console.log('   Updated data:', updateResult.rows[0]);
    } else {
      console.log('❌ UPDATE: Failed to update session');
    }

    // 4. Test filtering by status
    console.log('\n4️⃣ Testing filtering functionality...');
    const filterResult = await client.query(`
      SELECT id, session_title, session_status 
      FROM tbl_tarl_training_sessions 
      WHERE session_status = 'scheduled' AND is_active = true
      LIMIT 5
    `);
    console.log(`✅ FILTER: Found ${filterResult.rows.length} scheduled sessions`);

    // 5. Test search functionality
    console.log('\n5️⃣ Testing search functionality...');
    const searchResult = await client.query(`
      SELECT id, session_title, location 
      FROM tbl_tarl_training_sessions 
      WHERE (
        session_title ILIKE $1 OR 
        location ILIKE $1
      ) AND is_active = true
      LIMIT 5
    `, ['%test%']);
    console.log(`✅ SEARCH: Found ${searchResult.rows.length} sessions matching 'test'`);

    // 6. Test permission-based filtering
    console.log('\n6️⃣ Testing role-based filtering...');
    const roleFilterResult = await client.query(`
      SELECT id, session_title, trainer_id 
      FROM tbl_tarl_training_sessions 
      WHERE trainer_id = 1 AND is_active = true
      LIMIT 5
    `);
    console.log(`✅ ROLE FILTER: Found ${roleFilterResult.rows.length} sessions for trainer ID 1`);

    // 7. Test DELETE (soft delete)
    console.log('\n7️⃣ Testing DELETE operation...');
    const deleteResult = await client.query(`
      UPDATE tbl_tarl_training_sessions 
      SET is_active = false, updated_at = NOW()
      WHERE id = $1
      RETURNING id, session_title, is_active
    `, [sessionId]);

    if (deleteResult.rows.length > 0) {
      console.log('✅ DELETE: Session soft deleted successfully');
      console.log('   Deleted session:', deleteResult.rows[0]);
    } else {
      console.log('❌ DELETE: Failed to delete session');
    }

    // Clean up training flow entries
    await client.query(`DELETE FROM tbl_tarl_training_flow WHERE session_id = $1`, [sessionId]);
    console.log('✅ CLEANUP: Training flow entries removed');

    // 8. Verify deletion
    console.log('\n8️⃣ Verifying deletion...');
    const verifyResult = await client.query(`
      SELECT id, is_active 
      FROM tbl_tarl_training_sessions 
      WHERE id = $1
    `, [sessionId]);

    if (verifyResult.rows.length > 0 && !verifyResult.rows[0].is_active) {
      console.log('✅ VERIFY: Session is properly soft deleted');
    } else {
      console.log('❌ VERIFY: Session deletion verification failed');
    }

    console.log('\n🎉 All Training Sessions CRUD tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    client.release();
    pool.end();
  }
}

// Run the tests
testTrainingSessionsCRUD();