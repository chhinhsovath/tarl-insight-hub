const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432', 10),
});

async function setupDefaultPermissions() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Setting up default page management and permissions...\n');
    
    // 1. Add Page Management to page_permissions table
    console.log('1️⃣ Adding Page Management entry...');
    const pageResult = await client.query(`
      INSERT INTO page_permissions (page_path, page_name, icon_name, created_at, updated_at) 
      VALUES ($1, $2, $3, NOW(), NOW()) 
      ON CONFLICT (page_path) DO UPDATE SET 
        page_name = EXCLUDED.page_name,
        icon_name = EXCLUDED.icon_name,
        updated_at = NOW()
      RETURNING *
    `, ['/settings/page-permissions', 'Page Management', 'Shield']);
    
    console.log('✅ Page Management added:', pageResult.rows[0]);

    // 2. Check if we have a user_role_permissions table or similar
    // First, let's see what permission-related tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (table_name LIKE '%permission%' OR table_name LIKE '%role%')
      ORDER BY table_name
    `);
    
    console.log('\n2️⃣ Found permission/role tables:');
    tablesResult.rows.forEach(row => console.log(`  - ${row.table_name}`));

    // 3. Create a simple role_page_permissions table if it doesn't exist
    console.log('\n3️⃣ Creating role-page permissions table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS role_page_permissions (
        id SERIAL PRIMARY KEY,
        role_name VARCHAR(50) NOT NULL,
        page_path VARCHAR(255) NOT NULL,
        can_access BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(role_name, page_path)
      )
    `);
    console.log('✅ role_page_permissions table ready');

    // 4. Get all pages and create admin permissions
    console.log('\n4️⃣ Setting up admin permissions for all pages...');
    const allPages = await client.query('SELECT page_path FROM page_permissions');
    
    let adminPermissionsAdded = 0;
    for (const page of allPages.rows) {
      const result = await client.query(`
        INSERT INTO role_page_permissions (role_name, page_path, can_access, created_at, updated_at)
        VALUES ('admin', $1, true, NOW(), NOW())
        ON CONFLICT (role_name, page_path) 
        DO UPDATE SET can_access = true, updated_at = NOW()
      `, [page.page_path]);
      adminPermissionsAdded++;
    }
    
    console.log(`✅ Admin permissions set for ${adminPermissionsAdded} pages`);

    // 5. Show final status
    console.log('\n📋 Final Summary:');
    
    const totalPages = await client.query('SELECT COUNT(*) as count FROM page_permissions');
    console.log(`  • Total pages in system: ${totalPages.rows[0].count}`);
    
    const adminPerms = await client.query(`
      SELECT COUNT(*) as count 
      FROM role_page_permissions 
      WHERE role_name = 'admin' AND can_access = true
    `);
    console.log(`  • Admin permissions granted: ${adminPerms.rows[0].count}`);
    
    const allPagesResult = await client.query(`
      SELECT pp.page_name, pp.page_path, 
             CASE WHEN rpp.can_access IS TRUE THEN '✅' ELSE '❌' END as admin_access
      FROM page_permissions pp
      LEFT JOIN role_page_permissions rpp ON pp.page_path = rpp.page_path AND rpp.role_name = 'admin'
      ORDER BY pp.page_name
    `);
    
    console.log('\n🔐 Admin Access Status:');
    allPagesResult.rows.forEach(row => {
      console.log(`  ${row.admin_access} ${row.page_name} (${row.page_path})`);
    });
    
    console.log('\n🎉 Setup complete! Admin now has access to all pages.');
    
  } catch (error) {
    console.error('❌ Error setting up permissions:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

setupDefaultPermissions();