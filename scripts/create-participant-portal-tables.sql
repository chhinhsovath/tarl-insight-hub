-- Create table for tracking participant material downloads
CREATE TABLE IF NOT EXISTS tbl_tarl_material_downloads (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL,
    participant_name VARCHAR(255) NOT NULL,
    participant_phone VARCHAR(50) NOT NULL,
    download_time TIMESTAMP DEFAULT NOW(),
    materials_count INTEGER DEFAULT 0,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_material_downloads_session ON tbl_tarl_material_downloads(session_id);
CREATE INDEX IF NOT EXISTS idx_material_downloads_participant ON tbl_tarl_material_downloads(participant_name, participant_phone);
CREATE INDEX IF NOT EXISTS idx_material_downloads_date ON tbl_tarl_material_downloads(download_time);

-- Create table for participant portal sessions (optional - for enhanced security)
CREATE TABLE IF NOT EXISTS tbl_tarl_participant_sessions (
    id VARCHAR(255) PRIMARY KEY,
    participant_name VARCHAR(255) NOT NULL,
    participant_phone VARCHAR(50) NOT NULL,
    login_time TIMESTAMP DEFAULT NOW(),
    last_activity TIMESTAMP DEFAULT NOW(),
    ip_address VARCHAR(45),
    user_agent TEXT,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Add indexes for participant sessions
CREATE INDEX IF NOT EXISTS idx_participant_sessions_active ON tbl_tarl_participant_sessions(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_participant_sessions_participant ON tbl_tarl_participant_sessions(participant_name, participant_phone);

-- Add some sample training materials if they don't exist
INSERT INTO tbl_tarl_training_materials (session_id, material_name, material_type, file_path, description, is_active)
SELECT 
    s.id,
    'Training Handout - ' || s.session_title,
    'document',
    '/materials/handouts/' || s.id || '_handout.pdf',
    'Comprehensive handout covering key concepts from the training session',
    true
FROM tbl_tarl_training_sessions s
WHERE NOT EXISTS (
    SELECT 1 FROM tbl_tarl_training_materials m 
    WHERE m.session_id = s.id
)
LIMIT 10;

-- Add presentation materials for training sessions
INSERT INTO tbl_tarl_training_materials (session_id, material_name, material_type, file_path, description, is_active)
SELECT 
    s.id,
    'Presentation Slides - ' || s.session_title,
    'presentation',
    '/materials/slides/' || s.id || '_slides.pdf',
    'Training presentation slides used during the session',
    true
FROM tbl_tarl_training_sessions s
WHERE NOT EXISTS (
    SELECT 1 FROM tbl_tarl_training_materials m 
    WHERE m.session_id = s.id AND m.material_type = 'presentation'
)
LIMIT 10;

COMMENT ON TABLE tbl_tarl_material_downloads IS 'Tracks when participants download training materials';
COMMENT ON TABLE tbl_tarl_participant_sessions IS 'Manages participant portal login sessions';
COMMENT ON TABLE tbl_tarl_training_materials IS 'Stores training materials available for download';