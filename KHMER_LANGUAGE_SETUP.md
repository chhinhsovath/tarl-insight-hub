# Khmer Language Support Setup Guide

This guide explains how to set up and use the Khmer language support for sidebar navigation in the TaRL Insight Hub application.

## 🚀 Quick Setup

### 1. Database Setup (Optional)

The system will automatically create the required columns when needed, but you can also run the setup script manually:

```bash
# Apply the Khmer language support schema
psql -d your_database -f scripts/add-khmer-language-support.sql
```

### 2. Access Admin Interface

1. Login as an admin user
2. Navigate to **Settings** → **Page Permissions** 
3. Click on the **"Translations"** tab

### 3. Add Khmer Translations

In the Translations tab, you can:

- Add Khmer translations for menu item names (`page_name_kh`)
- Add Khmer translations for page titles (`page_title_kh`)
- Save individual translations or bulk save all changes

## 🌐 Language Switching

### For Training Pages

The sidebar automatically switches to Khmer when:
1. User is on a training page (URLs starting with `/training/`)
2. User switches language to Khmer using the training language switcher
3. Khmer translations are available for menu items

### Language Detection

- Uses the training locale system with `'km'` for Khmer
- Automatically falls back to English if Khmer translation is missing
- No additional configuration needed for end users

## 📋 Available Translations

### Pre-configured Khmer Translations

The system comes with pre-configured Khmer translations for common pages:

- **Dashboard** → ផ្ទាំងគ្រប់គ្រង
- **Schools** → សាលារៀន  
- **Users** → អ្នកប្រើប្រាស់
- **Students** → សិស្ស
- **Training** → ការបណ្តុះបណ្តាល
- **Analytics** → ការវិភាគ
- **Reports** → របាយការណ៍
- **Settings** → ការកំណត់

### Training-Specific Translations

- **Training Programs** → កម្មវិធីបណ្តុះបណ្តាល
- **Training Sessions** → វគ្គបណ្តុះបណ្តាល
- **Training Materials** → ឯកសារបណ្តុះបណ្តាល
- **Training Participants** → អ្នកចូលរួមបណ្តុះបណ្តាល
- **QR Codes** → លេខកូដ QR

## 🔧 Technical Details

### Database Schema

The system adds these columns to the `page_permissions` table:

```sql
ALTER TABLE page_permissions 
ADD COLUMN IF NOT EXISTS page_name_kh VARCHAR(200),
ADD COLUMN IF NOT EXISTS page_title_kh VARCHAR(200);
```

### API Integration

The system automatically:
- Checks for column existence before querying
- Gracefully handles missing Khmer columns
- Returns appropriate fallbacks

### Component Integration

The `dynamic-sidebar-nav.tsx` component:
- Detects training locale (`'km'` for Khmer)
- Uses Khmer translations when available
- Falls back to English automatically

## 🛠️ Management Interface

### Admin Features

**Location:** `/settings/page-permissions` → **Translations** tab

**Capabilities:**
- View all pages and their current translations
- Edit Khmer names and titles inline
- Track unsaved changes with visual indicators
- Bulk save multiple translations
- Reset individual translations

**Security:**
- Admin and Director roles only
- Session-based authentication
- Audit trail support

## 🎯 Usage Examples

### 1. Setting Up New Translations

```javascript
// Admin adds new translation via UI
{
  pageId: 123,
  page_name_kh: "ថ្មីនេះ",
  page_title_kh: "ទំព័រថ្មី"
}
```

### 2. Language Switching

```javascript
// User switches to Khmer on training page
// Sidebar automatically updates to show Khmer menu items
locale: 'km' → Shows page_name_kh values
locale: 'en' → Shows page_name values
```

## 🔍 Troubleshooting

### Common Issues

1. **API Returns 500 Error**
   - The fixed API now handles missing columns gracefully
   - Check database connection and user permissions

2. **Translations Not Showing**
   - Verify locale is set to `'km'` 
   - Check if Khmer translations exist for the specific pages
   - Ensure you're on a training page for automatic language switching

3. **Admin Cannot Access Translations**
   - Verify user has admin or director role
   - Check session authentication

### Debugging

Enable console logs to see:
- Language detection: `console.log('isKhmerLocale:', isKhmerLocale)`
- Translation loading: `console.log('Using translation:', translatedName)`
- API responses: Check browser network tab for `/api/user/menu-permissions`

## 🚀 Next Steps

### Future Enhancements

1. **Global Language Selector**
   - Extend beyond training pages
   - System-wide language preference

2. **Additional Languages**
   - Support for more languages (Thai, Vietnamese, etc.)
   - Multi-language content management

3. **User Preferences**
   - Individual language preferences
   - Remember user language choice

4. **Content Translation**
   - Extend beyond navigation to page content
   - Integrated translation management system

## 📞 Support

For technical issues or questions:
1. Check the browser console for error messages
2. Verify database schema and permissions
3. Test the API endpoints directly
4. Review the audit trail for permission changes

The Khmer language support is designed to be robust and backward-compatible, ensuring a smooth experience for both English and Khmer users! 🇰🇭✨