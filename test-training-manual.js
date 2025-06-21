const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

async function testTrainingEndpoints() {
  console.log('🧪 Testing Training System - Manual CRUD Operations\n');
  
  // Test 1: Check if training programs page loads
  console.log('1. Testing Training Programs API...');
  try {
    const { stdout, stderr } = await execAsync('curl -s -w "%{http_code}" http://localhost:3003/api/training/programs');
    console.log('   Response:', stdout);
  } catch (error) {
    console.log('   Error:', error.message);
  }
  
  // Test 2: Check training sessions API
  console.log('\n2. Testing Training Sessions API...');
  try {
    const { stdout, stderr } = await execAsync('curl -s -w "%{http_code}" http://localhost:3003/api/training/sessions');
    console.log('   Response:', stdout);
  } catch (error) {
    console.log('   Error:', error.message);
  }
  
  // Test 3: Check participants API
  console.log('\n3. Testing Participants API...');
  try {
    const { stdout, stderr } = await execAsync('curl -s -w "%{http_code}" http://localhost:3003/api/training/participants');
    console.log('   Response:', stdout);
  } catch (error) {
    console.log('   Error:', error.message);
  }
  
  // Test 4: Check QR codes API
  console.log('\n4. Testing QR Codes API...');
  try {
    const { stdout, stderr } = await execAsync('curl -s -w "%{http_code}" http://localhost:3003/api/training/qr-codes');
    console.log('   Response:', stdout);
  } catch (error) {
    console.log('   Error:', error.message);
  }
  
  console.log('\n✅ Basic API endpoint testing completed');
}

testTrainingEndpoints().catch(console.error);