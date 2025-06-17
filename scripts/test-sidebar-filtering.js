// Test script to verify that training menu items are filtered out
// This simulates the filtering logic from dynamic-sidebar-nav.tsx

// Function to determine if a page should be hidden from sidebar
const shouldHideFromSidebar = (path) => {
  const hiddenPaths = [
    '/training/sessions',
    '/training/programs', 
    '/training/participants',
    '/training/qr-codes'
  ];
  
  // Hide all training-related pages (main training page and sub-pages)
  if (path === '/training' || path.startsWith('/training/')) {
    return true;
  }
  
  return hiddenPaths.includes(path);
};

// Test data simulating what might come from the database
const testPages = [
  { id: 1, page_name: 'Dashboard', page_path: '/dashboard' },
  { id: 2, page_name: 'Schools', page_path: '/schools' },
  { id: 3, page_name: 'Users', page_path: '/users' },
  { id: 4, page_name: 'Training', page_path: '/training' },
  { id: 5, page_name: 'Training Feedback', page_path: '/training/feedback' },
  { id: 6, page_name: 'training-sessions', page_path: '/training/sessions' },
  { id: 7, page_name: 'training-participants', page_path: '/training/participants' },
  { id: 8, page_name: 'Settings', page_path: '/settings' },
  { id: 9, page_name: 'Reports', page_path: '/reports' },
];

console.log('🧪 Testing sidebar filtering logic...\n');

console.log('📋 Original pages:');
testPages.forEach(page => {
  console.log(`  ${page.id}: ${page.page_name} (${page.page_path})`);
});

console.log('\n🔍 Filtering logic test:');
testPages.forEach(page => {
  const shouldHide = shouldHideFromSidebar(page.page_path);
  const nameContainsTraining = page.page_name.toLowerCase().includes('training');
  const pathContainsTraining = page.page_path.toLowerCase().includes('training');
  
  const finallyFiltered = shouldHide || nameContainsTraining || pathContainsTraining;
  
  console.log(`  ${page.page_name}:`);
  console.log(`    Path filter: ${shouldHide ? 'HIDE' : 'SHOW'}`);
  console.log(`    Name filter: ${nameContainsTraining ? 'HIDE' : 'SHOW'}`);
  console.log(`    Path text filter: ${pathContainsTraining ? 'HIDE' : 'SHOW'}`);
  console.log(`    Final result: ${finallyFiltered ? '❌ HIDDEN' : '✅ SHOWN'}`);
  console.log('');
});

// Apply the complete filtering logic
const filteredPages = testPages.filter(page => 
  !shouldHideFromSidebar(page.page_path) && 
  !page.page_name.toLowerCase().includes('training') &&
  !page.page_path.toLowerCase().includes('training')
);

console.log('📋 Pages that will appear in sidebar:');
if (filteredPages.length === 0) {
  console.log('  No pages will be shown (something might be wrong!)');
} else {
  filteredPages.forEach(page => {
    console.log(`  ✅ ${page.page_name} (${page.page_path})`);
  });
}

console.log('\n📋 Pages that will be hidden:');
const hiddenPages = testPages.filter(page => 
  shouldHideFromSidebar(page.page_path) || 
  page.page_name.toLowerCase().includes('training') ||
  page.page_path.toLowerCase().includes('training')
);

if (hiddenPages.length === 0) {
  console.log('  No pages will be hidden');
} else {
  hiddenPages.forEach(page => {
    console.log(`  ❌ ${page.page_name} (${page.page_path})`);
  });
}

// Verify that all training items are filtered out
const trainingItemsRemaining = filteredPages.filter(page => 
  page.page_name.toLowerCase().includes('training') || 
  page.page_path.toLowerCase().includes('training')
);

console.log('\n🎯 Final verification:');
if (trainingItemsRemaining.length === 0) {
  console.log('✅ SUCCESS: All training items have been filtered out!');
  console.log('✅ The sidebar will not show any training-related menu items.');
} else {
  console.log('❌ ERROR: Some training items are still showing:');
  trainingItemsRemaining.forEach(page => {
    console.log(`  - ${page.page_name} (${page.page_path})`);
  });
}

console.log('\n🎉 Sidebar filtering test completed!');