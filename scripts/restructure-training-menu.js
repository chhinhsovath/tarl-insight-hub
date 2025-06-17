const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function restructureTrainingMenu() {
  const pool = new Pool({
    user: process.env.PGUSER || 'postgres',
    host: process.env.PGHOST || 'localhost',
    database: process.env.PGDATABASE || 'pratham_tarl',
    password: process.env.PGPASSWORD || '12345',
    port: process.env.PGPORT || 5432,
  });

  try {
    console.log('🔄 Restructuring training menu hierarchy...');

    // Clean up any duplicate training entries first
    console.log('🧹 Cleaning up duplicate entries...');
    await pool.query(`
      DELETE FROM page_permissions 
      WHERE page_path = '/training' 
      AND is_parent_menu = false 
      AND menu_level = 0
    `);

    // First, let's check current training menu items
    const currentTraining = await pool.query(`
      SELECT id, page_name, page_path, parent_page_id, is_parent_menu, menu_level, sort_order
      FROM page_permissions 
      WHERE page_path LIKE '/training%' 
      ORDER BY sort_order
    `);
    
    console.log('📋 Current training menu items:');
    currentTraining.rows.forEach(item => {
      console.log(`  - ${item.page_name} (${item.page_path}) - Level: ${item.menu_level}, Parent: ${item.parent_page_id}`);
    });

    // Step 1: Find or create the main Training parent page
    let trainingParentId;
    const mainTraining = await pool.query(`
      SELECT id FROM page_permissions WHERE page_path = '/training'
    `);

    if (mainTraining.rows.length > 0) {
      trainingParentId = mainTraining.rows[0].id;
      console.log(`✅ Found existing main training page with ID: ${trainingParentId}`);
      
      // Update it to be a parent menu
      await pool.query(`
        UPDATE page_permissions 
        SET is_parent_menu = true, 
            menu_level = 1,
            page_name = 'Training Management',
            sort_order = 15
        WHERE id = $1
      `, [trainingParentId]);
    } else {
      console.log('📝 Creating main Training parent page...');
      const result = await pool.query(`
        INSERT INTO page_permissions (
          page_name, page_path, 
          is_parent_menu, menu_level, sort_order, created_at, updated_at
        ) VALUES (
          'Training Management', '/training',
          true, 1, 15, NOW(), NOW()
        ) RETURNING id
      `);
      trainingParentId = result.rows[0].id;
      console.log(`✅ Created main training page with ID: ${trainingParentId}`);
    }

    // Step 2: Define training sub-menu structure
    const trainingSubMenus = [
      {
        page_name: 'Sessions',
        page_path: '/training/sessions',
        sort_order: 1
      },
      {
        page_name: 'Programs',
        page_path: '/training/programs',
        sort_order: 2
      },
      {
        page_name: 'Participants',
        page_path: '/training/participants',
        sort_order: 3
      },
      {
        page_name: 'QR Codes',
        page_path: '/training/qr-codes',
        sort_order: 4
      },
      {
        page_name: 'Feedback',
        page_path: '/training/feedback',
        sort_order: 5
      }
    ];

    // Step 3: Update or create training sub-menu items
    for (const submenu of trainingSubMenus) {
      const existing = await pool.query(`
        SELECT id FROM page_permissions WHERE page_path = $1
      `, [submenu.page_path]);

      if (existing.rows.length > 0) {
        // Update existing item
        await pool.query(`
          UPDATE page_permissions 
          SET page_name = $1,
              parent_page_id = $2,
              is_parent_menu = false,
              menu_level = 2,
              sort_order = $3,
              updated_at = NOW()
          WHERE page_path = $4
        `, [
          submenu.page_name,
          trainingParentId,
          submenu.sort_order,
          submenu.page_path
        ]);
        console.log(`✅ Updated: ${submenu.page_name}`);
      } else {
        // Create new item
        await pool.query(`
          INSERT INTO page_permissions (
            page_name, page_path,
            parent_page_id, is_parent_menu, menu_level, sort_order,
            created_at, updated_at
          ) VALUES ($1, $2, $3, false, 2, $4, NOW(), NOW())
        `, [
          submenu.page_name,
          submenu.page_path,
          trainingParentId,
          submenu.sort_order
        ]);
        console.log(`✅ Created: ${submenu.page_name}`);
      }
    }

    // Step 4: Set up default role permissions for training items
    console.log('🔐 Setting up role permissions...');
    
    // Get all training page IDs
    const trainingPages = await pool.query(`
      SELECT id, page_path FROM page_permissions 
      WHERE page_path LIKE '/training%'
    `);

    // Get role IDs
    const roles = await pool.query(`
      SELECT id, name FROM tbl_tarl_roles 
      WHERE name IN ('admin', 'director', 'partner', 'coordinator', 'teacher')
    `);

    // Set permissions for each role on each training page
    for (const page of trainingPages.rows) {
      for (const role of roles.rows) {
        // Check if permission already exists
        const existing = await pool.query(`
          SELECT id FROM role_page_permissions 
          WHERE role = $1 AND page_id = $2
        `, [role.name, page.id]);

        if (existing.rows.length === 0) {
          // Determine access level based on role
          let isAllowed = true;
          if (role.name === 'teacher' && page.page_path.includes('/programs')) {
            isAllowed = false; // Teachers can't manage programs
          }

          await pool.query(`
            INSERT INTO role_page_permissions (role, page_id, is_allowed, created_at, updated_at)
            VALUES ($1, $2, $3, NOW(), NOW())
          `, [role.name, page.id, isAllowed]);
        }
      }
    }

    // Step 5: Show final structure
    console.log('\n🎯 Final training menu structure:');
    const finalStructure = await pool.query(`
      SELECT id, page_name, page_path, parent_page_id, is_parent_menu, menu_level, sort_order
      FROM page_permissions 
      WHERE page_path LIKE '/training%' 
      ORDER BY menu_level, sort_order
    `);
    
    finalStructure.rows.forEach(item => {
      const indent = '  '.repeat(item.menu_level - 1);
      const parentIcon = item.is_parent_menu ? '📁' : '📄';
      console.log(`${indent}${parentIcon} ${item.page_name} (${item.page_path})`);
    });

    console.log('\n✅ Training menu restructuring completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   • Main training parent: Training Management`);
    console.log(`   • Sub-menu items: ${trainingSubMenus.length}`);
    console.log(`   • Role permissions: Set for all roles`);
    console.log(`   • Menu category: management`);

  } catch (error) {
    console.error('❌ Error restructuring training menu:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the restructuring
restructureTrainingMenu().catch(console.error);