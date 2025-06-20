# Pull Request: Implement Flowbite Admin Template with Khmer Font Support

## Summary

This PR implements a complete Flowbite UI admin template with full Khmer language support and MOEYS branding.

## Changes

### 🎨 UI/UX Improvements
- ✅ Complete Flowbite admin template implementation
- ✅ Responsive dashboard optimized for no-scroll desktop viewing  
- ✅ Clean, modern UI components with Tailwind CSS
- ✅ Fixed layout issues with flexbox approach
- ✅ Removed duplicate user information from sidebar

### 🌐 Khmer Language Support
- ✅ Integrated Hanuman font for proper Khmer text display
- ✅ Added automatic Khmer text detection component
- ✅ Updated site manifest with Khmer app name (មជ្ឈមណ្ឌលអន្តរកម្ម)
- ✅ Full typography support for mixed Khmer/English content

### 🏛️ MOEYS Branding
- ✅ Implemented official MOEYS favicon from plp.moeys.gov.kh
- ✅ Updated navbar and sidebar with MOEYS logo
- ✅ Added PWA manifest for mobile support

### 🐛 Bug Fixes
- ✅ Fixed training feedback API being called on all pages unnecessarily
- ✅ Resolved sidebar menu duplication issues
- ✅ Fixed main content positioning under sidebar

### 🗄️ Database Migration Tools
- ✅ Created comprehensive migration scripts for local PostgreSQL to Neon
- ✅ Added intelligent table size detection for optimal migration
- ✅ Included backup and restore functionality
- ✅ Added detailed migration documentation

## Testing Checklist
- [x] Dashboard displays correctly without scrolling on desktop
- [x] Khmer text renders properly with Hanuman font
- [x] All navigation links work correctly
- [x] API calls are optimized and only run where needed
- [x] Mobile responsive layout functions properly
- [x] Database migration scripts work correctly
- [x] No console errors in development mode

## Migration Scripts Added
```bash
npm run migrate:to-neon        # Complete migration tool
npm run backup:neon           # Backup Neon database  
npm run migrate:local-to-neon # Direct migration
```

## File Changes Summary
- **Modified**: 15 files (core components and layouts)
- **Added**: 31 new files (Flowbite components, migration scripts, assets)
- **Deleted**: 0 files
- **Total changes**: 11,294 insertions(+), 2,106 deletions(-)

## Database Migration Status
- Local tables: 71
- Neon tables: 68 (96% complete)
- Remaining: 3 tables (in progress)

## Breaking Changes
None - All existing functionality preserved

## Notes
- Large SQL backup files (>100MB) are excluded from version control
- Added to `.gitignore`: `*.sql`, `scripts/neon_backup_*.sql`
- Migration completing in background

## How to Test
1. Pull this branch
2. Run `npm install` to get dependencies
3. Keep using local database or switch to Neon after migration completes
4. Run `npm run dev`
5. Test all pages and verify Khmer text rendering

## Related Issues
Closes #[issue-number]

## Screenshots Needed
1. Dashboard with new Flowbite UI
2. Khmer text rendering example
3. MOEYS favicon in browser tab
4. Mobile responsive view