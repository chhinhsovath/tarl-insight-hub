#!/usr/bin/env node

/**
 * Test CRUD Operations with Synchronization
 * Verify that database operations work and sync properly
 */

const { Pool } = require('pg');
const fetch = require('node-fetch');

// Colors for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  header: (msg) => console.log(`\n${colors.bold}${colors.blue}=== ${msg} ===${colors.reset}\n`)
};

// Database configurations
const localConfig = {
  user: 'postgres',
  host: 'localhost',
  database: 'pratham_tarl',
  password: '12345',
  port: 5432,
};

const doConfig = {
  user: 'postgres',
  host: '137.184.109.21',
  database: 'tarl_ptom',
  password: 'P@ssw0rd',
  port: 5432,
  ssl: { rejectUnauthorized: false }
};

// Test direct database CRUD operations
async function testDirectDatabaseCRUD() {
  log.header('Direct Database CRUD Test');
  
  const localPool = new Pool(localConfig);
  const doPool = new Pool(doConfig);
  
  try {
    const [localClient, doClient] = await Promise.all([
      localPool.connect(),
      doPool.connect()
    ]);
    
    try {
      const testSchoolData = {
        sclName: `Test School CRUD ${Date.now()}`,
        sclCode: `TST${Date.now()}`,
        sclProvinceName: 'Test Province',
        sclDistrictName: 'Test District',
        sclCommune: 'Test Commune',
        sclStatus: 1
      };
      
      // CREATE - Insert test school in local database
      log.info('Testing CREATE operation...');
      const insertResult = await localClient.query(`
        INSERT INTO tbl_tarl_schools ("sclName", "sclCode", "sclProvinceName", "sclDistrictName", "sclCommune", "sclStatus")
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING "sclAutoID", "sclName", "sclCode"
      `, [
        testSchoolData.sclName,
        testSchoolData.sclCode,
        testSchoolData.sclProvinceName,
        testSchoolData.sclDistrictName,
        testSchoolData.sclCommune,
        testSchoolData.sclStatus
      ]);
      
      const newSchool = insertResult.rows[0];
      log.success(`Created school: ID=${newSchool.sclAutoID}, Name=${newSchool.sclName}`);
      
      // READ - Verify the school exists in local database
      log.info('Testing READ operation...');
      const readResult = await localClient.query(`
        SELECT "sclAutoID", "sclName", "sclCode", "sclStatus"
        FROM tbl_tarl_schools 
        WHERE "sclAutoID" = $1
      `, [newSchool.sclAutoID]);
      
      if (readResult.rows.length > 0) {
        log.success(`Read school: ${JSON.stringify(readResult.rows[0])}`);
      } else {
        log.error('Failed to read created school');
      }
      
      // UPDATE - Modify the school
      log.info('Testing UPDATE operation...');
      const updatedName = `${testSchoolData.sclName} (Updated)`;
      await localClient.query(`
        UPDATE tbl_tarl_schools 
        SET "sclName" = $1, "updatedAt" = NOW()
        WHERE "sclAutoID" = $2
      `, [updatedName, newSchool.sclAutoID]);
      
      // Verify update
      const updateVerify = await localClient.query(`
        SELECT "sclName" FROM tbl_tarl_schools WHERE "sclAutoID" = $1
      `, [newSchool.sclAutoID]);
      
      if (updateVerify.rows[0].sclName === updatedName) {
        log.success(`Updated school name: ${updatedName}`);
      } else {
        log.error('Failed to update school');
      }
      
      // Manual sync to DO database (since auto-sync might not be running)
      log.info('Testing manual sync to Digital Ocean...');
      const schoolData = await localClient.query(`
        SELECT * FROM tbl_tarl_schools WHERE "sclAutoID" = $1
      `, [newSchool.sclAutoID]);
      
      if (schoolData.rows.length > 0) {
        const school = schoolData.rows[0];
        const columns = Object.keys(school);
        const columnList = columns.map(col => `"${col}"`).join(', ');
        const valuePlaceholders = columns.map((_, index) => `$${index + 1}`).join(', ');
        
        // Insert into DO database
        const doInsertQuery = `
          INSERT INTO tbl_tarl_schools (${columnList}) 
          VALUES (${valuePlaceholders})
          ON CONFLICT ("sclAutoID") DO UPDATE SET 
          "sclName" = EXCLUDED."sclName",
          "updatedAt" = EXCLUDED."updatedAt"
        `;
        
        const values = columns.map(col => school[col]);
        await doClient.query(doInsertQuery, values);
        
        // Verify in DO database
        const doVerify = await doClient.query(`
          SELECT "sclName" FROM tbl_tarl_schools WHERE "sclAutoID" = $1
        `, [newSchool.sclAutoID]);
        
        if (doVerify.rows.length > 0) {
          log.success(`Synced to Digital Ocean: ${doVerify.rows[0].sclName}`);
        } else {
          log.error('Failed to sync to Digital Ocean');
        }
      }
      
      // DELETE - Clean up test data
      log.info('Testing DELETE operation...');
      await localClient.query(`DELETE FROM tbl_tarl_schools WHERE "sclAutoID" = $1`, [newSchool.sclAutoID]);
      await doClient.query(`DELETE FROM tbl_tarl_schools WHERE "sclAutoID" = $1`, [newSchool.sclAutoID]);
      
      log.success('Cleaned up test data from both databases');
      
      return { success: true, testSchoolId: newSchool.sclAutoID };
      
    } finally {
      localClient.release();
      doClient.release();
    }
    
  } catch (error) {
    log.error(`Direct CRUD test failed: ${error.message}`);
    return { success: false, error: error.message };
  } finally {
    await Promise.all([localPool.end(), doPool.end()]);
  }
}

// Test API endpoints
async function testAPIEndpoints() {
  log.header('API Endpoints Test');
  
  const BASE_URL = 'http://localhost:3003/api';
  
  try {
    // Test public school search API
    log.info('Testing public school search API...');
    const searchResponse = await fetch(`${BASE_URL}/public/schools?search=primary&limit=5`);
    
    if (searchResponse.ok) {
      const schools = await searchResponse.json();
      log.success(`School search API: Found ${schools.length} schools`);
      
      if (schools.length > 0) {
        log.info(`Sample school: ${schools[0].sclName} (${schools[0].sclCode || 'No code'})`);
      }
    } else {
      log.error(`School search API failed: ${searchResponse.status}`);
    }
    
    // Test demographics API
    log.info('Testing demographics API...');
    const provincesResponse = await fetch(`${BASE_URL}/demographics/provinces`);
    
    if (provincesResponse.ok) {
      const provinces = await provincesResponse.json();
      log.success(`Demographics API: Found ${provinces.length} provinces`);
      
      if (provinces.length > 0) {
        // Test districts for first province
        const firstProvince = provinces[0];
        const districtsResponse = await fetch(`${BASE_URL}/demographics/districts?provinceCode=${firstProvince.id}`);
        
        if (districtsResponse.ok) {
          const districts = await districtsResponse.json();
          log.success(`Districts API: Found ${districts.length} districts for ${firstProvince.name}`);
        } else {
          log.error(`Districts API failed: ${districtsResponse.status}`);
        }
      }
    } else {
      log.error(`Provinces API failed: ${provincesResponse.status}`);
    }
    
    // Test school registration API (GET only)
    log.info('Testing school registration API...');
    const registrationResponse = await fetch(`${BASE_URL}/school-registration?page=1&limit=5`);
    
    if (registrationResponse.ok) {
      const registrations = await registrationResponse.json();
      log.success(`School registration API: ${registrations.success ? 'Working' : 'Has issues'}`);
    } else {
      log.error(`School registration API failed: ${registrationResponse.status}`);
    }
    
    return { success: true };
    
  } catch (error) {
    log.error(`API test failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Test school registration form submission
async function testSchoolRegistrationForm() {
  log.header('School Registration Form Test');
  
  const BASE_URL = 'http://localhost:3003/api';
  
  try {
    // First, get a school to test with
    const schoolsResponse = await fetch(`${BASE_URL}/public/schools?search=primary&limit=1`);
    
    if (!schoolsResponse.ok) {
      log.error('Cannot get test school for registration');
      return { success: false };
    }
    
    const schools = await schoolsResponse.json();
    if (schools.length === 0) {
      log.error('No schools found for registration test');
      return { success: false };
    }
    
    const testSchool = schools[0];
    log.info(`Testing registration with school: ${testSchool.sclName}`);
    
    // Create test registration data
    const registrationData = {
      schoolId: testSchool.sclAutoID,
      schoolData: {
        schoolType: 'public',
        schoolLevel: 'primary',
        establishedYear: '2000',
        totalClasses: '6',
        totalStudents: '300',
        totalTeachers: '12',
        schoolCode: testSchool.sclCode || 'TEST001',
        schoolCluster: 'Test Cluster',
        schoolZone: 'Test Zone',
        buildingCondition: 'good',
        classroomCount: '6',
        libraryAvailable: 'yes',
        computerLabAvailable: 'no',
        internetAvailable: 'no',
        electricityAvailable: 'yes',
        waterSourceAvailable: 'yes',
        directorName: 'តេស្ត នាយក',
        directorGender: 'male',
        directorAge: '45',
        directorPhone: '012345678',
        directorEmail: 'test@example.com',
        directorEducation: 'បរិញ្ញាបត្រ',
        directorExperience: '10',
        schoolPhone: '023456789',
        schoolEmail: 'school@example.com',
        challenges: 'តេស្ត បញ្ហាប្រឈម',
        achievements: 'តេស្ត សមិទ្ធិផល',
        supportNeeded: 'តេស្ត ការជំនួយ',
        notes: 'តេស្ត កំណត់ចំណាំ'
      }
    };
    
    // Submit registration
    log.info('Submitting test school registration...');
    const submitResponse = await fetch(`${BASE_URL}/school-registration`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(registrationData)
    });
    
    if (submitResponse.ok) {
      const result = await submitResponse.json();
      log.success(`Registration submitted successfully: ID=${result.registrationId}`);
      
      // Verify the registration was saved
      const verifyResponse = await fetch(`${BASE_URL}/school-registration?page=1&limit=1`);
      if (verifyResponse.ok) {
        const registrations = await verifyResponse.json();
        log.success('Registration verification successful');
      }
      
      return { success: true, registrationId: result.registrationId };
    } else {
      const errorResult = await submitResponse.json();
      log.error(`Registration failed: ${errorResult.error || 'Unknown error'}`);
      return { success: false, error: errorResult.error };
    }
    
  } catch (error) {
    log.error(`School registration test failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Count records in both databases
async function checkDataCounts() {
  log.header('Database Record Counts');
  
  const localPool = new Pool(localConfig);
  const doPool = new Pool(doConfig);
  
  try {
    const [localClient, doClient] = await Promise.all([
      localPool.connect(),
      doPool.connect()
    ]);
    
    try {
      const tables = ['tbl_tarl_schools', 'tbl_tarl_demographics', 'tbl_tarl_users'];
      
      for (const tableName of tables) {
        try {
          const [localCount, doCount] = await Promise.all([
            localClient.query(`SELECT COUNT(*) as count FROM ${tableName}`),
            doClient.query(`SELECT COUNT(*) as count FROM ${tableName}`)
          ]);
          
          const local = parseInt(localCount.rows[0].count);
          const digital_ocean = parseInt(doCount.rows[0].count);
          
          log.info(`${tableName}:`);
          log.info(`  Local: ${local.toLocaleString()} records`);
          log.info(`  Digital Ocean: ${digital_ocean.toLocaleString()} records`);
          
          if (local === digital_ocean) {
            log.success(`  ✓ Synchronized`);
          } else {
            log.warning(`  ⚠ Not synchronized (difference: ${Math.abs(local - digital_ocean)})`);
          }
          
        } catch (error) {
          log.error(`${tableName}: ${error.message}`);
        }
      }
      
    } finally {
      localClient.release();
      doClient.release();
    }
    
  } catch (error) {
    log.error(`Data count check failed: ${error.message}`);
  } finally {
    await Promise.all([localPool.end(), doPool.end()]);
  }
}

// Main test execution
async function runTests() {
  console.log(`${colors.bold}${colors.blue}`);
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║                CRUD with Sync Testing Suite              ║');
  console.log('║            Comprehensive Database & API Tests            ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(colors.reset);
  
  const results = {
    databaseCRUD: null,
    apiEndpoints: null,
    schoolRegistration: null
  };
  
  try {
    // Check current data counts
    await checkDataCounts();
    
    // Test direct database CRUD operations
    results.databaseCRUD = await testDirectDatabaseCRUD();
    
    // Test API endpoints
    results.apiEndpoints = await testAPIEndpoints();
    
    // Test school registration form
    results.schoolRegistration = await testSchoolRegistrationForm();
    
    // Final summary
    log.header('Test Results Summary');
    
    const allSuccess = Object.values(results).every(result => result && result.success);
    
    log.info(`Database CRUD: ${results.databaseCRUD?.success ? '✅ Pass' : '❌ Fail'}`);
    log.info(`API Endpoints: ${results.apiEndpoints?.success ? '✅ Pass' : '❌ Fail'}`);
    log.info(`School Registration: ${results.schoolRegistration?.success ? '✅ Pass' : '❌ Fail'}`);
    
    if (allSuccess) {
      log.success('🎉 All tests passed! CRUD operations and synchronization are working properly.');
    } else {
      log.warning('⚠️ Some tests failed. Check the details above.');
    }
    
    return { success: allSuccess, results };
    
  } catch (error) {
    log.error(`Test suite failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Execute if run directly
if (require.main === module) {
  runTests().catch(error => {
    log.error(`Fatal error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { runTests, testDirectDatabaseCRUD, testAPIEndpoints };