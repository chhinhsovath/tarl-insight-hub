#!/usr/bin/env node

/**
 * Comprehensive CRUD Testing Script
 * Tests all database operations and API endpoints
 */

const fetch = require('node-fetch');
const { getDbManager } = require('../lib/dual-database-config');

const BASE_URL = 'http://localhost:3003';
const API_BASE = `${BASE_URL}/api`;

// Test session - you'll need to get a valid session token
let SESSION_TOKEN = null;

// ANSI colors for console output
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

// API endpoint configurations for testing
const API_ENDPOINTS = [
  // Geographic Data (READ operations)
  { 
    name: 'Provinces', 
    endpoint: '/data/provinces', 
    methods: ['GET'],
    description: 'Geographic provinces data'
  },
  { 
    name: 'Districts', 
    endpoint: '/data/districts', 
    methods: ['GET'],
    params: { provinceId: 1 },
    description: 'Districts by province'
  },
  { 
    name: 'Communes', 
    endpoint: '/data/communes', 
    methods: ['GET'],
    params: { district_id: 1 },
    description: 'Communes by district'
  },
  { 
    name: 'Villages', 
    endpoint: '/data/villages', 
    methods: ['GET'],
    params: { commune_id: 1 },
    description: 'Villages by commune'
  },
  
  // Demographics (using new table)
  {
    name: 'Demographics Provinces',
    endpoint: '/demographics/provinces',
    methods: ['GET'],
    description: 'Provinces from tbl_tarl_demographics'
  },
  {
    name: 'Demographics Districts',
    endpoint: '/demographics/districts',
    methods: ['GET'],
    params: { provinceCode: 1 },
    description: 'Districts from tbl_tarl_demographics'
  },
  
  // Core Data (FULL CRUD)
  { 
    name: 'Schools', 
    endpoint: '/data/schools', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    testData: {
      sclName: 'Test School CRUD',
      sclCode: 'TST001',
      sclProvinceName: 'Test Province',
      sclDistrictName: 'Test District',
      sclCommune: 'Test Commune',
      sclStatus: 1
    },
    description: 'Schools management with full CRUD'
  },
  { 
    name: 'Users', 
    endpoint: '/data/users', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    testData: {
      full_name: 'Test User CRUD',
      username: 'testuser' + Date.now(),
      email: 'test@example.com',
      role: 'Teacher',
      password: 'password123'
    },
    description: 'User management with full CRUD'
  },
  { 
    name: 'Students', 
    endpoint: '/data/students', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    testData: {
      name: 'Test Student CRUD',
      gender: 'M',
      birth_date: '2010-01-01',
      grade: 5
    },
    description: 'Student management with full CRUD'
  },
  
  // Training System (FULL CRUD)
  { 
    name: 'Training Programs', 
    endpoint: '/training/programs', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    testData: {
      program_name: 'Test Training Program',
      description: 'Test program for CRUD testing',
      program_type: 'workshop',
      status: 'active'
    },
    description: 'Training programs with full CRUD'
  },
  { 
    name: 'Training Sessions', 
    endpoint: '/training/sessions', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    testData: {
      session_name: 'Test Training Session',
      program_id: 1,
      session_date: '2024-01-15',
      location: 'Test Location',
      status: 'scheduled'
    },
    description: 'Training sessions with full CRUD'
  },
  
  // Public APIs
  { 
    name: 'Public Schools Search', 
    endpoint: '/public/schools', 
    methods: ['GET'],
    params: { search: 'test', limit: 10 },
    description: 'Public school search API',
    requiresAuth: false
  },
  { 
    name: 'School Registration', 
    endpoint: '/school-registration', 
    methods: ['GET', 'POST'],
    testData: {
      schoolId: 1,
      schoolData: {
        directorName: 'Test Director',
        directorPhone: '012345678',
        schoolType: 'public',
        schoolLevel: 'primary'
      }
    },
    description: 'School registration system',
    requiresAuth: false
  }
];

// Database direct testing
const DATABASE_TESTS = [
  {
    name: 'Connection Test',
    query: 'SELECT 1 as test',
    description: 'Basic database connectivity'
  },
  {
    name: 'Schools Table Count',
    query: 'SELECT COUNT(*) as count FROM tbl_tarl_schools',
    description: 'Count records in schools table'
  },
  {
    name: 'Demographics Table Count',
    query: 'SELECT COUNT(*) as count FROM tbl_tarl_demographics',
    description: 'Count records in demographics table'
  },
  {
    name: 'Training Programs Count',
    query: 'SELECT COUNT(*) as count FROM tbl_tarl_training_programs',
    description: 'Count training programs'
  },
  {
    name: 'Users Table Structure',
    query: `SELECT column_name, data_type 
           FROM information_schema.columns 
           WHERE table_name = 'tbl_tarl_users' 
           ORDER BY ordinal_position`,
    description: 'Check users table structure'
  }
];

// Test database connections directly
async function testDatabaseConnections() {
  log.header('Database Connection Tests');
  
  try {
    const dbManager = getDbManager();
    
    // Test connections
    const connections = await dbManager.testConnections();
    
    if (connections.local) {
      log.success('Local database connection successful');
    } else {
      log.error('Local database connection failed');
    }
    
    if (connections.digitalOcean) {
      log.success('Digital Ocean database connection successful');
    } else {
      log.error('Digital Ocean database connection failed');
    }
    
    // Get database info
    const dbInfo = await dbManager.getDatabaseInfo();
    log.info(`Primary DB: ${dbInfo.primary?.database_name} (${dbInfo.primary?.server_ip})`);
    log.info(`Secondary DB: ${dbInfo.secondary?.database_name} (${dbInfo.secondary?.server_ip})`);
    
    return connections;
    
  } catch (error) {
    log.error(`Database connection test failed: ${error.message}`);
    return { local: false, digitalOcean: false };
  }
}

// Test database queries directly
async function testDatabaseQueries() {
  log.header('Database Query Tests');
  
  try {
    const dbManager = getDbManager();
    
    for (const test of DATABASE_TESTS) {
      try {
        log.info(`Testing: ${test.name}`);
        const result = await dbManager.queryPrimary(test.query);
        
        if (result.rows && result.rows.length >= 0) {
          log.success(`${test.name}: ${JSON.stringify(result.rows[0] || 'No data')}`);
        } else {
          log.warning(`${test.name}: No results`);
        }
      } catch (error) {
        log.error(`${test.name}: ${error.message}`);
      }
    }
    
  } catch (error) {
    log.error(`Database query tests failed: ${error.message}`);
  }
}

// Get authentication session
async function getAuthSession() {
  try {
    // Try to login with a test user
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'admin', // Adjust to your admin username
        password: 'admin123' // Adjust to your admin password
      })
    });
    
    if (loginResponse.ok) {
      const result = await loginResponse.json();
      SESSION_TOKEN = result.token;
      log.success('Authentication successful');
      return true;
    } else {
      log.warning('Authentication failed - testing public endpoints only');
      return false;
    }
  } catch (error) {
    log.warning(`Authentication error: ${error.message} - testing public endpoints only`);
    return false;
  }
}

// Test a single API endpoint
async function testAPIEndpoint(endpoint) {
  const results = {
    name: endpoint.name,
    endpoint: endpoint.endpoint,
    tests: []
  };
  
  log.info(`Testing ${endpoint.name}...`);
  
  for (const method of endpoint.methods) {
    try {
      let url = `${API_BASE}${endpoint.endpoint}`;
      let options = {
        method: method,
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      // Add authentication if required
      if (endpoint.requiresAuth !== false && SESSION_TOKEN) {
        options.headers['Authorization'] = `Bearer ${SESSION_TOKEN}`;
      }
      
      // Handle different HTTP methods
      switch (method) {
        case 'GET':
          if (endpoint.params) {
            const params = new URLSearchParams(endpoint.params);
            url += `?${params}`;
          }
          break;
          
        case 'POST':
          if (endpoint.testData) {
            options.body = JSON.stringify(endpoint.testData);
          }
          break;
          
        case 'PUT':
          if (endpoint.testData) {
            options.body = JSON.stringify({ id: 1, ...endpoint.testData });
          }
          break;
          
        case 'DELETE':
          url += '/1'; // Assume we're deleting record with ID 1
          break;
      }
      
      const response = await fetch(url, options);
      const result = await response.json();
      
      const testResult = {
        method: method,
        status: response.status,
        success: response.ok,
        data: result
      };
      
      results.tests.push(testResult);
      
      if (response.ok) {
        log.success(`${method} ${endpoint.name}: ${response.status}`);
      } else {
        log.error(`${method} ${endpoint.name}: ${response.status} - ${result.error || 'Unknown error'}`);
      }
      
    } catch (error) {
      const testResult = {
        method: method,
        status: 0,
        success: false,
        error: error.message
      };
      
      results.tests.push(testResult);
      log.error(`${method} ${endpoint.name}: ${error.message}`);
    }
  }
  
  return results;
}

// Test all API endpoints
async function testAllAPIEndpoints() {
  log.header('API Endpoint Tests');
  
  const allResults = [];
  
  for (const endpoint of API_ENDPOINTS) {
    const result = await testAPIEndpoint(endpoint);
    allResults.push(result);
    console.log(''); // Add spacing between tests
  }
  
  return allResults;
}

// Test synchronization functionality
async function testSynchronization() {
  log.header('Database Synchronization Tests');
  
  if (!SESSION_TOKEN) {
    log.warning('Skipping sync tests - authentication required');
    return;
  }
  
  try {
    // Test sync status
    const statusResponse = await fetch(`${API_BASE}/admin/database-sync`, {
      headers: {
        'Authorization': `Bearer ${SESSION_TOKEN}`
      }
    });
    
    if (statusResponse.ok) {
      const status = await statusResponse.json();
      log.success('Sync status retrieved successfully');
      log.info(`Sync running: ${status.data.syncStatus.isRunning}`);
    } else {
      log.error('Failed to get sync status');
    }
    
    // Test database connections
    const testResponse = await fetch(`${API_BASE}/admin/database-test`, {
      headers: {
        'Authorization': `Bearer ${SESSION_TOKEN}`
      }
    });
    
    if (testResponse.ok) {
      const testResult = await testResponse.json();
      log.success('Database test completed');
      log.info(`Local connected: ${testResult.data.connections.local}`);
      log.info(`DO connected: ${testResult.data.connections.digitalOcean}`);
    } else {
      log.error('Database test failed');
    }
    
  } catch (error) {
    log.error(`Synchronization test failed: ${error.message}`);
  }
}

// Generate test report
function generateReport(results) {
  log.header('Test Report Summary');
  
  const summary = {
    total: 0,
    passed: 0,
    failed: 0,
    endpoints: results.length
  };
  
  results.forEach(endpoint => {
    endpoint.tests.forEach(test => {
      summary.total++;
      if (test.success) {
        summary.passed++;
      } else {
        summary.failed++;
      }
    });
  });
  
  log.info(`Total Endpoints Tested: ${summary.endpoints}`);
  log.info(`Total Tests: ${summary.total}`);
  log.success(`Passed: ${summary.passed}`);
  log.error(`Failed: ${summary.failed}`);
  log.info(`Success Rate: ${((summary.passed / summary.total) * 100).toFixed(1)}%`);
  
  // Show failed tests
  if (summary.failed > 0) {
    log.header('Failed Tests');
    results.forEach(endpoint => {
      endpoint.tests.forEach(test => {
        if (!test.success) {
          log.error(`${test.method} ${endpoint.name}: ${test.error || test.data?.error || 'Unknown error'}`);
        }
      });
    });
  }
}

// Main test execution
async function runAllTests() {
  console.log(`${colors.bold}${colors.blue}`);
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║                    TaRL CRUD Test Suite                  ║');
  console.log('║              Comprehensive Database & API Testing        ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(colors.reset);
  
  try {
    // Test database connections
    await testDatabaseConnections();
    
    // Test database queries
    await testDatabaseQueries();
    
    // Get authentication
    await getAuthSession();
    
    // Test all API endpoints
    const results = await testAllAPIEndpoints();
    
    // Test synchronization
    await testSynchronization();
    
    // Generate report
    generateReport(results);
    
    log.header('Test Suite Complete');
    log.success('All tests have been executed');
    
  } catch (error) {
    log.error(`Test suite failed: ${error.message}`);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  runAllTests().catch(error => {
    log.error(`Fatal error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  testDatabaseConnections,
  testAllAPIEndpoints,
  testSynchronization
};