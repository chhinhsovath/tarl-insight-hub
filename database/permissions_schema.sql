-- =====================================================
-- ROLE-BASED PERMISSION MANAGEMENT SYSTEM
-- =====================================================

-- Pages/Resources table - defines all protected pages/resources
CREATE TABLE IF NOT EXISTS tbl_tarl_pages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    path VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Role_Permissions junction table - defines which roles can access which pages
CREATE TABLE IF NOT EXISTS tbl_tarl_role_permissions (
    id SERIAL PRIMARY KEY,
    role_id INTEGER NOT NULL REFERENCES tbl_tarl_roles(id) ON DELETE CASCADE,
    page_id INTEGER NOT NULL REFERENCES tbl_tarl_pages(id) ON DELETE CASCADE,
    can_access BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role_id, page_id)
);

-- Permission audit trail table - tracks all permission changes
CREATE TABLE IF NOT EXISTS tbl_tarl_permission_audit (
    id SERIAL PRIMARY KEY,
    role_id INTEGER NOT NULL REFERENCES tbl_tarl_roles(id) ON DELETE CASCADE,
    page_id INTEGER NOT NULL REFERENCES tbl_tarl_pages(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- 'granted', 'revoked', 'created', 'deleted'
    previous_value BOOLEAN,
    new_value BOOLEAN,
    changed_by INTEGER NOT NULL REFERENCES tbl_tarl_users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default pages/resources
INSERT INTO tbl_tarl_pages (name, path, description) VALUES
('Dashboard', '/dashboard', 'Main dashboard overview'),
('Schools', '/schools', 'School management and viewing'),
('Users', '/users', 'User management and administration'),
('Analytics', '/analytics', 'Data analytics and reports'),
('Reports', '/reports', 'Generate and view reports'),
('Settings', '/settings', 'System settings and configuration'),
('Students', '/students', 'Student data and management'),
('Observations', '/observations', 'Classroom observations'),
('Progress', '/progress', 'Student and teacher progress tracking'),
('Training', '/training', 'Training materials and management'),
('Visits', '/visits', 'School visits and monitoring'),
('Collection', '/collection', 'Data collection tools')
ON CONFLICT (name) DO NOTHING;

-- Ensure all predefined roles exist
INSERT INTO tbl_tarl_roles (name) VALUES
('admin'),
('collector'),
('teacher'),
('coordinator'),
('partner'),
('director'),
('intern')
ON CONFLICT (name) DO NOTHING;

-- Create default permission sets
-- Admin - full access
INSERT INTO tbl_tarl_role_permissions (role_id, page_id, can_access)
SELECT r.id, p.id, true
FROM tbl_tarl_roles r
CROSS JOIN tbl_tarl_pages p
WHERE r.name = 'admin'
ON CONFLICT (role_id, page_id) DO NOTHING;

-- Collector - data collection focused
INSERT INTO tbl_tarl_role_permissions (role_id, page_id, can_access)
SELECT r.id, p.id, true
FROM tbl_tarl_roles r
CROSS JOIN tbl_tarl_pages p
WHERE r.name = 'collector' AND p.name IN ('Dashboard', 'Schools', 'Students', 'Observations', 'Collection', 'Visits')
ON CONFLICT (role_id, page_id) DO NOTHING;

-- Teacher - classroom focused
INSERT INTO tbl_tarl_role_permissions (role_id, page_id, can_access)
SELECT r.id, p.id, true
FROM tbl_tarl_roles r
CROSS JOIN tbl_tarl_pages p
WHERE r.name = 'teacher' AND p.name IN ('Dashboard', 'Students', 'Progress', 'Training')
ON CONFLICT (role_id, page_id) DO NOTHING;

-- Coordinator - coordination and oversight
INSERT INTO tbl_tarl_role_permissions (role_id, page_id, can_access)
SELECT r.id, p.id, true
FROM tbl_tarl_roles r
CROSS JOIN tbl_tarl_pages p
WHERE r.name = 'coordinator' AND p.name IN ('Dashboard', 'Schools', 'Users', 'Students', 'Observations', 'Progress', 'Training', 'Visits')
ON CONFLICT (role_id, page_id) DO NOTHING;

-- Partner - partner organization access
INSERT INTO tbl_tarl_role_permissions (role_id, page_id, can_access)
SELECT r.id, p.id, true
FROM tbl_tarl_roles r
CROSS JOIN tbl_tarl_pages p
WHERE r.name = 'partner' AND p.name IN ('Dashboard', 'Schools', 'Analytics', 'Reports', 'Progress')
ON CONFLICT (role_id, page_id) DO NOTHING;

-- Director - leadership oversight
INSERT INTO tbl_tarl_role_permissions (role_id, page_id, can_access)
SELECT r.id, p.id, true
FROM tbl_tarl_roles r
CROSS JOIN tbl_tarl_pages p
WHERE r.name = 'director' AND p.name IN ('Dashboard', 'Schools', 'Users', 'Analytics', 'Reports', 'Progress', 'Settings')
ON CONFLICT (role_id, page_id) DO NOTHING;

-- Intern - limited access for learning
INSERT INTO tbl_tarl_role_permissions (role_id, page_id, can_access)
SELECT r.id, p.id, true
FROM tbl_tarl_roles r
CROSS JOIN tbl_tarl_pages p
WHERE r.name = 'intern' AND p.name IN ('Dashboard', 'Schools', 'Students', 'Training')
ON CONFLICT (role_id, page_id) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON tbl_tarl_role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_page_id ON tbl_tarl_role_permissions(page_id);
CREATE INDEX IF NOT EXISTS idx_permission_audit_role_id ON tbl_tarl_permission_audit(role_id);
CREATE INDEX IF NOT EXISTS idx_permission_audit_created_at ON tbl_tarl_permission_audit(created_at);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tarl_pages_updated_at BEFORE UPDATE ON tbl_tarl_pages FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_tarl_role_permissions_updated_at BEFORE UPDATE ON tbl_tarl_role_permissions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();