const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// Digital Ocean PostgreSQL configuration
const pool = new Pool({
  user: 'postgres',
  host: '137.184.109.21',
  database: 'tarl_ptom',
  password: 'P@ssw0rd',
  port: 5432,
});

async function resetTestPasswords() {
  const client = await pool.connect();
  
  try {
    console.log('Resetting passwords for test users...\n');
    
    // Define test users and their passwords
    const testUsers = [
      { username: 'admin', password: 'admin123' },
      { username: 'teacher1', password: 'teacher123' },
      { username: 'demo', password: 'demo123' },
      { username: 'coordinator1', password: 'coord123' },
      { username: 'collector1', password: 'collector123' }
    ];
    
    for (const user of testUsers) {
      // Hash the password
      const hashedPassword = await bcrypt.hash(user.password, 10);
      
      // Update the user's password
      const result = await client.query(
        'UPDATE tbl_tarl_users SET password = $1 WHERE username = $2',
        [hashedPassword, user.username]
      );
      
      if (result.rowCount > 0) {
        console.log(`✅ Reset password for ${user.username}`);
      } else {
        console.log(`❌ User ${user.username} not found`);
      }
    }
    
    console.log('\n✅ Password reset complete!');
    console.log('\nYou can now login with these credentials:');
    console.log('- admin / admin123');
    console.log('- teacher1 / teacher123');
    console.log('- demo / demo123');
    console.log('- coordinator1 / coord123');
    console.log('- collector1 / collector123');
    
  } catch (error) {
    console.error('Error resetting passwords:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

resetTestPasswords();