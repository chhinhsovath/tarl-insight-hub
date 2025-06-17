-- WordPress-Style Menu System Enhancement
-- Separate display control from access permissions

-- Add display control columns to page_permissions
ALTER TABLE page_permissions 
ADD COLUMN IF NOT EXISTS is_displayed_in_menu BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS display_condition TEXT, -- JSON for conditional display rules
ADD COLUMN IF NOT EXISTS menu_visibility VARCHAR(20) DEFAULT 'visible', -- visible, hidden, conditional
ADD COLUMN IF NOT EXISTS parent_menu_id INTEGER REFERENCES page_permissions(id),
ADD COLUMN IF NOT EXISTS menu_group VARCHAR(50), -- group menus logically
ADD COLUMN IF NOT EXISTS menu_template VARCHAR(50) DEFAULT 'default', -- different menu templates
ADD COLUMN IF NOT EXISTS css_classes TEXT, -- custom CSS classes for menu items
ADD COLUMN IF NOT EXISTS menu_icon_type VARCHAR(20) DEFAULT 'lucide', -- lucide, custom, emoji
ADD COLUMN IF NOT EXISTS custom_icon_url TEXT, -- for custom icons
ADD COLUMN IF NOT EXISTS badge_text VARCHAR(20), -- notification badges
ADD COLUMN IF NOT EXISTS badge_color VARCHAR(20) DEFAULT 'blue',
ADD COLUMN IF NOT EXISTS requires_confirmation BOOLEAN DEFAULT false, -- for sensitive actions
ADD COLUMN IF NOT EXISTS confirmation_message TEXT,
ADD COLUMN IF NOT EXISTS external_url TEXT, -- for external links
ADD COLUMN IF NOT EXISTS opens_in_new_tab BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_divider BOOLEAN DEFAULT false, -- menu dividers
ADD COLUMN IF NOT EXISTS divider_label VARCHAR(100); -- optional divider labels

-- Create menu display conditions table
CREATE TABLE IF NOT EXISTS menu_display_conditions (
    id SERIAL PRIMARY KEY,
    page_id INTEGER NOT NULL REFERENCES page_permissions(id) ON DELETE CASCADE,
    condition_type VARCHAR(50) NOT NULL, -- role, user_count, feature_flag, time_based, etc.
    condition_operator VARCHAR(20) NOT NULL, -- equals, not_equals, greater_than, less_than, in, not_in
    condition_value TEXT NOT NULL, -- the value to compare against
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create menu themes/templates table
CREATE TABLE IF NOT EXISTS menu_templates (
    id SERIAL PRIMARY KEY,
    template_name VARCHAR(50) NOT NULL UNIQUE,
    template_config JSON NOT NULL, -- configuration for the template
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user menu customizations table (like WordPress user preferences)
CREATE TABLE IF NOT EXISTS user_menu_customizations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES tbl_tarl_users(id) ON DELETE CASCADE,
    page_id INTEGER NOT NULL REFERENCES page_permissions(id) ON DELETE CASCADE,
    is_hidden BOOLEAN DEFAULT false, -- user can hide menu items
    is_pinned BOOLEAN DEFAULT false, -- user can pin favorites
    custom_label VARCHAR(100), -- user can rename menu items
    custom_order INTEGER, -- user custom ordering
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, page_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_page_permissions_display ON page_permissions(is_displayed_in_menu, menu_visibility);
CREATE INDEX IF NOT EXISTS idx_page_permissions_menu_group ON page_permissions(menu_group);
CREATE INDEX IF NOT EXISTS idx_menu_display_conditions_page ON menu_display_conditions(page_id);
CREATE INDEX IF NOT EXISTS idx_user_menu_customizations_user ON user_menu_customizations(user_id);

-- Insert default menu templates
INSERT INTO menu_templates (template_name, template_config) VALUES
('default', '{
    "showIcons": true,
    "showBadges": true,
    "collapsible": true,
    "showGroupLabels": true,
    "animation": "slide",
    "theme": "light"
}'),
('compact', '{
    "showIcons": false,
    "showBadges": false,
    "collapsible": false,
    "showGroupLabels": false,
    "animation": "none",
    "theme": "minimal"
}'),
('admin', '{
    "showIcons": true,
    "showBadges": true,
    "collapsible": true,
    "showGroupLabels": true,
    "animation": "fade",
    "theme": "dark",
    "showAdvanced": true
}')
ON CONFLICT (template_name) DO NOTHING;

-- Update existing menu items with WordPress-style organization
UPDATE page_permissions SET 
    menu_group = CASE 
        WHEN page_path LIKE '/dashboard%' THEN 'overview'
        WHEN page_path LIKE '/training%' THEN 'training'
        WHEN page_path LIKE '/settings%' OR page_path LIKE '/management%' OR page_path LIKE '/users%' THEN 'administration'
        WHEN page_path LIKE '/schools%' OR page_path LIKE '/students%' THEN 'management'
        WHEN page_path LIKE '/collection%' OR page_path LIKE '/observations%' OR page_path LIKE '/visits%' THEN 'data_collection'
        WHEN page_path LIKE '/analytics%' OR page_path LIKE '/reports%' OR page_path LIKE '/progress%' THEN 'analytics'
        ELSE 'other'
    END,
    menu_template = CASE 
        WHEN page_path LIKE '/settings%' THEN 'admin'
        ELSE 'default'
    END;

-- Set some menu items as hidden but still accessible (WordPress style)
UPDATE page_permissions SET 
    is_displayed_in_menu = false,
    menu_visibility = 'hidden'
WHERE page_path IN (
    '/settings/system-logs',
    '/settings/database-maintenance', 
    '/management/bulk-operations',
    '/training/advanced-settings'
);

-- Add conditional display for some items
INSERT INTO menu_display_conditions (page_id, condition_type, condition_operator, condition_value) 
SELECT 
    p.id,
    'role',
    'in',
    '["admin", "director"]'
FROM page_permissions p 
WHERE p.page_path LIKE '/settings%' AND p.menu_level > 1
ON CONFLICT DO NOTHING;

-- Add some notification badges
UPDATE page_permissions SET 
    badge_text = 'New',
    badge_color = 'green'
WHERE page_path = '/training/qr-codes';

UPDATE page_permissions SET 
    badge_text = '5',
    badge_color = 'red'
WHERE page_path = '/training/feedback';

-- Add confirmation for sensitive actions
UPDATE page_permissions SET 
    requires_confirmation = true,
    confirmation_message = 'This will permanently delete the user and all associated data. Continue?'
WHERE page_path LIKE '%/delete%' OR page_name ILIKE '%delete%';

-- Set some external links
UPDATE page_permissions SET 
    external_url = 'https://docs.tarl.edu/training',
    opens_in_new_tab = true
WHERE page_path = '/training/documentation';

-- Add dividers for better organization
INSERT INTO page_permissions (
    page_name, page_path, page_title, menu_group, is_divider, divider_label, 
    sort_order, menu_level, created_at, updated_at
) VALUES 
('divider_training_main', '/divider/training/main', '', 'training', true, 'Core Training', 10, 2, NOW(), NOW()),
('divider_training_advanced', '/divider/training/advanced', '', 'training', true, 'Advanced Features', 50, 2, NOW(), NOW()),
('divider_admin_main', '/divider/admin/main', '', 'administration', true, 'System Administration', 5, 1, NOW(), NOW())
ON CONFLICT (page_path) DO NOTHING;

-- Create a view for easy menu querying (WordPress style)
CREATE OR REPLACE VIEW v_menu_items AS
SELECT 
    p.id,
    p.page_name,
    p.page_path,
    p.page_title,
    p.icon_name,
    p.parent_page_id,
    p.is_parent_menu,
    p.menu_level,
    p.sort_order,
    p.is_displayed_in_menu,
    p.menu_visibility,
    p.menu_group,
    p.menu_template,
    p.css_classes,
    p.menu_icon_type,
    p.custom_icon_url,
    p.badge_text,
    p.badge_color,
    p.requires_confirmation,
    p.confirmation_message,
    p.external_url,
    p.opens_in_new_tab,
    p.is_divider,
    p.divider_label,
    -- Get display conditions
    COALESCE(
        JSON_AGG(
            JSON_BUILD_OBJECT(
                'type', dc.condition_type,
                'operator', dc.condition_operator,
                'value', dc.condition_value
            )
        ) FILTER (WHERE dc.id IS NOT NULL), 
        '[]'::json
    ) as display_conditions,
    -- Get role permissions
    COALESCE(
        JSON_AGG(
            DISTINCT JSON_BUILD_OBJECT(
                'role', rpp.role,
                'allowed', rpp.is_allowed
            )
        ) FILTER (WHERE rpp.id IS NOT NULL), 
        '[]'::json
    ) as role_permissions
FROM page_permissions p
LEFT JOIN menu_display_conditions dc ON p.id = dc.page_id AND dc.is_active = true
LEFT JOIN role_page_permissions rpp ON p.id = rpp.page_id
GROUP BY p.id
ORDER BY p.menu_group, p.menu_level, p.sort_order;

-- Grant permissions
GRANT SELECT ON v_menu_items TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON menu_display_conditions TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON menu_templates TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_menu_customizations TO postgres;
GRANT USAGE, SELECT ON SEQUENCE menu_display_conditions_id_seq TO postgres;
GRANT USAGE, SELECT ON SEQUENCE menu_templates_id_seq TO postgres;
GRANT USAGE, SELECT ON SEQUENCE user_menu_customizations_id_seq TO postgres;

-- Add comments for documentation
COMMENT ON TABLE menu_display_conditions IS 'WordPress-style conditional display rules for menu items';
COMMENT ON TABLE menu_templates IS 'Menu template configurations for different user experiences';
COMMENT ON TABLE user_menu_customizations IS 'User-specific menu customizations and preferences';
COMMENT ON VIEW v_menu_items IS 'Complete menu structure with permissions and display conditions';

COMMENT ON COLUMN page_permissions.is_displayed_in_menu IS 'Whether to show this item in the menu (separate from access permissions)';
COMMENT ON COLUMN page_permissions.menu_visibility IS 'visible, hidden, or conditional display';
COMMENT ON COLUMN page_permissions.display_condition IS 'JSON rules for conditional display';
COMMENT ON COLUMN page_permissions.menu_group IS 'Logical grouping of menu items (like WordPress menu locations)';
COMMENT ON COLUMN page_permissions.badge_text IS 'Notification badge text (e.g., "5", "New")';
COMMENT ON COLUMN page_permissions.requires_confirmation IS 'Show confirmation dialog before navigation';
COMMENT ON COLUMN page_permissions.external_url IS 'External URL for menu items that link outside the app';

SELECT 'WordPress-style menu system enhancement completed successfully!' as status;