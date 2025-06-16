const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432', 10),
});

async function debugDeleteError() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Debugging DELETE API 500 Error...\n');

    // 1. Check if required tables exist
    console.log('1️⃣ Checking required tables...');
    
    const tables = [
      'tbl_tarl_training_sessions',
      'tbl_tarl_training_participants', 
      'tbl_tarl_training_flow',
      'tbl_tarl_qr_codes'
    ];

    for (const table of tables) {
      try {
        const result = await client.query(`
          SELECT table_name FROM information_schema.tables 
          WHERE table_name = $1 AND table_schema = 'public'
        `, [table]);
        
        if (result.rows.length > 0) {
          console.log(`✅ Table ${table} exists`);
        } else {
          console.log(`❌ Table ${table} NOT FOUND`);
        }
      } catch (error) {
        console.log(`❌ Error checking table ${table}:`, error.message);
      }
    }

    // 2. Check if session 7 exists
    console.log('\n2️⃣ Checking session 7 existence...');
    try {
      const sessionResult = await client.query(`
        SELECT id, session_title, session_status, is_active 
        FROM tbl_tarl_training_sessions 
        WHERE id = 7
      `);
      
      if (sessionResult.rows.length > 0) {
        const session = sessionResult.rows[0];
        console.log(`✅ Session 7 found: "${session.session_title}"`);
        console.log(`   Status: ${session.session_status}`);
        console.log(`   Active: ${session.is_active}`);
      } else {
        console.log('❌ Session 7 not found');
      }
    } catch (error) {
      console.log('❌ Error checking session 7:', error.message);
    }

    // 3. Check participant count for session 7
    console.log('\n3️⃣ Checking participants for session 7...');
    try {
      const participantResult = await client.query(`
        SELECT COUNT(*) as participant_count 
        FROM tbl_tarl_training_participants 
        WHERE session_id = 7
      `);
      
      const count = participantResult.rows[0].participant_count;
      console.log(`✅ Session 7 has ${count} participants`);
    } catch (error) {
      console.log('❌ Error checking participants:', error.message);
    }

    // 4. Test the DELETE query components individually
    console.log('\n4️⃣ Testing DELETE query components...');
    
    try {
      // Test session existence check
      await client.query(`
        SELECT id, session_title, session_status FROM tbl_tarl_training_sessions 
        WHERE id = $1 AND is_active = true
      `, [7]);
      console.log('✅ Session existence query works');
    } catch (error) {
      console.log('❌ Session existence query failed:', error.message);
    }

    try {
      // Test participant count check
      await client.query(`
        SELECT COUNT(*) as participant_count FROM tbl_tarl_training_participants 
        WHERE session_id = $1
      `, [7]);
      console.log('✅ Participant count query works');
    } catch (error) {
      console.log('❌ Participant count query failed:', error.message);
    }

    // 5. Test database column existence
    console.log('\n5️⃣ Checking table columns...');
    try {
      const columnsResult = await client.query(`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'tbl_tarl_training_sessions'
        AND column_name IN ('id', 'session_title', 'session_status', 'is_active', 'updated_at')
      `);
      
      const columns = columnsResult.rows.map(r => r.column_name);
      console.log('✅ Required columns found:', columns.join(', '));
      
      const requiredColumns = ['id', 'session_title', 'session_status', 'is_active'];
      const missingColumns = requiredColumns.filter(col => !columns.includes(col));
      
      if (missingColumns.length > 0) {
        console.log('❌ Missing columns:', missingColumns.join(', '));
      }
    } catch (error) {
      console.log('❌ Error checking columns:', error.message);
    }

    // 6. Test UPDATE query
    console.log('\n6️⃣ Testing UPDATE query (dry run)...');
    try {
      await client.query('BEGIN');
      
      const updateResult = await client.query(`
        UPDATE tbl_tarl_training_sessions 
        SET is_active = is_active, updated_at = NOW()
        WHERE id = $1
        RETURNING id, session_title
      `, [7]);
      
      if (updateResult.rows.length > 0) {
        console.log('✅ UPDATE query syntax is valid');
        console.log(`   Would update: ${updateResult.rows[0].session_title}`);
      } else {
        console.log('❌ UPDATE query returned no rows');
      }
      
      await client.query('ROLLBACK');
    } catch (error) {
      console.log('❌ UPDATE query failed:', error.message);
      await client.query('ROLLBACK');
    }

    console.log('\n💡 Debugging Tips:');
    console.log('• Check server console for detailed error messages');
    console.log('• Verify database connection and permissions');
    console.log('• Ensure all required tables and columns exist');
    console.log('• Test with a different session ID if session 7 doesn\'t exist');

  } catch (error) {
    console.error('❌ Debug script failed:', error);
  } finally {
    client.release();
    pool.end();
  }
}

// Run the debug
debugDeleteError();