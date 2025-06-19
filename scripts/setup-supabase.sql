-- Supabase Database Setup Script
-- Run this in Supabase SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create all tables by running the master schema
-- Note: Copy the contents of scripts/99_master_schema.sql here

-- After creating tables, insert initial admin user
-- Password: admin123 (bcrypt hash)
INSERT INTO tbl_tarl_users (
    full_name, 
    email, 
    username, 
    password, 
    role, 
    role_id,
    is_active,
    created_at,
    updated_at
) VALUES (
    'Admin User',
    'admin@tarl.edu.kh',
    'admin1',
    '$2b$10$kXGM3e2aNkcWHxE5LmLDYORQkK5AQ5GGLt5hVs6hZ/6kxQH8hxJl.',
    'admin',
    (SELECT id FROM tbl_tarl_roles WHERE name = 'admin'),
    true,
    NOW(),
    NOW()
) ON CONFLICT (username) DO NOTHING;

-- Enable Row Level Security (RLS) for sensitive tables
ALTER TABLE tbl_tarl_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_tarl_training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_tarl_training_participants ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies (adjust based on your needs)
CREATE POLICY "Users can view their own data" ON tbl_tarl_users
    FOR SELECT USING (auth.uid()::text = id::text OR role = 'admin');

CREATE POLICY "Admins can manage all users" ON tbl_tarl_users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM tbl_tarl_users 
            WHERE id::text = auth.uid()::text 
            AND role = 'admin'
        )
    );

-- Grant necessary permissions
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_username ON tbl_tarl_users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON tbl_tarl_users(email);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON tbl_tarl_training_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_participants_email ON tbl_tarl_training_participants(participant_email);