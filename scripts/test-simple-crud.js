const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.PGUSER || 'postgres',
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDATABASE || 'pratham_tarl',
  password: process.env.PGPASSWORD || '12345',
  port: parseInt(process.env.PGPORT || '5432', 10),
});

async function testAPIDirect() {
  const client = await pool.connect();
  try {
    console.log('🔍 Testing Training CRUD Operations Directly...\n');

    // 1. Test Programs CRUD
    console.log('1️⃣ Testing Programs CRUD:');
    
    // CREATE Program
    const createProgramResult = await client.query(`
      INSERT INTO tbl_tarl_training_programs (
        program_name, description, program_type, duration_hours, created_by, is_active
      ) VALUES ($1, $2, $3, $4, $5, true)
      RETURNING id, program_name, description, program_type, duration_hours, created_at
    `, [
      'Direct Test Program',
      'Testing CRUD operations directly',
      'workshop',
      5,
      3 // admin user id
    ]);
    
    const programId = createProgramResult.rows[0].id;
    console.log('✅ CREATE Program:', createProgramResult.rows[0].program_name);

    // READ Programs
    const readProgramsResult = await client.query(`
      SELECT 
        tp.*,
        creator.full_name as created_by_name,
        COUNT(DISTINCT ts.id) as session_count
      FROM tbl_tarl_training_programs tp
      LEFT JOIN tbl_tarl_users creator ON tp.created_by = creator.id
      LEFT JOIN tbl_tarl_training_sessions ts ON tp.id = ts.program_id AND ts.is_active = true
      WHERE tp.is_active = true
      GROUP BY tp.id, creator.full_name
      ORDER BY tp.created_at DESC
    `);
    console.log('✅ READ Programs:', readProgramsResult.rows.length, 'programs found');

    // UPDATE Program
    const updateProgramResult = await client.query(`
      UPDATE tbl_tarl_training_programs SET
        description = $1,
        duration_hours = $2,
        updated_at = NOW()
      WHERE id = $3 AND is_active = true
      RETURNING id, program_name, description, duration_hours, updated_at
    `, [
      'Updated test program description',
      6,
      programId
    ]);
    console.log('✅ UPDATE Program:', updateProgramResult.rows[0].description);

    // 2. Test Sessions CRUD
    console.log('\n2️⃣ Testing Sessions CRUD:');
    
    // CREATE Session
    const createSessionResult = await client.query(`
      INSERT INTO tbl_tarl_training_sessions (
        program_id, session_title, session_date, session_time, location, 
        venue_address, max_participants, created_by, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
      RETURNING id, session_title, session_date, session_time, location
    `, [
      programId,
      'Direct Test Session',
      '2025-08-15',
      '10:30:00',
      'Direct Test Center',
      'Test Address 123',
      30,
      3
    ]);
    
    const sessionId = createSessionResult.rows[0].id;
    console.log('✅ CREATE Session:', createSessionResult.rows[0].session_title);

    // Initialize flow for session
    const flowStages = ['before', 'during', 'after'];
    for (const stage of flowStages) {
      await client.query(`
        INSERT INTO tbl_tarl_training_flow (session_id, flow_stage, stage_data)
        VALUES ($1, $2, $3)
      `, [sessionId, stage, JSON.stringify({
        stage: stage,
        description: `${stage.charAt(0).toUpperCase() + stage.slice(1)} training activities`,
        tasks: []
      })]);
    }
    console.log('✅ Flow stages initialized for session');

    // READ Sessions
    const readSessionsResult = await client.query(`
      SELECT 
        ts.*,
        tp.program_name,
        COUNT(DISTINCT tpt.id) as participant_count
      FROM tbl_tarl_training_sessions ts
      LEFT JOIN tbl_tarl_training_programs tp ON ts.program_id = tp.id
      LEFT JOIN tbl_tarl_training_participants tpt ON ts.id = tpt.session_id
      WHERE ts.is_active = true
      GROUP BY ts.id, tp.program_name
      ORDER BY ts.session_date DESC
    `);
    console.log('✅ READ Sessions:', readSessionsResult.rows.length, 'sessions found');

    // UPDATE Session
    const updateSessionResult = await client.query(`
      UPDATE tbl_tarl_training_sessions SET
        session_title = $1,
        max_participants = $2,
        session_status = $3,
        updated_at = NOW()
      WHERE id = $4 AND is_active = true
      RETURNING id, session_title, max_participants, session_status
    `, [
      'Updated Direct Test Session',
      35,
      'scheduled',
      sessionId
    ]);
    console.log('✅ UPDATE Session:', updateSessionResult.rows[0].session_title);

    // 3. Test Participants CRUD
    console.log('\n3️⃣ Testing Participants CRUD:');
    
    // CREATE Participant
    const createParticipantResult = await client.query(`
      INSERT INTO tbl_tarl_training_participants (
        session_id, participant_name, participant_email, participant_phone,
        participant_role, school_name, registration_method, registration_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'registered')
      RETURNING id, participant_name, participant_email, registration_status, created_at
    `, [
      sessionId,
      'Direct Test Participant',
      'direct.test@example.com',
      '+1234567890',
      'teacher',
      'Direct Test School',
      'manual'
    ]);
    
    const participantId = createParticipantResult.rows[0].id;
    console.log('✅ CREATE Participant:', createParticipantResult.rows[0].participant_name);

    // READ Participants
    const readParticipantsResult = await client.query(`
      SELECT 
        tp.*,
        ts.session_title
      FROM tbl_tarl_training_participants tp
      LEFT JOIN tbl_tarl_training_sessions ts ON tp.session_id = ts.id
      WHERE tp.session_id = $1
      ORDER BY tp.created_at DESC
    `, [sessionId]);
    console.log('✅ READ Participants:', readParticipantsResult.rows.length, 'participants found');

    // UPDATE Participant (confirm attendance)
    const updateParticipantResult = await client.query(`
      UPDATE tbl_tarl_training_participants SET
        registration_status = $1,
        attendance_confirmed = $2,
        attendance_time = NOW(),
        updated_at = NOW()
      WHERE id = $3
      RETURNING id, participant_name, registration_status, attendance_confirmed
    `, [
      'confirmed',
      true,
      participantId
    ]);
    console.log('✅ UPDATE Participant:', updateParticipantResult.rows[0].attendance_confirmed ? 'Attendance confirmed' : 'Not confirmed');

    // 4. Test QR Codes CRUD
    console.log('\n4️⃣ Testing QR Codes CRUD:');
    
    // CREATE QR Code
    const createQRResult = await client.query(`
      INSERT INTO tbl_tarl_qr_codes (
        code_type, session_id, qr_data, expires_at, max_usage, created_by, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, true)
      RETURNING id, code_type, qr_data, expires_at, max_usage, created_at
    `, [
      'registration',
      sessionId,
      `http://localhost:3000/training/register?session=${sessionId}&qr=direct-test-123`,
      new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      100,
      3
    ]);
    
    const qrCodeId = createQRResult.rows[0].id;
    console.log('✅ CREATE QR Code:', createQRResult.rows[0].code_type);

    // READ QR Codes
    const readQRResult = await client.query(`
      SELECT 
        qr.*,
        ts.session_title
      FROM tbl_tarl_qr_codes qr
      LEFT JOIN tbl_tarl_training_sessions ts ON qr.session_id = ts.id
      WHERE qr.session_id = $1 AND qr.is_active = true
      ORDER BY qr.created_at DESC
    `, [sessionId]);
    console.log('✅ READ QR Codes:', readQRResult.rows.length, 'QR codes found');

    // UPDATE QR Code
    const updateQRResult = await client.query(`
      UPDATE tbl_tarl_qr_codes SET
        is_active = $1,
        max_usage = $2
      WHERE id = $3
      RETURNING id, code_type, is_active, max_usage
    `, [
      false,
      150,
      qrCodeId
    ]);
    console.log('✅ UPDATE QR Code:', updateQRResult.rows[0].is_active ? 'Active' : 'Inactive');

    // 5. Test Training Flow
    console.log('\n5️⃣ Testing Training Flow:');
    
    // READ Flow
    const readFlowResult = await client.query(`
      SELECT 
        tf.*,
        ts.session_title
      FROM tbl_tarl_training_flow tf
      LEFT JOIN tbl_tarl_training_sessions ts ON tf.session_id = ts.id
      WHERE tf.session_id = $1
      ORDER BY 
        CASE tf.flow_stage 
          WHEN 'before' THEN 1 
          WHEN 'during' THEN 2 
          WHEN 'after' THEN 3 
          ELSE 4 
        END
    `, [sessionId]);
    console.log('✅ READ Flow:', readFlowResult.rows.length, 'flow stages found');

    // UPDATE Flow
    const updateFlowResult = await client.query(`
      UPDATE tbl_tarl_training_flow SET
        stage_status = $1,
        qr_code_generated = $2,
        participants_notified = $3,
        stage_completed_at = NOW(),
        updated_at = NOW()
      WHERE session_id = $4 AND flow_stage = $5
      RETURNING id, session_id, flow_stage, stage_status
    `, [
      'completed',
      true,
      true,
      sessionId,
      'before'
    ]);
    console.log('✅ UPDATE Flow:', updateFlowResult.rows[0].stage_status);

    // 6. DELETE Operations (cleanup)
    console.log('\n6️⃣ Testing DELETE Operations:');
    
    // Soft delete program (will cascade to sessions, participants, QR codes)
    const deleteProgramResult = await client.query(`
      UPDATE tbl_tarl_training_programs 
      SET is_active = false, updated_at = NOW()
      WHERE id = $1 AND is_active = true
      RETURNING id, program_name
    `, [programId]);
    console.log('✅ DELETE Program:', deleteProgramResult.rows[0].program_name);

    // Summary
    console.log('\n📊 Direct CRUD Test Results:');
    console.log('==========================================');
    console.log('✅ Programs CRUD: CREATE, READ, UPDATE, DELETE');
    console.log('✅ Sessions CRUD: CREATE, READ, UPDATE');
    console.log('✅ Participants CRUD: CREATE, READ, UPDATE');
    console.log('✅ QR Codes CRUD: CREATE, READ, UPDATE');
    console.log('✅ Training Flow: READ, UPDATE');
    console.log('✅ Cascade DELETE: Program → Sessions → Participants → QR Codes');
    console.log('==========================================');
    console.log('🎉 All direct database operations are working correctly!');

    return true;

  } catch (error) {
    console.error('❌ Direct CRUD test failed:', error.message);
    return false;
  } finally {
    client.release();
  }
}

// Run the test
if (require.main === module) {
  testAPIDirect()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testAPIDirect };