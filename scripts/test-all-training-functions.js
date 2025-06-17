const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.PGUSER || 'postgres',
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDATABASE || 'pratham_tarl',
  password: process.env.PGPASSWORD || '12345',
  port: parseInt(process.env.PGPORT || '5432', 10),
});

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

async function testTrainingFunctions() {
  const client = await pool.connect();
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  try {
    log('\n🏃 Running Comprehensive Training System Tests', 'cyan');
    log('=' .repeat(50), 'cyan');

    // Test 1: Check all training tables exist
    log('\n📋 Test 1: Checking Training Tables', 'yellow');
    const tables = [
      'tbl_tarl_training_programs',
      'tbl_tarl_training_sessions',
      'tbl_tarl_training_participants',
      'tbl_tarl_training_materials',
      'tbl_tarl_training_feedback',
      'tbl_tarl_training_flow',
      'tbl_tarl_qr_codes',
      'tbl_tarl_qr_usage_log'
    ];

    for (const table of tables) {
      totalTests++;
      try {
        await client.query(`SELECT 1 FROM ${table} LIMIT 1`);
        log(`  ✅ Table ${table} exists`, 'green');
        passedTests++;
      } catch (error) {
        log(`  ❌ Table ${table} missing: ${error.message}`, 'red');
        failedTests++;
      }
    }

    // Test 2: Check training programs functionality
    log('\n📚 Test 2: Training Programs CRUD', 'yellow');
    totalTests++;
    try {
      // Create a test program
      const programResult = await client.query(`
        INSERT INTO tbl_tarl_training_programs 
        (program_name, description, program_type, duration_hours, created_by)
        VALUES ('Test Program', 'Test Description', 'standard', 8, 1)
        RETURNING id
      `);
      const programId = programResult.rows[0].id;
      
      // Update the program
      await client.query(`
        UPDATE tbl_tarl_training_programs 
        SET description = 'Updated Description'
        WHERE id = $1
      `, [programId]);
      
      // Check materials count query
      const countResult = await client.query(`
        SELECT COUNT(*) as materials_count 
        FROM tbl_tarl_training_materials 
        WHERE program_id = $1 AND is_active = true
      `, [programId]);
      
      // Clean up
      await client.query('DELETE FROM tbl_tarl_training_programs WHERE id = $1', [programId]);
      
      log('  ✅ Training Programs CRUD working', 'green');
      passedTests++;
    } catch (error) {
      log(`  ❌ Training Programs CRUD failed: ${error.message}`, 'red');
      failedTests++;
    }

    // Test 3: Check training sessions functionality
    log('\n📅 Test 3: Training Sessions CRUD', 'yellow');
    totalTests++;
    try {
      // First create a program for the session
      const programResult = await client.query(`
        INSERT INTO tbl_tarl_training_programs 
        (program_name, description, program_type, duration_hours, created_by)
        VALUES ('Session Test Program', 'For testing sessions', 'standard', 8, 1)
        RETURNING id
      `);
      const programId = programResult.rows[0].id;
      
      // Create a session
      const sessionResult = await client.query(`
        INSERT INTO tbl_tarl_training_sessions 
        (program_id, session_title, session_date, session_time, location, 
         max_participants, registration_deadline, session_status, created_by)
        VALUES ($1, 'Test Session', CURRENT_DATE + 7, '09:00:00', 'Test Location',
                50, CURRENT_DATE + 5, 'scheduled', 1)
        RETURNING id
      `, [programId]);
      const sessionId = sessionResult.rows[0].id;
      
      // Update session
      await client.query(`
        UPDATE tbl_tarl_training_sessions 
        SET location = 'Updated Location'
        WHERE id = $1
      `, [sessionId]);
      
      // Clean up
      await client.query('DELETE FROM tbl_tarl_training_sessions WHERE id = $1', [sessionId]);
      await client.query('DELETE FROM tbl_tarl_training_programs WHERE id = $1', [programId]);
      
      log('  ✅ Training Sessions CRUD working', 'green');
      passedTests++;
    } catch (error) {
      log(`  ❌ Training Sessions CRUD failed: ${error.message}`, 'red');
      failedTests++;
    }

    // Test 4: Check materials functionality
    log('\n📁 Test 4: Training Materials', 'yellow');
    totalTests++;
    try {
      // Create a program for materials
      const programResult = await client.query(`
        INSERT INTO tbl_tarl_training_programs 
        (program_name, description, program_type, duration_hours, created_by)
        VALUES ('Materials Test Program', 'For testing materials', 'standard', 8, 1)
        RETURNING id
      `);
      const programId = programResult.rows[0].id;
      
      // Check if material_title column exists (should use this instead of material_name in DB)
      const columnCheck = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'tbl_tarl_training_materials' 
        AND column_name IN ('material_title', 'material_name')
      `);
      
      const materialColumn = columnCheck.rows[0]?.column_name || 'material_title';
      
      // Create a link material
      const materialResult = await client.query(`
        INSERT INTO tbl_tarl_training_materials 
        (program_id, ${materialColumn}, material_type, external_url, description, is_required, created_by)
        VALUES ($1, 'Test Material', 'link', 'https://example.com', 'Test Description', false, 1)
        RETURNING id
      `, [programId]);
      
      // Clean up
      await client.query('DELETE FROM tbl_tarl_training_materials WHERE program_id = $1', [programId]);
      await client.query('DELETE FROM tbl_tarl_training_programs WHERE id = $1', [programId]);
      
      log('  ✅ Training Materials working', 'green');
      passedTests++;
    } catch (error) {
      log(`  ❌ Training Materials failed: ${error.message}`, 'red');
      failedTests++;
    }

    // Test 5: Check QR codes functionality
    log('\n🔲 Test 5: QR Codes', 'yellow');
    totalTests++;
    try {
      // Create QR code
      const qrResult = await client.query(`
        INSERT INTO tbl_tarl_qr_codes 
        (qr_type, qr_data, session_id, created_by)
        VALUES ('registration', '{"test": "data"}', null, 1)
        RETURNING id
      `);
      const qrId = qrResult.rows[0].id;
      
      // Update QR code
      await client.query(`
        UPDATE tbl_tarl_qr_codes 
        SET usage_count = usage_count + 1
        WHERE id = $1
      `, [qrId]);
      
      // Clean up
      await client.query('DELETE FROM tbl_tarl_qr_codes WHERE id = $1', [qrId]);
      
      log('  ✅ QR Codes working', 'green');
      passedTests++;
    } catch (error) {
      log(`  ❌ QR Codes failed: ${error.message}`, 'red');
      failedTests++;
    }

    // Test 6: Check feedback system
    log('\n💬 Test 6: Feedback System', 'yellow');
    totalTests++;
    try {
      // Create feedback entry
      const feedbackResult = await client.query(`
        INSERT INTO tbl_tarl_training_feedback 
        (session_id, overall_rating, content_quality, trainer_effectiveness, 
         would_recommend, comments, is_anonymous)
        VALUES (null, 5, 5, 5, true, 'Test feedback', true)
        RETURNING id
      `);
      const feedbackId = feedbackResult.rows[0].id;
      
      // Clean up
      await client.query('DELETE FROM tbl_tarl_training_feedback WHERE id = $1', [feedbackId]);
      
      log('  ✅ Feedback System working', 'green');
      passedTests++;
    } catch (error) {
      log(`  ❌ Feedback System failed: ${error.message}`, 'red');
      failedTests++;
    }

    // Test 7: Check training flow
    log('\n🔄 Test 7: Training Flow (3-Stage System)', 'yellow');
    totalTests++;
    try {
      // Check if table exists and has correct columns
      const flowColumns = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'tbl_tarl_training_flow'
        ORDER BY ordinal_position
      `);
      
      if (flowColumns.rows.length > 0) {
        log(`  ✅ Training Flow table exists with ${flowColumns.rows.length} columns`, 'green');
        passedTests++;
      } else {
        throw new Error('Training flow table not found');
      }
    } catch (error) {
      log(`  ❌ Training Flow check failed: ${error.message}`, 'red');
      failedTests++;
    }

    // Test 8: Check participant management
    log('\n👥 Test 8: Participant Management', 'yellow');
    totalTests++;
    try {
      // Create a participant entry
      const participantResult = await client.query(`
        INSERT INTO tbl_tarl_training_participants 
        (session_id, participant_name, email, phone, designation, school_name, registration_date)
        VALUES (null, 'Test Participant', 'test@example.com', '1234567890', 
                'Teacher', 'Test School', CURRENT_DATE)
        RETURNING id
      `);
      const participantId = participantResult.rows[0].id;
      
      // Update participant
      await client.query(`
        UPDATE tbl_tarl_training_participants 
        SET attendance_confirmed = true
        WHERE id = $1
      `, [participantId]);
      
      // Clean up
      await client.query('DELETE FROM tbl_tarl_training_participants WHERE id = $1', [participantId]);
      
      log('  ✅ Participant Management working', 'green');
      passedTests++;
    } catch (error) {
      log(`  ❌ Participant Management failed: ${error.message}`, 'red');
      failedTests++;
    }

    // Test 9: Check permissions integration
    log('\n🔐 Test 9: Training Permissions', 'yellow');
    totalTests++;
    try {
      // Check if training pages exist in page_permissions
      const permissionCheck = await client.query(`
        SELECT page_name, page_title 
        FROM page_permissions 
        WHERE page_name LIKE 'training%'
        ORDER BY sort_order
      `);
      
      if (permissionCheck.rows.length > 0) {
        log(`  ✅ Found ${permissionCheck.rows.length} training pages in permissions:`, 'green');
        permissionCheck.rows.forEach(page => {
          log(`     - ${page.page_name}: ${page.page_title}`, 'blue');
        });
        passedTests++;
      } else {
        throw new Error('No training pages found in permissions');
      }
    } catch (error) {
      log(`  ❌ Training Permissions check failed: ${error.message}`, 'red');
      failedTests++;
    }

    // Test 10: Check API integration
    log('\n🌐 Test 10: API Endpoints Check', 'yellow');
    const apiEndpoints = [
      '/api/training/sessions',
      '/api/training/programs', 
      '/api/training/participants',
      '/api/training/materials',
      '/api/training/qr-codes',
      '/api/training/feedback',
      '/api/training/flow'
    ];
    
    log('  ℹ️  API endpoints that should be available:', 'blue');
    apiEndpoints.forEach(endpoint => {
      log(`     - ${endpoint}`, 'blue');
    });
    
    // Summary
    log('\n' + '=' .repeat(50), 'cyan');
    log('📊 Test Summary', 'cyan');
    log('=' .repeat(50), 'cyan');
    log(`Total Tests: ${totalTests}`, 'yellow');
    log(`Passed: ${passedTests}`, 'green');
    log(`Failed: ${failedTests}`, 'red');
    log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`, 
        passedTests === totalTests ? 'green' : 'yellow');
    
    if (failedTests > 0) {
      log('\n⚠️  Some tests failed. Run the following to fix:', 'yellow');
      log('  node scripts/setup-training-system.js', 'blue');
    } else {
      log('\n✅ All training functions are working correctly!', 'green');
    }

  } catch (error) {
    log(`\n❌ Critical error during tests: ${error.message}`, 'red');
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the tests
testTrainingFunctions().catch(console.error);