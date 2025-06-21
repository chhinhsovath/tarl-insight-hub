#!/usr/bin/env node

/**
 * Test Global Loading System
 * Verifies the global loading implementation is working properly
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Global Loading System Implementation\n');

// Test files that should contain global loading
const testFiles = [
  {
    path: 'lib/global-loading-context.tsx',
    shouldContain: ['GlobalLoadingProvider', 'useGlobalLoading', 'showLoading', 'hideLoading'],
    description: 'Global loading context'
  },
  {
    path: 'components/global-loading-overlay.tsx',
    shouldContain: ['useGlobalLoading', 'UniversalLoading'],
    description: 'Global loading overlay component'
  },
  {
    path: 'app/layout.tsx',
    shouldContain: ['GlobalLoadingProvider', 'GlobalLoadingOverlay'],
    description: 'Root layout with global loading'
  },
  {
    path: 'app/(dashboard)/schools/page.tsx',
    shouldContain: ['useGlobalLoading', 'showLoading', 'hideLoading'],
    shouldNotContain: ['loading ? (', 'Loading schools...'],
    description: 'Schools page with global loading'
  },
  {
    path: 'app/(dashboard)/training/sessions/page.tsx',
    shouldContain: ['useGlobalLoading', 'showLoading("Loading training sessions...")'],
    shouldNotContain: ['UniversalLoading isLoading={true}'],
    description: 'Training sessions page with global loading'
  },
  {
    path: 'components/navigation-loading.tsx',
    shouldContain: ['useGlobalLoading', 'usePathname', 'showLoading("Loading page...")'],
    description: 'Navigation loading component'
  },
  {
    path: 'app/(dashboard)/layout.tsx',
    shouldContain: ['NavigationLoading'],
    description: 'Dashboard layout with navigation loading'
  },
  {
    path: 'app/(dashboard)/dashboard/page.tsx',
    shouldContain: ['useGlobalLoading', 'showLoading("Loading dashboard...")'],
    description: 'Dashboard page with global loading'
  },
  {
    path: 'app/(dashboard)/users/page.tsx',
    shouldContain: ['useGlobalLoading', 'showLoading("Loading users...")'],
    description: 'Users page with global loading'
  }
];

let allTestsPassed = true;

testFiles.forEach(testFile => {
  const filePath = path.join(__dirname, '..', testFile.path);
  
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    console.log(`📁 Testing ${testFile.description}:`);
    console.log(`   File: ${testFile.path}`);
    
    // Check for required content
    if (testFile.shouldContain) {
      testFile.shouldContain.forEach(requirement => {
        if (content.includes(requirement)) {
          console.log(`   ✅ Contains: ${requirement}`);
        } else {
          console.log(`   ❌ Missing: ${requirement}`);
          allTestsPassed = false;
        }
      });
    }
    
    // Check for content that should NOT be there
    if (testFile.shouldNotContain) {
      testFile.shouldNotContain.forEach(forbidden => {
        if (!content.includes(forbidden)) {
          console.log(`   ✅ Correctly removed: ${forbidden}`);
        } else {
          console.log(`   ⚠️  Still contains old loading: ${forbidden}`);
          allTestsPassed = false;
        }
      });
    }
    
    console.log('');
  } else {
    console.log(`❌ File not found: ${testFile.path}`);
    allTestsPassed = false;
  }
});

// Test global CSS for loading animations
const globalCssPath = path.join(__dirname, '..', 'app/globals.css');
if (fs.existsSync(globalCssPath)) {
  const cssContent = fs.readFileSync(globalCssPath, 'utf8');
  console.log('🎨 Testing global CSS:');
  
  if (cssContent.includes('@keyframes sweep')) {
    console.log('   ✅ Contains sweep animation');
  } else {
    console.log('   ❌ Missing sweep animation');
    allTestsPassed = false;
  }
  
  if (cssContent.includes('.animate-sweep')) {
    console.log('   ✅ Contains animate-sweep class');
  } else {
    console.log('   ❌ Missing animate-sweep class');
    allTestsPassed = false;
  }
  console.log('');
}

// Summary
console.log('📊 Test Summary:');
if (allTestsPassed) {
  console.log('✅ All tests passed! Global loading system is properly implemented.');
} else {
  console.log('❌ Some tests failed. Please review the implementation.');
}

console.log('\n🎯 Global Loading System Features:');
console.log('• UniversalLoading component with favicon and glare effects');
console.log('• GlobalLoadingProvider context for app-wide loading state');
console.log('• useGlobalLoading hook for easy loading control');
console.log('• Contextual loading messages based on current page');
console.log('• Standardized loading experience across all pages');
console.log('• Global overlay that covers entire application');

console.log('\n📝 Usage Example:');
console.log(`
import { useGlobalLoading } from '@/lib/global-loading-context';

function MyComponent() {
  const { showLoading, hideLoading } = useGlobalLoading();
  
  const loadData = async () => {
    showLoading("Loading data...");
    try {
      // Your API call here
      await fetchData();
    } finally {
      hideLoading();
    }
  };
}
`);