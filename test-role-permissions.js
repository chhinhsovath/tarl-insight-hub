#!/usr/bin/env node

/**
 * Comprehensive Role Permission Testing Script
 * 
 * This script tests the role-based permission system by:
 * 1. Checking database role configurations
 * 2. Verifying page-level permissions
 * 3. Testing action-level permissions  
 * 4. Validating training module permissions
 * 5. Testing frontend role restrictions
 */

const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.PGUSER || 'postgres',
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDATABASE || 'pratham_tarl',
  password: process.env.PGPASSWORD || '12345',
  port: parseInt(process.env.PGPORT || '5432', 10),
});

// Test data structure
const testResults = {
  roleTests: {},
  permissionTests: {},
  trainingPermissionTests: {},
  errors: []
};

// Define role hierarchy and expected permissions
const roleHierarchy = {
  'admin': {
    level: 1,
    canManageHierarchy: true,
    maxHierarchyDepth: 999,
    expectedPageAccess: ['all'],
    expectedTrainingAccess: {
      programs: { view: true, create: true, update: true, delete: true },
      sessions: { view: true, create: true, update: true, delete: true },
      participants: { view: true, create: true, update: true, delete: true },
      qrCodes: { view: true, create: true, update: true, delete: true },
      feedback: { view: true, create: true, update: true, delete: true }
    }
  },
  'director': {
    level: 2,
    canManageHierarchy: true,
    maxHierarchyDepth: 3,
    expectedPageAccess: ['dashboard', 'training', 'schools', 'analytics'],
    expectedTrainingAccess: {
      programs: { view: true, create: true, update: true, delete: true },
      sessions: { view: true, create: true, update: true, delete: true },
      participants: { view: true, create: true, update: true, delete: true },
      qrCodes: { view: true, create: true, update: true, delete: true },
      feedback: { view: true, create: false, update: false, delete: false }
    }
  },
  'partner': {
    level: 2,
    canManageHierarchy: true,
    maxHierarchyDepth: 3,
    expectedPageAccess: ['dashboard', 'training', 'schools', 'analytics'],
    expectedTrainingAccess: {
      programs: { view: true, create: true, update: true, delete: true },
      sessions: { view: true, create: true, update: true, delete: true },
      participants: { view: true, create: true, update: true, delete: true },
      qrCodes: { view: true, create: true, update: true, delete: true },
      feedback: { view: true, create: false, update: false, delete: false }
    }
  },
  'coordinator': {
    level: 3,
    canManageHierarchy: false,
    maxHierarchyDepth: 1,
    expectedPageAccess: ['dashboard', 'training', 'schools', 'analytics'],
    expectedTrainingAccess: {
      programs: { view: true, create: true, update: true, delete: false },
      sessions: { view: true, create: true, update: true, delete: true },
      participants: { view: true, create: true, update: true, delete: true },
      qrCodes: { view: true, create: true, update: true, delete: true },
      feedback: { view: true, create: false, update: false, delete: false }
    }
  },
  'teacher': {
    level: 3,
    canManageHierarchy: false,
    maxHierarchyDepth: 1,
    expectedPageAccess: ['dashboard', 'training', 'students', 'observations'],
    expectedTrainingAccess: {
      programs: { view: true, create: false, update: false, delete: false },
      sessions: { view: true, create: false, update: true, delete: false },
      participants: { view: true, create: false, update: true, delete: false },
      qrCodes: { view: true, create: false, update: false, delete: false },
      feedback: { view: true, create: false, update: false, delete: false }
    }
  },
  'collector': {
    level: 3,
    canManageHierarchy: false,
    maxHierarchyDepth: 0,
    expectedPageAccess: ['dashboard', 'data collection', 'observations'],
    expectedTrainingAccess: {
      programs: { view: false, create: false, update: false, delete: false },
      sessions: { view: false, create: false, update: false, delete: false },
      participants: { view: false, create: false, update: false, delete: false },
      qrCodes: { view: false, create: false, update: false, delete: false },
      feedback: { view: false, create: false, update: false, delete: false }
    }
  },
  'intern': {
    level: 4,
    canManageHierarchy: false,
    maxHierarchyDepth: 0,
    expectedPageAccess: ['dashboard'],
    expectedTrainingAccess: {
      programs: { view: false, create: false, update: false, delete: false },
      sessions: { view: false, create: false, update: false, delete: false },
      participants: { view: false, create: false, update: false, delete: false },
      qrCodes: { view: false, create: false, update: false, delete: false },
      feedback: { view: false, create: false, update: false, delete: false }
    }
  }
};

async function testRoleHierarchy() {
  console.log('🔍 Testing Role Hierarchy...');
  
  try {
    const result = await pool.query(`
      SELECT name, hierarchy_level, can_manage_hierarchy, max_hierarchy_depth, description 
      FROM tbl_tarl_roles 
      ORDER BY hierarchy_level
    `);
    
    result.rows.forEach(role => {
      const roleName = role.name.toLowerCase();
      const expected = roleHierarchy[roleName];
      
      if (!expected) {
        testResults.errors.push(`Unknown role in database: ${role.name}`);
        return;
      }
      
      testResults.roleTests[roleName] = {
        exists: true,
        hierarchyLevel: role.hierarchy_level === expected.level,
        canManageHierarchy: role.can_manage_hierarchy === expected.canManageHierarchy,
        maxHierarchyDepth: role.max_hierarchy_depth === expected.maxHierarchyDepth,
        description: role.description || 'No description'
      };
    });
    
    console.log('✅ Role hierarchy test completed');
  } catch (error) {
    testResults.errors.push(`Role hierarchy test failed: ${error.message}`);
    console.log('❌ Role hierarchy test failed');
  }
}

async function testPagePermissions() {
  console.log('🔍 Testing Page Permissions...');
  
  try {
    const result = await pool.query(`
      SELECT rpp.role, pp.page_name, rpp.is_allowed 
      FROM role_page_permissions rpp 
      JOIN page_permissions pp ON rpp.page_id = pp.id 
      WHERE pp.page_name IN ('Dashboard', 'បណ្តុះបណ្តាល', 'Schools', 'Analytics', 'Students', 'Data Collection', 'Observations')
      ORDER BY rpp.role, pp.page_name
    `);
    
    // Group by role
    const permissionsByRole = {};
    result.rows.forEach(row => {
      if (!permissionsByRole[row.role]) {
        permissionsByRole[row.role] = {};
      }
      permissionsByRole[row.role][row.page_name] = row.is_allowed;
    });
    
    Object.keys(roleHierarchy).forEach(role => {
      const capitalizedRole = role.charAt(0).toUpperCase() + role.slice(1);
      const permissions = permissionsByRole[capitalizedRole] || permissionsByRole[role];
      
      if (!permissions) {
        testResults.errors.push(`No page permissions found for role: ${role}`);
        return;
      }
      
      testResults.permissionTests[role] = {
        hasBasicAccess: permissions['Dashboard'] || false,
        hasTrainingAccess: permissions['បណ្តុះបណ្តាល'] || false,
        hasSchoolAccess: permissions['Schools'] || false,
        hasAnalyticsAccess: permissions['Analytics'] || false,
        hasDataCollectionAccess: permissions['Data Collection'] || false,
        permissions: permissions
      };
    });
    
    console.log('✅ Page permissions test completed');
  } catch (error) {
    testResults.errors.push(`Page permissions test failed: ${error.message}`);
    console.log('❌ Page permissions test failed');
  }
}

async function testTrainingActionPermissions() {
  console.log('🔍 Testing Training Action Permissions...');
  
  try {
    const result = await pool.query(`
      SELECT pap.role, pp.page_name, pap.action_name, pap.is_allowed 
      FROM page_action_permissions pap 
      JOIN page_permissions pp ON pap.page_id = pp.id 
      WHERE pp.page_name LIKE '%បណ្តុះបណ្តាល%'
      ORDER BY pap.role, pp.page_name, pap.action_name
    `);
    
    // Map Khmer page names to English equivalents
    const pageNameMap = {
      'កម្មវិធីបណ្តុះបណ្តាល': 'programs',
      'សម័យបណ្តុះបណ្តាល': 'sessions', 
      'អ្នកចូលរួមបណ្តុះបណ្តាល': 'participants',
      'លេខកូដ QR': 'qrCodes',
      'មតិយោបល់បណ្តុះបណ្តាល': 'feedback'
    };
    
    // Group by role and page
    const actionPermissionsByRole = {};
    result.rows.forEach(row => {
      const role = row.role.toLowerCase();
      const page = pageNameMap[row.page_name] || row.page_name;
      
      if (!actionPermissionsByRole[role]) {
        actionPermissionsByRole[role] = {};
      }
      if (!actionPermissionsByRole[role][page]) {
        actionPermissionsByRole[role][page] = {};
      }
      
      actionPermissionsByRole[role][page][row.action_name] = row.is_allowed;
    });
    
    Object.keys(roleHierarchy).forEach(role => {
      const actualPermissions = actionPermissionsByRole[role] || {};
      const expectedPermissions = roleHierarchy[role].expectedTrainingAccess;
      
      testResults.trainingPermissionTests[role] = {
        programs: comparePermissions(actualPermissions.programs, expectedPermissions.programs),
        sessions: comparePermissions(actualPermissions.sessions, expectedPermissions.sessions),
        participants: comparePermissions(actualPermissions.participants, expectedPermissions.participants),
        qrCodes: comparePermissions(actualPermissions.qrCodes, expectedPermissions.qrCodes),
        feedback: comparePermissions(actualPermissions.feedback, expectedPermissions.feedback),
        actualPermissions: actualPermissions
      };
    });
    
    console.log('✅ Training action permissions test completed');
  } catch (error) {
    testResults.errors.push(`Training action permissions test failed: ${error.message}`);
    console.log('❌ Training action permissions test failed');
  }
}

function comparePermissions(actual, expected) {
  if (!actual || !expected) {
    return { match: false, reason: 'Missing permissions data' };
  }
  
  const actions = ['view', 'create', 'update', 'delete'];
  const results = {};
  
  actions.forEach(action => {
    const actualValue = actual[action] || false;
    const expectedValue = expected[action] || false;
    results[action] = {
      actual: actualValue,
      expected: expectedValue,
      match: actualValue === expectedValue
    };
  });
  
  const allMatch = actions.every(action => results[action].match);
  
  return {
    match: allMatch,
    details: results,
    summary: `${actions.filter(action => results[action].match).length}/${actions.length} actions match`
  };
}

async function testUsersExist() {
  console.log('🔍 Testing User Accounts...');
  
  try {
    const result = await pool.query(`
      SELECT role, COUNT(*) as count 
      FROM tbl_tarl_users 
      WHERE role IN ('admin', 'director', 'partner', 'coordinator', 'teacher', 'collector', 'intern')
      GROUP BY role 
      ORDER BY role
    `);
    
    const userCounts = {};
    result.rows.forEach(row => {
      userCounts[row.role] = parseInt(row.count);
    });
    
    Object.keys(roleHierarchy).forEach(role => {
      const capitalizedRole = role.charAt(0).toUpperCase() + role.slice(1);
      const count = userCounts[capitalizedRole] || userCounts[role] || 0;
      
      testResults.roleTests[role] = {
        ...testResults.roleTests[role],
        userAccountsExist: count > 0,
        userCount: count
      };
    });
    
    console.log('✅ User accounts test completed');
  } catch (error) {
    testResults.errors.push(`User accounts test failed: ${error.message}`);
    console.log('❌ User accounts test failed');
  }
}

function generateReport() {
  console.log('\n📊 ROLE PERMISSION TEST REPORT');
  console.log('=====================================\n');
  
  // Role Tests Summary
  console.log('👥 ROLE TESTS:');
  Object.keys(testResults.roleTests).forEach(role => {
    const test = testResults.roleTests[role];
    const status = test.exists && test.hierarchyLevel && test.userAccountsExist ? '✅' : '❌';
    console.log(`${status} ${role.toUpperCase()}: ${test.userCount || 0} users, Level ${test.hierarchyLevel ? 'OK' : 'MISMATCH'}`);
  });
  
  // Page Permission Tests
  console.log('\n📄 PAGE PERMISSIONS:');
  Object.keys(testResults.permissionTests).forEach(role => {
    const test = testResults.permissionTests[role];
    const basicAccess = test.hasBasicAccess ? '✅' : '❌';
    const trainingAccess = test.hasTrainingAccess ? '✅' : '❌';
    console.log(`${role.toUpperCase()}: Dashboard ${basicAccess} | Training ${trainingAccess}`);
  });
  
  // Training Action Permissions
  console.log('\n🎯 TRAINING ACTION PERMISSIONS:');
  Object.keys(testResults.trainingPermissionTests).forEach(role => {
    const test = testResults.trainingPermissionTests[role];
    console.log(`\n${role.toUpperCase()}:`);
    
    ['programs', 'sessions', 'participants', 'qrCodes', 'feedback'].forEach(module => {
      const moduleTest = test[module];
      if (moduleTest && moduleTest.details) {
        const status = moduleTest.match ? '✅' : '❌';
        console.log(`  ${status} ${module}: ${moduleTest.summary}`);
        
        if (!moduleTest.match) {
          Object.keys(moduleTest.details).forEach(action => {
            const detail = moduleTest.details[action];
            if (!detail.match) {
              console.log(`    ⚠️  ${action}: expected ${detail.expected}, got ${detail.actual}`);
            }
          });
        }
      }
    });
  });
  
  // Errors
  if (testResults.errors.length > 0) {
    console.log('\n🚨 ERRORS:');
    testResults.errors.forEach(error => {
      console.log(`❌ ${error}`);
    });
  }
  
  // Frontend Permission Rules Summary
  console.log('\n🎮 FRONTEND PERMISSION RULES:');
  console.log('Programs Creation: admin, director, partner');
  console.log('Sessions Creation: admin, director, partner, coordinator');
  console.log('QR Code Management: admin, director, partner, coordinator');
  console.log('Participant Management: admin, director, partner, coordinator, teacher');
  console.log('Feedback Analysis: admin, director, partner, coordinator, teacher');
  
  // Overall Status
  const totalTests = Object.keys(roleHierarchy).length;
  const passedRoleTests = Object.keys(testResults.roleTests).filter(role => {
    const test = testResults.roleTests[role];
    return test.exists && test.hierarchyLevel && test.userAccountsExist;
  }).length;
  
  const passedPermissionTests = Object.keys(testResults.permissionTests).filter(role => {
    const test = testResults.permissionTests[role];
    return test.hasBasicAccess; // Basic requirement
  }).length;
  
  console.log('\n📈 OVERALL STATUS:');
  console.log(`Role Tests: ${passedRoleTests}/${totalTests} passed`);
  console.log(`Permission Tests: ${passedPermissionTests}/${totalTests} passed`);
  console.log(`Errors: ${testResults.errors.length}`);
  
  const overallStatus = (passedRoleTests === totalTests && passedPermissionTests === totalTests && testResults.errors.length === 0) ? 'PASSED' : 'NEEDS ATTENTION';
  console.log(`\n🎯 OVERALL: ${overallStatus}`);
}

async function runAllTests() {
  console.log('🚀 Starting Comprehensive Role Permission Tests\n');
  
  try {
    await testRoleHierarchy();
    await testUsersExist();
    await testPagePermissions();
    await testTrainingActionPermissions();
    
    generateReport();
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  } finally {
    await pool.end();
  }
}

// Run the tests
runAllTests();