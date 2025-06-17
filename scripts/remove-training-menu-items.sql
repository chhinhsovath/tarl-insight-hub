-- =====================================================
-- REMOVE TRAINING MENU ITEMS FROM SIDEBAR
-- =====================================================

BEGIN;

-- First, let's see what training-related items exist
SELECT 'TRAINING ITEMS BEFORE REMOVAL:' as status;
SELECT id, page_name, page_path 
FROM page_permissions 
WHERE page_name ILIKE '%training%' OR page_path ILIKE '%training%'
ORDER BY id;

-- Remove training items from action permissions (if table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'page_action_permissions') THEN
        DELETE FROM page_action_permissions 
        WHERE page_id IN (
            SELECT id FROM page_permissions 
            WHERE page_name ILIKE '%training%' OR page_path ILIKE '%training%'
        );
        RAISE NOTICE 'Removed training items from page_action_permissions';
    END IF;
END $$;

-- Remove training items from role permissions (if table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'role_page_permissions') THEN
        DELETE FROM role_page_permissions 
        WHERE page_id IN (
            SELECT id FROM page_permissions 
            WHERE page_name ILIKE '%training%' OR page_path ILIKE '%training%'
        );
        RAISE NOTICE 'Removed training items from role_page_permissions';
    END IF;
END $$;

-- Remove training items from user menu order (if table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_menu_order') THEN
        DELETE FROM user_menu_order 
        WHERE page_id IN (
            SELECT id FROM page_permissions 
            WHERE page_name ILIKE '%training%' OR page_path ILIKE '%training%'
        );
        RAISE NOTICE 'Removed training items from user_menu_order';
    END IF;
END $$;

-- Remove training items from hierarchical permissions if they exist
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'page_permissions' AND column_name = 'parent_page_id') THEN
        -- Remove child items first
        DELETE FROM page_permissions 
        WHERE parent_page_id IN (
            SELECT id FROM page_permissions 
            WHERE page_name ILIKE '%training%' OR page_path ILIKE '%training%'
        );
        RAISE NOTICE 'Removed training child pages';
    END IF;
END $$;

-- Remove training items from the legacy tbl_tarl_pages table (if it exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tbl_tarl_pages') THEN
        DELETE FROM tbl_tarl_role_permissions 
        WHERE page_id IN (
            SELECT id FROM tbl_tarl_pages 
            WHERE name ILIKE '%training%' OR path ILIKE '%training%'
        );
        
        DELETE FROM tbl_tarl_pages 
        WHERE name ILIKE '%training%' OR path ILIKE '%training%';
        
        RAISE NOTICE 'Removed training items from legacy tbl_tarl_pages system';
    END IF;
END $$;

-- Finally, remove training items from main page_permissions table
DELETE FROM page_permissions 
WHERE page_name ILIKE '%training%' OR page_path ILIKE '%training%';

-- Verify removal
SELECT 'TRAINING ITEMS AFTER REMOVAL:' as status;
SELECT id, page_name, page_path 
FROM page_permissions 
WHERE page_name ILIKE '%training%' OR page_path ILIKE '%training%'
ORDER BY id;

-- Show confirmation message
SELECT CASE 
    WHEN COUNT(*) = 0 THEN 'SUCCESS: All training menu items have been removed!'
    ELSE 'WARNING: ' || COUNT(*) || ' training items still remain'
END as result
FROM page_permissions 
WHERE page_name ILIKE '%training%' OR page_path ILIKE '%training%';

COMMIT;

RAISE NOTICE 'Training menu items removal completed successfully!';