#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Find all files with Pool instances
const findPoolFiles = () => {
  try {
    const result = execSync('grep -r "new Pool(" app/api/', { encoding: 'utf8' });
    const files = result.split('\n')
      .filter(line => line.trim())
      .map(line => line.split(':')[0])
      .filter((file, index, self) => self.indexOf(file) === index); // unique files
    return files;
  } catch (error) {
    console.log('No more Pool instances found or error:', error.message);
    return [];
  }
};

let fixedCount = 0;
const filesToFix = findPoolFiles();

console.log(`Found ${filesToFix.length} files with Pool instances:`);
filesToFix.forEach(file => console.log(`  - ${file}`));

filesToFix.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${file}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Remove the old Pool creation (more flexible regex)
  const poolCreationRegex = /const pool = new Pool\({[\s\S]*?\}\);/m;
  
  if (poolCreationRegex.test(content)) {
    content = content.replace(poolCreationRegex, 'const pool = getPool();');
    
    // Remove Pool import if it exists
    content = content.replace(/import { Pool } from ["']pg["'];?\s*\n/g, '');
    
    // Ensure getPool is imported
    if (!content.includes('getPool')) {
      // Find the first import statement
      const firstImportMatch = content.match(/import .* from .*/);
      if (firstImportMatch) {
        const firstImport = firstImportMatch[0];
        const importIndex = content.indexOf(firstImport);
        content = content.slice(0, importIndex + firstImport.length) +
                  '\nimport { getPool } from "@/lib/database-config";' +
                  content.slice(importIndex + firstImport.length);
      }
    }
    
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed: ${file}`);
    fixedCount++;
  } else {
    console.log(`ℹ️  Already fixed or different pattern: ${file}`);
  }
});

console.log(`\n🎉 Fixed ${fixedCount} files`);