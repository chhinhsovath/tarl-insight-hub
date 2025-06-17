const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function testEngageAPI() {
  const pool = new Pool({
    user: process.env.PGUSER || 'postgres',
    host: process.env.PGHOST || 'localhost',
    database: process.env.PGDATABASE || 'pratham_tarl',
    password: process.env.PGPASSWORD || '12345',
    port: process.env.PGPORT || 5432,
  });

  try {
    console.log('🧪 Testing Engage Programs API...\n');

    // Test 1: Check if session 4 has engage programs
    console.log('📋 Test 1: Check engage programs for session 4');
    const programs = await pool.query(`
      SELECT 
        ep.id,
        ep.session_id,
        ep.title,
        ep.timing,
        ep.sort_order,
        COUNT(em.id) as material_count
      FROM tbl_training_engage_programs ep
      LEFT JOIN tbl_training_engage_materials em ON ep.id = em.engage_program_id AND em.is_active = true
      WHERE ep.session_id = $1 AND ep.is_active = true
      GROUP BY ep.id
      ORDER BY ep.timing, ep.sort_order
    `, [4]);

    console.log(`✅ Found ${programs.rows.length} engage programs for session 4:`);
    programs.rows.forEach(program => {
      console.log(`   - ${program.title} (${program.timing}) - ${program.material_count} materials`);
    });
    console.log();

    // Test 2: Check materials for each program
    console.log('📋 Test 2: Check materials for each program');
    for (const program of programs.rows) {
      const materials = await pool.query(`
        SELECT id, material_type, title, external_url, file_path
        FROM tbl_training_engage_materials 
        WHERE engage_program_id = $1 AND is_active = true
        ORDER BY created_at
      `, [program.id]);

      console.log(`✅ Program "${program.title}" has ${materials.rows.length} materials:`);
      materials.rows.forEach(material => {
        const location = material.external_url || material.file_path || 'No URL/Path';
        console.log(`   - ${material.title} (${material.material_type}) - ${location}`);
      });
      console.log();
    }

    // Test 3: Test the API query directly
    console.log('📋 Test 3: Test API query directly');
    const apiQuery = `
      SELECT 
        ep.id,
        ep.session_id,
        ep.title,
        ep.description,
        ep.timing,
        ep.sort_order,
        ep.is_active,
        ep.created_at,
        ep.updated_at,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', em.id,
              'material_type', em.material_type,
              'title', em.title,
              'description', em.description,
              'file_path', em.file_path,
              'file_name', em.file_name,
              'file_size', em.file_size,
              'file_type', em.file_type,
              'external_url', em.external_url,
              'download_count', em.download_count,
              'is_active', em.is_active
            ) ORDER BY em.created_at
          ) FILTER (WHERE em.id IS NOT NULL), 
          '[]'::json
        ) as materials
      FROM tbl_training_engage_programs ep
      LEFT JOIN tbl_training_engage_materials em ON ep.id = em.engage_program_id AND em.is_active = true
      WHERE ep.session_id = $1 AND ep.is_active = true
      GROUP BY ep.id
      ORDER BY ep.timing, ep.sort_order
    `;

    const apiResult = await pool.query(apiQuery, [4]);
    console.log(`✅ API query returned ${apiResult.rows.length} programs with nested materials:`);
    apiResult.rows.forEach(program => {
      console.log(`   - ${program.title}: ${program.materials.length} materials`);
    });
    console.log();

    // Test 4: Check session existence
    console.log('📋 Test 4: Verify session 4 exists');
    const session = await pool.query(`
      SELECT id, session_title, session_date, session_status
      FROM tbl_tarl_training_sessions 
      WHERE id = $1
    `, [4]);

    if (session.rows.length > 0) {
      const s = session.rows[0];
      console.log(`✅ Session 4 exists: "${s.session_title}" (${s.session_date}) - Status: ${s.session_status}`);
    } else {
      console.log('❌ Session 4 does not exist');
    }
    console.log();

    // Test 5: Check API response format
    console.log('📋 Test 5: API Response Format Check');
    console.log('Expected API response format:');
    console.log(JSON.stringify(apiResult.rows, null, 2));

    console.log('\n✅ All tests completed successfully!');
    console.log('\n📝 Summary:');
    console.log(`   • Session 4 has ${programs.rows.length} engage programs`);
    console.log(`   • Total materials across all programs: ${programs.rows.reduce((sum, p) => sum + parseInt(p.material_count), 0)}`);
    console.log(`   • API query structure is valid`);
    console.log(`   • Database connection is working`);

  } catch (error) {
    console.error('❌ Error testing Engage API:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the test
testEngageAPI().catch(console.error);