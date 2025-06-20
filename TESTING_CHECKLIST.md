# Testing Checklist for Flowbite Implementation

## 🎨 UI/UX Testing

### Dashboard Page
- [ ] Visit http://localhost:3000/dashboard
- [ ] Verify no vertical scrolling needed on desktop (1920x1080 or higher)
- [ ] Check all stat cards display correctly
- [ ] Verify Recent Activity sidebar shows properly
- [ ] Test responsive layout on mobile devices

### Navigation
- [ ] Sidebar menu items work correctly
- [ ] Sidebar can be toggled on mobile
- [ ] User menu dropdown functions properly
- [ ] All navigation links lead to correct pages

### Dark Mode
- [ ] Toggle dark mode using moon/sun icon
- [ ] Verify all components adapt to dark theme
- [ ] Check contrast and readability in dark mode

## 🌐 Khmer Language Testing

### Font Display
- [ ] Switch language to Khmer using globe icon
- [ ] Verify Hanuman font loads for Khmer text
- [ ] Check menu items display in Khmer
- [ ] Test mixed Khmer/English content rendering

### Specific Khmer Text Areas
- [ ] Page title: "មជ្ឈមណ្ឌលអន្តរកម្ម TaRL Insight Hub"
- [ ] Menu items when language is switched
- [ ] Training module translations

## 🏛️ MOEYS Branding

### Favicon
- [ ] MOEYS logo appears in browser tab
- [ ] Favicon visible in bookmarks
- [ ] Logo appears in navbar (left side)
- [ ] Logo appears in sidebar header

### PWA Testing
- [ ] Open site on mobile browser
- [ ] Try "Add to Home Screen" option
- [ ] Verify app icon uses MOEYS logo

## 🐛 Bug Fix Verification

### API Optimization
1. Open Developer Console (F12)
2. Navigate to different pages
3. Check Network tab
4. Verify `/api/training/feedback?stats=true` only called on training page
5. No 500 errors in console

### Layout Issues
- [ ] Main content displays beside sidebar (not underneath)
- [ ] No duplicate user information in sidebar
- [ ] Proper spacing between components

## 🗄️ Database Testing (if migration complete)

### Switch to Neon (when ready)
```bash
cp .env.local.neon .env.local
npm run dev
```

### Test Data Operations
- [ ] Login works correctly
- [ ] View schools list
- [ ] View users list
- [ ] Check training modules
- [ ] Verify data integrity

## 📱 Responsive Testing

### Mobile Devices
- [ ] iPhone SE (375px)
- [ ] iPhone 12 Pro (390px)
- [ ] iPad (768px)
- [ ] iPad Pro (1024px)

### Desktop
- [ ] Laptop (1366px)
- [ ] Desktop (1920px)
- [ ] 4K Display (2560px)

## ⚡ Performance Testing

### Page Load Times
- [ ] Dashboard loads under 3 seconds
- [ ] No layout shift after load
- [ ] Images load properly
- [ ] Fonts load without FOUT

### Console Checks
- [ ] No JavaScript errors
- [ ] No failed resource loads
- [ ] No deprecation warnings
- [ ] No mixed content warnings

## 🔄 Migration Testing

### Scripts Functionality
```bash
# Test connection script
node scripts/test-connections.js

# Check remaining tables
node scripts/check-remaining-tables.js

# Compare databases
node scripts/compare-databases.js
```

## 📋 Final Verification

- [ ] All pages load without errors
- [ ] Navigation works throughout the app
- [ ] Data displays correctly
- [ ] Forms submit properly
- [ ] User authentication works
- [ ] Logout functions correctly

## Known Issues to Check
1. Large table migrations may take time
2. Array type columns need special handling
3. Some complex constraints might not migrate

## Sign-off
- [ ] Development environment tested
- [ ] All critical features working
- [ ] Ready for code review
- [ ] Documentation updated

---

**Tester**: ________________  
**Date**: ________________  
**Environment**: Local / Staging / Production