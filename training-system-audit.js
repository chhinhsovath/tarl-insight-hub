#!/usr/bin/env node

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function auditTrainingSystem() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 COMPREHENSIVE TRAINING SYSTEM AUDIT');
    console.log('=' .repeat(60));
    
    // 1. Check database tables
    console.log('\n📋 1. DATABASE TABLES:');
    const tables = [
      'tbl_tarl_training_programs',
      'tbl_tarl_training_sessions', 
      'tbl_tarl_training_participants',
      'tbl_tarl_training_registrations',
      'tbl_tarl_master_participants',
      'tbl_tarl_training_materials',
      'tbl_tarl_training_feedback',
      'tbl_tarl_training_flow',
      'tbl_tarl_qr_codes'
    ];
    
    let tableStatus = {};
    for (const table of tables) {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = $1
        )
      `, [table]);
      
      const exists = result.rows[0].exists;
      tableStatus[table] = exists;
      console.log(`   ${exists ? '✅' : '❌'} ${table}`);
      
      if (exists) {
        const countResult = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`      Records: ${countResult.rows[0].count}`);
      }
    }
    
    // 2. Check API files
    console.log('\n📋 2. API ENDPOINTS:');
    const apiEndpoints = [
      '/api/training/sessions',
      '/api/training/programs',
      '/api/training/participants', 
      '/api/training/materials',
      '/api/training/feedback',
      '/api/training/qr-codes',
      '/api/training/flow'
    ];
    
    const fs = require('fs');
    const path = require('path');
    
    for (const endpoint of apiEndpoints) {
      const filePath = path.join(__dirname, 'app', endpoint, 'route.ts');
      const exists = fs.existsSync(filePath);
      console.log(`   ${exists ? '✅' : '❌'} ${endpoint} -> ${filePath}`);
    }
    
    // 3. Check frontend pages
    console.log('\n📋 3. FRONTEND PAGES:');
    const pages = [
      'app/(dashboard)/training/page.tsx',
      'app/(dashboard)/training/sessions/page.tsx',
      'app/(dashboard)/training/programs/page.tsx',
      'app/(dashboard)/training/participants/page.tsx',
      'app/(dashboard)/training/qr-codes/page.tsx',
      'app/(dashboard)/training/feedback/page.tsx'
    ];
    
    for (const pagePath of pages) {
      const fullPath = path.join(__dirname, pagePath);
      const exists = fs.existsSync(fullPath);
      console.log(`   ${exists ? '✅' : '❌'} ${pagePath}`);
    }
    
    // 4. Check permissions 
    console.log('\n📋 4. PERMISSION SYSTEM:');
    
    const permissionsResult = await client.query(`
      SELECT page_name, page_path, page_title
      FROM page_permissions 
      WHERE page_name LIKE 'training%' OR page_name = 'Training'
      ORDER BY page_name
    `);
    
    console.log(`   Training pages in permissions: ${permissionsResult.rows.length}`);
    permissionsResult.rows.forEach(page => {
      console.log(`   ✅ ${page.page_name} (${page.page_path})`);
    });
    
    // 5. Check for functional issues
    console.log('\n📋 5. FUNCTIONAL ANALYSIS:');
    
    // Check if registrations vs participants table issue
    const hasRegistrations = tableStatus['tbl_tarl_training_registrations'];
    const hasParticipants = tableStatus['tbl_tarl_training_participants'];
    const hasMasterParticipants = tableStatus['tbl_tarl_master_participants'];
    
    if (hasRegistrations && hasParticipants) {
      console.log('   ⚠️  DUAL SYSTEM: Both registrations AND participants tables exist');
      
      const regCount = await client.query('SELECT COUNT(*) as count FROM tbl_tarl_training_registrations');
      const partCount = await client.query('SELECT COUNT(*) as count FROM tbl_tarl_training_participants');
      
      console.log(`      Registrations: ${regCount.rows[0].count} records`);
      console.log(`      Participants: ${partCount.rows[0].count} records`);
      
      if (regCount.rows[0].count > 0 && partCount.rows[0].count == 0) {
        console.log('   ✅ Using registrations table (newer system)');
      } else if (partCount.rows[0].count > 0 && regCount.rows[0].count == 0) {
        console.log('   ⚠️  Using participants table (older system)');
      } else {
        console.log('   ❌ INCONSISTENT: Both tables have data');
      }
    } else if (hasRegistrations) {
      console.log('   ✅ Using registrations table (recommended)');
    } else if (hasParticipants) {
      console.log('   ⚠️  Using participants table (older system)');
    }
    
    if (hasMasterParticipants) {
      console.log('   ✅ Master participants system available (returning participant tracking)');
    } else {
      console.log('   ❌ No master participants system (no returning participant tracking)');
    }
    
    // 6. Check training workflow
    console.log('\n📋 6. TRAINING WORKFLOW:');
    
    if (tableStatus['tbl_tarl_training_flow']) {
      const flowResult = await client.query(`
        SELECT flow_stage, COUNT(*) as count
        FROM tbl_tarl_training_flow
        GROUP BY flow_stage
        ORDER BY flow_stage
      `);
      
      console.log('   Three-stage workflow status:');
      ['before', 'during', 'after'].forEach(stage => {
        const stageData = flowResult.rows.find(r => r.flow_stage === stage);
        const count = stageData ? stageData.count : 0;
        console.log(`   ${count > 0 ? '✅' : '⚪'} ${stage.toUpperCase()}: ${count} records`);
      });
    }
    
    // 7. Generate recommendations
    console.log('\n📋 7. RECOMMENDATIONS:');
    
    let recommendations = [];
    
    if (!tableStatus['tbl_tarl_master_participants']) {
      recommendations.push('❗ CRITICAL: Set up master participants system for returning participant tracking');
    }
    
    if (hasRegistrations && hasParticipants) {
      recommendations.push('⚠️  OPTIMIZE: Consider consolidating participant/registration tables');
    }
    
    if (permissionsResult.rows.length < 5) {
      recommendations.push('⚠️  SETUP: Configure remaining training pages in permission system');
    }
    
    if (!tableStatus['tbl_tarl_training_materials']) {
      recommendations.push('❗ MISSING: Training materials system not fully set up');
    }
    
    if (recommendations.length === 0) {
      console.log('   ✅ Training system appears fully functional!');
    } else {
      recommendations.forEach(rec => console.log(`   ${rec}`));
    }
    
    // 8. Overall assessment
    console.log('\n' + '='.repeat(60));
    console.log('🎯 OVERALL ASSESSMENT:');
    
    const criticalTables = ['tbl_tarl_training_programs', 'tbl_tarl_training_sessions'];
    const hasCriticalTables = criticalTables.every(table => tableStatus[table]);
    
    const hasRegistrationSystem = hasRegistrations || hasParticipants;
    const hasWorkflow = tableStatus['tbl_tarl_training_flow'];
    const hasQRSystem = tableStatus['tbl_tarl_qr_codes'];
    
    let functionalityScore = 0;
    if (hasCriticalTables) functionalityScore += 25;
    if (hasRegistrationSystem) functionalityScore += 25;
    if (hasWorkflow) functionalityScore += 20;
    if (hasQRSystem) functionalityScore += 15;
    if (hasMasterParticipants) functionalityScore += 15;
    
    console.log(`📊 Functionality Score: ${functionalityScore}/100`);
    
    if (functionalityScore >= 80) {
      console.log('✅ EXCELLENT: Training system is fully functional');
    } else if (functionalityScore >= 60) {
      console.log('⚠️  GOOD: Training system works but has some gaps');
    } else if (functionalityScore >= 40) {
      console.log('⚠️  PARTIAL: Basic training functionality available');
    } else {
      console.log('❌ POOR: Training system needs significant work');
    }
    
  } catch (error) {
    console.error('❌ Error during audit:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

auditTrainingSystem().catch(console.error);