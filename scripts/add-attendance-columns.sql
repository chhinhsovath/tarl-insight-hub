-- Add missing columns for attendance functionality
-- Run this script if attendance marking is not working

-- Add attendance tracking columns to registrations table
ALTER TABLE tbl_tarl_training_registrations 
ADD COLUMN IF NOT EXISTS attendance_marked_at TIMESTAMP;

ALTER TABLE tbl_tarl_training_registrations 
ADD COLUMN IF NOT EXISTS attendance_marked_by VARCHAR(255);

-- Create QR usage log table if not exists
CREATE TABLE IF NOT EXISTS tbl_tarl_qr_usage_log (
    id SERIAL PRIMARY KEY,
    qr_code_id INTEGER,
    session_id INTEGER,
    participant_id VARCHAR(255),
    action_type VARCHAR(50),
    scan_result VARCHAR(50),
    user_agent TEXT,
    ip_address VARCHAR(45),
    scan_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_qr_usage_session ON tbl_tarl_qr_usage_log(session_id);
CREATE INDEX IF NOT EXISTS idx_qr_usage_qr_code ON tbl_tarl_qr_usage_log(qr_code_id);

-- Add sample data for testing (optional)
-- INSERT INTO tbl_tarl_training_registrations 
-- (session_id, participant_name, participant_email, attendance_status, registration_method, is_active)
-- VALUES 
-- (2, 'Test User 1', 'test1@example.com', 'registered', 'online', true),
-- (2, 'Test User 2', 'test2@example.com', 'attended', 'qr_code', true),
-- (2, 'Test User 3', 'test3@example.com', 'registered', 'online', true);

COMMENT ON COLUMN tbl_tarl_training_registrations.attendance_marked_at IS 'Timestamp when attendance was marked';
COMMENT ON COLUMN tbl_tarl_training_registrations.attendance_marked_by IS 'Who marked the attendance (user or system)';
COMMENT ON TABLE tbl_tarl_qr_usage_log IS 'Logs all QR code scans and usage for tracking';