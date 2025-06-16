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

async function createPrototypeUsers() {
  const client = await pool.connect();

  try {
    console.log('🎭 Creating Prototype Users for Testing...');

    // Define prototype users for each role
    const prototypeUsers = [
      // Admin users
      {
        username: 'demo_admin',
        password: 'admin123',
        full_name: 'Demo Administrator',
        email: 'admin@tarl-demo.com',
        role: 'admin',
        role_id: 1,
        phone: '+1-555-0001'
      },

      // Director users
      {
        username: 'demo_director1',
        password: 'director123',
        full_name: 'John Director',
        email: 'director1@tarl-demo.com',
        role: 'director',
        role_id: 6,
        phone: '+1-555-0002',
        school_id: 3664
      },
      {
        username: 'demo_director2',
        password: 'director123',
        full_name: 'Sarah Regional',
        email: 'director2@tarl-demo.com',
        role: 'director',
        role_id: 6,
        phone: '+1-555-0003',
        school_id: 3665
      },

      // Partner users
      {
        username: 'demo_partner1',
        password: 'partner123',
        full_name: 'Mike Partner',
        email: 'partner1@tarl-demo.com',
        role: 'partner',
        role_id: 5,
        phone: '+1-555-0004',
        school_id: 3666
      },

      // Teacher users
      {
        username: 'demo_teacher1',
        password: 'teacher123',
        full_name: 'Mary Teacher',
        email: 'teacher1@tarl-demo.com',
        role: 'teacher',
        role_id: 3,
        phone: '+1-555-0005',
        school_id: 3664
      },
      {
        username: 'demo_teacher2',
        password: 'teacher123',
        full_name: 'David Educator',
        email: 'teacher2@tarl-demo.com',
        role: 'teacher',
        role_id: 3,
        phone: '+1-555-0006',
        school_id: 3665
      },

      // Coordinator users
      {
        username: 'demo_coordinator1',
        password: 'coord123',
        full_name: 'Lisa Coordinator',
        email: 'coordinator1@tarl-demo.com',
        role: 'coordinator',
        role_id: 4,
        phone: '+1-555-0007',
        school_id: 3664
      },

      // Collector users
      {
        username: 'demo_collector1',
        password: 'collector123',
        full_name: 'Tom Collector',
        email: 'collector1@tarl-demo.com',
        role: 'collector',
        role_id: 2,
        phone: '+1-555-0008',
        school_id: 3667
      },

      // Intern users
      {
        username: 'demo_intern1',
        password: 'intern123',
        full_name: 'Emma Intern',
        email: 'intern1@tarl-demo.com',
        role: 'intern',
        role_id: 7,
        phone: '+1-555-0009',
        school_id: 3669
      }
    ];

    console.log('📝 Creating users...');

    for (const user of prototypeUsers) {
      try {
        // Check if user already exists
        const existingUser = await client.query(
          'SELECT username FROM tbl_tarl_users WHERE username = $1 OR email = $2',
          [user.username, user.email]
        );

        if (existingUser.rows.length > 0) {
          console.log(`   ⚠️  User ${user.username} already exists, skipping...`);
          continue;
        }

        // Create user
        const result = await client.query(`
          INSERT INTO tbl_tarl_users (
            username, password, full_name, email, role, role_id, 
            phone, school_id, is_active, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, NOW(), NOW())
          RETURNING id, username, role
        `, [
          user.username,
          user.password, // In production, this should be hashed
          user.full_name,
          user.email,
          user.role,
          user.role_id,
          user.phone || null,
          user.school_id || null
        ]);

        console.log(`   ✅ Created ${user.role}: ${user.username} (${user.full_name})`);
      } catch (error) {
        console.error(`   ❌ Failed to create ${user.username}:`, error.message);
      }
    }

    // Create some hierarchy assignments for testing
    console.log('\n🏗️  Setting up hierarchy assignments...');

    // Assign directors to provinces/districts
    try {
      // Get some sample province/district data
      const provinces = await client.query('SELECT "prvAutoID" FROM tbl_tarl_province LIMIT 2');
      const districts = await client.query('SELECT id FROM tbl_tarl_district LIMIT 2');

      if (provinces.rows.length > 0) {
        // Assign demo_director1 to first province
        await client.query(`
          INSERT INTO user_province_assignments (user_id, province_id, assigned_by, is_active)
          SELECT 
            (SELECT id FROM tbl_tarl_users WHERE username = 'demo_director1'),
            $1,
            (SELECT id FROM tbl_tarl_users WHERE username = 'demo_admin' LIMIT 1),
            true
          ON CONFLICT (user_id, province_id) DO NOTHING
        `, [provinces.rows[0].prvAutoID]);

        console.log('   ✅ Assigned demo_director1 to province');
      }

      if (districts.rows.length > 0) {
        // Assign demo_director2 to first district
        await client.query(`
          INSERT INTO user_district_assignments (user_id, district_id, assigned_by, is_active)
          SELECT 
            (SELECT id FROM tbl_tarl_users WHERE username = 'demo_director2'),
            $1,
            (SELECT id FROM tbl_tarl_users WHERE username = 'demo_admin' LIMIT 1),
            true
          ON CONFLICT (user_id, district_id) DO NOTHING
        `, [districts.rows[0].id]);

        console.log('   ✅ Assigned demo_director2 to district');
      }

      // Assign schools to users
      const schoolAssignments = [
        { username: 'demo_partner1', school_id: 3666 },
        { username: 'demo_teacher1', school_id: 3664 },
        { username: 'demo_teacher2', school_id: 3665 }
      ];

      for (const assignment of schoolAssignments) {
        await client.query(`
          INSERT INTO user_school_assignments (user_id, school_id, assignment_type, assigned_by, is_active)
          SELECT 
            (SELECT id FROM tbl_tarl_users WHERE username = $1),
            $2,
            'direct',
            (SELECT id FROM tbl_tarl_users WHERE username = 'demo_admin' LIMIT 1),
            true
          ON CONFLICT (user_id, school_id, assignment_type) DO NOTHING
        `, [assignment.username, assignment.school_id]);

        console.log(`   ✅ Assigned ${assignment.username} to school ${assignment.school_id}`);
      }

    } catch (error) {
      console.warn('   ⚠️  Some hierarchy assignments may have failed:', error.message);
    }

    console.log('\n🎉 Prototype users created successfully!');
    console.log('\n📋 LOGIN CREDENTIALS:');
    console.log('==========================================');
    
    prototypeUsers.forEach(user => {
      console.log(`${user.role.toUpperCase().padEnd(12)} | ${user.username.padEnd(20)} | ${user.password}`);
    });

    console.log('==========================================');
    console.log('\n🚀 You can now test the hierarchical workflow:');
    console.log('1. Login as demo_admin to create directors and manage the system');
    console.log('2. Login as demo_director1 to create teachers in assigned regions');
    console.log('3. Login as demo_teacher1 to create classes and add students');
    console.log('4. Use /management/hierarchical to access the management interface');

  } catch (error) {
    console.error('❌ Error creating prototype users:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if called directly
if (require.main === module) {
  createPrototypeUsers()
    .then(() => {
      console.log('✅ Prototype user creation completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Prototype user creation failed:', error);
      process.exit(1);
    });
}

module.exports = { createPrototypeUsers };