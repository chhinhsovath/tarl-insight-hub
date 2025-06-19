-- Training Schema Fixes
-- Fixes inconsistencies between database schema and API expectations

-- 1. Fix tbl_tarl_training_materials table structure
-- Add missing columns and aliases to match API expectations

DO $$
BEGIN
    -- Add program_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tbl_tarl_training_materials' AND column_name = 'program_id') THEN
        ALTER TABLE tbl_tarl_training_materials ADD COLUMN program_id INTEGER REFERENCES tbl_tarl_training_programs(id);
    END IF;
    
    -- Add material_name column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tbl_tarl_training_materials' AND column_name = 'material_name') THEN
        ALTER TABLE tbl_tarl_training_materials ADD COLUMN material_name VARCHAR(255);
    END IF;
    
    -- Add external_url column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tbl_tarl_training_materials' AND column_name = 'external_url') THEN
        ALTER TABLE tbl_tarl_training_materials ADD COLUMN external_url VARCHAR(500);
    END IF;
    
    -- Add is_required column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tbl_tarl_training_materials' AND column_name = 'is_required') THEN
        ALTER TABLE tbl_tarl_training_materials ADD COLUMN is_required BOOLEAN DEFAULT false;
    END IF;
    
    -- Add sort_order column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tbl_tarl_training_materials' AND column_name = 'sort_order') THEN
        ALTER TABLE tbl_tarl_training_materials ADD COLUMN sort_order INTEGER DEFAULT 0;
    END IF;
    
    -- Add created_by column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tbl_tarl_training_materials' AND column_name = 'created_by') THEN
        ALTER TABLE tbl_tarl_training_materials ADD COLUMN created_by INTEGER REFERENCES tbl_tarl_users(id);
    END IF;
    
    -- Add is_active column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tbl_tarl_training_materials' AND column_name = 'is_active') THEN
        ALTER TABLE tbl_tarl_training_materials ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- 2. Update existing data to use new structure
-- Copy material_title to material_name where material_name is null
UPDATE tbl_tarl_training_materials 
SET material_name = material_title 
WHERE material_name IS NULL AND material_title IS NOT NULL;

-- Set program_id from session's program_id where program_id is null
UPDATE tbl_tarl_training_materials tm
SET program_id = ts.program_id
FROM tbl_tarl_training_sessions ts
WHERE tm.session_id = ts.id AND tm.program_id IS NULL;

-- 3. Add missing columns to tbl_tarl_training_sessions if needed
DO $$
BEGIN
    -- Add agenda column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tbl_tarl_training_sessions' AND column_name = 'agenda') THEN
        ALTER TABLE tbl_tarl_training_sessions ADD COLUMN agenda TEXT;
    END IF;
    
    -- Add notes column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tbl_tarl_training_sessions' AND column_name = 'notes') THEN
        ALTER TABLE tbl_tarl_training_sessions ADD COLUMN notes TEXT;
    END IF;
END $$;

-- 4. Create new training_registrations table if it doesn't exist
CREATE TABLE IF NOT EXISTS tbl_tarl_training_registrations (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES tbl_tarl_training_sessions(id),
    participant_name VARCHAR(255) NOT NULL,
    participant_email VARCHAR(255) NOT NULL,
    participant_phone VARCHAR(20),
    participant_role VARCHAR(100),
    school_name VARCHAR(255),
    district VARCHAR(100),
    province VARCHAR(100),
    registration_data TEXT, -- JSON data from registration form
    attendance_status VARCHAR(20) DEFAULT 'registered', -- registered, attended, no_show
    attendance_marked_at TIMESTAMP,
    marked_by INTEGER REFERENCES tbl_tarl_users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(session_id, participant_email)
);

-- 5. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_training_materials_program ON tbl_tarl_training_materials(program_id);
CREATE INDEX IF NOT EXISTS idx_training_materials_session ON tbl_tarl_training_materials(session_id);
CREATE INDEX IF NOT EXISTS idx_training_materials_type ON tbl_tarl_training_materials(material_type);
CREATE INDEX IF NOT EXISTS idx_training_registrations_session ON tbl_tarl_training_registrations(session_id);
CREATE INDEX IF NOT EXISTS idx_training_registrations_email ON tbl_tarl_training_registrations(participant_email);
CREATE INDEX IF NOT EXISTS idx_training_registrations_status ON tbl_tarl_training_registrations(attendance_status);

-- Comments for documentation
COMMENT ON TABLE tbl_tarl_training_registrations IS 'Training session registrations with attendance tracking';
COMMENT ON COLUMN tbl_tarl_training_materials.program_id IS 'Links materials to training programs';
COMMENT ON COLUMN tbl_tarl_training_materials.material_name IS 'Name of the training material';
COMMENT ON COLUMN tbl_tarl_training_materials.external_url IS 'URL for link-type materials';
COMMENT ON COLUMN tbl_tarl_training_materials.is_required IS 'Whether this material is required for the training';
COMMENT ON COLUMN tbl_tarl_training_materials.sort_order IS 'Display order for materials';