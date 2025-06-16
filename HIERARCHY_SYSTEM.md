# Hierarchical Permission System

This document explains the comprehensive hierarchical permission system implemented for the TaRL Insight Hub platform.

## Overview

The hierarchical permission system provides role-based data access control where users can only see and manage data within their assigned organizational hierarchy. This ensures data security and appropriate access levels for different user roles.

## Role Hierarchy

### 1. Admin
- **Hierarchy Level**: 1 (Highest)
- **Access**: Global - Full access to all data and system management
- **Capabilities**:
  - Manage all schools, users, students, observations
  - Full CRUD operations on all data
  - System configuration and user management
  - Global menu ordering and permission management

### 2. Director & Partner
- **Hierarchy Level**: 2
- **Access**: Regional - Access to assigned zones, provinces, districts, or schools
- **Capabilities**:
  - Manage schools, teachers, and students in their assigned regions
  - View and update data within their hierarchy
  - Create and manage users in their regions
  - Generate reports for their assigned areas
  - Cannot delete core data (schools, users)

### 3. Teacher
- **Hierarchy Level**: 3
- **Access**: Class-level - Access to their assigned classes and students
- **Capabilities**:
  - Manage their class students and academic records
  - Create and update student monthly transcripts
  - View observations related to their classes
  - Update their own profile information

### 4. Collector
- **Hierarchy Level**: 3
- **Access**: School-level - Access to data collection activities
- **Capabilities**:
  - Create and manage observations, visits, and learning data
  - Access schools assigned to them for data collection
  - View students and schools for data collection purposes
  - Export collected data

## Database Schema

### Core Hierarchy Tables

#### User Assignment Tables
- `user_zone_assignments` - Assigns users to geographic zones
- `user_province_assignments` - Assigns users to provinces
- `user_district_assignments` - Assigns users to districts
- `user_school_assignments` - Assigns users to specific schools
- `teacher_class_assignments` - Assigns teachers to classes

#### Educational Structure Tables
- `tbl_tarl_classes` - Class definitions with school associations
- `tbl_tarl_students` - Student records with class and school links
- `role_data_scope` - Defines what data each role can access at different levels

#### Enhanced Role Definition
- Added `hierarchy_level`, `can_manage_hierarchy`, and `max_hierarchy_depth` to `tbl_tarl_roles`

### Views for Easy Access
- `user_accessible_schools` - Shows all schools a user can access through various assignments
- `teacher_classes_students` - Shows teacher-class-student relationships

## Permission Logic

### Two-Layer Permission System

1. **Page-Level Permissions**: Basic access to application pages
2. **Hierarchy-Level Permissions**: Data access within the user's assigned hierarchy

### Permission Checking Flow

```typescript
// 1. Check basic page permission
const hasPageAccess = await ActionPermissionManager.canPerformAction(
  userRole, pageName, actionName
);

// 2. For hierarchical roles, check data access
if (hasPageAccess && isHierarchicalRole(userRole)) {
  const hasDataAccess = await HierarchyPermissionManager.canAccessData(
    userId, dataType, action, resourceId
  );
  return hasDataAccess;
}

return hasPageAccess;
```

### Data Filtering

Data queries are automatically filtered based on user hierarchy:

```sql
-- Example: Schools accessible to a Director
SELECT s.* FROM tbl_tarl_schools s
WHERE s.province_id IN (user_assigned_provinces)
   OR s.district_id IN (user_assigned_districts)
   OR s.id IN (user_assigned_schools);
```

## Implementation Components

### Backend Components

1. **`HierarchyPermissionManager`** (`lib/hierarchy-permissions.ts`)
   - Core hierarchy logic and permission checking
   - User hierarchy retrieval and data access validation

2. **Enhanced `ActionPermissionManager`** (`lib/action-permissions.ts`)
   - Integrated hierarchy checking with existing permissions
   - Page-to-data-type mapping

3. **Enhanced `DatabaseService`** (`lib/database.ts`)
   - Hierarchy-aware data fetching methods
   - User assignment management

### API Endpoints

- `/api/data/hierarchy/schools` - Get user's accessible schools
- `/api/data/hierarchy/students` - Get user's accessible students
- `/api/data/hierarchy/classes` - Get teacher's classes
- `/api/data/hierarchy/assign` - Manage hierarchy assignments

### Frontend Components

1. **`HierarchyAssignmentManager`** (`components/hierarchy-assignment-manager.tsx`)
   - UI for managing user hierarchy assignments
   - Visual representation of user's access scope

## Setup and Configuration

### 1. Database Setup

```bash
# Apply hierarchy schema
psql -d your_database -f scripts/hierarchy_schema.sql

# Run setup script
node scripts/setup-hierarchy-system.js
```

### 2. Role Configuration

The setup script automatically configures default permissions for each role. You can customize these by modifying the `role_data_scope` table.

### 3. User Assignment

Use the `HierarchyAssignmentManager` component or API endpoints to assign users to their appropriate hierarchy levels:

```typescript
// Assign a Director to a province
await DatabaseService.assignUserToHierarchy({
  userId: directorId,
  assignmentType: 'province',
  assignmentId: provinceId,
  assignedBy: adminUserId
});

// Assign a Teacher to a class
await DatabaseService.assignUserToHierarchy({
  userId: teacherId,
  assignmentType: 'class',
  assignmentId: classId,
  assignedBy: adminUserId
});
```

## Usage Examples

### Director Managing Regional Data

```typescript
// Director sees only schools in their assigned provinces/districts
const schools = await DatabaseService.getSchools({ 
  userId: directorId 
});

// Automatically filtered to their region
const users = await DatabaseService.getUsers({ 
  userId: directorId 
});
```

### Teacher Managing Class Data

```typescript
// Teacher sees only their assigned classes
const classes = await DatabaseService.getTeacherClasses(teacherId);

// Teacher sees only students in their classes
const students = await DatabaseService.getAccessibleStudents(teacherId);

// Manage student transcripts
const transcripts = await DatabaseService.getStudentTranscripts(
  studentId, 
  { month: '2024-01', year: '2024' }
);
```

### Collector Data Collection

```typescript
// Collector sees schools assigned to them
const schools = await DatabaseService.getAccessibleSchools(collectorId);

// Create observations for assigned schools
const observation = await DatabaseService.createObservation({
  school_id: schoolId,
  collector_id: collectorId,
  observation_data: {...}
});
```

## Security Features

1. **Automatic Data Filtering**: All data queries are automatically filtered based on user hierarchy
2. **Multi-Level Validation**: Both page and data permissions are checked
3. **Audit Trail**: All hierarchy assignments and permission changes are logged
4. **Fail-Safe Defaults**: Users have no access unless explicitly granted

## Performance Considerations

1. **Indexed Queries**: All hierarchy tables have appropriate indexes
2. **Cached Hierarchy**: User hierarchy is retrieved once and cached per request
3. **Optimized Views**: Pre-built views for common hierarchy queries
4. **Efficient Filtering**: SQL-level filtering reduces data transfer

## Troubleshooting

### Common Issues

1. **User sees no data**: Check hierarchy assignments in `user_*_assignments` tables
2. **Permission denied**: Verify role permissions in `role_data_scope` table
3. **Slow queries**: Ensure indexes are created and up-to-date

### Debug Commands

```sql
-- Check user's hierarchy assignments
SELECT * FROM user_accessible_schools WHERE user_id = ?;

-- Verify role permissions
SELECT * FROM role_data_scope WHERE role_name = ?;

-- Check specific permission
SELECT * FROM page_action_permissions 
WHERE role = ? AND action_name = ?;
```

## Future Enhancements

1. **Time-Based Permissions**: Temporary access assignments
2. **Dynamic Hierarchy**: Runtime hierarchy modifications
3. **Cross-Region Collaboration**: Shared access between regions
4. **Advanced Reporting**: Hierarchy-based analytics and reporting
5. **Mobile App Integration**: Hierarchy-aware mobile applications

## Migration Notes

When migrating from the basic permission system:

1. Existing page permissions are preserved
2. All users start with no hierarchy assignments
3. Admins retain full access
4. Manual assignment of users to hierarchy levels is required
5. Test thoroughly before production deployment

This hierarchical system provides a robust, scalable foundation for managing complex organizational data access patterns while maintaining security and performance.