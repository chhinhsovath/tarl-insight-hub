#!/usr/bin/env node

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function setupSchoolRegistrationPermissions() {
  const client = await pool.connect();
  
  try {
    console.log('🏫 Setting up School Registration page permissions...\n');
    
    // Check if page already exists
    const existingPageResult = await client.query(`
      SELECT id, page_name, page_title 
      FROM page_permissions 
      WHERE page_name = 'school-registration' OR page_path = '/school-registration'
    `);
    
    let page;
    if (existingPageResult.rows.length > 0) {
      // Update existing page
      const updateResult = await client.query(`
        UPDATE page_permissions SET
          page_title = 'School Registration',
          category = 'Management',
          icon_name = 'School',
          sort_order = 120,
          is_displayed_in_menu = true,
          menu_visibility = 'visible'
        WHERE page_name = 'school-registration' OR page_path = '/school-registration'
        RETURNING id, page_name, page_title
      `);
      page = updateResult.rows[0];
      console.log('✅ Page updated:', page.page_name, '-', page.page_title);
    } else {
      // Insert new page
      const pageResult = await client.query(`
        INSERT INTO page_permissions (
          page_name, 
          page_path, 
          page_title, 
          category, 
          icon_name, 
          sort_order,
          is_displayed_in_menu,
          menu_visibility,
          menu_icon_type
        ) VALUES (
          'school-registration', 
          '/school-registration', 
          'School Registration', 
          'Management', 
          'School', 
          120,
          true,
          'visible',
          'lucide'
        ) 
        RETURNING id, page_name, page_title
      `);
      page = pageResult.rows[0];
      console.log('✅ Page added:', page.page_name, '-', page.page_title);
    }
    
    // Get all roles
    const rolesResult = await client.query('SELECT name FROM tbl_tarl_roles ORDER BY name');
    const roles = rolesResult.rows.map(r => r.name);
    
    console.log('\n📋 Setting up role permissions for:', roles.join(', '));
    
    // Set permissions for each role
    for (const role of roles) {
      // All roles can access school registration (directors need it to register their schools)
      const isAllowed = true; // Allow all roles for now
      
      await client.query(`
        INSERT INTO role_page_permissions (page_id, role, is_allowed)
        VALUES ($1, $2, $3)
        ON CONFLICT (page_id, role) 
        DO UPDATE SET is_allowed = EXCLUDED.is_allowed
      `, [page.id, role, isAllowed]);
      
      const status = isAllowed ? '✅ ALLOWED' : '❌ DENIED';
      console.log(`   - ${role}: ${status}`);
    }
    
    console.log('\n🎯 School Registration permissions setup completed!');
    console.log('📍 Page URL: /school-registration');
    console.log('🔗 Menu Category: Management');
    
  } catch (error) {
    console.error('❌ Error setting up school registration permissions:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

setupSchoolRegistrationPermissions().catch(console.error);