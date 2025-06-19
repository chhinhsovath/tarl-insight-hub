// Simple password hasher for participant demo accounts
const bcrypt = require('bcrypt');

async function hashPasswords() {
  console.log('Generating bcrypt hashes for participant accounts...');
  console.log('');
  
  try {
    const password = 'participant123';
    const saltRounds = 10;
    
    // Generate hash
    const hash = await bcrypt.hash(password, saltRounds);
    
    console.log('Password:', password);
    console.log('Bcrypt Hash:', hash);
    console.log('');
    console.log('SQL Update Commands:');
    console.log('');
    console.log(`UPDATE tbl_tarl_users SET password = '${hash}' WHERE username = 'participant1';`);
    console.log(`UPDATE tbl_tarl_users SET password = '${hash}' WHERE username = 'participant2';`);
    console.log('');
    console.log('Note: Run these SQL commands in your database to set the proper hashed passwords.');
    
  } catch (error) {
    console.error('Error generating hash:', error);
  }
}

hashPasswords();