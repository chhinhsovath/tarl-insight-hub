const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.PGUSER || 'postgres',
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDATABASE || 'pratham_tarl',
  password: process.env.PGPASSWORD || '12345',
  port: parseInt(process.env.PGPORT || '5432', 10),
});

const BASE_URL = 'http://localhost:3000';

class TrainingCRUDTester {
  constructor() {
    this.sessionToken = null;
  }

  async setupTestSession() {
    const client = await pool.connect();
    try {
      // Get an admin user
      const userResult = await client.query('SELECT id, username, role FROM tbl_tarl_users WHERE role = \'admin\' LIMIT 1');
      if (userResult.rows.length === 0) {
        throw new Error('No admin user found for testing');
      }
      
      const user = userResult.rows[0];
      this.sessionToken = 'test-crud-session-' + Date.now();
      
      // Create test session
      await client.query(`
        INSERT INTO tbl_tarl_sessions (user_id, username, role, session_token, expires_at)
        VALUES ($1, $2, $3, $4, NOW() + INTERVAL '1 hour')
      `, [user.id, user.username, user.role, this.sessionToken]);
      
      console.log('✅ Test session created:', this.sessionToken);
      return user;
    } finally {
      client.release();
    }
  }

  async makeRequest(method, url, data = null) {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `session-token=${this.sessionToken}`
      }
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${JSON.stringify(result)}`);
      }
      
      return result;
    } catch (error) {
      throw new Error(`Request failed: ${error.message}`);
    }
  }

  async testProgramsCRUD() {
    console.log('\n🔄 Testing Training Programs CRUD...');
    
    try {
      // CREATE
      const newProgram = {
        program_name: 'Test CRUD Program',
        description: 'Test program for CRUD operations',
        program_type: 'workshop',
        duration_hours: 6
      };
      
      const createResult = await this.makeRequest('POST', `${BASE_URL}/api/training/programs`, newProgram);
      console.log('✅ CREATE Program:', createResult.program.program_name);
      const programId = createResult.program.id;

      // READ (list)
      const listResult = await this.makeRequest('GET', `${BASE_URL}/api/training/programs`);
      console.log('✅ READ Programs:', listResult.length, 'programs found');

      // UPDATE
      const updateData = {
        description: 'Updated test program description',
        duration_hours: 8
      };
      
      const updateResult = await this.makeRequest('PUT', `${BASE_URL}/api/training/programs?id=${programId}`, updateData);
      console.log('✅ UPDATE Program:', updateResult.program.description);

      // DELETE
      const deleteResult = await this.makeRequest('DELETE', `${BASE_URL}/api/training/programs?id=${programId}`);
      console.log('✅ DELETE Program:', deleteResult.message);

      return { success: true, programId };
    } catch (error) {
      console.error('❌ Programs CRUD failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async testSessionsCRUD() {
    console.log('\n🔄 Testing Training Sessions CRUD...');
    
    try {
      // First create a program for the session
      const programData = {
        program_name: 'Session Test Program',
        description: 'Program for session testing',
        program_type: 'training',
        duration_hours: 4
      };
      
      const programResult = await this.makeRequest('POST', `${BASE_URL}/api/training/programs`, programData);
      const programId = programResult.program.id;

      // CREATE Session
      const newSession = {
        program_id: programId,
        session_title: 'Test CRUD Session',
        session_date: '2025-07-01',
        session_time: '10:00:00',
        location: 'Test Training Center',
        venue_address: 'Test Address',
        max_participants: 25
      };
      
      const createResult = await this.makeRequest('POST', `${BASE_URL}/api/training/sessions`, newSession);
      console.log('✅ CREATE Session:', createResult.session.session_title);
      const sessionId = createResult.session.id;

      // READ (list)
      const listResult = await this.makeRequest('GET', `${BASE_URL}/api/training/sessions`);
      console.log('✅ READ Sessions:', listResult.length, 'sessions found');

      // UPDATE
      const updateData = {
        session_title: 'Updated CRUD Session',
        max_participants: 30,
        session_status: 'scheduled'
      };
      
      const updateResult = await this.makeRequest('PUT', `${BASE_URL}/api/training/sessions?id=${sessionId}`, updateData);
      console.log('✅ UPDATE Session:', updateResult.session.session_title);

      // Cleanup - delete program (which will cascade delete session)
      await this.makeRequest('DELETE', `${BASE_URL}/api/training/programs?id=${programId}`);
      console.log('✅ DELETE Session (via program cascade)');

      return { success: true, sessionId, programId };
    } catch (error) {
      console.error('❌ Sessions CRUD failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async testParticipantsCRUD() {
    console.log('\n🔄 Testing Training Participants CRUD...');
    
    try {
      // Create program and session first
      const programResult = await this.makeRequest('POST', `${BASE_URL}/api/training/programs`, {
        program_name: 'Participants Test Program',
        description: 'Program for participants testing',
        program_type: 'workshop',
        duration_hours: 3
      });
      const programId = programResult.program.id;

      const sessionResult = await this.makeRequest('POST', `${BASE_URL}/api/training/sessions`, {
        program_id: programId,
        session_title: 'Participants Test Session',
        session_date: '2025-07-15',
        session_time: '14:00:00',
        location: 'Participant Test Center',
        max_participants: 20
      });
      const sessionId = sessionResult.session.id;

      // CREATE Participant
      const newParticipant = {
        session_id: sessionId,
        participant_name: 'Test Participant',
        participant_email: 'test.participant@example.com',
        participant_phone: '+1234567890',
        participant_role: 'teacher',
        school_name: 'Test School'
      };
      
      const createResult = await this.makeRequest('POST', `${BASE_URL}/api/training/participants`, newParticipant);
      console.log('✅ CREATE Participant:', createResult.participant.participant_name);
      const participantId = createResult.participant.id;

      // READ (list)
      const listResult = await this.makeRequest('GET', `${BASE_URL}/api/training/participants?session_id=${sessionId}`);
      console.log('✅ READ Participants:', listResult.length, 'participants found');

      // UPDATE (confirm attendance)
      const updateData = {
        attendance_confirmed: true,
        registration_status: 'confirmed'
      };
      
      const updateResult = await this.makeRequest('PUT', `${BASE_URL}/api/training/participants?id=${participantId}`, updateData);
      console.log('✅ UPDATE Participant:', updateResult.participant.attendance_confirmed ? 'Attendance confirmed' : 'Not confirmed');

      // Cleanup
      await this.makeRequest('DELETE', `${BASE_URL}/api/training/programs?id=${programId}`);
      console.log('✅ DELETE Participant (via program cascade)');

      return { success: true, participantId, sessionId, programId };
    } catch (error) {
      console.error('❌ Participants CRUD failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async testQRCodesCRUD() {
    console.log('\n🔄 Testing QR Codes CRUD...');
    
    try {
      // Create program and session first
      const programResult = await this.makeRequest('POST', `${BASE_URL}/api/training/programs`, {
        program_name: 'QR Test Program',
        description: 'Program for QR testing',
        program_type: 'seminar',
        duration_hours: 2
      });
      const programId = programResult.program.id;

      const sessionResult = await this.makeRequest('POST', `${BASE_URL}/api/training/sessions`, {
        program_id: programId,
        session_title: 'QR Test Session',
        session_date: '2025-08-01',
        session_time: '09:00:00',
        location: 'QR Test Center',
        max_participants: 15
      });
      const sessionId = sessionResult.session.id;

      // CREATE QR Code
      const newQRCode = {
        session_id: sessionId,
        code_type: 'registration',
        expires_at: '2025-08-01T12:00:00',
        max_usage: 50
      };
      
      const createResult = await this.makeRequest('POST', `${BASE_URL}/api/training/qr-codes`, newQRCode);
      console.log('✅ CREATE QR Code:', createResult.qr_code.code_type);
      const qrCodeId = createResult.qr_code.id;

      // READ (list)
      const listResult = await this.makeRequest('GET', `${BASE_URL}/api/training/qr-codes?session_id=${sessionId}`);
      console.log('✅ READ QR Codes:', listResult.length, 'QR codes found');

      // UPDATE
      const updateData = {
        is_active: false,
        max_usage: 100
      };
      
      const updateResult = await this.makeRequest('PUT', `${BASE_URL}/api/training/qr-codes?id=${qrCodeId}`, updateData);
      console.log('✅ UPDATE QR Code:', updateResult.qr_code.is_active ? 'Active' : 'Inactive');

      // Test QR Code usage logging
      const usageData = {
        participant_id: null,
        action_type: 'scan',
        user_agent: 'Test Browser',
        ip_address: '127.0.0.1',
        scan_data: { test: true }
      };
      
      try {
        const usageResult = await this.makeRequest('PATCH', `${BASE_URL}/api/training/qr-codes?qr_id=${qrCodeId}&session_id=${sessionId}`, usageData);
        console.log('✅ QR Code Usage Logged');
      } catch (usageError) {
        console.log('⚠️ QR Code usage logging failed (expected if inactive):', usageError.message);
      }

      // Cleanup
      await this.makeRequest('DELETE', `${BASE_URL}/api/training/programs?id=${programId}`);
      console.log('✅ DELETE QR Code (via program cascade)');

      return { success: true, qrCodeId, sessionId, programId };
    } catch (error) {
      console.error('❌ QR Codes CRUD failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async testTrainingFlow() {
    console.log('\n🔄 Testing Training Flow Management...');
    
    try {
      // Create program and session
      const programResult = await this.makeRequest('POST', `${BASE_URL}/api/training/programs`, {
        program_name: 'Flow Test Program',
        description: 'Program for flow testing',
        program_type: 'training',
        duration_hours: 5
      });
      const programId = programResult.program.id;

      const sessionResult = await this.makeRequest('POST', `${BASE_URL}/api/training/sessions`, {
        program_id: programId,
        session_title: 'Flow Test Session',
        session_date: '2025-09-01',
        session_time: '08:00:00',
        location: 'Flow Test Center',
        max_participants: 30
      });
      const sessionId = sessionResult.session.id;

      // READ flow status
      const flowResult = await this.makeRequest('GET', `${BASE_URL}/api/training/flow?session_id=${sessionId}`);
      console.log('✅ READ Flow Status:', flowResult.length, 'flow stages found');

      // UPDATE flow stage
      const updateFlowData = {
        stage_status: 'completed',
        qr_code_generated: true,
        participants_notified: true
      };
      
      const updateFlowResult = await this.makeRequest('PUT', `${BASE_URL}/api/training/flow?session_id=${sessionId}&stage=before`, updateFlowData);
      console.log('✅ UPDATE Flow Stage:', updateFlowResult.flow_stage.stage_status);

      // Cleanup
      await this.makeRequest('DELETE', `${BASE_URL}/api/training/programs?id=${programId}`);
      console.log('✅ Flow test cleanup complete');

      return { success: true, sessionId, programId };
    } catch (error) {
      console.error('❌ Training Flow failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async cleanupTestSession() {
    const client = await pool.connect();
    try {
      await client.query('DELETE FROM tbl_tarl_sessions WHERE session_token LIKE \'test-crud-session-%\'');
      console.log('✅ Test sessions cleaned up');
    } finally {
      client.release();
    }
  }

  async runAllTests() {
    console.log('🚀 Starting Training System CRUD Tests...\n');
    
    try {
      // Setup
      await this.setupTestSession();
      
      // Run all tests
      const results = {
        programs: await this.testProgramsCRUD(),
        sessions: await this.testSessionsCRUD(),
        participants: await this.testParticipantsCRUD(),
        qrCodes: await this.testQRCodesCRUD(),
        flow: await this.testTrainingFlow()
      };

      // Summary
      console.log('\n📊 CRUD Test Results Summary:');
      console.log('==========================================');
      
      const categories = Object.keys(results);
      const passed = categories.filter(cat => results[cat].success).length;
      const failed = categories.filter(cat => !results[cat].success).length;
      
      categories.forEach(category => {
        const status = results[category].success ? '✅ PASS' : '❌ FAIL';
        console.log(`${status} ${category.toUpperCase()}`);
        if (!results[category].success) {
          console.log(`   Error: ${results[category].error}`);
        }
      });
      
      console.log('==========================================');
      console.log(`Total: ${categories.length} | Passed: ${passed} | Failed: ${failed}`);
      
      if (failed === 0) {
        console.log('🎉 All Training CRUD operations are working correctly!');
      } else {
        console.log('⚠️ Some operations failed and need attention.');
      }

      return { passed, failed, results };
      
    } finally {
      // Cleanup
      await this.cleanupTestSession();
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new TrainingCRUDTester();
  tester.runAllTests()
    .then(({ passed, failed }) => {
      process.exit(failed === 0 ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = { TrainingCRUDTester };