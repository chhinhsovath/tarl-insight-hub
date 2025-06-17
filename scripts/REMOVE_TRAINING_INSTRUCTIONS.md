# Remove Training Menu Items Instructions

This document explains how to remove the "training" and "training-feedback" menu items from the TaRL Insight Hub sidebar.

## What Has Been Done

### 1. Frontend Protection
- Updated `components/dynamic-sidebar-nav.tsx` to filter out all training-related menu items
- This ensures training items won't appear in the sidebar even if they exist in the database

### 2. Database Cleanup Script
- Created `scripts/remove-training-menu-items.sql` to remove training items from the database
- The script handles all possible table structures and dependencies

### 3. API Enhancement
- Added DELETE method to `app/api/data/pages/route.ts` for future menu management

## How to Remove Training Items from Database

### Option 1: Using psql directly
```bash
# Navigate to the project directory
cd /Users/user/Documents/GitHub/tarl-insight-hub

# Run the SQL script
psql -U postgres -d pratham_tarl -f scripts/remove-training-menu-items.sql

# Or if you have a different database setup:
psql $DATABASE_URL -f scripts/remove-training-menu-items.sql
```

### Option 2: Copy and paste the SQL
1. Open your database management tool (pgAdmin, DBeaver, etc.)
2. Copy the contents of `scripts/remove-training-menu-items.sql`
3. Execute the SQL commands in your database

## What the Script Does

1. **Shows current training items** before removal
2. **Removes dependencies** in this order:
   - Action permissions (`page_action_permissions`)
   - Role permissions (`role_page_permissions`)
   - User menu order (`user_menu_order`)
   - Hierarchical child pages
   - Legacy table items (`tbl_tarl_pages` system)
3. **Removes main training items** from `page_permissions`
4. **Verifies removal** and shows confirmation

## Verification

After running the script, you should see:
- "SUCCESS: All training menu items have been removed!" message
- No training items in the "TRAINING ITEMS AFTER REMOVAL" section
- Training items no longer appear in the sidebar when you refresh the application

## Backup Protection

Even if the database cleanup fails, the frontend filtering in `dynamic-sidebar-nav.tsx` will ensure training items don't appear in the sidebar.

## Files Modified

1. `components/dynamic-sidebar-nav.tsx` - Added filtering logic
2. `scripts/remove-training-menu-items.sql` - Database cleanup script
3. `app/api/data/pages/route.ts` - Added DELETE endpoint
4. `scripts/remove-training-menu-items.js` - Node.js version (requires proper env setup)
5. `scripts/remove-training-api.js` - API-based removal (requires running dev server)

## Notes

- The frontend filtering is permanent and will prevent training items from appearing
- The database cleanup is recommended but not strictly required due to the frontend protection
- All training-related pages and their dependencies are handled by the script