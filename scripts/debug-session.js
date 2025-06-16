const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.PGUSER || 'postgres',
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDATABASE || 'pratham_tarl',
  password: process.env.PGPASSWORD || '12345',
  port: parseInt(process.env.PGPORT || '5432', 10),
});

async function debugSession() {
  const client = await pool.connect();
  try {
    // Check current sessions
    const sessions = await client.query(`
      SELECT session_token, user_id, username, role, expires_at, 
             (expires_at > NOW()) as is_valid,
             (NOW() - created_at) as age
      FROM tbl_tarl_sessions 
      ORDER BY created_at DESC
    `);
    
    console.log('Current sessions:');
    sessions.rows.forEach(session => {
      console.log(`- Token: ${session.session_token}`);
      console.log(`  User: ${session.username} (${session.role})`);
      console.log(`  Valid: ${session.is_valid}`);
      console.log(`  Expires: ${session.expires_at}`);
      console.log(`  Age: ${session.age}`);
      console.log('');
    });

    // Test a specific session
    const testToken = 'test-manual-1750060950970';
    const testResult = await client.query(`
      SELECT user_id, username, role, expires_at > NOW() as is_valid
      FROM tbl_tarl_sessions 
      WHERE session_token = $1 AND expires_at > NOW()
    `, [testToken]);
    
    console.log(`Testing token: ${testToken}`);
    if (testResult.rows.length > 0) {
      console.log('✅ Session found and valid:', testResult.rows[0]);
    } else {
      console.log('❌ Session not found or expired');
      
      // Check if it exists but is expired
      const expiredCheck = await client.query(`
        SELECT user_id, username, role, expires_at, expires_at > NOW() as is_valid
        FROM tbl_tarl_sessions 
        WHERE session_token = $1
      `, [testToken]);
      
      if (expiredCheck.rows.length > 0) {
        console.log('Found expired session:', expiredCheck.rows[0]);
      } else {
        console.log('Session does not exist at all');
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    process.exit(0);
  }
}

debugSession();