const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432', 10),
});

async function setupTrainingPermissions() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Setting up training permissions...');
    
    await client.query('BEGIN');

    // Get the next sort order
    const maxSortResult = await client.query('SELECT COALESCE(MAX(sort_order), 0) as max_sort FROM page_permissions');
    let nextSort = maxSortResult.rows[0].max_sort + 1;

    // Training pages to add
    const trainingPages = [
      {
        page_name: 'training',
        page_path: '/training',
        display_name: 'Training Overview',
        description: 'Training management overview and dashboard',
        category: 'Training',
        icon: 'GraduationCap',
        is_active: true,
        sort_order: nextSort++
      },
      {
        page_name: 'training-sessions',
        page_path: '/training/sessions',
        display_name: 'Training Sessions',
        description: 'Manage training sessions and schedules',
        category: 'Training',
        icon: 'CalendarDays',
        is_active: true,
        sort_order: nextSort++
      },
      {
        page_name: 'training-programs',
        page_path: '/training/programs',
        display_name: 'Training Programs',
        description: 'Manage training programs and curricula',
        category: 'Training',
        icon: 'ClipboardList',
        is_active: true,
        sort_order: nextSort++
      },
      {
        page_name: 'training-participants',
        page_path: '/training/participants',
        display_name: 'Training Participants',
        description: 'Manage participant registration and attendance',
        category: 'Training',
        icon: 'Users',
        is_active: true,
        sort_order: nextSort++
      },
      {
        page_name: 'training-qr-codes',
        page_path: '/training/qr-codes',
        display_name: 'Training QR Codes',
        description: 'Generate and manage QR codes for training',
        category: 'Training',
        icon: 'QrCode',
        is_active: true,
        sort_order: nextSort++
      }
    ];

    // Insert training pages
    for (const page of trainingPages) {
      // Check if page already exists
      const existingPage = await client.query(
        'SELECT id FROM page_permissions WHERE page_name = $1 OR page_path = $2',
        [page.page_name, page.page_path]
      );

      if (existingPage.rows.length === 0) {
        const result = await client.query(`
          INSERT INTO page_permissions (
            page_name, page_path, display_name, description, category, 
            icon, is_active, sort_order, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
          RETURNING id
        `, [
          page.page_name, page.page_path, page.display_name, page.description,
          page.category, page.icon, page.is_active, page.sort_order
        ]);

        console.log(`✅ Added page: ${page.display_name} (ID: ${result.rows[0].id})`);
      } else {
        console.log(`⚠️  Page already exists: ${page.display_name}`);
      }
    }

    // Set up default role permissions for training pages
    const roles = ['admin', 'director', 'partner', 'coordinator', 'teacher'];
    
    // Get all training page IDs
    const trainingPageIds = await client.query(`
      SELECT id, page_name FROM page_permissions 
      WHERE page_name IN ('training', 'training-sessions', 'training-programs', 'training-participants', 'training-qr-codes')
    `);

    for (const pageRow of trainingPageIds.rows) {
      const pageId = pageRow.id;
      const pageName = pageRow.page_name;

      for (const role of roles) {
        // Check if role page permission already exists
        const existingRolePermission = await client.query(
          'SELECT id FROM role_page_permissions WHERE page_id = $1 AND role = $2',
          [pageId, role]
        );

        if (existingRolePermission.rows.length === 0) {
          // Set permissions based on role and page
          let hasAccess = true;
          
          // FULL ACCESS: All roles can access all training pages
          hasAccess = true;

          if (hasAccess) {
            await client.query(`
              INSERT INTO role_page_permissions (page_id, role, has_access, created_at, updated_at)
              VALUES ($1, $2, $3, NOW(), NOW())
            `, [pageId, role, true]);

            console.log(`✅ Added role permission: ${role} -> ${pageName}`);
          }
        }
      }
    }

    // Set up action permissions for training pages
    const actions = ['view', 'create', 'update', 'delete', 'export'];
    
    for (const pageRow of trainingPageIds.rows) {
      const pageId = pageRow.id;
      const pageName = pageRow.page_name;

      for (const role of roles) {
        for (const action of actions) {
          // Check if action permission already exists
          const existingActionPermission = await client.query(
            'SELECT id FROM page_action_permissions WHERE page_id = $1 AND role = $2 AND action_name = $3',
            [pageId, role, action]
          );

          if (existingActionPermission.rows.length === 0) {
            // FULL ACCESS: All roles can perform all actions on all training pages
            let isAllowed = true;

            if (isAllowed) {
              await client.query(`
                INSERT INTO page_action_permissions (page_id, role, action_name, is_allowed, created_at, updated_at)
                VALUES ($1, $2, $3, $4, NOW(), NOW())
              `, [pageId, role, action, true]);

              console.log(`✅ Added action permission: ${role} -> ${pageName} -> ${action}`);
            }
          }
        }
      }
    }

    await client.query('COMMIT');
    console.log('🎉 Training permissions setup completed successfully!');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error setting up training permissions:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the setup
if (require.main === module) {
  setupTrainingPermissions()
    .then(() => {
      console.log('✅ Training permissions setup complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Failed to setup training permissions:', error);
      process.exit(1);
    });
}

module.exports = { setupTrainingPermissions };