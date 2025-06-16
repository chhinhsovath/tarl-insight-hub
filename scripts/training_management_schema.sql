-- Training Management System Schema
-- Three-session training flow with QR code functionality

-- Training Programs table (overall training programs)
CREATE TABLE IF NOT EXISTS tbl_tarl_training_programs (
    id SERIAL PRIMARY KEY,
    program_name VARCHAR(255) NOT NULL,
    description TEXT,
    program_type VARCHAR(50) DEFAULT 'standard', -- standard, workshop, intensive
    duration_hours INTEGER DEFAULT 8,
    created_by INTEGER REFERENCES tbl_tarl_users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Training Sessions table (individual training instances)
CREATE TABLE IF NOT EXISTS tbl_tarl_training_sessions (
    id SERIAL PRIMARY KEY,
    program_id INTEGER REFERENCES tbl_tarl_training_programs(id),
    session_title VARCHAR(255) NOT NULL,
    session_date DATE NOT NULL,
    session_time TIME NOT NULL,
    location VARCHAR(255),
    venue_address TEXT,
    max_participants INTEGER DEFAULT 50,
    trainer_id INTEGER REFERENCES tbl_tarl_users(id),
    coordinator_id INTEGER REFERENCES tbl_tarl_users(id),
    session_status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, ongoing, completed, cancelled
    registration_deadline DATE,
    qr_code_data TEXT, -- JSON data for QR code
    registration_form_data TEXT, -- JSON schema for registration form
    feedback_form_data TEXT, -- JSON schema for feedback form
    created_by INTEGER REFERENCES tbl_tarl_users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Training Participants table (registrations)
CREATE TABLE IF NOT EXISTS tbl_tarl_training_participants (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES tbl_tarl_training_sessions(id),
    participant_name VARCHAR(255) NOT NULL,
    participant_email VARCHAR(255),
    participant_phone VARCHAR(20),
    participant_role VARCHAR(100), -- Teacher, Coordinator, etc.
    school_name VARCHAR(255),
    school_id INTEGER REFERENCES tbl_tarl_schools("sclAutoID"),
    district VARCHAR(100),
    province VARCHAR(100),
    registration_method VARCHAR(20) DEFAULT 'qr_code', -- qr_code, manual, bulk_import
    registration_data TEXT, -- JSON data from registration form
    registration_status VARCHAR(20) DEFAULT 'registered', -- registered, confirmed, attended, no_show
    attendance_confirmed BOOLEAN DEFAULT false,
    attendance_time TIMESTAMP,
    confirmed_by INTEGER REFERENCES tbl_tarl_users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(session_id, participant_email)
);

-- Training Materials table
CREATE TABLE IF NOT EXISTS tbl_tarl_training_materials (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES tbl_tarl_training_sessions(id),
    material_title VARCHAR(255) NOT NULL,
    material_type VARCHAR(50), -- handout, presentation, video, resource
    file_path VARCHAR(500),
    file_url VARCHAR(500),
    description TEXT,
    is_downloadable BOOLEAN DEFAULT true,
    download_count INTEGER DEFAULT 0,
    uploaded_by INTEGER REFERENCES tbl_tarl_users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Training Feedback Enhancement (extending existing table)
-- Note: tbl_tarl_training_feedback already exists, so we'll add missing columns if needed
DO $$
BEGIN
    -- Add session_id column to existing feedback table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tbl_tarl_training_feedback' AND column_name = 'session_id') THEN
        ALTER TABLE tbl_tarl_training_feedback ADD COLUMN session_id INTEGER REFERENCES tbl_tarl_training_sessions(id);
    END IF;
    
    -- Add participant_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tbl_tarl_training_feedback' AND column_name = 'participant_id') THEN
        ALTER TABLE tbl_tarl_training_feedback ADD COLUMN participant_id INTEGER REFERENCES tbl_tarl_training_participants(id);
    END IF;
    
    -- Add submitted_via column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tbl_tarl_training_feedback' AND column_name = 'submitted_via') THEN
        ALTER TABLE tbl_tarl_training_feedback ADD COLUMN submitted_via VARCHAR(20) DEFAULT 'manual';
    END IF;
    
    -- Add qr_code_used column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tbl_tarl_training_feedback' AND column_name = 'qr_code_used') THEN
        ALTER TABLE tbl_tarl_training_feedback ADD COLUMN qr_code_used BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Training Session Flow Tracking
CREATE TABLE IF NOT EXISTS tbl_tarl_training_flow (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES tbl_tarl_training_sessions(id),
    flow_stage VARCHAR(20) NOT NULL, -- before, during, after
    stage_status VARCHAR(20) DEFAULT 'pending', -- pending, active, completed
    stage_data TEXT, -- JSON data for stage-specific information
    qr_code_generated BOOLEAN DEFAULT false,
    qr_code_data TEXT,
    participants_notified BOOLEAN DEFAULT false,
    materials_distributed BOOLEAN DEFAULT false,
    feedback_collected BOOLEAN DEFAULT false,
    stage_completed_at TIMESTAMP,
    completed_by INTEGER REFERENCES tbl_tarl_users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(session_id, flow_stage)
);

-- QR Code Tracking table
CREATE TABLE IF NOT EXISTS tbl_tarl_qr_codes (
    id SERIAL PRIMARY KEY,
    code_type VARCHAR(50) NOT NULL, -- registration, attendance, feedback, materials
    session_id INTEGER REFERENCES tbl_tarl_training_sessions(id),
    qr_data TEXT NOT NULL, -- The actual QR code data/URL
    qr_code_image TEXT, -- Base64 or file path to QR code image
    usage_count INTEGER DEFAULT 0,
    max_usage INTEGER, -- NULL for unlimited
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER REFERENCES tbl_tarl_users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    last_used_at TIMESTAMP
);

-- QR Code Usage Log
CREATE TABLE IF NOT EXISTS tbl_tarl_qr_usage_log (
    id SERIAL PRIMARY KEY,
    qr_code_id INTEGER REFERENCES tbl_tarl_qr_codes(id),
    session_id INTEGER REFERENCES tbl_tarl_training_sessions(id),
    participant_id INTEGER REFERENCES tbl_tarl_training_participants(id),
    action_type VARCHAR(50), -- scan, register, feedback, download
    user_agent TEXT,
    ip_address INET,
    scan_data TEXT, -- JSON data from the scan
    scan_result VARCHAR(20) DEFAULT 'success', -- success, error, expired
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_training_sessions_date ON tbl_tarl_training_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_training_sessions_status ON tbl_tarl_training_sessions(session_status);
CREATE INDEX IF NOT EXISTS idx_training_participants_session ON tbl_tarl_training_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_training_participants_email ON tbl_tarl_training_participants(participant_email);
CREATE INDEX IF NOT EXISTS idx_training_feedback_session_new ON tbl_tarl_training_feedback(session_id);
CREATE INDEX IF NOT EXISTS idx_training_flow_session ON tbl_tarl_training_flow(session_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_session ON tbl_tarl_qr_codes(session_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_type ON tbl_tarl_qr_codes(code_type);
CREATE INDEX IF NOT EXISTS idx_qr_usage_log_qr_code ON tbl_tarl_qr_usage_log(qr_code_id);

-- Insert sample training program
INSERT INTO tbl_tarl_training_programs (program_name, description, program_type, duration_hours, created_by)
SELECT 
    'TaRL Teaching Methodology Workshop',
    'Comprehensive workshop on Teaching at the Right Level methodology for educators',
    'workshop',
    8,
    id
FROM tbl_tarl_users 
WHERE role = 'admin' 
LIMIT 1
ON CONFLICT DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE tbl_tarl_training_programs IS 'Overall training programs/courses available';
COMMENT ON TABLE tbl_tarl_training_sessions IS 'Individual training session instances with QR code support';
COMMENT ON TABLE tbl_tarl_training_participants IS 'Participant registrations for training sessions';
COMMENT ON TABLE tbl_tarl_training_materials IS 'Training materials and resources';
COMMENT ON TABLE tbl_tarl_training_feedback IS 'Post-training feedback from participants';
COMMENT ON TABLE tbl_tarl_training_flow IS 'Tracks the three-stage training flow (before/during/after)';
COMMENT ON TABLE tbl_tarl_qr_codes IS 'QR codes for various training activities';
COMMENT ON TABLE tbl_tarl_qr_usage_log IS 'Audit log for QR code usage';

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO training_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO training_user;