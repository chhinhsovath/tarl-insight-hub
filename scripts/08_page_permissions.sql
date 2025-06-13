-- =====================================================
-- PAGE PERMISSIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS page_permissions (
    id SERIAL PRIMARY KEY,
    page_path VARCHAR(255) NOT NULL,
    page_name VARCHAR(255) NOT NULL,
    icon_name VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS role_page_permissions (
    id SERIAL PRIMARY KEY,
    role VARCHAR(50) NOT NULL,
    page_id INTEGER REFERENCES page_permissions(id) ON DELETE CASCADE,
    is_allowed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role, page_id)
);

-- Insert default pages
INSERT INTO page_permissions (page_path, page_name, icon_name) VALUES
    ('/dashboard', 'Dashboard', 'LayoutDashboard'),
    ('/schools', 'Schools', 'School'),
    ('/users', 'Users', 'Users'),
    ('/analytics', 'Analytics', 'BarChart3'),
    ('/reports', 'Reports', 'FileText'),
    ('/settings', 'Settings', 'Settings'),
    ('/students', 'Students', 'Users'),
    ('/observations', 'Observations', 'Eye'),
    ('/progress', 'Progress', 'TrendingUp'),
    ('/training', 'Training', 'BookOpen'),
    ('/visits', 'Visits', 'MapPin'),
    ('/collection', 'Data Collection', 'Database');

-- Insert default permissions for roles
INSERT INTO role_page_permissions (role, page_id, is_allowed)
SELECT 'Admin', id, true FROM page_permissions;

INSERT INTO role_page_permissions (role, page_id, is_allowed)
SELECT 'Teacher', id, is_allowed FROM page_permissions
CROSS JOIN (VALUES
    ('/dashboard', true),
    ('/students', true),
    ('/observations', true),
    ('/progress', true),
    ('/training', true)
) AS default_perms(page_path, is_allowed)
WHERE page_permissions.page_path = default_perms.page_path;

INSERT INTO role_page_permissions (role, page_id, is_allowed)
SELECT 'Coordinator', id, is_allowed FROM page_permissions
CROSS JOIN (VALUES
    ('/dashboard', true),
    ('/schools', true),
    ('/visits', true),
    ('/progress', true),
    ('/analytics', true),
    ('/reports', true)
) AS default_perms(page_path, is_allowed)
WHERE page_permissions.page_path = default_perms.page_path;

INSERT INTO role_page_permissions (role, page_id, is_allowed)
SELECT 'Staff', id, is_allowed FROM page_permissions
CROSS JOIN (VALUES
    ('/dashboard', true),
    ('/collection', true),
    ('/reports', true)
) AS default_perms(page_path, is_allowed)
WHERE page_permissions.page_path = default_perms.page_path;

-- Create function to get allowed pages for a role
CREATE OR REPLACE FUNCTION get_allowed_pages(role_name VARCHAR)
RETURNS TABLE (
    page_path VARCHAR,
    page_name VARCHAR,
    icon_name VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        pp.page_path,
        pp.page_name,
        pp.icon_name
    FROM page_permissions pp
    JOIN role_page_permissions rpp ON pp.id = rpp.page_id
    WHERE rpp.role = role_name
    AND rpp.is_allowed = true
    ORDER BY pp.page_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_allowed_pages TO PUBLIC;
