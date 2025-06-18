const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432', 10),
});

async function getSampleParticipants() {
  try {
    const client = await pool.connect();
    
    const query = `
      SELECT DISTINCT 
        participant_name, 
        participant_phone,
        COUNT(*) as registration_count,
        COUNT(CASE WHEN attendance_status = 'attended' THEN 1 END) as attended_count
      FROM tbl_tarl_training_registrations 
      WHERE is_active = true 
        AND participant_name IS NOT NULL 
        AND participant_phone IS NOT NULL
        AND TRIM(participant_name) != ''
        AND TRIM(participant_phone) != ''
      GROUP BY participant_name, participant_phone
      ORDER BY registration_count DESC
      LIMIT 5
    `;
    
    const result = await client.query(query);
    
    console.log('\n=== SAMPLE PARTICIPANT LOGIN CREDENTIALS ===');
    console.log('Use any of these name/phone combinations to login:\n');
    
    result.rows.forEach((row, index) => {
      console.log(`${index + 1}. Name: "${row.participant_name}"`);
      console.log(`   Phone: "${row.participant_phone}"`);
      console.log(`   Registrations: ${row.registration_count}`);
      console.log(`   Attended: ${row.attended_count}`);
      console.log('');
    });
    
    if (result.rows.length === 0) {
      console.log('❌ No participant records found!');
      console.log('You need to have training registrations in your database first.');
      console.log('Please run some training sessions and register participants.');
    } else {
      console.log('✅ Copy any name and phone exactly as shown above');
      console.log('✅ Go to http://localhost:3001/participant');
      console.log('✅ Enter the name and phone to login');
    }
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

getSampleParticipants();