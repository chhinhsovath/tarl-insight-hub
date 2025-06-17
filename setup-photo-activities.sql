-- Run this SQL to set up photo activities table
-- Command: psql -d your_database_name -f setup-photo-activities.sql

-- Create photo activities table
CREATE TABLE IF NOT EXISTS tbl_training_photo_activities (
    id SERIAL PRIMARY KEY,
    session_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    photo_path VARCHAR(500) NOT NULL,
    photo_name VARCHAR(255) NOT NULL,
    photo_size BIGINT,
    photo_type VARCHAR(100),
    activity_date DATE DEFAULT CURRENT_DATE,
    activity_time TIME,
    location VARCHAR(255),
    uploaded_by INT NOT NULL,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_featured BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT true,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_photo_activities_session_id ON tbl_training_photo_activities(session_id);
CREATE INDEX IF NOT EXISTS idx_photo_activities_uploaded_by ON tbl_training_photo_activities(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_photo_activities_activity_date ON tbl_training_photo_activities(activity_date);
CREATE INDEX IF NOT EXISTS idx_photo_activities_is_active ON tbl_training_photo_activities(is_active);

-- Create update trigger
CREATE OR REPLACE FUNCTION update_photo_activities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_photo_activities_updated_at ON tbl_training_photo_activities;
CREATE TRIGGER update_photo_activities_updated_at
    BEFORE UPDATE ON tbl_training_photo_activities
    FOR EACH ROW
    EXECUTE FUNCTION update_photo_activities_updated_at();

SELECT 'Photo activities table created successfully!' as result;