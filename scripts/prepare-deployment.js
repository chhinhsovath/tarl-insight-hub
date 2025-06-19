#!/usr/bin/env node

/**
 * Deployment Preparation Script for cPanel Hosting
 * This script helps prepare your application for deployment
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Preparing TaRL Insight Hub for cPanel Deployment...\n');

// Check if we're in the right directory
if (!fs.existsSync('./package.json')) {
  console.error('❌ Error: Please run this script from the project root directory.');
  process.exit(1);
}

// Check for required files
const requiredFiles = [
  './package.json',
  './next.config.mjs',
  './app',
  './components',
  './lib'
];

console.log('📋 Checking required files...');
for (const file of requiredFiles) {
  if (!fs.existsSync(file)) {
    console.error(`❌ Missing required file/directory: ${file}`);
    process.exit(1);
  }
  console.log(`✅ Found: ${file}`);
}

// Create .env.production if it doesn't exist
if (!fs.existsSync('./.env.production')) {
  console.log('\n📝 Creating .env.production file...');
  if (fs.existsSync('./.env.production.example')) {
    fs.copyFileSync('./.env.production.example', './.env.production');
    console.log('✅ Created .env.production from example file');
    console.log('⚠️  IMPORTANT: Update .env.production with your actual hosting details!');
  } else {
    console.log('❌ .env.production.example not found. Please create .env.production manually.');
  }
}

// Install dependencies
console.log('\n📦 Installing dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Dependencies installed successfully');
} catch (error) {
  console.error('❌ Failed to install dependencies:', error.message);
  process.exit(1);
}

// Build the application
console.log('\n🏗️  Building application...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Application built successfully');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  console.log('\n💡 Troubleshooting tips:');
  console.log('   - Check your .env.production file for correct database settings');
  console.log('   - Ensure all required environment variables are set');
  console.log('   - Fix any TypeScript or ESLint errors');
  process.exit(1);
}

// Create deployment summary
console.log('\n📊 Deployment Summary:');
console.log('=====================================');

// Check build output
const buildExists = fs.existsSync('./.next');
console.log(`Build Output (.next): ${buildExists ? '✅ Ready' : '❌ Missing'}`);

// Check environment file
const envExists = fs.existsSync('./.env.production');
console.log(`Environment File: ${envExists ? '✅ Found' : '❌ Missing'}`);

// Get package.json info
const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
console.log(`Application Name: ${packageJson.name}`);
console.log(`Version: ${packageJson.version}`);

// List files to upload
console.log('\n📁 Files to upload to your cPanel hosting:');
const filesToUpload = [
  '.next/',
  'app/',
  'components/',
  'lib/',
  'public/',
  'scripts/',
  'package.json',
  'next.config.mjs',
  '.env.production'
];

filesToUpload.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`   ${exists ? '✅' : '❌'} ${file}`);
});

console.log('\n📝 Next Steps:');
console.log('=====================================');
console.log('1. Update .env.production with your actual hosting database details');
console.log('2. Create a PostgreSQL database in your cPanel');
console.log('3. Upload the above files to your hosting (exclude node_modules)');
console.log('4. In cPanel terminal, run: npm install --production');
console.log('5. Set up Node.js app in cPanel pointing to your uploaded files');
console.log('6. Configure your domain to point to the Node.js app');
console.log('7. Import your database schema using the SQL files in scripts/');

console.log('\n🔗 For detailed instructions, see DEPLOYMENT.md');

console.log('\n✅ Preparation complete! Your app is ready for cPanel deployment.');