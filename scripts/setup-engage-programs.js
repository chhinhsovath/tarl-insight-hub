const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function setupEngagePrograms() {
  const pool = new Pool({
    user: process.env.PGUSER || 'postgres',
    host: process.env.PGHOST || 'localhost',
    database: process.env.PGDATABASE || 'pratham_tarl',
    password: process.env.PGPASSWORD || '12345',
    port: process.env.PGPORT || 5432,
  });

  try {
    console.log('Setting up Engage Programs schema...');

    // Create engage programs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tbl_training_engage_programs (
        id SERIAL PRIMARY KEY,
        session_id INT NOT NULL REFERENCES tbl_tarl_training_sessions(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        timing VARCHAR(20) NOT NULL CHECK (timing IN ('before', 'during', 'after')),
        sort_order INT DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_by INT REFERENCES tbl_tarl_users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Created tbl_training_engage_programs table');

    // Create engage materials table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tbl_training_engage_materials (
        id SERIAL PRIMARY KEY,
        engage_program_id INT NOT NULL REFERENCES tbl_training_engage_programs(id) ON DELETE CASCADE,
        material_type VARCHAR(20) NOT NULL CHECK (material_type IN ('document', 'link')),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        file_path VARCHAR(500),
        file_name VARCHAR(255),
        file_size BIGINT,
        file_type VARCHAR(100),
        external_url TEXT,
        download_count INT DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_by INT REFERENCES tbl_tarl_users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Created tbl_training_engage_materials table');

    // Create material downloads tracking table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tbl_training_material_downloads (
        id SERIAL PRIMARY KEY,
        material_id INT NOT NULL REFERENCES tbl_training_engage_materials(id) ON DELETE CASCADE,
        participant_id INT REFERENCES tbl_tarl_training_participants(id),
        ip_address VARCHAR(45),
        user_agent TEXT,
        downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Created tbl_training_material_downloads table');

    // Create indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_engage_programs_session ON tbl_training_engage_programs(session_id);
      CREATE INDEX IF NOT EXISTS idx_engage_programs_timing ON tbl_training_engage_programs(timing);
      CREATE INDEX IF NOT EXISTS idx_engage_materials_program ON tbl_training_engage_materials(engage_program_id);
      CREATE INDEX IF NOT EXISTS idx_material_downloads_material ON tbl_training_material_downloads(material_id);
      CREATE INDEX IF NOT EXISTS idx_material_downloads_participant ON tbl_training_material_downloads(participant_id);
    `);
    console.log('✓ Created indexes');

    // Check if we need to add sample data
    const existingPrograms = await pool.query('SELECT COUNT(*) FROM tbl_training_engage_programs');
    
    if (existingPrograms.rows[0].count === '0') {
      console.log('Adding sample engage programs...');
      
      // Get existing sessions
      const sessions = await pool.query('SELECT id FROM tbl_tarl_training_sessions LIMIT 10');
      
      for (const session of sessions.rows) {
        // Add 3 engage programs per session (before, during, after)
        const programs = [
          {
            title: 'Pre-Training Materials',
            description: 'Materials to review before the training session',
            timing: 'before',
            sort_order: 1
          },
          {
            title: 'Training Resources',
            description: 'Resources available during the training',
            timing: 'during',
            sort_order: 2
          },
          {
            title: 'Post-Training Resources',
            description: 'Additional materials for after the training',
            timing: 'after',
            sort_order: 3
          }
        ];

        for (const program of programs) {
          const result = await pool.query(`
            INSERT INTO tbl_training_engage_programs (session_id, title, description, timing, sort_order, created_by)
            VALUES ($1, $2, $3, $4, $5, 1)
            RETURNING id
          `, [session.id, program.title, program.description, program.timing, program.sort_order]);

          // Add sample materials
          const materials = [
            {
              type: 'link',
              title: program.timing === 'before' ? 'Pre-reading: TaRL Methodology Guide' : 
                     program.timing === 'during' ? 'Interactive Training Slides' : 
                     'Additional Resources and Best Practices',
              description: program.timing === 'before' ? 'Essential reading to prepare for the training session' :
                          program.timing === 'during' ? 'Presentation slides used during the training' :
                          'Supplementary materials for further learning',
              url: program.timing === 'before' ? 'https://example.com/tarl-methodology-guide.pdf' :
                   program.timing === 'during' ? 'https://example.com/training-slides.pptx' :
                   'https://example.com/best-practices.pdf'
            },
            {
              type: 'link',
              title: program.timing === 'before' ? 'Video: Introduction to TaRL' : 
                     program.timing === 'during' ? 'Workshop Handouts' : 
                     'Follow-up Activities Template',
              description: program.timing === 'before' ? 'Watch this video before attending the session' :
                          program.timing === 'during' ? 'Printable handouts for workshop activities' :
                          'Templates for implementing TaRL in your classroom',
              url: program.timing === 'before' ? 'https://youtube.com/watch?v=example' :
                   program.timing === 'during' ? 'https://example.com/handouts.pdf' :
                   'https://example.com/activity-templates.docx'
            }
          ];

          for (const material of materials) {
            await pool.query(`
              INSERT INTO tbl_training_engage_materials (
                engage_program_id, material_type, title, description, external_url, created_by
              ) VALUES ($1, $2, $3, $4, $5, 1)
            `, [result.rows[0].id, material.type, material.title, material.description, material.url]);
          }
        }
      }
      
      console.log('✓ Added sample engage programs and materials');
    }

    // Grant permissions
    await pool.query(`
      GRANT SELECT, INSERT, UPDATE, DELETE ON tbl_training_engage_programs TO postgres;
      GRANT SELECT, INSERT, UPDATE, DELETE ON tbl_training_engage_materials TO postgres;
      GRANT SELECT, INSERT, UPDATE, DELETE ON tbl_training_material_downloads TO postgres;
      GRANT USAGE, SELECT ON SEQUENCE tbl_training_engage_programs_id_seq TO postgres;
      GRANT USAGE, SELECT ON SEQUENCE tbl_training_engage_materials_id_seq TO postgres;
      GRANT USAGE, SELECT ON SEQUENCE tbl_training_material_downloads_id_seq TO postgres;
    `);
    console.log('✓ Granted permissions');

    console.log('\n✅ Engage Programs setup completed successfully!');

  } catch (error) {
    console.error('❌ Error setting up engage programs:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the setup
setupEngagePrograms().catch(console.error);