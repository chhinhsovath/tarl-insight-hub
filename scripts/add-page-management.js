const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432', 10),
});

async function addPageManagement() {
  const client = await pool.connect();
  
  try {
    console.log('Adding Page Management to page_permissions table...');
    
    // Add Page Management entry
    const result = await client.query(`
      INSERT INTO page_permissions (page_path, page_name, icon_name, created_at, updated_at) 
      VALUES ($1, $2, $3, NOW(), NOW()) 
      ON CONFLICT (page_path) DO NOTHING
      RETURNING *
    `, ['/settings/page-permissions', 'Page Management', 'Shield']);
    
    if (result.rows.length > 0) {
      console.log('✅ Page Management added successfully:', result.rows[0]);
    } else {
      console.log('ℹ️  Page Management already exists');
    }

    // Also add some observation subpages if they don't exist
    const subPages = [
      ['/observations/new', 'New Observation', 'Plus'],
      ['/observations/list', 'All Observations', 'List'],
    ];

    for (const [path, name, icon] of subPages) {
      const subResult = await client.query(`
        INSERT INTO page_permissions (page_path, page_name, icon_name, created_at, updated_at) 
        VALUES ($1, $2, $3, NOW(), NOW()) 
        ON CONFLICT (page_path) DO NOTHING
        RETURNING *
      `, [path, name, icon]);
      
      if (subResult.rows.length > 0) {
        console.log(`✅ Added: ${name}`);
      }
    }
    
    // Show all current pages
    const allPages = await client.query('SELECT page_path, page_name FROM page_permissions ORDER BY page_name');
    console.log('\n📋 Current pages in database:');
    allPages.rows.forEach(page => {
      console.log(`  - ${page.page_name} (${page.page_path})`);
    });
    
  } catch (error) {
    console.error('❌ Error adding page management:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

addPageManagement();