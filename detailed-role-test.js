#!/usr/bin/env node

/**
 * Detailed Role Permission Testing
 * Tests each specific role against frontend permission rules
 */

const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.PGUSER || 'postgres',
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDATABASE || 'pratham_tarl',
  password: process.env.PGPASSWORD || '12345',
  port: parseInt(process.env.PGPORT || '5432', 10),
});

// Frontend permission rules extracted from code
const frontendPermissionRules = {
  'canCreatePrograms': ['admin', 'director', 'partner'],
  'canCreateSessions': ['admin', 'director', 'partner', 'coordinator'],
  'canManageQrCodes': ['admin', 'director', 'partner', 'coordinator'],
  'canManageParticipants': ['admin', 'director', 'partner', 'coordinator', 'teacher'],
  'canViewFeedback': ['admin', 'director', 'partner', 'coordinator', 'teacher']
};

// Training module action requirements from database
const trainingModules = {
  'កម្មវិធីបណ្តុះបណ្តាល': 'programs',      // Training Programs
  'សម័យបណ្តុះបណ្តាល': 'sessions',       // Training Sessions  
  'អ្នកចូលរួមបណ្តុះបណ្តាល': 'participants', // Training Participants
  'លេខកូដ QR': 'qrCodes',               // QR Codes
  'មតិយោបល់បណ្តុះបណ្តាល': 'feedback'      // Training Feedback
};

async function testRolePermissions() {
  console.log('🔍 Testing Role-Based Permissions\n');
  
  // Get all roles and users
  const rolesResult = await pool.query('SELECT DISTINCT role FROM tbl_tarl_users ORDER BY role');
  const roles = rolesResult.rows.map(r => r.role);
  
  console.log('📋 Found roles:', roles.join(', '));
  console.log('');
  
  for (const role of roles) {
    await testRoleSpecific(role);
    console.log('');
  }
}

async function testRoleSpecific(role) {
  console.log(`👤 Testing ${role.toUpperCase()} role:`);
  
  // Test page access
  const pageResult = await pool.query(`
    SELECT pp.page_name, rpp.is_allowed 
    FROM role_page_permissions rpp 
    JOIN page_permissions pp ON rpp.page_id = pp.id 
    WHERE rpp.role = $1 
    ORDER BY pp.page_name
  `, [role]);
  
  const pages = {};
  pageResult.rows.forEach(row => {
    pages[row.page_name] = row.is_allowed;
  });
  
  // Test training access
  const hasTrainingAccess = pages['បណ្តុះបណ្តាល'] || false;
  console.log(`  📄 Training Module Access: ${hasTrainingAccess ? '✅ YES' : '❌ NO'}`);
  
  if (hasTrainingAccess) {
    // Test action permissions for each training module
    const actionResult = await pool.query(`
      SELECT pp.page_name, pap.action_name, pap.is_allowed 
      FROM page_action_permissions pap 
      JOIN page_permissions pp ON pap.page_id = pp.id 
      WHERE pap.role = $1 AND pp.page_name LIKE '%បណ្តុះបណ្តាល%'
      ORDER BY pp.page_name, pap.action_name
    `, [role]);
    
    // Group by module
    const modulePermissions = {};
    actionResult.rows.forEach(row => {
      const module = trainingModules[row.page_name];
      if (module) {
        if (!modulePermissions[module]) {
          modulePermissions[module] = {};
        }
        modulePermissions[module][row.action_name] = row.is_allowed;
      }
    });
    
    // Test frontend permission rules
    Object.keys(frontendPermissionRules).forEach(permission => {
      const allowedRoles = frontendPermissionRules[permission];
      const roleHasPermission = allowedRoles.includes(role.toLowerCase());
      const status = roleHasPermission ? '✅' : '❌';
      console.log(`  🎯 ${permission}: ${status}`);
    });
    
    // Show detailed module permissions
    Object.keys(modulePermissions).forEach(module => {
      const perms = modulePermissions[module];
      const actions = ['view', 'create', 'update', 'delete'].map(action => {
        const allowed = perms[action] || false;
        return `${action}:${allowed ? '✅' : '❌'}`;
      }).join(' ');
      console.log(`  📊 ${module}: ${actions}`);
    });
  }
  
  // Test key page access
  const keyPages = ['Dashboard', 'Schools', 'Analytics', 'System Admin'];
  keyPages.forEach(page => {
    const hasAccess = pages[page] || false;
    const status = hasAccess ? '✅' : '❌';
    console.log(`  📄 ${page}: ${status}`);
  });
}

async function testPermissionConsistency() {
  console.log('🔍 Testing Permission Consistency\n');
  
  // Check if frontend rules match database permissions
  for (const [permission, allowedRoles] of Object.entries(frontendPermissionRules)) {
    console.log(`🎯 ${permission}:`);
    console.log(`  Frontend allows: ${allowedRoles.join(', ')}`);
    
    // Find corresponding database checks
    let dbModule = '';
    if (permission.includes('Programs')) dbModule = 'programs';
    else if (permission.includes('Sessions')) dbModule = 'sessions';
    else if (permission.includes('QrCodes')) dbModule = 'qrCodes';
    else if (permission.includes('Participants')) dbModule = 'participants';
    else if (permission.includes('Feedback')) dbModule = 'feedback';
    
    if (dbModule) {
      // Find corresponding Khmer page name
      const khmerPageName = Object.keys(trainingModules).find(key => trainingModules[key] === dbModule);
      
      if (khmerPageName) {
        const actionResult = await pool.query(`
          SELECT pap.role, pap.action_name, pap.is_allowed 
          FROM page_action_permissions pap 
          JOIN page_permissions pp ON pap.page_id = pp.id 
          WHERE pp.page_name = $1 AND pap.action_name IN ('create', 'view', 'update')
          ORDER BY pap.role
        `, [khmerPageName]);
        
        const dbRoles = actionResult.rows
          .filter(row => row.is_allowed && ['create', 'view'].includes(row.action_name))
          .map(row => row.role.toLowerCase())
          .filter((role, index, self) => self.indexOf(role) === index);
        
        console.log(`  Database allows: ${dbRoles.join(', ')}`);
        
        // Check consistency
        const frontendSet = new Set(allowedRoles);
        const dbSet = new Set(dbRoles);
        const consistent = allowedRoles.every(role => dbSet.has(role));
        console.log(`  Consistency: ${consistent ? '✅ MATCH' : '❌ MISMATCH'}`);
        
        if (!consistent) {
          const missing = allowedRoles.filter(role => !dbSet.has(role));
          const extra = dbRoles.filter(role => !frontendSet.has(role));
          if (missing.length > 0) console.log(`    Missing in DB: ${missing.join(', ')}`);
          if (extra.length > 0) console.log(`    Extra in DB: ${extra.join(', ')}`);
        }
      }
    }
    console.log('');
  }
}

async function testSpecificScenarios() {
  console.log('🔍 Testing Specific Permission Scenarios\n');
  
  // Test 1: Admin should have full access
  console.log('Test 1: Admin Full Access');
  const adminResult = await pool.query(`
    SELECT COUNT(*) as total,
           SUM(CASE WHEN is_allowed = true THEN 1 ELSE 0 END) as allowed
    FROM role_page_permissions rpp 
    JOIN page_permissions pp ON rpp.page_id = pp.id 
    WHERE rpp.role = 'admin'
  `);
  
  const adminStats = adminResult.rows[0];
  console.log(`  Admin has access to ${adminStats.allowed}/${adminStats.total} pages`);
  console.log(`  Status: ${adminStats.allowed === adminStats.total ? '✅ PASS' : '❌ FAIL'}`);
  
  // Test 2: Teacher should have limited access
  console.log('\nTest 2: Teacher Limited Access');
  const teacherResult = await pool.query(`
    SELECT pp.page_name, rpp.is_allowed 
    FROM role_page_permissions rpp 
    JOIN page_permissions pp ON rpp.page_id = pp.id 
    WHERE rpp.role = 'teacher' AND pp.page_name IN ('System Admin', 'Pages Management', 'Users')
  `);
  
  const restrictedAccess = teacherResult.rows.filter(row => row.is_allowed).length;
  console.log(`  Teacher has access to ${restrictedAccess}/3 restricted admin pages`);
  console.log(`  Status: ${restrictedAccess === 0 ? '✅ PASS' : '❌ FAIL - has admin access'}`);
  
  // Test 3: Training Organizer should only access training
  console.log('\nTest 3: Training Organizer Scope');
  const organizerResult = await pool.query(`
    SELECT pp.page_name, rpp.is_allowed 
    FROM role_page_permissions rpp 
    JOIN page_permissions pp ON rpp.page_id = pp.id 
    WHERE rpp.role = 'Training Organizer'
  `);
  
  const organizerPages = organizerResult.rows.filter(row => row.is_allowed);
  const trainingOnlyPages = organizerPages.filter(row => 
    row.page_name.includes('បណ្តុះបណ្តាល') || row.page_name === 'Dashboard'
  );
  
  console.log(`  Training Organizer has access to ${organizerPages.length} total pages`);
  console.log(`  Training-related pages: ${trainingOnlyPages.length}`);
  console.log(`  Status: ${organizerPages.length === trainingOnlyPages.length ? '✅ PASS' : '❌ NEEDS REVIEW'}`);
}

async function runDetailedTests() {
  try {
    await testRolePermissions();
    await testPermissionConsistency();
    await testSpecificScenarios();
    
    console.log('\n✅ Detailed permission testing completed');
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await pool.end();
  }
}

runDetailedTests();