const fetch = require('node-fetch');

async function removeTrainingMenuItems() {
  try {
    console.log('🗑️  Removing training menu items via API...');
    
    // First login to get session token
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@example.com', // Assuming this is an admin account
        password: 'password123'     // You'll need to adjust these credentials
      })
    });
    
    if (!loginResponse.ok) {
      console.error('❌ Failed to login. Please start the dev server first with npm run dev');
      return;
    }
    
    const sessionCookie = loginResponse.headers.get('set-cookie');
    console.log('✅ Logged in successfully');
    
    // Get all pages
    const pagesResponse = await fetch('http://localhost:3000/api/data/page-permissions', {
      headers: {
        'Cookie': sessionCookie
      }
    });
    
    if (!pagesResponse.ok) {
      console.error('❌ Failed to fetch pages');
      return;
    }
    
    const pages = await pagesResponse.json();
    console.log('📋 Found pages:', pages.length);
    
    // Find training-related pages
    const trainingPages = pages.filter(page => 
      page.page_name.toLowerCase().includes('training') || 
      page.page_path.toLowerCase().includes('training')
    );
    
    console.log('🎯 Found training-related pages:');
    trainingPages.forEach(page => {
      console.log(`  ID: ${page.id}, Name: ${page.page_name}, Path: ${page.page_path}`);
    });
    
    if (trainingPages.length === 0) {
      console.log('✅ No training menu items found to remove.');
      return;
    }
    
    // Remove each training page
    for (const page of trainingPages) {
      console.log(`🗑️  Removing page: ${page.page_name} (${page.page_path})`);
      
      const deleteResponse = await fetch(`http://localhost:3000/api/data/pages?id=${page.id}`, {
        method: 'DELETE',
        headers: {
          'Cookie': sessionCookie
        }
      });
      
      if (deleteResponse.ok) {
        console.log(`  ✅ Successfully removed: ${page.page_name}`);
      } else {
        console.log(`  ❌ Failed to remove: ${page.page_name}`);
      }
    }
    
    console.log('🎉 Training menu items removal completed!');
    
  } catch (error) {
    console.error('❌ Error removing training menu items:', error);
  }
}

// Check if the script is being run directly
if (require.main === module) {
  console.log('📝 Instructions:');
  console.log('1. Start the development server: npm run dev');
  console.log('2. Make sure you have admin credentials in the database');
  console.log('3. Run this script again');
  console.log('');
  console.log('This script will use the API endpoints to remove training menu items.');
  console.log('Please ensure the dev server is running on localhost:3000');
}

module.exports = { removeTrainingMenuItems };