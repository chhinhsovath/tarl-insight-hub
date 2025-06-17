-- Photo Activities Schema for Training Sessions
-- This script creates tables for managing photo activities during training sessions

-- Table: tbl_training_photo_activities
-- Purpose: Store photo activities/uploads for training sessions
CREATE TABLE IF NOT EXISTS tbl_training_photo_activities (
    id SERIAL PRIMARY KEY,
    session_id INT NOT NULL REFERENCES tbl_tarl_training_sessions(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    photo_path VARCHAR(500) NOT NULL,
    photo_name VARCHAR(255) NOT NULL,
    photo_size BIGINT,
    photo_type VARCHAR(100),
    activity_date DATE DEFAULT CURRENT_DATE,
    activity_time TIME,
    location VARCHAR(255),
    uploaded_by INT NOT NULL REFERENCES tbl_tarl_users(id),
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_featured BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT true,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_photo_activities_session_id ON tbl_training_photo_activities(session_id);
CREATE INDEX IF NOT EXISTS idx_photo_activities_uploaded_by ON tbl_training_photo_activities(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_photo_activities_activity_date ON tbl_training_photo_activities(activity_date);
CREATE INDEX IF NOT EXISTS idx_photo_activities_is_active ON tbl_training_photo_activities(is_active);

-- Add comments for documentation
COMMENT ON TABLE tbl_training_photo_activities IS 'Photo activities and uploads for training sessions';
COMMENT ON COLUMN tbl_training_photo_activities.session_id IS 'References the training session';
COMMENT ON COLUMN tbl_training_photo_activities.title IS 'Title/caption for the photo activity';
COMMENT ON COLUMN tbl_training_photo_activities.description IS 'Detailed description of the activity';
COMMENT ON COLUMN tbl_training_photo_activities.photo_path IS 'File system path to the uploaded photo';
COMMENT ON COLUMN tbl_training_photo_activities.photo_name IS 'Original filename of the uploaded photo';
COMMENT ON COLUMN tbl_training_photo_activities.photo_size IS 'File size in bytes';
COMMENT ON COLUMN tbl_training_photo_activities.photo_type IS 'MIME type of the photo';
COMMENT ON COLUMN tbl_training_photo_activities.activity_date IS 'Date when the activity/photo was taken';
COMMENT ON COLUMN tbl_training_photo_activities.activity_time IS 'Time when the activity/photo was taken';
COMMENT ON COLUMN tbl_training_photo_activities.location IS 'Location where the activity took place';
COMMENT ON COLUMN tbl_training_photo_activities.uploaded_by IS 'User who uploaded the photo';
COMMENT ON COLUMN tbl_training_photo_activities.upload_date IS 'When the photo was uploaded to the system';
COMMENT ON COLUMN tbl_training_photo_activities.is_featured IS 'Whether this photo is featured in the session';
COMMENT ON COLUMN tbl_training_photo_activities.is_public IS 'Whether this photo is visible to public';
COMMENT ON COLUMN tbl_training_photo_activities.sort_order IS 'Display order of photos';
COMMENT ON COLUMN tbl_training_photo_activities.is_active IS 'Whether this photo activity is active';

-- Update trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION update_photo_activities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_photo_activities_updated_at
    BEFORE UPDATE ON tbl_training_photo_activities
    FOR EACH ROW
    EXECUTE FUNCTION update_photo_activities_updated_at();

-- Sample view for photo activities with user information
CREATE OR REPLACE VIEW vw_training_photo_activities AS
SELECT 
    pa.*,
    u.full_name as uploader_name,
    u.role_id as uploader_role,
    ts.session_title,
    ts.session_date,
    ts.location as session_location
FROM tbl_training_photo_activities pa
JOIN tbl_tarl_users u ON pa.uploaded_by = u.id
JOIN tbl_tarl_training_sessions ts ON pa.session_id = ts.id
WHERE pa.is_active = true
ORDER BY pa.activity_date DESC, pa.sort_order ASC;

COMMENT ON VIEW vw_training_photo_activities IS 'View combining photo activities with user and session information';