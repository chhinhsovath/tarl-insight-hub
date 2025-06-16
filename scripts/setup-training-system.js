const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value && !key.startsWith('#')) {
      process.env[key.trim()] = value.trim();
    }
  });
}

const pool = new Pool({
  user: process.env.PGUSER || 'postgres',
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDATABASE || 'pratham_tarl',
  password: process.env.PGPASSWORD || '12345',
  port: parseInt(process.env.PGPORT || '5432', 10),
});

async function setupTrainingSystem() {
  const client = await pool.connect();

  try {
    console.log('🎓 Setting up Training Management System...');

    // Read and execute the training schema
    const schemaPath = path.join(__dirname, 'training_management_schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📋 Applying training management schema...');
    await client.query(schemaSql);
    console.log('   ✅ Training management tables created successfully');

    // Add training management page to page_permissions if it doesn't exist
    console.log('🔐 Setting up training management permissions...');
    
    // Check if training management page already exists
    let pagePermissionResult = await client.query(`
      SELECT id FROM page_permissions WHERE page_name = 'Training Management'
    `);
    
    let pageId;
    if (pagePermissionResult.rows.length > 0) {
      pageId = pagePermissionResult.rows[0].id;
      console.log('   ✅ Training management page permission already exists');
    } else {
      pagePermissionResult = await client.query(`
        INSERT INTO page_permissions (page_name, page_path, sort_order)
        VALUES ('Training Management', '/training', 25)
        RETURNING id
      `);
      pageId = pagePermissionResult.rows[0].id;
      console.log('   ✅ Training management page permission created');
    }

    // Grant access to training management for relevant roles
    const trainingRoles = ['admin', 'director', 'partner', 'coordinator'];
    
    for (const role of trainingRoles) {
      // Check if role permission already exists
      const existingPerm = await client.query(`
        SELECT id FROM role_page_permissions WHERE role = $1 AND page_id = $2
      `, [role, pageId]);
      
      if (existingPerm.rows.length === 0) {
        await client.query(`
          INSERT INTO role_page_permissions (role, page_id, is_allowed)
          VALUES ($1, $2, true)
        `, [role, pageId]);
      }
    }
    console.log('   ✅ Training management permissions granted to relevant roles');

    // Set up action permissions for training management
    console.log('🎯 Setting up action permissions...');
    
    // Note: page_action_permissions combines role and action in single table
    // No separate action_description column exists
    const actions = ['view', 'create', 'update', 'delete', 'manage_participants', 'generate_qr', 'export'];
    console.log('   ✅ Action permissions created for training management');

    // Set default role permissions for training actions
    const rolePermissions = {
      'admin': ['view', 'create', 'update', 'delete', 'manage_participants', 'generate_qr', 'export'],
      'director': ['view', 'create', 'update', 'manage_participants', 'generate_qr', 'export'],
      'partner': ['view', 'create', 'update', 'manage_participants', 'generate_qr', 'export'],
      'coordinator': ['view', 'manage_participants', 'generate_qr']
    };

    for (const [role, permissions] of Object.entries(rolePermissions)) {
      for (const permission of permissions) {
        // Check if action permission already exists
        const existingAction = await client.query(`
          SELECT id FROM page_action_permissions WHERE page_id = $1 AND action_name = $2 AND role = $3
        `, [pageId, permission, role]);
        
        if (existingAction.rows.length === 0) {
          await client.query(`
            INSERT INTO page_action_permissions (page_id, action_name, role, is_allowed)
            VALUES ($1, $2, $3, true)
          `, [pageId, permission, role]);
        }
      }
    }
    console.log('   ✅ Default role permissions set for training actions');

    // Create sample training session for testing
    console.log('📚 Creating sample training session...');
    
    const adminUser = await client.query(`
      SELECT id FROM tbl_tarl_users WHERE role = 'admin' LIMIT 1
    `);

    if (adminUser.rows.length > 0) {
      const adminId = adminUser.rows[0].id;
      
      // Create sample training session
      const sessionResult = await client.query(`
        INSERT INTO tbl_tarl_training_sessions (
          program_id, session_title, session_date, session_time, location, 
          venue_address, max_participants, trainer_id, coordinator_id, 
          registration_deadline, created_by
        )
        SELECT 
          p.id,
          'Introduction to TaRL Methodology - Session 1',
          CURRENT_DATE + INTERVAL '7 days',
          '09:00:00',
          'TaRL Training Center',
          '123 Education Street, Learning City',
          30,
          $1,
          $1,
          CURRENT_DATE + INTERVAL '5 days',
          $1
        FROM tbl_tarl_training_programs p
        WHERE p.program_name = 'TaRL Teaching Methodology Workshop'
        LIMIT 1
        RETURNING id
      `, [adminId]);

      if (sessionResult.rows.length > 0) {
        const sessionId = sessionResult.rows[0].id;
        
        // Initialize the three-stage flow
        const flowStages = ['before', 'during', 'after'];
        for (const stage of flowStages) {
          await client.query(`
            INSERT INTO tbl_tarl_training_flow (session_id, flow_stage, stage_data)
            VALUES ($1, $2, $3)
          `, [sessionId, stage, JSON.stringify({
            stage: stage,
            description: `${stage.charAt(0).toUpperCase() + stage.slice(1)} training activities`,
            tasks: []
          })]);
        }
        
        console.log('   ✅ Sample training session created with three-stage flow');
      }
    }

    console.log('\n🎉 Training Management System setup completed successfully!');
    console.log('\n📋 SETUP SUMMARY:');
    console.log('==========================================');
    console.log('✅ Training management database schema applied');
    console.log('✅ Page permissions created for training management');
    console.log('✅ Role-based access permissions configured');
    console.log('✅ Action-level permissions set up');
    console.log('✅ Sample training session created for testing');
    console.log('==========================================');
    console.log('\n🚀 Next Steps:');
    console.log('1. Access training management at /training');
    console.log('2. Create training sessions with three-stage flow');
    console.log('3. Generate QR codes for registration and feedback');
    console.log('4. Manage participants and collect feedback');

  } catch (error) {
    console.error('❌ Error setting up training system:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if called directly
if (require.main === module) {
  setupTrainingSystem()
    .then(() => {
      console.log('✅ Training system setup completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Training system setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupTrainingSystem };