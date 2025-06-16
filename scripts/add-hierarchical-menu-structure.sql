-- Add hierarchical menu structure to page_permissions table
-- This enables parent-child relationships for navigation menus

-- Add parent_page_id column to support hierarchy
ALTER TABLE page_permissions 
ADD COLUMN parent_page_id INTEGER REFERENCES page_permissions(id);

-- Add is_parent_menu flag to indicate if item should show as expandable
ALTER TABLE page_permissions 
ADD COLUMN is_parent_menu BOOLEAN DEFAULT FALSE;

-- Add level indicator for nested depth (0 = root, 1 = child, etc.)
ALTER TABLE page_permissions 
ADD COLUMN menu_level INTEGER DEFAULT 0;

-- Create indexes for performance
CREATE INDEX idx_page_permissions_parent_id ON page_permissions(parent_page_id);
CREATE INDEX idx_page_permissions_level ON page_permissions(menu_level);

-- Update existing data to create hierarchical structure
-- Make /settings a parent menu item
UPDATE page_permissions 
SET is_parent_menu = TRUE, 
    menu_level = 0,
    page_name = 'System Administration',
    icon_name = 'Settings'
WHERE page_path = '/settings';

-- Create dedicated pages under /settings hierarchy
-- First, create the main Settings/Administration parent entry
INSERT INTO page_permissions (page_path, page_name, icon_name, sort_order, is_parent_menu, menu_level)
VALUES 
('/admin', 'Administration', 'Settings', 10, TRUE, 0)
ON CONFLICT (page_path) DO NOTHING;

-- Get the parent ID for hierarchy setup
DO $$
DECLARE
    admin_parent_id INTEGER;
BEGIN
    -- Get the admin parent ID
    SELECT id INTO admin_parent_id FROM page_permissions WHERE page_path = '/admin';
    
    -- If we don't have /admin, use /settings as parent
    IF admin_parent_id IS NULL THEN
        SELECT id INTO admin_parent_id FROM page_permissions WHERE page_path = '/settings';
    END IF;
    
    -- Update child pages to be under administration
    UPDATE page_permissions 
    SET parent_page_id = admin_parent_id,
        menu_level = 1,
        sort_order = 11
    WHERE page_path = '/users';
    
    UPDATE page_permissions 
    SET parent_page_id = admin_parent_id,
        menu_level = 1,
        sort_order = 12
    WHERE page_path = '/settings/page-permissions';
    
    UPDATE page_permissions 
    SET parent_page_id = admin_parent_id,
        menu_level = 1,
        sort_order = 13
    WHERE page_path = '/management/hierarchical';
END $$;

-- Update sort orders to group hierarchical items together
UPDATE page_permissions SET sort_order = 10 WHERE page_path = '/admin' OR page_path = '/settings';
UPDATE page_permissions SET sort_order = 99 WHERE parent_page_id IS NOT NULL;

COMMIT;

-- Display the new structure
SELECT 
    id,
    page_path,
    page_name,
    parent_page_id,
    is_parent_menu,
    menu_level,
    sort_order,
    CASE 
        WHEN parent_page_id IS NOT NULL THEN '  └─ ' 
        WHEN is_parent_menu = TRUE THEN '▼ '
        ELSE ''
    END || page_name as display_structure
FROM page_permissions 
ORDER BY sort_order, parent_page_id NULLS FIRST, id;