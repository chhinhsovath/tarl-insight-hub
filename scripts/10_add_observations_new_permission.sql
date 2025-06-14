-- Add /observations/new page to page_permissions table if it doesn't exist
INSERT INTO page_permissions (page_path, page_name, icon_name)
VALUES ('/observations/new', 'New Observation', 'Eye')
ON CONFLICT (page_path) DO NOTHING;

-- Grant permissions for 'Admin' role to 'New Observation' page
INSERT INTO role_page_permissions (role, page_id, is_allowed)
SELECT 'Admin', id, TRUE
FROM page_permissions
WHERE page_path = '/observations/new'
ON CONFLICT (role, page_id) DO UPDATE SET is_allowed = TRUE;

-- Grant permissions for 'Teacher' role to 'New Observation' page
INSERT INTO role_page_permissions (role, page_id, is_allowed)
SELECT 'Teacher', id, TRUE
FROM page_permissions
WHERE page_path = '/observations/new'
ON CONFLICT (role, page_id) DO UPDATE SET is_allowed = TRUE;

-- Grant permissions for 'Collector' role to 'New Observation' page
INSERT INTO role_page_permissions (role, page_id, is_allowed)
SELECT 'Collector', id, TRUE
FROM page_permissions
WHERE page_path = '/observations/new'
ON CONFLICT (role, page_id) DO UPDATE SET is_allowed = TRUE;

-- Grant permissions for 'Coordinator' role to 'New Observation' page
INSERT INTO role_page_permissions (role, page_id, is_allowed)
SELECT 'Coordinator', id, TRUE
FROM page_permissions
WHERE page_path = '/observations/new'
ON CONFLICT (role, page_id) DO UPDATE SET is_allowed = TRUE; 