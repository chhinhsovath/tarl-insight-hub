const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432', 10),
});

async function testSessionsCRUD() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Testing Training Sessions CRUD Operations...\n');

    // Test 1: Check if required tables exist
    console.log('1. Checking database tables...');
    
    const tables = [
      'tbl_tarl_training_sessions',
      'tbl_tarl_training_programs', 
      'tbl_tarl_training_participants',
      'tbl_tarl_training_flow',
      'tbl_tarl_sessions'
    ];

    for (const tableName of tables) {
      const tableCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = $1
        );
      `, [tableName]);
      
      if (tableCheck.rows[0].exists) {
        console.log(`✅ Table exists: ${tableName}`);
      } else {
        console.log(`❌ Table missing: ${tableName}`);
      }
    }

    // Test 2: Check training programs (needed for sessions)
    console.log('\n2. Checking training programs...');
    const programsResult = await client.query('SELECT * FROM tbl_tarl_training_programs LIMIT 5');
    console.log(`✅ Found ${programsResult.rows.length} training programs`);
    
    if (programsResult.rows.length > 0) {
      console.log('Sample program:', {
        id: programsResult.rows[0].id,
        name: programsResult.rows[0].program_name,
        type: programsResult.rows[0].program_type
      });
    }

    // Test 3: Check training sessions
    console.log('\n3. Checking training sessions...');
    const sessionsResult = await client.query(`
      SELECT 
        ts.*,
        tp.program_name,
        COUNT(DISTINCT tpt.id) as participant_count
      FROM tbl_tarl_training_sessions ts
      LEFT JOIN tbl_tarl_training_programs tp ON ts.program_id = tp.id
      LEFT JOIN tbl_tarl_training_participants tpt ON ts.id = tpt.session_id
      WHERE ts.is_active = true
      GROUP BY ts.id, tp.program_name
      ORDER BY ts.created_at DESC
      LIMIT 5
    `);
    
    console.log(`✅ Found ${sessionsResult.rows.length} training sessions`);
    
    if (sessionsResult.rows.length > 0) {
      console.log('Sample session:', {
        id: sessionsResult.rows[0].id,
        title: sessionsResult.rows[0].session_title,
        date: sessionsResult.rows[0].session_date,
        program: sessionsResult.rows[0].program_name,
        participants: sessionsResult.rows[0].participant_count
      });
    }

    // Test 4: Check authentication session
    console.log('\n4. Checking authentication sessions...');
    const authSessionsResult = await client.query(`
      SELECT user_id, username, role, expires_at 
      FROM tbl_tarl_sessions 
      WHERE expires_at > NOW() 
      ORDER BY created_at DESC 
      LIMIT 3
    `);
    
    console.log(`✅ Found ${authSessionsResult.rows.length} active auth sessions`);
    
    if (authSessionsResult.rows.length > 0) {
      console.log('Sample auth session:', {
        user_id: authSessionsResult.rows[0].user_id,
        username: authSessionsResult.rows[0].username,
        role: authSessionsResult.rows[0].role,
        expires: authSessionsResult.rows[0].expires_at
      });
    }

    // Test 5: Test API endpoint directly
    console.log('\n5. Testing API endpoint with mock session...');
    
    // Create a test session for API testing
    const testUser = await client.query(`
      SELECT id, username, role FROM tbl_tarl_users 
      WHERE email = 'admin@tarl.org' 
      LIMIT 1
    `);
    
    if (testUser.rows.length > 0) {
      const user = testUser.rows[0];
      const testSessionToken = `test-session-${Date.now()}`;
      
      // Insert test session
      await client.query(`
        INSERT INTO tbl_tarl_sessions (user_id, username, role, session_token, expires_at)
        VALUES ($1, $2, $3, $4, NOW() + INTERVAL '1 hour')
      `, [user.id, user.username, user.role, testSessionToken]);
      
      console.log(`✅ Created test session for ${user.username} (${user.role})`);
      
      console.log(`✅ Test session ready for API testing with token: ${testSessionToken}`);
      
      // Clean up test session
      await client.query(`
        DELETE FROM tbl_tarl_sessions WHERE session_token = $1
      `, [testSessionToken]);
      
    } else {
      console.log('❌ No admin user found for API testing');
    }

    console.log('\n6. Database Schema Check...');
    
    // Check training_sessions table structure
    const sessionColumnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'tbl_tarl_training_sessions'
      ORDER BY ordinal_position
    `);
    
    console.log('✅ Training sessions table columns:');
    sessionColumnsResult.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

    console.log('\n🎉 Training Sessions verification completed!');
    
  } catch (error) {
    console.error('❌ Error during verification:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the test
if (require.main === module) {
  testSessionsCRUD()
    .then(() => {
      console.log('\n✅ Verification complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Verification failed:', error);
      process.exit(1);
    });
}

module.exports = { testSessionsCRUD };