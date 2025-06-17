-- Engage Programs Schema for Training Sessions
-- Supports materials (documents/links) with timing options (before/during/after)

-- Table for engage programs within training sessions
CREATE TABLE IF NOT EXISTS tbl_training_engage_programs (
    id SERIAL PRIMARY KEY,
    session_id INT NOT NULL REFERENCES tbl_training_sessions(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    timing VARCHAR(20) NOT NULL CHECK (timing IN ('before', 'during', 'after')),
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_by INT REFERENCES tbl_tarl_users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for engage program materials (files and links)
CREATE TABLE IF NOT EXISTS tbl_training_engage_materials (
    id SERIAL PRIMARY KEY,
    engage_program_id INT NOT NULL REFERENCES tbl_training_engage_programs(id) ON DELETE CASCADE,
    material_type VARCHAR(20) NOT NULL CHECK (material_type IN ('document', 'link')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_path VARCHAR(500), -- For uploaded documents
    file_name VARCHAR(255), -- Original file name
    file_size BIGINT, -- File size in bytes
    file_type VARCHAR(100), -- MIME type
    external_url TEXT, -- For external links
    download_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_by INT REFERENCES tbl_tarl_users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table to track material downloads
CREATE TABLE IF NOT EXISTS tbl_training_material_downloads (
    id SERIAL PRIMARY KEY,
    material_id INT NOT NULL REFERENCES tbl_training_engage_materials(id) ON DELETE CASCADE,
    participant_id INT REFERENCES tbl_training_participants(id),
    ip_address VARCHAR(45),
    user_agent TEXT,
    downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_engage_programs_session ON tbl_training_engage_programs(session_id);
CREATE INDEX idx_engage_programs_timing ON tbl_training_engage_programs(timing);
CREATE INDEX idx_engage_materials_program ON tbl_training_engage_materials(engage_program_id);
CREATE INDEX idx_material_downloads_material ON tbl_training_material_downloads(material_id);
CREATE INDEX idx_material_downloads_participant ON tbl_training_material_downloads(participant_id);

-- Add sample engage programs for existing sessions
INSERT INTO tbl_training_engage_programs (session_id, title, description, timing, sort_order, created_by)
SELECT 
    id,
    CASE 
        WHEN ROW_NUMBER() OVER (PARTITION BY id ORDER BY id) = 1 THEN 'Pre-Training Materials'
        WHEN ROW_NUMBER() OVER (PARTITION BY id ORDER BY id) = 2 THEN 'Training Resources'
        ELSE 'Post-Training Resources'
    END as title,
    CASE 
        WHEN ROW_NUMBER() OVER (PARTITION BY id ORDER BY id) = 1 THEN 'Materials to review before the training session'
        WHEN ROW_NUMBER() OVER (PARTITION BY id ORDER BY id) = 2 THEN 'Resources available during the training'
        ELSE 'Additional materials for after the training'
    END as description,
    CASE 
        WHEN ROW_NUMBER() OVER (PARTITION BY id ORDER BY id) = 1 THEN 'before'
        WHEN ROW_NUMBER() OVER (PARTITION BY id ORDER BY id) = 2 THEN 'during'
        ELSE 'after'
    END as timing,
    ROW_NUMBER() OVER (PARTITION BY id ORDER BY id) as sort_order,
    1 as created_by
FROM tbl_training_sessions
CROSS JOIN generate_series(1, 3);

-- Add sample materials for some engage programs
INSERT INTO tbl_training_engage_materials (engage_program_id, material_type, title, description, external_url, created_by)
SELECT 
    ep.id,
    'link' as material_type,
    CASE 
        WHEN ep.timing = 'before' THEN 'Pre-reading: TaRL Methodology Guide'
        WHEN ep.timing = 'during' THEN 'Interactive Training Slides'
        ELSE 'Additional Resources and Best Practices'
    END as title,
    CASE 
        WHEN ep.timing = 'before' THEN 'Essential reading to prepare for the training session'
        WHEN ep.timing = 'during' THEN 'Presentation slides used during the training'
        ELSE 'Supplementary materials for further learning'
    END as description,
    CASE 
        WHEN ep.timing = 'before' THEN 'https://example.com/tarl-methodology-guide.pdf'
        WHEN ep.timing = 'during' THEN 'https://example.com/training-slides.pptx'
        ELSE 'https://example.com/best-practices.pdf'
    END as external_url,
    1 as created_by
FROM tbl_training_engage_programs ep
WHERE ep.session_id IN (SELECT id FROM tbl_training_sessions LIMIT 5);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON tbl_training_engage_programs TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON tbl_training_engage_materials TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON tbl_training_material_downloads TO postgres;
GRANT USAGE, SELECT ON SEQUENCE tbl_training_engage_programs_id_seq TO postgres;
GRANT USAGE, SELECT ON SEQUENCE tbl_training_engage_materials_id_seq TO postgres;
GRANT USAGE, SELECT ON SEQUENCE tbl_training_material_downloads_id_seq TO postgres;