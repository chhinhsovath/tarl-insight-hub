const { Pool } = require('pg');
require('dotenv').config();

// Debug environment variables
console.log('🔍 Database configuration:');
console.log('  PGUSER:', process.env.PGUSER);
console.log('  PGHOST:', process.env.PGHOST);
console.log('  PGDATABASE:', process.env.PGDATABASE);
console.log('  PGPASSWORD:', process.env.PGPASSWORD ? '***' : 'NOT SET');
console.log('  PGPORT:', process.env.PGPORT);

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432', 10),
});

async function removeTrainingMenuItems() {
  const client = await pool.connect();
  
  try {
    console.log('🗑️  Removing training menu items from the database...');
    
    // First, let's check what training-related items exist
    const checkResult = await client.query(`
      SELECT id, page_name, page_path 
      FROM page_permissions 
      WHERE page_name ILIKE '%training%' OR page_path ILIKE '%training%'
      ORDER BY id
    `);
    
    console.log('📋 Found training-related menu items:');
    checkResult.rows.forEach(row => {
      console.log(`  ID: ${row.id}, Name: ${row.page_name}, Path: ${row.page_path}`);
    });
    
    if (checkResult.rows.length === 0) {
      console.log('✅ No training menu items found to remove.');
      return;
    }
    
    // Remove the specific training menu items
    const removeItems = [
      '/training',
      '/training/feedback'
    ];
    
    for (const path of removeItems) {
      console.log(`🗑️  Removing menu item: ${path}`);
      
      // First check if it exists
      const existsResult = await client.query(
        'SELECT id, page_name FROM page_permissions WHERE page_path = $1',
        [path]
      );
      
      if (existsResult.rows.length > 0) {
        // Delete related permissions first
        await client.query(
          'DELETE FROM role_page_permissions WHERE page_id = $1',
          [existsResult.rows[0].id]
        );
        console.log(`  ✅ Removed role permissions for ${existsResult.rows[0].page_name}`);
        
        // Delete action permissions if they exist
        const actionPermissionsCheck = await client.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'page_action_permissions'
        `);
        
        if (actionPermissionsCheck.rows.length > 0) {
          await client.query(
            'DELETE FROM page_action_permissions WHERE page_id = $1',
            [existsResult.rows[0].id]
          );
          console.log(`  ✅ Removed action permissions for ${existsResult.rows[0].page_name}`);
        }
        
        // Delete from user menu order if it exists
        const userMenuCheck = await client.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'user_menu_order'
        `);
        
        if (userMenuCheck.rows.length > 0) {
          await client.query(
            'DELETE FROM user_menu_order WHERE page_id = $1',
            [existsResult.rows[0].id]
          );
          console.log(`  ✅ Removed user menu order entries for ${existsResult.rows[0].page_name}`);
        }
        
        // Finally delete the page permission itself
        await client.query(
          'DELETE FROM page_permissions WHERE page_path = $1',
          [path]
        );
        console.log(`  ✅ Removed page permission: ${existsResult.rows[0].page_name}`);
      } else {
        console.log(`  ℹ️  Menu item ${path} not found in database`);
      }
    }
    
    // Also remove any training sub-pages that might exist
    const trainingSubpages = await client.query(`
      SELECT id, page_name, page_path 
      FROM page_permissions 
      WHERE page_path LIKE '/training/%'
      ORDER BY id
    `);
    
    if (trainingSubpages.rows.length > 0) {
      console.log('🗑️  Removing training sub-pages:');
      for (const subpage of trainingSubpages.rows) {
        console.log(`  Removing: ${subpage.page_name} (${subpage.page_path})`);
        
        // Remove related permissions
        await client.query(
          'DELETE FROM role_page_permissions WHERE page_id = $1',
          [subpage.id]
        );
        
        // Remove action permissions if they exist
        const actionPermissionsCheck = await client.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'page_action_permissions'
        `);
        
        if (actionPermissionsCheck.rows.length > 0) {
          await client.query(
            'DELETE FROM page_action_permissions WHERE page_id = $1',
            [subpage.id]
          );
        }
        
        // Remove from user menu order if it exists
        const userMenuCheck = await client.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'user_menu_order'
        `);
        
        if (userMenuCheck.rows.length > 0) {
          await client.query(
            'DELETE FROM user_menu_order WHERE page_id = $1',
            [subpage.id]
          );
        }
        
        // Delete the page permission
        await client.query(
          'DELETE FROM page_permissions WHERE id = $1',
          [subpage.id]
        );
        console.log(`  ✅ Removed: ${subpage.page_name}`);
      }
    }
    
    // Verify removal
    const finalCheck = await client.query(`
      SELECT id, page_name, page_path 
      FROM page_permissions 
      WHERE page_name ILIKE '%training%' OR page_path ILIKE '%training%'
      ORDER BY id
    `);
    
    console.log('📋 Remaining training-related items after cleanup:');
    if (finalCheck.rows.length === 0) {
      console.log('  ✅ All training menu items have been successfully removed!');
    } else {
      finalCheck.rows.forEach(row => {
        console.log(`  ID: ${row.id}, Name: ${row.page_name}, Path: ${row.page_path}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error removing training menu items:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
removeTrainingMenuItems()
  .then(() => {
    console.log('🎉 Training menu items removal completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed to remove training menu items:', error);
    process.exit(1);
  });