#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all TypeScript files in the api directory
const apiFiles = glob.sync('app/api/**/*.ts');

let fixedCount = 0;

apiFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;

  // Check if file has Pool instance creation
  if (content.includes('new Pool({') && !content.includes('database-config')) {
    // Check if it already imports Pool
    const hasPoolImport = content.includes("import { Pool } from \"pg\"");
    const hasPoolImportInline = content.includes("Pool } from \"pg\"");
    
    // Replace the Pool creation with centralized config
    const oldPoolPattern = /const pool = new Pool\({[\s\S]*?\}\);/m;
    
    if (oldPoolPattern.test(content)) {
      // Remove Pool import if exists
      if (hasPoolImport) {
        content = content.replace("import { Pool } from \"pg\";\n", "");
        content = content.replace("import { Pool } from \"pg\";", "");
      }
      
      // Replace inline Pool import
      if (hasPoolImportInline) {
        content = content.replace(/, Pool\s*\}/, " }");
        content = content.replace(/{\s*Pool\s*,/, "{ ");
        content = content.replace(/{\s*Pool\s*\}/, "{ }");
      }
      
      // Add database-config import if not exists
      if (!content.includes('database-config')) {
        // Find the last import statement
        const importMatches = content.match(/import .* from .*/g);
        if (importMatches) {
          const lastImport = importMatches[importMatches.length - 1];
          const lastImportIndex = content.lastIndexOf(lastImport);
          content = content.slice(0, lastImportIndex + lastImport.length) +
                    '\nimport { getPool } from "@/lib/database-config";' +
                    content.slice(lastImportIndex + lastImport.length);
        } else {
          // No imports, add at the beginning
          content = 'import { getPool } from "@/lib/database-config";\n' + content;
        }
      }
      
      // Replace Pool creation
      content = content.replace(oldPoolPattern, 'const pool = getPool();');
      
      modified = true;
      fixedCount++;
      console.log(`✅ Fixed: ${file}`);
    }
  }
  
  if (modified) {
    fs.writeFileSync(file, content);
  }
});

console.log(`\n🎉 Fixed ${fixedCount} files with SSL connection issues`);
console.log('\nNext steps:');
console.log('1. Run "npm run build" to verify no TypeScript errors');
console.log('2. Commit these changes');
console.log('3. Deploy to Vercel');