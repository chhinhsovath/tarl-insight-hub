const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001';

async function testAPIEndpoints() {
  console.log('🌐 Testing API endpoints...\n');

  try {
    // Test 1: Get training programs
    console.log('1. Testing GET /api/training/programs');
    const getPrograms = await fetch(`${BASE_URL}/api/training/programs`);
    console.log(`   Status: ${getPrograms.status}`);
    
    if (getPrograms.ok) {
      const programs = await getPrograms.json();
      console.log(`   Found ${programs.length} programs`);
    } else {
      const error = await getPrograms.text();
      console.log(`   Error: ${error}`);
    }

    // Test 2: Create a program
    console.log('\n2. Testing POST /api/training/programs');
    const createProgram = await fetch(`${BASE_URL}/api/training/programs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        program_name: 'API Test Program ' + Date.now(),
        description: 'Created via API test',
        program_type: 'standard',
        duration_hours: 8
      })
    });
    
    console.log(`   Status: ${createProgram.status}`);
    if (createProgram.ok) {
      const result = await createProgram.json();
      console.log(`   Created program ID: ${result.program?.id}`);
    } else {
      const error = await createProgram.text();
      console.log(`   Error: ${error}`);
    }

    // Test 3: Get feedback
    console.log('\n3. Testing GET /api/training/feedback');
    const getFeedback = await fetch(`${BASE_URL}/api/training/feedback`);
    console.log(`   Status: ${getFeedback.status}`);
    
    if (getFeedback.ok) {
      const feedback = await getFeedback.json();
      console.log(`   Found ${feedback.length} feedback entries`);
    } else {
      const error = await getFeedback.text();
      console.log(`   Error: ${error}`);
    }

    console.log('\n✅ API endpoint tests completed');

  } catch (error) {
    console.error('❌ API test error:', error.message);
  }
}

testAPIEndpoints();