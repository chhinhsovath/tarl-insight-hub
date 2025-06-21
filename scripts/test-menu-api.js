// Simple test to check what the menu API returns
async function testMenuAPI() {
  console.log('Testing menu API endpoints...\n');
  
  try {
    console.log('1. Testing /api/user/menu-order:');
    const orderResponse = await fetch('http://localhost:3002/api/user/menu-order', {
      credentials: 'include'
    });
    
    if (orderResponse.ok) {
      const orderData = await orderResponse.json();
      console.log('✅ Menu-order API response:', JSON.stringify(orderData, null, 2));
      
      if (orderData.pages && orderData.pages.length > 0) {
        console.log('\n📋 Sample menu items:');
        orderData.pages.slice(0, 3).forEach(page => {
          console.log(`- ${page.page_name} (${page.page_name_kh || 'No Khmer'}) → ${page.page_path}`);
        });
      }
    } else {
      console.log('❌ Menu-order API failed:', await orderResponse.text());
    }
    
    console.log('\n2. Testing /api/user/menu-permissions:');
    const permResponse = await fetch('http://localhost:3002/api/user/menu-permissions', {
      credentials: 'include'
    });
    
    if (permResponse.ok) {
      const permData = await permResponse.json();
      console.log('✅ Menu-permissions API response structure:', {
        hasMenuItems: !!permData.menuItems,
        itemCount: permData.menuItems?.length || 0,
        userRole: permData.userRole
      });
      
      if (permData.menuItems && permData.menuItems.length > 0) {
        console.log('\n📋 Sample permission items:');
        permData.menuItems.slice(0, 3).forEach(item => {
          console.log(`- ${item.page_name} (${item.page_name_kh || 'No Khmer'}) → ${item.page_path}`);
        });
      }
    } else {
      console.log('❌ Menu-permissions API failed:', await permResponse.text());
    }
    
  } catch (error) {
    console.error('❌ Error testing APIs:', error.message);
    console.log('\n💡 Make sure you:');
    console.log('1. Are logged in to the application');
    console.log('2. Have the dev server running on port 3002');
    console.log('3. Have valid session cookies');
  }
}

// Note: This is just a test script - would need to be run from browser console with valid session
console.log('Run this in the browser console while logged in to test the menu APIs');
console.log('testMenuAPI();');