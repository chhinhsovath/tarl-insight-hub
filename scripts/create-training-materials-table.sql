-- Training Program Materials Table
-- This table stores training materials (files and links) attached to training programs

CREATE TABLE IF NOT EXISTS tbl_tarl_training_materials (
    id SERIAL PRIMARY KEY,
    program_id INTEGER NOT NULL REFERENCES tbl_tarl_training_programs(id) ON DELETE CASCADE,
    material_name VARCHAR(255) NOT NULL,
    material_type VARCHAR(50) NOT NULL CHECK (material_type IN ('file', 'link')),
    
    -- For file materials
    file_path VARCHAR(500), -- Path to uploaded file
    file_size BIGINT, -- File size in bytes
    file_type VARCHAR(100), -- MIME type (e.g., application/pdf, application/vnd.ms-excel)
    original_filename VARCHAR(255), -- Original filename when uploaded
    
    -- For link materials
    external_url VARCHAR(1000), -- External URL for links
    
    description TEXT,
    is_required BOOLEAN DEFAULT false, -- Whether this material is required for the program
    sort_order INTEGER DEFAULT 0, -- Display order
    
    -- Metadata
    created_by INTEGER NOT NULL REFERENCES tbl_tarl_users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_training_materials_program_id ON tbl_tarl_training_materials(program_id);
CREATE INDEX IF NOT EXISTS idx_training_materials_type ON tbl_tarl_training_materials(material_type);
CREATE INDEX IF NOT EXISTS idx_training_materials_active ON tbl_tarl_training_materials(is_active);

-- Constraints
-- Ensure file materials have file_path and link materials have external_url
ALTER TABLE tbl_tarl_training_materials 
ADD CONSTRAINT chk_file_material_path 
CHECK (
    (material_type = 'file' AND file_path IS NOT NULL) OR 
    (material_type = 'link' AND external_url IS NOT NULL) OR
    material_type NOT IN ('file', 'link')
);

-- Add comments for documentation
COMMENT ON TABLE tbl_tarl_training_materials IS 'Training materials attached to programs (files and external links)';
COMMENT ON COLUMN tbl_tarl_training_materials.material_type IS 'Type of material: file (uploaded) or link (external URL)';
COMMENT ON COLUMN tbl_tarl_training_materials.file_path IS 'Server path to uploaded file (for file type materials)';
COMMENT ON COLUMN tbl_tarl_training_materials.external_url IS 'External URL (for link type materials)';
COMMENT ON COLUMN tbl_tarl_training_materials.is_required IS 'Whether participants must access this material';