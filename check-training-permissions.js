#!/usr/bin/env node

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkTrainingPermissions() {
  const client = await pool.connect();
  
  try {
    console.log('🔐 Checking Training System Permissions...\n');
    
    // Check if training-related pages exist in permissions
    console.log('1. Training pages in permission system:');
    const trainingPagesResult = await client.query(`
      SELECT page_name, page_path, page_title, sort_order
      FROM page_permissions 
      WHERE page_name LIKE 'training%' OR page_path LIKE '/training%'
      ORDER BY sort_order, page_name
    `);
    
    if (trainingPagesResult.rows.length > 0) {
      trainingPagesResult.rows.forEach(page => {
        console.log(`   ✅ ${page.page_name} - ${page.page_title || 'No title'} (${page.page_path})`);
      });
    } else {
      console.log('   ❌ No training pages found in permission system');
    }
    
    // Check role permissions for training pages
    if (trainingPagesResult.rows.length > 0) {
      console.log('\n2. Role permissions for training pages:');
      for (const page of trainingPagesResult.rows) {
        console.log(`\n   📄 ${page.page_name}:`);
        
        const rolePermissions = await client.query(`
          SELECT rpp.role, rpp.is_allowed
          FROM role_page_permissions rpp
          JOIN page_permissions pp ON rpp.page_id = pp.id
          WHERE pp.page_name = $1
          ORDER BY rpp.role
        `, [page.page_name]);
        
        if (rolePermissions.rows.length > 0) {
          rolePermissions.rows.forEach(perm => {
            const status = perm.is_allowed ? '✅ ALLOWED' : '❌ DENIED';
            console.log(`     - ${perm.role}: ${status}`);
          });
        } else {
          console.log(`     ⚠️  No role permissions configured (defaults to allowed)`);
        }
      }
    }
    
    // Check action permissions for training
    console.log('\n3. Action permissions for training:');
    const actionPermissionsResult = await client.query(`
      SELECT DISTINCT pp.page_name, pap.role, pap.action_name, pap.is_allowed
      FROM page_action_permissions pap
      JOIN page_permissions pp ON pap.page_id = pp.id
      WHERE pp.page_name LIKE 'training%'
      ORDER BY pp.page_name, pap.role, pap.action_name
    `);
    
    if (actionPermissionsResult.rows.length > 0) {
      let currentPage = '';
      let currentRole = '';
      
      actionPermissionsResult.rows.forEach(perm => {
        if (perm.page_name !== currentPage) {
          console.log(`\n   📄 ${perm.page_name}:`);
          currentPage = perm.page_name;
          currentRole = '';
        }
        
        if (perm.role !== currentRole) {
          console.log(`     👤 ${perm.role}:`);
          currentRole = perm.role;
        }
        
        const status = perm.is_allowed ? '✅' : '❌';
        console.log(`       - ${perm.action_name}: ${status}`);
      });
    } else {
      console.log('   ⚠️  No action permissions configured for training');
    }
    
    // Check training menu items
    console.log('\n4. Training menu structure:');
    const menuItemsResult = await client.query(`
      SELECT page_name, page_title, category, sort_order, icon_name
      FROM page_permissions 
      WHERE page_name LIKE 'training%' OR page_path LIKE '/training%'
      ORDER BY sort_order, page_name
    `);
    
    if (menuItemsResult.rows.length > 0) {
      menuItemsResult.rows.forEach(item => {
        const icon = item.icon_name ? `${item.icon_name} ` : '';
        console.log(`   📁 ${icon}${item.page_title || item.page_name}`);
        if (item.category) {
          console.log(`       Category: ${item.category}`);
        }
      });
    } else {
      console.log('   ❌ No training menu items found');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 TRAINING PERMISSIONS SUMMARY:');
    
    if (trainingPagesResult.rows.length === 0) {
      console.log('❌ CRITICAL: Training pages not configured in permission system');
      console.log('   This means training features may not be accessible through the menu');
      console.log('   and permission checks may fail.');
      
      console.log('\n🔧 RECOMMENDED ACTIONS:');
      console.log('1. Run training permissions setup script');
      console.log('2. Add training pages to permission system');
      console.log('3. Configure role-based access for training features');
    } else {
      console.log(`✅ Training pages configured: ${trainingPagesResult.rows.length} pages`);
      console.log(`✅ Action permissions: ${actionPermissionsResult.rows.length} configured`);
    }
    
  } catch (error) {
    console.error('❌ Error checking training permissions:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkTrainingPermissions().catch(console.error);