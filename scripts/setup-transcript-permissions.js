const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

// Load environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value && !process.env[key]) {
      process.env[key] = value;
    }
  });
}

// Database configuration
const getDatabaseConfig = () => {
  const isLocalhost = process.env.PGHOST === 'localhost' || process.env.PGHOST === '127.0.0.1';
  const isProduction = process.env.NODE_ENV === 'production';
  
  const config = {
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: parseInt(process.env.PGPORT || '5432', 10),
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };

  // Only use SSL for non-localhost connections or in production
  if (!isLocalhost || isProduction) {
    config.ssl = {
      rejectUnauthorized: false
    };
  }

  return config;
};

const pool = new Pool(getDatabaseConfig());

async function setupTranscriptPermissions() {
  const client = await pool.connect();
  
  try {
    console.log('Setting up transcript permissions...');

    // 1. Insert page permission for transcript entry
    // First check if the page exists
    const existingPage = await client.query(
      'SELECT id FROM page_permissions WHERE page_name = $1',
      ['transcript-entry']
    );

    if (existingPage.rows.length === 0) {
      await client.query(`
        INSERT INTO page_permissions (page_name, page_title, page_title_kh, page_name_kh, page_path, category, icon_name, sort_order) 
        VALUES ('transcript-entry', 'Transcript Entry', 'ការបញ្ចូលពិន្ទុ', 'ការបញ្ចូលពិន្ទុ', '/transcripts', 'academic', 'FileText', 15)
      `);
    } else {
      await client.query(`
        UPDATE page_permissions SET
          page_title = 'Transcript Entry',
          page_title_kh = 'ការបញ្ចូលពិន្ទុ',
          page_name_kh = 'ការបញ្ចូលពិន្ទុ',
          page_path = '/transcripts',
          category = 'academic',
          icon_name = 'FileText',
          sort_order = 15,
          updated_at = NOW()
        WHERE page_name = 'transcript-entry'
      `);
    }

    console.log('✓ Page permissions added');

    // 2. Grant permissions to roles
    const rolePermissions = [
      { role: 'admin', pages: ['transcript-entry'] },
      { role: 'director', pages: ['transcript-entry'] },
      { role: 'teacher', pages: ['transcript-entry'] },
      { role: 'coordinator', pages: ['transcript-entry'] }
    ];

    for (const rolePermission of rolePermissions) {
      for (const pageName of rolePermission.pages) {
        // Check if permission already exists
        const existingPermission = await client.query(`
          SELECT rpp.id FROM role_page_permissions rpp
          JOIN page_permissions p ON rpp.page_id = p.id
          WHERE p.page_name = $1 AND rpp.role = $2
        `, [pageName, rolePermission.role]);

        if (existingPermission.rows.length === 0) {
          // Check the column name - it might be 'role' instead of 'role_name'
          await client.query(`
            INSERT INTO role_page_permissions (page_id, role, is_allowed) 
            SELECT p.id, $1, true 
            FROM page_permissions p 
            WHERE p.page_name = $2
          `, [rolePermission.role, pageName]);
        } else {
          await client.query(`
            UPDATE role_page_permissions SET is_allowed = true
            WHERE id = $1
          `, [existingPermission.rows[0].id]);
        }
      }
    }

    console.log('✓ Role page permissions granted');

    // 3. Set up action permissions if the table exists
    const actionPermissionsExists = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'page_action_permissions'
      )
    `);

    if (actionPermissionsExists.rows[0].exists) {
      const pageResult = await client.query(
        'SELECT id FROM page_permissions WHERE page_name = $1',
        ['transcript-entry']
      );

      if (pageResult.rows.length > 0) {
        const pageId = pageResult.rows[0].id;
        const actions = ['view', 'create', 'update', 'delete', 'export'];
        const roles = ['admin', 'director', 'teacher', 'coordinator'];

        for (const role of roles) {
          for (const action of actions) {
            // Set different permissions based on role
            let isAllowed = true;
            if (action === 'delete' && ['teacher', 'coordinator'].includes(role)) {
              isAllowed = false; // Teachers and coordinators cannot delete
            }

            // Check if action permission already exists
            const existingActionPermission = await client.query(`
              SELECT id FROM page_action_permissions
              WHERE page_id = $1 AND role = $2 AND action_name = $3
            `, [pageId, role, action]);

            if (existingActionPermission.rows.length === 0) {
              await client.query(`
                INSERT INTO page_action_permissions (page_id, role, action_name, is_allowed)
                VALUES ($1, $2, $3, $4)
              `, [pageId, role, action, isAllowed]);
            } else {
              await client.query(`
                UPDATE page_action_permissions SET 
                  is_allowed = $1
                WHERE id = $2
              `, [isAllowed, existingActionPermission.rows[0].id]);
            }
          }
        }

        console.log('✓ Action permissions configured');
      }
    }

    // 4. Ensure the transcript table structure is up to date
    await client.query(`
      -- Ensure tbl_tarl_transcripts table exists with all required columns
      CREATE TABLE IF NOT EXISTS tbl_tarl_transcripts (
        id SERIAL PRIMARY KEY,
        student_id INTEGER REFERENCES tbl_tarl_students(id),
        class_id INTEGER REFERENCES tbl_tarl_classes(id),
        academic_year VARCHAR(20) NOT NULL,
        subject VARCHAR(100) NOT NULL,
        assessment_period VARCHAR(20) NOT NULL 
          CHECK (assessment_period IN ('monthly', 'quarterly', 'semester', 'final')),
        assessment_month VARCHAR(20),
        score DECIMAL(5,2),
        grade VARCHAR(5),
        remarks TEXT,
        teacher_id INTEGER REFERENCES tbl_tarl_teachers(id),
        entry_date DATE DEFAULT CURRENT_DATE,
        is_final BOOLEAN DEFAULT false,
        created_by INTEGER REFERENCES tbl_tarl_users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_deleted BOOLEAN DEFAULT false,
        deleted_at TIMESTAMP,
        deleted_by INTEGER REFERENCES tbl_tarl_users(id),
        UNIQUE(student_id, subject, academic_year, assessment_period, assessment_month)
      );

      -- Add indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_transcript_student_id ON tbl_tarl_transcripts(student_id);
      CREATE INDEX IF NOT EXISTS idx_transcript_class_id ON tbl_tarl_transcripts(class_id);
      CREATE INDEX IF NOT EXISTS idx_transcript_teacher_id ON tbl_tarl_transcripts(teacher_id);
      CREATE INDEX IF NOT EXISTS idx_transcript_academic_year ON tbl_tarl_transcripts(academic_year);
      CREATE INDEX IF NOT EXISTS idx_transcript_assessment_period ON tbl_tarl_transcripts(assessment_period);
      CREATE INDEX IF NOT EXISTS idx_transcript_is_deleted ON tbl_tarl_transcripts(is_deleted);

      -- Ensure grade scales table exists
      CREATE TABLE IF NOT EXISTS tbl_tarl_grade_scales (
        id SERIAL PRIMARY KEY,
        min_score DECIMAL(5,2) NOT NULL,
        max_score DECIMAL(5,2) NOT NULL,
        letter_grade VARCHAR(5) NOT NULL,
        grade_point DECIMAL(3,2),
        description VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Insert default grade scales if they don't exist (no ON CONFLICT)
      INSERT INTO tbl_tarl_grade_scales (min_score, max_score, letter_grade, grade_point, description) 
      SELECT 90, 100, 'A', 4.0, 'Excellent'
      WHERE NOT EXISTS (SELECT 1 FROM tbl_tarl_grade_scales WHERE letter_grade = 'A');
      
      INSERT INTO tbl_tarl_grade_scales (min_score, max_score, letter_grade, grade_point, description) 
      SELECT 80, 89.99, 'B', 3.0, 'Good'
      WHERE NOT EXISTS (SELECT 1 FROM tbl_tarl_grade_scales WHERE letter_grade = 'B');
      
      INSERT INTO tbl_tarl_grade_scales (min_score, max_score, letter_grade, grade_point, description) 
      SELECT 70, 79.99, 'C', 2.0, 'Satisfactory'
      WHERE NOT EXISTS (SELECT 1 FROM tbl_tarl_grade_scales WHERE letter_grade = 'C');
      
      INSERT INTO tbl_tarl_grade_scales (min_score, max_score, letter_grade, grade_point, description) 
      SELECT 60, 69.99, 'D', 1.0, 'Pass'
      WHERE NOT EXISTS (SELECT 1 FROM tbl_tarl_grade_scales WHERE letter_grade = 'D');
      
      INSERT INTO tbl_tarl_grade_scales (min_score, max_score, letter_grade, grade_point, description) 
      SELECT 0, 59.99, 'F', 0.0, 'Fail'
      WHERE NOT EXISTS (SELECT 1 FROM tbl_tarl_grade_scales WHERE letter_grade = 'F');
    `);

    console.log('✓ Database schema verified and updated');

    // 5. Add update trigger for transcripts
    await client.query(`
      -- Create or replace update trigger function
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      -- Drop existing trigger if it exists
      DROP TRIGGER IF EXISTS set_transcripts_updated_at ON tbl_tarl_transcripts;

      -- Create new trigger
      CREATE TRIGGER set_transcripts_updated_at
      BEFORE UPDATE ON tbl_tarl_transcripts
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    console.log('✓ Update triggers configured');

    console.log('\n🎉 Transcript management system setup completed successfully!');
    console.log('\nThe following has been configured:');
    console.log('- Page permissions for transcript entry');
    console.log('- Role-based access control');
    console.log('- Action-level permissions');
    console.log('- Database schema with indexes');
    console.log('- Grade scales');
    console.log('- Update triggers');
    console.log('\nYou can now access the transcript management at: /transcripts');

  } catch (error) {
    console.error('Error setting up transcript permissions:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  setupTranscriptPermissions()
    .then(() => {
      console.log('Setup completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupTranscriptPermissions };