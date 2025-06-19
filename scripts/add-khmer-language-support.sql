-- Add Khmer language support to page_permissions table
-- This enables bilingual sidebar navigation (English/Khmer)

-- Add page_name_kh column for Khmer translations
ALTER TABLE page_permissions 
ADD COLUMN IF NOT EXISTS page_name_kh VARCHAR(200);

-- Add page_title_kh column for Khmer page titles  
ALTER TABLE page_permissions 
ADD COLUMN IF NOT EXISTS page_title_kh VARCHAR(200);

-- Update existing records with Khmer translations
-- These translations can be updated by admins through the UI later
UPDATE page_permissions SET 
    page_name_kh = CASE 
        WHEN page_name = 'Dashboard' THEN 'ផ្ទាំងគ្រប់គ្រង'
        WHEN page_name = 'Schools' THEN 'សាលារៀន'
        WHEN page_name = 'Users' THEN 'អ្នកប្រើប្រាស់'
        WHEN page_name = 'Students' THEN 'សិស្ស'
        WHEN page_name = 'Analytics' THEN 'ការវិភាគ'
        WHEN page_name = 'Reports' THEN 'របាយការណ៍'
        WHEN page_name = 'Settings' THEN 'ការកំណត់'
        WHEN page_name = 'System Administration' OR page_name = 'Administration' THEN 'ការគ្រប់គ្រងប្រព័ន្ធ'
        WHEN page_name = 'Observations' THEN 'ការសង្កេត'
        WHEN page_name = 'Progress' THEN 'ការវឌ្ឍនភាព'
        WHEN page_name = 'Training' THEN 'ការបណ្តុះបណ្តាល'
        WHEN page_name = 'Training Programs' THEN 'កម្មវិធីបណ្តុះបណ្តាល'
        WHEN page_name = 'Training Sessions' THEN 'វគ្គបណ្តុះបណ្តាល'
        WHEN page_name = 'Training Materials' THEN 'ឯកសារបណ្តុះបណ្តាល'
        WHEN page_name = 'Training Participants' THEN 'អ្នកចូលរួមបណ្តុះបណ្តាល'
        WHEN page_name = 'Training Attendance' THEN 'វត្តមានបណ្តុះបណ្តាល'
        WHEN page_name = 'Training Feedback' THEN 'មតិកែលម្អបណ្តុះបណ្តាល'
        WHEN page_name = 'QR Codes' THEN 'លេខកូដ QR'
        WHEN page_name = 'Visits' THEN 'ការទស្សនកិច្ច'
        WHEN page_name = 'Data Collection' OR page_name = 'Collection' THEN 'ការប្រមូលទិន្នន័យ'
        WHEN page_name = 'Management' THEN 'ការគ្រប់គ្រង'
        WHEN page_name = 'Hierarchical Management' THEN 'ការគ្រប់គ្រងតាមសាខា'
        WHEN page_name = 'Page Permissions' THEN 'សិទ្ធិអនុញ្ញាតទំព័រ'
        WHEN page_name = 'Menu Management' THEN 'ការគ្រប់គ្រងម៉ឺនុយ'
        WHEN page_name = 'User Profile' THEN 'ប្រវត្តិរូបអ្នកប្រើ'
        WHEN page_name = 'Teacher Inputs' THEN 'ការបញ្ចូលរបស់គ្រូ'
        WHEN page_name = 'Surveys' THEN 'ការស្ទង់មតិ'
        ELSE page_name -- Keep English as fallback
    END,
    page_title_kh = CASE 
        WHEN page_title = 'Main Dashboard' THEN 'ផ្ទាំងគ្រប់គ្រងសំខាន់'
        WHEN page_title = 'School Management' THEN 'ការគ្រប់គ្រងសាលារៀន'
        WHEN page_title = 'User Management' THEN 'ការគ្រប់គ្រងអ្នកប្រើប្រាស់'
        WHEN page_title = 'Student Management' THEN 'ការគ្រប់គ្រងសិស្ស'
        WHEN page_title = 'Data Analytics' THEN 'ការវិភាគទិន្នន័យ'
        WHEN page_title = 'System Reports' THEN 'របាយការណ៍ប្រព័ន្ធ'
        WHEN page_title = 'System Settings' THEN 'ការកំណត់ប្រព័ន្ធ'
        WHEN page_title = 'Classroom Observations' THEN 'ការសង្កេតថ្នាក់រៀន'
        WHEN page_title = 'Progress Tracking' THEN 'ការតាមដានការវឌ្ឍនភាព'
        WHEN page_title = 'Training Management' THEN 'ការគ្រប់គ្រងការបណ្តុះបណ្តាល'
        WHEN page_title = 'School Visits' THEN 'ការទស្សនកិច្ចសាលារៀន'
        WHEN page_title = 'Data Collection Tools' THEN 'ឧបករណ៍ប្រមូលទិន្នន័យ'
        ELSE page_title -- Keep English as fallback
    END
WHERE page_name_kh IS NULL OR page_title_kh IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN page_permissions.page_name_kh IS 'Khmer translation of page name for bilingual sidebar navigation';
COMMENT ON COLUMN page_permissions.page_title_kh IS 'Khmer translation of page title for bilingual page headers';

-- Create an index for better performance when querying by language
CREATE INDEX IF NOT EXISTS idx_page_permissions_name_kh ON page_permissions(page_name_kh);

-- Update the v_menu_items view to include Khmer fields (if it exists)
DROP VIEW IF EXISTS v_menu_items;
CREATE OR REPLACE VIEW v_menu_items AS
SELECT 
    p.id,
    p.page_name,
    p.page_name_kh,
    p.page_path,
    p.page_title,
    p.page_title_kh,
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

-- Grant permissions for the updated view
GRANT SELECT ON v_menu_items TO postgres;

SELECT 'Khmer language support added to page_permissions table successfully!' as status;

-- Display sample of updated records
SELECT 
    id,
    page_name,
    page_name_kh,
    page_title,
    page_title_kh
FROM page_permissions 
WHERE page_name_kh IS NOT NULL 
ORDER BY sort_order 
LIMIT 10;