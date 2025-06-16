const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001';

async function testTrainingAPI() {
  console.log('🧪 Testing Training API endpoints...');
  
  try {
    // Test 1: Fetch training programs
    console.log('\n1. Testing GET /api/training/programs');
    const getResponse = await fetch(`${BASE_URL}/api/training/programs`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'session-token=test-token' // This might need to be a real token
      }
    });
    
    console.log(`   Status: ${getResponse.status}`);
    const getResult = await getResponse.json().catch(() => ({ error: 'Failed to parse JSON' }));
    console.log(`   Response:`, getResult);

    // Test 2: Create training program
    console.log('\n2. Testing POST /api/training/programs');
    const postData = {
      program_name: 'Test API Program ' + Date.now(),
      description: 'Test program created via API',
      program_type: 'standard',
      duration_hours: 8
    };

    const postResponse = await fetch(`${BASE_URL}/api/training/programs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'session-token=test-token'
      },
      body: JSON.stringify(postData)
    });

    console.log(`   Status: ${postResponse.status}`);
    const postResult = await postResponse.json().catch(() => ({ error: 'Failed to parse JSON' }));
    console.log(`   Response:`, postResult);

    // Test 3: Test authentication endpoint
    console.log('\n3. Testing authentication');
    const authResponse = await fetch(`${BASE_URL}/api/auth/check`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'session-token=test-token'
      }
    });

    console.log(`   Auth Status: ${authResponse.status}`);
    const authResult = await authResponse.json().catch(() => ({ error: 'Failed to parse JSON' }));
    console.log(`   Auth Response:`, authResult);

  } catch (error) {
    console.error('❌ API Test failed:', error.message);
  }

  console.log('\n✅ API tests completed');
}

// Run the test
testTrainingAPI();