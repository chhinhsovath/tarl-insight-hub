#!/usr/bin/env node

/**
 * Cleanup Legacy Database Dependencies
 * Removes Supabase, Neon, and other legacy database configurations
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 Cleaning up legacy database dependencies...\n');

// 1. Clean up package.json scripts
console.log('1. Cleaning package.json scripts...');
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Remove legacy scripts
const legacyScripts = [
  'migrate:to-neon',
  'backup:neon', 
  'migrate:local-to-neon'
];

legacyScripts.forEach(script => {
  if (packageJson.scripts[script]) {
    delete packageJson.scripts[script];
    console.log(`   ✅ Removed script: ${script}`);
  }
});

// 2. List legacy dependencies (don't auto-remove to avoid breaking things)
console.log('\n2. Found legacy dependencies (manual removal recommended):');
const legacyDeps = ['@supabase/supabase-js'];
legacyDeps.forEach(dep => {
  if (packageJson.dependencies && packageJson.dependencies[dep]) {
    console.log(`   ⚠️  Found: ${dep} (version: ${packageJson.dependencies[dep]})`);
    console.log(`      Remove with: npm uninstall ${dep}`);
  }
});

// Write updated package.json
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
console.log('   ✅ Updated package.json');

// 3. List legacy files for manual review
console.log('\n3. Legacy files found (review and remove if unused):');
const legacyFiles = [
  'lib/supabase.ts',
  'scripts/complete-migration.js',
  'scripts/backup-neon-before-migration.js',
  'scripts/migrate-local-to-neon.js',
  'scripts/migrate-local-to-neon-safe.js',
  'scripts/migrate-simple.js',
  'scripts/migrate-final-tables.js',
  'scripts/migrate-small-tables.js',
  'scripts/migrate-large-tables.js',
  'scripts/check-remaining-tables.js',
  'scripts/test-connections.js',
  'scripts/resume-migration.js',
  'scripts/compare-databases.js'
];

legacyFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    console.log(`   📁 ${file}`);
  }
});

// 4. Current database configuration summary
console.log('\n4. Current database configuration:');
console.log('   ✅ Primary: Digital Ocean PostgreSQL');
console.log('   ✅ Configuration: lib/database-config.ts');
console.log('   ✅ Uses: Standard PostgreSQL with pg library');

// 5. Environment variables to clean up
console.log('\n5. Environment variables to clean up:');
const legacyEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEON_DATABASE_URL',
  'NEON_PGHOST',
  'NEON_PGUSER',
  'NEON_PGPASSWORD',
  'NEON_PGDATABASE'
];

console.log('   Remove these from your .env files:');
legacyEnvVars.forEach(envVar => {
  console.log(`   - ${envVar}`);
});

console.log('\n✅ Cleanup summary generated!');
console.log('\n📋 Manual steps to complete cleanup:');
console.log('1. npm uninstall @supabase/supabase-js');
console.log('2. Review and remove legacy files listed above');
console.log('3. Clean up environment variables');
console.log('4. Remove legacy database references from any remaining code');

console.log('\n🎯 Current setup: Digital Ocean PostgreSQL with lib/database-config.ts');