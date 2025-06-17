const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.PGUSER || 'postgres',
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDATABASE || 'pratham_tarl',
  password: process.env.PGPASSWORD || '12345',
  port: parseInt(process.env.PGPORT || '5432', 10),
});

async function fixSchemaIssues() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Fixing Training Schema Issues...\n');
    
    // Fix 1: Add missing columns to training_feedback table
    console.log('1. Checking training_feedback table columns...');
    const feedbackColumns = [
      { name: 'content_quality', type: 'INTEGER', default: null },
      { name: 'trainer_effectiveness', type: 'INTEGER', default: null },
      { name: 'would_recommend', type: 'BOOLEAN', default: true },
      { name: 'materials_helpful', type: 'BOOLEAN', default: true },
      { name: 'overall_rating', type: 'INTEGER', default: null },
      { name: 'comments', type: 'TEXT', default: null },
      { name: 'is_anonymous', type: 'BOOLEAN', default: true },
      { name: 'session_id', type: 'INTEGER REFERENCES tbl_tarl_training_sessions(id)', default: null },
      { name: 'participant_id', type: 'INTEGER REFERENCES tbl_tarl_training_participants(id)', default: null },
      { name: 'submitted_via', type: 'VARCHAR(20)', default: "'manual'" },
      { name: 'qr_code_id', type: 'INTEGER REFERENCES tbl_tarl_qr_codes(id)', default: null },
      { name: 'submission_time', type: 'TIMESTAMP', default: 'NOW()' }
    ];
    
    for (const column of feedbackColumns) {
      try {
        const checkQuery = `
          SELECT column_name FROM information_schema.columns 
          WHERE table_name = 'tbl_tarl_training_feedback' 
          AND column_name = $1
        `;
        const checkResult = await client.query(checkQuery, [column.name]);
        
        if (checkResult.rows.length === 0) {
          const defaultClause = column.default ? ` DEFAULT ${column.default}` : '';
          const alterQuery = `ALTER TABLE tbl_tarl_training_feedback ADD COLUMN ${column.name} ${column.type}${defaultClause}`;
          await client.query(alterQuery);
          console.log(`  ✅ Added column: ${column.name}`);
        } else {
          console.log(`  ℹ️  Column exists: ${column.name}`);
        }
      } catch (error) {
        console.log(`  ⚠️  Error adding ${column.name}: ${error.message}`);
      }
    }
    
    // Fix 2: Add missing columns to training_participants table
    console.log('\n2. Checking training_participants table columns...');
    const participantColumns = [
      { name: 'email', type: 'VARCHAR(255)', default: null },
      { name: 'phone', type: 'VARCHAR(20)', default: null },
      { name: 'designation', type: 'VARCHAR(100)', default: null },
      { name: 'registration_date', type: 'DATE', default: 'CURRENT_DATE' }
    ];
    
    for (const column of participantColumns) {
      try {
        const checkQuery = `
          SELECT column_name FROM information_schema.columns 
          WHERE table_name = 'tbl_tarl_training_participants' 
          AND column_name = $1
        `;
        const checkResult = await client.query(checkQuery, [column.name]);
        
        if (checkResult.rows.length === 0) {
          // Check if similar column exists (e.g., participant_email vs email)
          const similarColumn = `participant_${column.name}`;
          const similarCheck = await client.query(checkQuery, [similarColumn]);
          
          if (similarCheck.rows.length > 0) {
            console.log(`  ℹ️  Column exists as: ${similarColumn}`);
          } else {
            const defaultClause = column.default ? ` DEFAULT ${column.default}` : '';
            const alterQuery = `ALTER TABLE tbl_tarl_training_participants ADD COLUMN ${column.name} ${column.type}${defaultClause}`;
            await client.query(alterQuery);
            console.log(`  ✅ Added column: ${column.name}`);
          }
        } else {
          console.log(`  ℹ️  Column exists: ${column.name}`);
        }
      } catch (error) {
        console.log(`  ⚠️  Error adding ${column.name}: ${error.message}`);
      }
    }
    
    // Fix 3: Update API compatibility for existing columns
    console.log('\n3. Creating views for API compatibility...');
    
    // Create a view that maps column names for API compatibility
    try {
      await client.query(`
        CREATE OR REPLACE VIEW v_training_participants AS
        SELECT 
          id,
          session_id,
          participant_name,
          participant_email as email,
          participant_phone as phone,
          participant_role as designation,
          school_name,
          school_id,
          district,
          province,
          registration_method,
          registration_data,
          registration_status,
          attendance_confirmed,
          attendance_time,
          confirmed_by,
          created_at as registration_date,
          created_at,
          updated_at
        FROM tbl_tarl_training_participants
      `);
      console.log('  ✅ Created v_training_participants view');
    } catch (error) {
      console.log(`  ⚠️  Error creating view: ${error.message}`);
    }
    
    // Fix 4: Add missing columns to page_permissions
    console.log('\n4. Checking page_permissions table...');
    try {
      const checkQuery = `
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'page_permissions' 
        AND column_name = 'page_title'
      `;
      const checkResult = await client.query(checkQuery);
      
      if (checkResult.rows.length === 0) {
        await client.query(`
          ALTER TABLE page_permissions 
          ADD COLUMN IF NOT EXISTS page_title VARCHAR(255)
        `);
        
        // Update page titles based on page names
        await client.query(`
          UPDATE page_permissions 
          SET page_title = 
            CASE 
              WHEN page_name LIKE 'training%' THEN 
                CONCAT('Training ', 
                  INITCAP(REPLACE(SUBSTRING(page_name FROM 9), '-', ' '))
                )
              ELSE INITCAP(REPLACE(page_name, '-', ' '))
            END
          WHERE page_title IS NULL
        `);
        console.log('  ✅ Added page_title column and populated values');
      } else {
        console.log('  ℹ️  Column page_title already exists');
      }
    } catch (error) {
      console.log(`  ⚠️  Error with page_permissions: ${error.message}`);
    }
    
    // Fix 5: Update training materials table for API compatibility
    console.log('\n5. Checking training_materials columns...');
    try {
      // Check which column name is used
      const columnCheck = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'tbl_tarl_training_materials' 
        AND column_name IN ('material_title', 'material_name')
      `);
      
      if (columnCheck.rows.length > 0) {
        const existingColumn = columnCheck.rows[0].column_name;
        console.log(`  ℹ️  Materials table uses column: ${existingColumn}`);
        
        // Create view for API compatibility if needed
        if (existingColumn === 'material_title') {
          await client.query(`
            CREATE OR REPLACE VIEW v_training_materials AS
            SELECT 
              *,
              material_title as material_name
            FROM tbl_tarl_training_materials
          `);
          console.log('  ✅ Created v_training_materials view for API compatibility');
        }
      }
    } catch (error) {
      console.log(`  ⚠️  Error with materials view: ${error.message}`);
    }
    
    console.log('\n✅ Schema fixes completed!');
    console.log('\nNote: Some API endpoints may need to be updated to use the correct column names.');
    console.log('Alternatively, the views created above can be used for compatibility.');
    
  } catch (error) {
    console.error('❌ Error fixing schema:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the fixes
fixSchemaIssues().catch(console.error);