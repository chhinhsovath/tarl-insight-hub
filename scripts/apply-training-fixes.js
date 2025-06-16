const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Read .env.local file
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432', 10),
});

async function applyFixes() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Applying training system fixes...\n');
    
    // Apply feedback table fixes
    console.log('📊 Fixing training feedback table...');
    const feedbackSql = fs.readFileSync(path.join(__dirname, 'fix-training-feedback-table.sql'), 'utf8');
    await client.query(feedbackSql);
    console.log('✅ Training feedback table fixed\n');
    
    // Apply permission fixes
    console.log('🔐 Adding training permissions...');
    const permissionsSql = fs.readFileSync(path.join(__dirname, 'add-training-permissions.sql'), 'utf8');
    await client.query(permissionsSql);
    console.log('✅ Training permissions added\n');
    
    // Verify fixes
    console.log('🔍 Verifying fixes...\n');
    
    // Check feedback table columns
    const feedbackColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'tbl_tarl_training_feedback' 
      AND column_name IN ('session_id', 'participant_id', 'submitted_via', 'qr_code_used', 'feedback_data')
      ORDER BY column_name
    `);
    
    console.log('📋 Training feedback table columns:');
    feedbackColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
    
    // Check training permissions
    const trainingPermissions = await client.query(`
      SELECT 
        pp.page_name,
        pp.page_path,
        pp.sort_order,
        COUNT(DISTINCT rpp.role) as roles_with_access,
        COUNT(DISTINCT pap.role || '-' || pap.action_name) as total_permissions
      FROM page_permissions pp
      LEFT JOIN role_page_permissions rpp ON pp.id = rpp.page_id AND rpp.is_allowed = true
      LEFT JOIN page_action_permissions pap ON pp.id = pap.page_id AND pap.is_allowed = true
      WHERE pp.page_name LIKE 'training%'
      GROUP BY pp.page_name, pp.page_path, pp.sort_order
      ORDER BY pp.sort_order
    `);
    
    console.log('\n🎯 Training page permissions:');
    trainingPermissions.rows.forEach(perm => {
      console.log(`  - ${perm.page_name} (${perm.page_path}): ${perm.roles_with_access} roles, ${perm.total_permissions} permissions`);
    });
    
    console.log('\n✅ All training system fixes applied successfully!');
    
  } catch (error) {
    console.error('❌ Error applying fixes:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

applyFixes().catch(console.error);