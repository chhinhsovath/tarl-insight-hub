# Role-Based Permission System

A comprehensive role-based access control (RBAC) system that provides granular page-level permissions for different user roles.

## Overview

This system allows administrators to manage which pages/resources each role can access, with full audit trail support and a user-friendly management interface.

## Features

### ✅ Implemented Features

- **Dynamic Role Management**: Predefined roles with customizable permissions
- **Page-Level Access Control**: Granular control over page access
- **Permission Management Interface**: Admin dashboard for managing permissions
- **Audit Trail**: Complete history of permission changes
- **Route Protection**: Middleware and component-level protection
- **Bulk Operations**: Grant/revoke all permissions for a role
- **Real-time Updates**: Immediate permission changes with user feedback

### 🔧 Core Components

1. **Database Schema** (`database/permissions_schema.sql`)
   - `tbl_tarl_pages`: Defines all protected pages/resources
   - `tbl_tarl_role_permissions`: Junction table for role-page access
   - `tbl_tarl_permission_audit`: Audit trail for all permission changes

2. **API Endpoints**
   - `/api/data/pages` - Page management
   - `/api/data/permissions` - Permission CRUD operations
   - `/api/data/permissions/matrix` - Permission matrix view
   - `/api/data/permissions/check` - Permission verification
   - `/api/data/permissions/audit` - Audit trail
   - `/api/data/permissions/user-pages` - User's accessible pages

3. **React Components**
   - `PermissionManager` - Complete permission management interface
   - `PermissionProtectedRoute` - Route-level protection
   - `usePermissions` hook - Permission state management

4. **Middleware** (`middleware.ts`)
   - Session verification
   - Route-level authentication

## User Roles & Default Permissions

### Admin
- **Access**: Full access to all pages
- **Capabilities**: Can manage all permissions, users, and system settings

### Collector
- **Access**: Dashboard, Schools, Students, Observations, Collection, Visits
- **Focus**: Data collection and field work

### Teacher
- **Access**: Dashboard, Students, Progress, Training
- **Focus**: Classroom management and student progress

### Coordinator
- **Access**: Dashboard, Schools, Users, Students, Observations, Progress, Training, Visits
- **Focus**: Program coordination and oversight

### Partner
- **Access**: Dashboard, Schools, Analytics, Reports, Progress
- **Focus**: Partner organization access to data and reports

### Director
- **Access**: Dashboard, Schools, Users, Analytics, Reports, Progress, Settings
- **Focus**: Leadership oversight and strategic management

### Intern
- **Access**: Dashboard, Schools, Students, Training
- **Focus**: Limited access for learning and basic tasks

## Setup Instructions

### 1. Database Setup

Run the permission system setup script:

```bash
node scripts/setup-permissions.js
```

This will:
- Create the necessary database tables
- Insert default pages/resources
- Set up default role permissions
- Create indexes for performance

### 2. Environment Variables

Ensure these environment variables are set:
```env
PGUSER=your_db_user
PGHOST=your_db_host
PGDATABASE=your_db_name
PGPASSWORD=your_db_password
PGPORT=5432
```

### 3. Frontend Integration

#### Protecting Routes

```tsx
import { PermissionProtectedRoute } from '@/components/permission-protected-route';

export default function MyPage() {
  return (
    <PermissionProtectedRoute>
      <div>Protected content</div>
    </PermissionProtectedRoute>
  );
}
```

#### Using Permission Hook

```tsx
import { usePermissions } from '@/hooks/use-permissions';

function MyComponent() {
  const { hasPermission, checkPermission } = usePermissions();
  
  if (!hasPermission('/admin/settings')) {
    return <div>Access denied</div>;
  }
  
  return <div>Protected content</div>;
}
```

#### Higher-Order Component

```tsx
import { withPermissionProtection } from '@/components/permission-protected-route';

const ProtectedComponent = withPermissionProtection(MyComponent);
```

## API Usage

### Check User Permission

```typescript
// Client-side
const hasAccess = await DatabaseService.checkUserPermission(userId, '/schools');

// Server-side API call
GET /api/data/permissions/check?userId=123&pagePath=/schools
```

### Update Role Permissions

```typescript
await DatabaseService.updateRolePermissions({
  roleId: 2,
  permissions: [
    { pageId: 1, canAccess: true },
    { pageId: 2, canAccess: false }
  ]
});
```

### Get Permission Matrix

```typescript
const matrix = await DatabaseService.getPermissionMatrix();
// Returns complete role-page permission matrix
```

## Permission Management Interface

Access the permission management interface at:
`/settings/page-permissions`

### Features:
- **Matrix View**: See all roles vs pages in a grid
- **Role Overview**: Individual role permission summaries
- **Audit Trail**: Complete history of permission changes
- **Bulk Operations**: Quick grant/revoke all permissions
- **Real-time Updates**: Immediate feedback on changes

## Security Considerations

### Route Protection
- Middleware handles authentication at the edge
- Component-level protection for granular control
- Automatic redirect to login for unauthenticated users

### API Security
- Session token verification on all protected endpoints
- Role-based access to admin functions
- SQL injection protection with parameterized queries

### Audit Trail
- All permission changes are logged
- Includes user who made the change and timestamp
- Tracks before/after values for changes

## Database Schema Details

### Core Tables

```sql
-- Pages/Resources
tbl_tarl_pages (id, name, path, description, created_at, updated_at)

-- Role Permissions
tbl_tarl_role_permissions (id, role_id, page_id, can_access, created_at, updated_at)

-- Audit Trail
tbl_tarl_permission_audit (id, role_id, page_id, action, previous_value, new_value, changed_by, created_at)
```

### Indexes
- `idx_role_permissions_role_id` - Fast role lookups
- `idx_role_permissions_page_id` - Fast page lookups
- `idx_permission_audit_created_at` - Audit trail performance

## Troubleshooting

### Common Issues

1. **Permission Denied Errors**
   - Check if user's role has access to the page
   - Verify session token is valid
   - Check audit log for recent permission changes

2. **Slow Permission Checks**
   - Ensure database indexes are created
   - Consider caching user permissions
   - Check for N+1 query issues

3. **UI Not Updating**
   - Permission changes require page refresh
   - Check browser console for API errors
   - Verify session hasn't expired

### Debug Mode

Enable debug logging in components:
```tsx
const { hasPermission, isLoading } = usePermissions();
console.log('Permission check result:', hasPermission('/path'));
```

## Future Enhancements

### Planned Features
- [ ] Permission inheritance/hierarchy
- [ ] Time-based permissions (temporary access)
- [ ] Resource-level permissions (beyond pages)
- [ ] Permission templates for quick role setup
- [ ] Bulk user role assignments
- [ ] Permission caching for performance
- [ ] API rate limiting based on permissions

### Extension Points
- Custom permission validation logic
- Integration with external auth systems
- Advanced audit reporting
- Permission-based UI component rendering

## Support

For issues or questions about the permission system:
1. Check this documentation
2. Review the audit trail for permission changes
3. Test with admin role to isolate permission issues
4. Check browser network tab for API errors