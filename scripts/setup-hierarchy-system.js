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

async function setupHierarchySystem() {
  const client = await pool.connect();

  try {
    console.log('🚀 Setting up Hierarchy Permission System...');

    // 1. Create hierarchy tables manually
    console.log('📝 Creating hierarchy tables...');
    
    // Create core hierarchy assignment tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_school_assignments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        school_id INTEGER NOT NULL,
        assignment_type VARCHAR(50) NOT NULL DEFAULT 'direct',
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        assigned_by INTEGER,
        is_active BOOLEAN DEFAULT true,
        UNIQUE(user_id, school_id, assignment_type)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS user_district_assignments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        district_id INTEGER NOT NULL,
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        assigned_by INTEGER,
        is_active BOOLEAN DEFAULT true,
        UNIQUE(user_id, district_id)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS user_province_assignments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        province_id INTEGER NOT NULL,
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        assigned_by INTEGER,
        is_active BOOLEAN DEFAULT true,
        UNIQUE(user_id, province_id)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS user_zone_assignments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        zone_id INTEGER NOT NULL,
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        assigned_by INTEGER,
        is_active BOOLEAN DEFAULT true,
        UNIQUE(user_id, zone_id)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS tbl_tarl_classes (
        id SERIAL PRIMARY KEY,
        class_name VARCHAR(255) NOT NULL,
        class_level INTEGER,
        school_id INTEGER NOT NULL,
        teacher_id INTEGER,
        academic_year VARCHAR(20),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS tbl_tarl_students (
        id SERIAL PRIMARY KEY,
        student_id VARCHAR(100) UNIQUE,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        date_of_birth DATE,
        gender VARCHAR(10),
        class_id INTEGER,
        school_id INTEGER NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS teacher_class_assignments (
        id SERIAL PRIMARY KEY,
        teacher_id INTEGER NOT NULL,
        class_id INTEGER NOT NULL,
        subject VARCHAR(100),
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        assigned_by INTEGER,
        is_active BOOLEAN DEFAULT true,
        UNIQUE(teacher_id, class_id, subject)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS role_data_scope (
        id SERIAL PRIMARY KEY,
        role_name VARCHAR(100) NOT NULL,
        data_type VARCHAR(100) NOT NULL,
        scope_level VARCHAR(50) NOT NULL,
        can_view BOOLEAN DEFAULT false,
        can_create BOOLEAN DEFAULT false,
        can_update BOOLEAN DEFAULT false,
        can_delete BOOLEAN DEFAULT false,
        can_export BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ Hierarchy tables created successfully');

    // 2. Update role hierarchy levels
    console.log('👥 Updating role hierarchy levels...');
    
    // Add hierarchy columns to roles table if they don't exist
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'tbl_tarl_roles' AND column_name = 'hierarchy_level') THEN
          ALTER TABLE tbl_tarl_roles ADD COLUMN hierarchy_level INTEGER DEFAULT 0;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'tbl_tarl_roles' AND column_name = 'can_manage_hierarchy') THEN
          ALTER TABLE tbl_tarl_roles ADD COLUMN can_manage_hierarchy BOOLEAN DEFAULT false;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'tbl_tarl_roles' AND column_name = 'max_hierarchy_depth') THEN
          ALTER TABLE tbl_tarl_roles ADD COLUMN max_hierarchy_depth INTEGER DEFAULT 0;
        END IF;
      END $$;
    `);

    // Update role hierarchy settings
    const roleUpdates = [
      { role: 'admin', level: 1, can_manage: true, depth: 999 },
      { role: 'director', level: 2, can_manage: true, depth: 3 },
      { role: 'partner', level: 2, can_manage: true, depth: 3 },
      { role: 'teacher', level: 3, can_manage: false, depth: 1 },
      { role: 'collector', level: 3, can_manage: false, depth: 0 },
      { role: 'coordinator', level: 3, can_manage: false, depth: 1 },
      { role: 'intern', level: 4, can_manage: false, depth: 0 }
    ];

    for (const roleUpdate of roleUpdates) {
      await client.query(`
        UPDATE tbl_tarl_roles SET 
          hierarchy_level = $1, 
          can_manage_hierarchy = $2, 
          max_hierarchy_depth = $3 
        WHERE name = $4
      `, [roleUpdate.level, roleUpdate.can_manage, roleUpdate.depth, roleUpdate.role]);
      
      console.log(`   ✅ Updated ${roleUpdate.role} role hierarchy settings`);
    }

    // 3. Insert default scope permissions
    console.log('🔐 Setting up default data scope permissions...');
    
    // Clear existing scope permissions
    await client.query('DELETE FROM role_data_scope');

    const scopePermissions = [
      // Admin - Full access
      { role: 'admin', data_type: 'schools', scope_level: 'global', permissions: { view: true, create: true, update: true, delete: true, export: true } },
      { role: 'admin', data_type: 'users', scope_level: 'global', permissions: { view: true, create: true, update: true, delete: true, export: true } },
      { role: 'admin', data_type: 'students', scope_level: 'global', permissions: { view: true, create: true, update: true, delete: true, export: true } },
      { role: 'admin', data_type: 'observations', scope_level: 'global', permissions: { view: true, create: true, update: true, delete: true, export: true } },
      
      // Director - Regional management
      { role: 'director', data_type: 'schools', scope_level: 'zone', permissions: { view: true, create: true, update: true, delete: false, export: true } },
      { role: 'director', data_type: 'schools', scope_level: 'province', permissions: { view: true, create: true, update: true, delete: false, export: true } },
      { role: 'director', data_type: 'schools', scope_level: 'district', permissions: { view: true, create: true, update: true, delete: false, export: true } },
      { role: 'director', data_type: 'users', scope_level: 'zone', permissions: { view: true, create: true, update: true, delete: false, export: true } },
      { role: 'director', data_type: 'users', scope_level: 'province', permissions: { view: true, create: true, update: true, delete: false, export: true } },
      { role: 'director', data_type: 'users', scope_level: 'district', permissions: { view: true, create: true, update: true, delete: false, export: true } },
      { role: 'director', data_type: 'students', scope_level: 'zone', permissions: { view: true, create: false, update: true, delete: false, export: true } },
      { role: 'director', data_type: 'students', scope_level: 'province', permissions: { view: true, create: false, update: true, delete: false, export: true } },
      { role: 'director', data_type: 'students', scope_level: 'district', permissions: { view: true, create: false, update: true, delete: false, export: true } },
      
      // Partner - Similar to Director
      { role: 'partner', data_type: 'schools', scope_level: 'zone', permissions: { view: true, create: true, update: true, delete: false, export: true } },
      { role: 'partner', data_type: 'schools', scope_level: 'province', permissions: { view: true, create: true, update: true, delete: false, export: true } },
      { role: 'partner', data_type: 'schools', scope_level: 'district', permissions: { view: true, create: true, update: true, delete: false, export: true } },
      { role: 'partner', data_type: 'users', scope_level: 'zone', permissions: { view: true, create: true, update: true, delete: false, export: true } },
      { role: 'partner', data_type: 'users', scope_level: 'province', permissions: { view: true, create: true, update: true, delete: false, export: true } },
      { role: 'partner', data_type: 'users', scope_level: 'district', permissions: { view: true, create: true, update: true, delete: false, export: true } },
      
      // Teacher - Class level
      { role: 'teacher', data_type: 'students', scope_level: 'class', permissions: { view: true, create: true, update: true, delete: false, export: true } },
      { role: 'teacher', data_type: 'observations', scope_level: 'class', permissions: { view: true, create: true, update: true, delete: false, export: false } },
      { role: 'teacher', data_type: 'users', scope_level: 'self', permissions: { view: true, create: false, update: true, delete: false, export: false } },
      
      // Collector - Data collection focus
      { role: 'collector', data_type: 'observations', scope_level: 'school', permissions: { view: true, create: true, update: true, delete: false, export: true } },
      { role: 'collector', data_type: 'visits', scope_level: 'school', permissions: { view: true, create: true, update: true, delete: false, export: true } },
      { role: 'collector', data_type: 'learning_data', scope_level: 'school', permissions: { view: true, create: true, update: true, delete: false, export: true } },
      { role: 'collector', data_type: 'schools', scope_level: 'school', permissions: { view: true, create: false, update: false, delete: false, export: false } },
      { role: 'collector', data_type: 'users', scope_level: 'self', permissions: { view: true, create: false, update: true, delete: false, export: false } },
      
      // Coordinator - Similar to Teacher but broader scope
      { role: 'coordinator', data_type: 'students', scope_level: 'school', permissions: { view: true, create: true, update: true, delete: false, export: true } },
      { role: 'coordinator', data_type: 'observations', scope_level: 'school', permissions: { view: true, create: true, update: true, delete: false, export: true } },
      { role: 'coordinator', data_type: 'users', scope_level: 'self', permissions: { view: true, create: false, update: true, delete: false, export: false } },
      
      // Intern - Limited access
      { role: 'intern', data_type: 'observations', scope_level: 'school', permissions: { view: true, create: false, update: false, delete: false, export: false } },
      { role: 'intern', data_type: 'users', scope_level: 'self', permissions: { view: true, create: false, update: true, delete: false, export: false } }
    ];

    for (const perm of scopePermissions) {
      await client.query(`
        INSERT INTO role_data_scope (role_name, data_type, scope_level, can_view, can_create, can_update, can_delete, can_export)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT DO NOTHING
      `, [
        perm.role, 
        perm.data_type, 
        perm.scope_level, 
        perm.permissions.view,
        perm.permissions.create,
        perm.permissions.update,
        perm.permissions.delete,
        perm.permissions.export
      ]);
    }

    console.log('   ✅ Default scope permissions configured');

    // 4. Create demo assignments for testing
    console.log('🧪 Creating demo hierarchy assignments...');
    
    // Check if we have any users to work with
    const usersResult = await client.query(`
      SELECT u.id, u.username, r.name as role 
      FROM tbl_tarl_users u
      JOIN tbl_tarl_roles r ON u.role_id = r.id
      WHERE r.name IN ('director', 'partner', 'teacher') 
      LIMIT 5
    `);

    if (usersResult.rows.length > 0) {
      console.log(`   Found ${usersResult.rows.length} users for demo assignments`);
      
      // Sample assignments (you may want to customize these)
      for (const user of usersResult.rows.slice(0, 2)) {
        if (user.role === 'director' || user.role === 'partner') {
          // Assign to first province/district
          const provinceResult = await client.query('SELECT "prvAutoID" FROM tbl_tarl_province LIMIT 1');
          if (provinceResult.rows.length > 0) {
            await client.query(`
              INSERT INTO user_province_assignments (user_id, province_id, assigned_by)
              VALUES ($1, $2, 1)
              ON CONFLICT (user_id, province_id) DO NOTHING
            `, [user.id, provinceResult.rows[0].prvAutoID]);
            
            console.log(`   ✅ Assigned ${user.username} (${user.role}) to province`);
          }
        }
      }
    } else {
      console.log('   ⚠️  No suitable users found for demo assignments');
    }

    // 5. Create indexes for performance
    console.log('📊 Creating performance indexes...');
    
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_user_school_assignments_user_id ON user_school_assignments(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_user_province_assignments_user_id ON user_province_assignments(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_user_district_assignments_user_id ON user_district_assignments(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_role_data_scope_role_data ON role_data_scope(role_name, data_type)'
    ];

    for (const indexQuery of indexes) {
      try {
        await client.query(indexQuery);
      } catch (error) {
        console.log(`   ⚠️  Index creation warning: ${error.message}`);
      }
    }

    console.log('   ✅ Performance indexes created');

    console.log('\n🎉 Hierarchy Permission System setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Use the Hierarchy Assignment Manager component to assign users to regions');
    console.log('   2. Test role-based data filtering in the application');
    console.log('   3. Configure additional scope permissions as needed');
    console.log('   4. Review and adjust hierarchy assignments based on your organization structure');

  } catch (error) {
    console.error('❌ Error setting up hierarchy system:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if called directly
if (require.main === module) {
  setupHierarchySystem()
    .then(() => {
      console.log('✅ Setup completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupHierarchySystem };