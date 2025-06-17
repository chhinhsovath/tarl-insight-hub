-- Create missing training tables

-- Training Registrations table (separate from participants for better tracking)
CREATE TABLE IF NOT EXISTS tbl_tarl_training_registrations (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES tbl_tarl_training_sessions(id),
    user_id INTEGER REFERENCES tbl_tarl_users(id), -- NULL for external registrations
    participant_name VARCHAR(255) NOT NULL,
    participant_email VARCHAR(255),
    participant_phone VARCHAR(20),
    participant_role VARCHAR(100),
    school_name VARCHAR(255),
    school_id INTEGER REFERENCES tbl_tarl_schools("sclAutoID"),
    district VARCHAR(100),
    province VARCHAR(100),
    registration_method VARCHAR(20) DEFAULT 'online', -- online, qr_code, manual, bulk_import
    registration_data TEXT, -- JSON data from registration form
    attendance_status VARCHAR(20) DEFAULT 'registered', -- registered, confirmed, pending, cancelled
    confirmation_code VARCHAR(50),
    qr_code_used BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(session_id, participant_email)
);

-- Training Attendance table (for actual session attendance tracking)
CREATE TABLE IF NOT EXISTS tbl_tarl_training_attendance (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES tbl_tarl_training_sessions(id),
    user_id INTEGER REFERENCES tbl_tarl_users(id), -- NULL for external attendees
    registration_id INTEGER REFERENCES tbl_tarl_training_registrations(id),
    participant_name VARCHAR(255) NOT NULL,
    participant_email VARCHAR(255),
    attendance_status VARCHAR(20) DEFAULT 'present', -- present, absent, late, excused
    check_in_time TIMESTAMP,
    check_out_time TIMESTAMP,
    attendance_method VARCHAR(20) DEFAULT 'manual', -- manual, qr_code, bulk_check
    attendance_notes TEXT,
    marked_by INTEGER REFERENCES tbl_tarl_users(id),
    qr_code_used BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- QR Codes table (if not exists)
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
    last_used_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_training_registrations_session ON tbl_tarl_training_registrations(session_id);
CREATE INDEX IF NOT EXISTS idx_training_registrations_email ON tbl_tarl_training_registrations(participant_email);
CREATE INDEX IF NOT EXISTS idx_training_registrations_status ON tbl_tarl_training_registrations(attendance_status);

CREATE INDEX IF NOT EXISTS idx_training_attendance_session ON tbl_tarl_training_attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_training_attendance_registration ON tbl_tarl_training_attendance(registration_id);
CREATE INDEX IF NOT EXISTS idx_training_attendance_status ON tbl_tarl_training_attendance(attendance_status);

CREATE INDEX IF NOT EXISTS idx_qr_codes_session ON tbl_tarl_qr_codes(session_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_type ON tbl_tarl_qr_codes(code_type);
CREATE INDEX IF NOT EXISTS idx_qr_codes_active ON tbl_tarl_qr_codes(is_active);

-- Update existing tbl_tarl_training_feedback to add user_id if not exists
DO $$
BEGIN
    -- Add user_id column to existing feedback table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tbl_tarl_training_feedback' AND column_name = 'user_id') THEN
        ALTER TABLE tbl_tarl_training_feedback ADD COLUMN user_id INTEGER REFERENCES tbl_tarl_users(id);
    END IF;
    
    -- Add is_active column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tbl_tarl_training_feedback' AND column_name = 'is_active') THEN
        ALTER TABLE tbl_tarl_training_feedback ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Sample data for testing (optional)
-- Insert some sample registrations for existing sessions
DO $$
DECLARE
    session_record RECORD;
    i INTEGER;
BEGIN
    FOR session_record IN 
        SELECT id FROM tbl_tarl_training_sessions WHERE is_active = true LIMIT 3
    LOOP
        FOR i IN 1..3 LOOP
            INSERT INTO tbl_tarl_training_registrations 
                (session_id, participant_name, participant_email, participant_role, registration_method, attendance_status)
            VALUES (
                session_record.id,
                'Sample Participant ' || i,
                'participant' || i || '_session_' || session_record.id || '@example.com',
                'Teacher',
                'online',
                CASE 
                    WHEN i = 1 THEN 'confirmed'
                    WHEN i = 2 THEN 'pending'
                    ELSE 'registered'
                END
            )
            ON CONFLICT (session_id, participant_email) DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- Comments
COMMENT ON TABLE tbl_tarl_training_registrations IS 'Participant registrations for training sessions';
COMMENT ON TABLE tbl_tarl_training_attendance IS 'Actual attendance tracking for training sessions';
COMMENT ON TABLE tbl_tarl_qr_codes IS 'QR codes for various training activities';