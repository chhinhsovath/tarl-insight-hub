#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// List of files that need manual fixing based on the linter output
const filesToFix = [
  'app/api/training/feedback/route.ts',
  'app/api/participant/materials/[sessionId]/route.ts',
  'app/api/participant/trainings/route.ts',
  'app/api/participant/auth/route.ts',
  'app/api/training/participants/materials/route.ts',
  'app/api/training/participants/check-returning/route.ts',
  'app/api/training/participants/search/route.ts',
  'app/api/training/participants/sessions/route.ts',
  'app/api/training/participants/route.ts',
  'app/api/training/materials/route.ts',
  'app/api/training/materials/upload/route.ts',
  'app/api/training/qr-codes/route.ts',
  'app/api/training/engage-materials/download/route.ts',
  'app/api/training/engage-materials/route.ts',
  'app/api/training/photo-activities/route.ts',
  'app/api/training/programs/route.ts',
  'app/api/training/engage-programs/route.ts',
  'app/api/training/sessions/public/[id]/route.ts',
  'app/api/training/sessions/route.ts',
  'app/api/training/sessions/[id]/attendance/route.ts'
];

let fixedCount = 0;

filesToFix.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${file}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Remove the old Pool creation
  const poolCreationRegex = /const pool = new Pool\({[\s\S]*?\}\);/m;
  
  if (poolCreationRegex.test(content)) {
    content = content.replace(poolCreationRegex, 'const pool = getPool();');
    
    // Remove Pool import if it exists
    content = content.replace(/import { Pool } from "pg";\n/g, '');
    
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