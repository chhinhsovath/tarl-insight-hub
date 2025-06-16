const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'pratham_tarl',
  password: '12345',
  port: 5432,
});

async function comprehensiveTrainingTest() {
  const client = await pool.connect();
  let testResults = {
    programs: { create: false, read: false, update: false, delete: false },
    sessions: { create: false, read: false, update: false, delete: false },
    materials: { create: false, read: false, delete: false },
    feedback: { create: false, read: false },
    qrCodes: { create: false, read: false },
    errors: []
  };

  try {
    console.log('🧪 Starting comprehensive training system test...\n');

    // Test 1: Training Programs CRUD
    console.log('1️⃣ Testing Training Programs...');
    
    // Create program
    try {
      const programResult = await client.query(`
        INSERT INTO tbl_tarl_training_programs (
          program_name, description, program_type, duration_hours, created_by, is_active
        ) VALUES ($1, $2, $3, $4, $5, true)
        RETURNING id, program_name
      `, [
        'Test Program ' + Date.now(),
        'Comprehensive test program',
        'standard',
        8,
        1
      ]);
      
      const programId = programResult.rows[0].id;
      console.log('✅ Program created:', programResult.rows[0]);
      testResults.programs.create = true;

      // Read program
      const readResult = await client.query('SELECT * FROM tbl_tarl_training_programs WHERE id = $1', [programId]);
      if (readResult.rows.length > 0) {
        console.log('✅ Program read successfully');
        testResults.programs.read = true;
      }

      // Update program
      const updateResult = await client.query(`
        UPDATE tbl_tarl_training_programs 
        SET description = $1, updated_at = NOW() 
        WHERE id = $2 RETURNING id
      `, ['Updated description', programId]);
      
      if (updateResult.rows.length > 0) {
        console.log('✅ Program updated successfully');
        testResults.programs.update = true;
      }

      // Test 2: Training Sessions
      console.log('\n2️⃣ Testing Training Sessions...');
      
      const sessionResult = await client.query(`
        INSERT INTO tbl_tarl_training_sessions (
          program_id, session_title, session_date, session_time, location, 
          trainer_id, session_status, created_by, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
        RETURNING id, session_title
      `, [
        programId,
        'Test Session ' + Date.now(),
        '2024-12-31',
        '10:00:00',
        'Test Location',
        1,
        'scheduled',
        1
      ]);
      
      const sessionId = sessionResult.rows[0].id;
      console.log('✅ Session created:', sessionResult.rows[0]);
      testResults.sessions.create = true;

      // Read sessions
      const sessionReadResult = await client.query('SELECT * FROM tbl_tarl_training_sessions WHERE id = $1', [sessionId]);
      if (sessionReadResult.rows.length > 0) {
        console.log('✅ Session read successfully');
        testResults.sessions.read = true;
      }

      // Update session
      const sessionUpdateResult = await client.query(`
        UPDATE tbl_tarl_training_sessions 
        SET session_status = $1, updated_at = NOW() 
        WHERE id = $2 RETURNING id
      `, ['ongoing', sessionId]);
      
      if (sessionUpdateResult.rows.length > 0) {
        console.log('✅ Session updated successfully');
        testResults.sessions.update = true;
      }

      // Test 3: Training Materials
      console.log('\n3️⃣ Testing Training Materials...');
      
      const materialResult = await client.query(`
        INSERT INTO tbl_tarl_training_materials (
          program_id, material_title, material_type, external_url, 
          description, is_required, sort_order, created_by, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
        RETURNING id, material_title as material_name
      `, [
        programId,
        'Test Material ' + Date.now(),
        'link',
        'https://example.com',
        'Test material description',
        false,
        1,
        1
      ]);
      
      const materialId = materialResult.rows[0].id;
      console.log('✅ Material created:', materialResult.rows[0]);
      testResults.materials.create = true;

      // Read materials
      const materialReadResult = await client.query('SELECT * FROM tbl_tarl_training_materials WHERE id = $1', [materialId]);
      if (materialReadResult.rows.length > 0) {
        console.log('✅ Material read successfully');
        testResults.materials.read = true;
      }

      // Test 4: Training Feedback
      console.log('\n4️⃣ Testing Training Feedback...');
      
      const feedbackResult = await client.query(`
        INSERT INTO tbl_tarl_training_feedback (
          session_id, overall_rating, trainer_rating, content_rating, venue_rating,
          would_recommend, comments, submitted_via, is_anonymous, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        RETURNING id, overall_rating
      `, [
        sessionId,
        5,
        4,
        5,
        4,
        true,
        'Test feedback comment',
        'test',
        false
      ]);
      
      if (feedbackResult.rows.length > 0) {
        console.log('✅ Feedback created:', feedbackResult.rows[0]);
        testResults.feedback.create = true;
      }

      // Read feedback
      const feedbackReadResult = await client.query('SELECT * FROM tbl_tarl_training_feedback WHERE session_id = $1', [sessionId]);
      if (feedbackReadResult.rows.length > 0) {
        console.log('✅ Feedback read successfully');
        testResults.feedback.read = true;
      }

      // Test 5: QR Codes
      console.log('\n5️⃣ Testing QR Codes...');
      
      const qrResult = await client.query(`
        INSERT INTO tbl_tarl_qr_codes (
          code_type, session_id, qr_data, qr_code_image, is_active, created_by
        ) VALUES ($1, $2, $3, $4, true, $5)
        RETURNING id, code_type
      `, [
        'feedback',
        sessionId,
        'https://example.com/test-qr',
        'data:image/png;base64,test',
        1
      ]);
      
      if (qrResult.rows.length > 0) {
        console.log('✅ QR Code created:', qrResult.rows[0]);
        testResults.qrCodes.create = true;
      }

      // Read QR codes
      const qrReadResult = await client.query('SELECT * FROM tbl_tarl_qr_codes WHERE session_id = $1', [sessionId]);
      if (qrReadResult.rows.length > 0) {
        console.log('✅ QR Code read successfully');
        testResults.qrCodes.read = true;
      }

      // Cleanup: Delete test data
      console.log('\n🧹 Cleaning up test data...');
      await client.query('DELETE FROM tbl_tarl_qr_codes WHERE session_id = $1', [sessionId]);
      await client.query('DELETE FROM tbl_tarl_training_feedback WHERE session_id = $1', [sessionId]);
      await client.query('DELETE FROM tbl_tarl_training_materials WHERE id = $1', [materialId]);
      testResults.materials.delete = true;
      
      await client.query('DELETE FROM tbl_tarl_training_sessions WHERE id = $1', [sessionId]);
      testResults.sessions.delete = true;
      
      await client.query('DELETE FROM tbl_tarl_training_programs WHERE id = $1', [programId]);
      testResults.programs.delete = true;
      
      console.log('✅ Test data cleaned up successfully');

    } catch (error) {
      console.error('❌ Error in programs test:', error.message);
      testResults.errors.push(`Programs: ${error.message}`);
    }

    // Print test results
    console.log('\n📊 Test Results Summary:');
    console.log('========================');
    
    Object.entries(testResults).forEach(([category, results]) => {
      if (category === 'errors') return;
      
      console.log(`\n${category.toUpperCase()}:`);
      Object.entries(results).forEach(([operation, success]) => {
        console.log(`  ${operation}: ${success ? '✅ PASS' : '❌ FAIL'}`);
      });
    });

    if (testResults.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      testResults.errors.forEach(error => console.log(`  - ${error}`));
    }

    // Calculate overall score
    const totalTests = Object.values(testResults).slice(0, -1).reduce((sum, category) => 
      sum + Object.keys(category).length, 0
    );
    const passedTests = Object.values(testResults).slice(0, -1).reduce((sum, category) => 
      sum + Object.values(category).filter(Boolean).length, 0
    );
    
    console.log(`\n🎯 Overall Score: ${passedTests}/${totalTests} (${Math.round(passedTests/totalTests*100)}%)`);
    
    if (passedTests === totalTests) {
      console.log('🎉 ALL TESTS PASSED! Training system is fully functional.');
    } else {
      console.log('⚠️ Some tests failed. Please check the issues above.');
    }

  } catch (error) {
    console.error('❌ Critical test error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the comprehensive test
comprehensiveTrainingTest();