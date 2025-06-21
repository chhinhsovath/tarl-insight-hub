#!/usr/bin/env node

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function testTrainingFunctions() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Testing Training System Functions...\n');
    
    // Test 1: Check if all training tables exist
    console.log('1. Checking training table existence...');
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
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = $1
        )
      `, [table]);
      
      console.log(`   ${table}: ${result.rows[0].exists ? '✅ EXISTS' : '❌ MISSING'}`);
    }
    
    // Test 2: Check training programs
    console.log('\n2. Testing training programs...');
    const programsResult = await client.query('SELECT COUNT(*) as count FROM tbl_tarl_training_programs');
    console.log(`   Programs in database: ${programsResult.rows[0].count}`);
    
    if (programsResult.rows[0].count > 0) {
      const sampleProgram = await client.query('SELECT program_name, program_type FROM tbl_tarl_training_programs LIMIT 1');
      console.log(`   Sample: "${sampleProgram.rows[0].program_name}" (${sampleProgram.rows[0].program_type})`);
    }
    
    // Test 3: Check training sessions
    console.log('\n3. Testing training sessions...');
    const sessionsResult = await client.query('SELECT COUNT(*) as count FROM tbl_tarl_training_sessions');
    console.log(`   Sessions in database: ${sessionsResult.rows[0].count}`);
    
    if (sessionsResult.rows[0].count > 0) {
      const sampleSession = await client.query(`
        SELECT ts.session_title, ts.session_status, tp.program_name 
        FROM tbl_tarl_training_sessions ts
        LEFT JOIN tbl_tarl_training_programs tp ON ts.program_id = tp.id
        LIMIT 1
      `);
      const session = sampleSession.rows[0];
      console.log(`   Sample: "${session.session_title}" - ${session.session_status} (${session.program_name || 'No program'})`);
    }
    
    // Test 4: Check participants/registrations  
    console.log('\n4. Testing participants...');
    
    // Check both tables
    const participantsResult = await client.query('SELECT COUNT(*) as count FROM tbl_tarl_training_participants WHERE 1=1');
    console.log(`   Participants table: ${participantsResult.rows[0].count} records`);
    
    // Check if registrations table exists
    const registrationsCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'tbl_tarl_training_registrations'
      )
    `);
    
    if (registrationsCheck.rows[0].exists) {
      const registrationsResult = await client.query('SELECT COUNT(*) as count FROM tbl_tarl_training_registrations');
      console.log(`   Registrations table: ${registrationsResult.rows[0].count} records`);
    } else {
      console.log(`   Registrations table: ❌ MISSING`);
    }
    
    // Test 5: Check materials
    console.log('\n5. Testing training materials...');
    const materialsResult = await client.query('SELECT COUNT(*) as count FROM tbl_tarl_training_materials');
    console.log(`   Materials in database: ${materialsResult.rows[0].count}`);
    
    // Test 6: Check feedback
    console.log('\n6. Testing feedback system...');
    const feedbackResult = await client.query('SELECT COUNT(*) as count FROM tbl_tarl_training_feedback');
    console.log(`   Feedback records: ${feedbackResult.rows[0].count}`);
    
    // Test 7: Check QR codes
    console.log('\n7. Testing QR code system...');
    const qrResult = await client.query('SELECT COUNT(*) as count FROM tbl_tarl_qr_codes');
    console.log(`   QR codes generated: ${qrResult.rows[0].count}`);
    
    // Test 8: Check training flow
    console.log('\n8. Testing training flow...');
    const flowResult = await client.query('SELECT COUNT(*) as count FROM tbl_tarl_training_flow');
    console.log(`   Training flow records: ${flowResult.rows[0].count}`);
    
    // Test 9: Check training permissions
    console.log('\n9. Testing training permissions...');
    const permissionsResult = await client.query(`
      SELECT pp.page_name, COUNT(rpp.role) as roles_with_access
      FROM page_permissions pp
      LEFT JOIN role_page_permissions rpp ON pp.id = rpp.page_id AND rpp.is_allowed = true
      WHERE pp.page_name LIKE 'training%'
      GROUP BY pp.page_name
      ORDER BY pp.page_name
    `);
    
    if (permissionsResult.rows.length > 0) {
      console.log('   Training pages in permission system:');
      permissionsResult.rows.forEach(row => {
        console.log(`     - ${row.page_name}: ${row.roles_with_access} roles have access`);
      });
    } else {
      console.log('   ❌ No training pages found in permission system');
    }
    
    // Test 10: Master participants system (if exists)
    console.log('\n10. Testing master participants system...');
    const masterParticipantsCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'tbl_tarl_master_participants'
      )
    `);
    
    if (masterParticipantsCheck.rows[0].exists) {
      const masterResult = await client.query('SELECT COUNT(*) as count FROM tbl_tarl_master_participants');
      console.log(`   Master participants: ✅ EXISTS - ${masterResult.rows[0].count} records`);
    } else {
      console.log(`   Master participants: ❌ MISSING (returning participant tracking unavailable)`);
    }
    
    console.log('\n📊 TRAINING SYSTEM STATUS SUMMARY:');
    console.log('=' .repeat(50));
    
    // Overall assessment
    let issues = [];
    
    if (programsResult.rows[0].count == 0) issues.push('No training programs');
    if (sessionsResult.rows[0].count == 0) issues.push('No training sessions');
    if (!registrationsCheck.rows[0].exists) issues.push('Missing registrations table');
    if (!masterParticipantsCheck.rows[0].exists) issues.push('Missing master participants (no returning participant tracking)');
    if (permissionsResult.rows.length == 0) issues.push('Training permissions not configured');
    
    if (issues.length === 0) {
      console.log('✅ Training system appears to be FULLY FUNCTIONAL');
    } else {
      console.log('⚠️  Training system has the following issues:');
      issues.forEach(issue => console.log(`   - ${issue}`));
    }
    
  } catch (error) {
    console.error('❌ Error testing training functions:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

testTrainingFunctions().catch(console.error);