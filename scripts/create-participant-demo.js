const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432', 10),
});

async function createParticipantDemo() {
  const client = await pool.connect();
  
  try {
    console.log('Creating participant demo account...');
    
    // First, add participant role if it doesn't exist
    await client.query(`
      INSERT INTO tbl_tarl_roles (name, description, hierarchy_level, can_manage_hierarchy, max_hierarchy_depth) 
      VALUES ('participant', 'Training participant with access to own sessions and feedback', 4, false, 0)
      ON CONFLICT (name) DO NOTHING
    `);
    
    // Get the role ID
    const roleResult = await client.query(
      "SELECT id FROM tbl_tarl_roles WHERE name = 'participant'"
    );
    const roleId = roleResult.rows[0]?.id;
    
    if (!roleId) {
      throw new Error('Failed to create participant role');
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash('participant123', 10);
    
    // Create participant users
    const participants = [
      {
        username: 'participant1',
        email: 'participant1@tarl.edu.kh',
        full_name: 'Ms. Sophea Demo (Participant)',
        phone: '+855-12-345-678',
      },
      {
        username: 'participant2',
        email: 'participant2@tarl.edu.kh',
        full_name: 'Mr. Pisach Demo (Participant)',
        phone: '+855-12-345-679',
      }
    ];
    
    for (const participant of participants) {
      // Insert or update user
      await client.query(`
        INSERT INTO tbl_tarl_users (
          username, password, full_name, email, phone, role_id, role, is_active, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, 'participant', true, NOW(), NOW())
        ON CONFLICT (username) DO UPDATE SET
          password = EXCLUDED.password,
          full_name = EXCLUDED.full_name,
          email = EXCLUDED.email,
          phone = EXCLUDED.phone,
          role_id = EXCLUDED.role_id,
          role = EXCLUDED.role,
          updated_at = NOW()
      `, [
        participant.username,
        hashedPassword,
        participant.full_name,
        participant.email,
        participant.phone,
        roleId
      ]);
      
      console.log(`✅ Created participant: ${participant.username}`);
    }
    
    // Add participant access to training-related pages
    const trainingPages = [
      '/training',
      '/training/feedback'
    ];
    
    for (const pagePath of trainingPages) {
      // Get page ID
      const pageResult = await client.query(
        "SELECT id FROM page_permissions WHERE page_path = $1",
        [pagePath]
      );
      
      if (pageResult.rows.length > 0) {
        const pageId = pageResult.rows[0].id;
        
        // Add role page permission
        await client.query(`
          INSERT INTO role_page_permissions (role, page_id, is_allowed, created_at, updated_at)
          VALUES ('participant', $1, true, NOW(), NOW())
          ON CONFLICT (role, page_id) DO UPDATE SET
            is_allowed = true,
            updated_at = NOW()
        `, [pageId]);
        
        console.log(`✅ Added participant access to: ${pagePath}`);
      }
    }
    
    // Create sample training participant entries
    const sessionsResult = await client.query(
      "SELECT id FROM tbl_tarl_training_sessions LIMIT 2"
    );
    
    if (sessionsResult.rows.length > 0) {
      for (let i = 0; i < participants.length && i < sessionsResult.rows.length; i++) {
        const sessionId = sessionsResult.rows[i].id;
        const participant = participants[i];
        
        await client.query(`
          INSERT INTO tbl_tarl_training_participants (
            session_id, participant_name, participant_email, participant_phone,
            participant_role, school_name, district, province,
            registration_method, registration_status, attendance_confirmed,
            created_at, updated_at
          ) VALUES ($1, $2, $3, $4, 'Teacher', 'Demo School', 'Phnom Penh', 'Phnom Penh',
                   'admin', 'registered', true, NOW(), NOW())
          ON CONFLICT DO NOTHING
        `, [sessionId, participant.full_name, participant.email, participant.phone]);
      }
      
      console.log('✅ Added participant training registrations');
    }
    
    console.log('');
    console.log('🎉 Participant demo accounts created successfully!');
    console.log('');
    console.log('Demo participant accounts:');
    console.log('- Username: participant1, Password: participant123');
    console.log('- Username: participant2, Password: participant123');
    console.log('');
    console.log('These accounts have access to:');
    console.log('- Training portal dashboard');
    console.log('- Submit feedback for sessions they\'re registered in');
    console.log('- View training materials');
    console.log('- Track their training progress');
    
  } catch (error) {
    console.error('❌ Error creating participant demo:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

createParticipantDemo();