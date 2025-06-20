#!/usr/bin/env node

const { backupNeonDatabase } = require('./backup-neon-before-migration');
const { migrateLocalToNeon } = require('./migrate-local-to-neon');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function switchToNeonEnvironment() {
  try {
    console.log('\n🔄 Switching environment to Neon...');
    
    const rootDir = path.join(__dirname, '..');
    const neonEnvFile = path.join(rootDir, '.env.local.neon');
    const currentEnvFile = path.join(rootDir, '.env.local');
    const backupEnvFile = path.join(rootDir, '.env.local.backup');

    // Backup current .env.local
    if (fs.existsSync(currentEnvFile)) {
      fs.copyFileSync(currentEnvFile, backupEnvFile);
      console.log(`✅ Backed up current .env.local to .env.local.backup`);
    }

    // Copy Neon configuration to .env.local
    if (fs.existsSync(neonEnvFile)) {
      fs.copyFileSync(neonEnvFile, currentEnvFile);
      console.log(`✅ Switched to Neon environment configuration`);
      console.log(`ℹ️  Your local PostgreSQL config is backed up in .env.local.backup`);
    } else {
      console.error(`❌ Neon environment file not found: ${neonEnvFile}`);
      throw new Error('Neon environment file missing');
    }

  } catch (error) {
    console.error('❌ Failed to switch environment:', error.message);
    throw error;
  }
}

async function testNeonConnection() {
  try {
    console.log('\n🔍 Testing Neon database connection...');
    
    const { Pool } = require('pg');
    const neonConfig = {
      user: 'neondb_owner',
      host: 'ep-bold-sun-a55wq826-pooler.us-east-2.aws.neon.tech',
      database: 'neondb',
      password: 'npg_U9lFscTri3yk',
      port: 5432,
      ssl: { rejectUnauthorized: false }
    };

    const pool = new Pool(neonConfig);
    await pool.query('SELECT NOW()');
    await pool.end();
    
    console.log('✅ Neon database connection successful');
  } catch (error) {
    console.error('❌ Neon database connection failed:', error.message);
    throw error;
  }
}

async function completeMigration() {
  try {
    console.log('🚀 Complete Local to Neon Migration Tool');
    console.log('==========================================\n');

    console.log('⚠️  WARNING: This will:');
    console.log('   1. Backup your current Neon database');
    console.log('   2. DELETE ALL TABLES in Neon');
    console.log('   3. Copy ALL data from local PostgreSQL to Neon');
    console.log('   4. Switch your environment to use Neon\n');

    const proceed = await question('Do you want to proceed? (yes/no): ');
    if (proceed.toLowerCase() !== 'yes') {
      console.log('❌ Migration cancelled by user');
      process.exit(0);
    }

    console.log('\n📋 Pre-migration checklist:');
    console.log('✅ Local PostgreSQL database: pratham_tarl on localhost');
    console.log('✅ Neon database: neondb on Neon.tech');
    console.log('✅ Backup will be created automatically\n');

    // Step 1: Test connections
    console.log('🔍 Testing database connections...');
    await testNeonConnection();
    
    const { Pool } = require('pg');
    const localPool = new Pool({
      user: 'postgres',
      host: 'localhost',
      database: 'pratham_tarl',
      password: '12345',
      port: 5432,
    });
    
    try {
      await localPool.query('SELECT 1');
      console.log('✅ Local PostgreSQL connection successful');
    } catch (error) {
      console.error('❌ Local PostgreSQL connection failed:', error.message);
      throw error;
    } finally {
      await localPool.end();
    }

    // Step 2: Backup Neon database
    console.log('\n📦 Step 1: Creating Neon database backup...');
    await backupNeonDatabase();

    // Step 3: Migrate data
    console.log('\n📥 Step 2: Migrating data from local to Neon...');
    await migrateLocalToNeon();

    // Step 4: Switch environment
    console.log('\n🔄 Step 3: Switching environment configuration...');
    await switchToNeonEnvironment();

    // Step 5: Final verification
    console.log('\n🔍 Step 4: Final verification...');
    await testNeonConnection();

    console.log('\n🎉 MIGRATION COMPLETED SUCCESSFULLY!');
    console.log('=====================================\n');
    console.log('✅ All data migrated from local PostgreSQL to Neon');
    console.log('✅ Environment switched to use Neon database');
    console.log('✅ Backup created for safety\n');
    
    console.log('📋 What to do next:');
    console.log('1. Restart your development server');
    console.log('2. Test your application thoroughly');
    console.log('3. Update any deployment configurations');
    console.log('4. Remove backup files when no longer needed\n');
    
    console.log('📁 Files created:');
    console.log('   - Neon backup: scripts/neon_backup_*.sql');
    console.log('   - Local export: scripts/local_database_export.sql');
    console.log('   - Env backup: .env.local.backup\n');

    console.log('🔄 To switch back to local PostgreSQL:');
    console.log('   cp .env.local.backup .env.local\n');

  } catch (error) {
    console.error('\n❌ MIGRATION FAILED:', error.message);
    console.error('Stack trace:', error.stack);
    
    console.log('\n🔧 Recovery steps:');
    console.log('1. Check your database connections');
    console.log('2. Restore from backup if needed');
    console.log('3. Switch back environment: cp .env.local.backup .env.local');
    
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run complete migration
if (require.main === module) {
  completeMigration();
}

module.exports = { completeMigration };