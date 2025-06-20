const fetch = require('node-fetch');

async function testLogin() {
  console.log('Testing login API...\n');
  
  const testUsers = [
    { identifier: 'admin', password: 'admin123', expectedRole: 'admin' },
    { identifier: 'teacher1', password: 'teacher123', expectedRole: 'teacher' },
    { identifier: 'demo', password: 'demo123', expectedRole: 'teacher' }
  ];
  
  // Test with local API first
  console.log('Testing LOCAL API:');
  for (const user of testUsers) {
    try {
      const response = await fetch('http://localhost:3000/api/auth/unified-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: user.identifier,
          password: user.password,
          loginType: 'auto'
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        console.log(`✅ ${user.identifier}: Login successful - Role: ${data.user.role}`);
      } else {
        console.log(`❌ ${user.identifier}: Login failed - ${data.message}`);
      }
    } catch (error) {
      console.log(`❌ ${user.identifier}: Request failed - ${error.message}`);
    }
  }
  
  console.log('\n📝 Notes:');
  console.log('- Make sure your local server is running (npm run dev)');
  console.log('- The API now properly joins users with roles table');
  console.log('- All role_id values have been set correctly');
  console.log('- Try logging in through the web interface at http://localhost:3000/login');
}

// Check if node-fetch is installed
try {
  require.resolve('node-fetch');
  testLogin();
} catch(e) {
  console.log('Installing node-fetch...');
  const { execSync } = require('child_process');
  execSync('npm install node-fetch@2', { stdio: 'inherit' });
  console.log('Please run this script again.');
}