# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Database Operations
```bash
npm run db:generate  # Generate Drizzle migrations
npm run db:migrate   # Run Drizzle migrations

# Manual database setup
node scripts/setup-permissions.js           # Initialize permission system
node scripts/setup-default-permissions.js   # Set default role permissions
node scripts/setup-hierarchy-system.js      # Initialize hierarchical permission system
```

### Important Scripts
```bash
# Database schema management
psql -d database_name -f scripts/99_master_schema.sql    # Apply complete schema
psql -d database_name -f database/permissions_schema.sql # Permission tables only
psql -d database_name -f scripts/hierarchy_schema.sql    # Hierarchical permission tables

# Data population
node importUsers.js  # Import user data
```

## Architecture Overview

This is a **Next.js 15** application implementing a **Teaching at the Right Level (TaRL) management system** with comprehensive role-based access control.

### Core Architecture

**Framework Stack:**
- **Next.js 15** with App Router
- **React 19** with TypeScript
- **PostgreSQL** database with raw SQL queries
- **Tailwind CSS** + **Shadcn/ui** components
- **Lucide React** icons

**Key Directories:**
- `app/(dashboard)/` - Protected dashboard pages with nested routing
- `app/api/` - API routes organized by domain (data/, auth/, etc.)
- `components/` - Reusable UI components
- `lib/` - Core business logic and utilities
- `scripts/` - Database setup and migration scripts

### Authentication & Authorization

**Multi-Layered Security:**
1. **Middleware** (`middleware.ts`) - Session token validation for routes
2. **API-Level** - Individual route protection with role checks
3. **Component-Level** - Permission wrappers and hooks
4. **Database-Level** - Role-based queries and audit trails

**Session Management:**
- Cookie-based sessions with `session-token`
- Context provider (`lib/auth-context.tsx`) for user state
- Automatic redirect to login for unauthorized access

### Database Architecture

**Core Tables:**
- `tbl_tarl_users` - User accounts with role associations
- `tbl_tarl_roles` - Role definitions (Admin, Teacher, Coordinator, etc.)
- `tbl_tarl_schools` - School information
- `page_permissions` - Page/route definitions
- `role_page_permissions` - Role-to-page access mapping
- `page_action_permissions` - Fine-grained action permissions
- `user_menu_order` - Personal menu customization

**Permission System:**
- **Page-Level Permissions**: Control access to entire pages/routes
- **Action-Level Permissions**: Granular control (view, create, update, delete, export, bulk_update)
- **Hierarchical Permissions**: Role-based data access within organizational hierarchy
- **Personal Menu Ordering**: Users can customize navigation order
- **Audit Trail**: Complete history of permission changes

### Key Features

**Permission Management:**
- Dynamic role-based access control
- Drag-and-drop menu ordering (admin global, user personal)
- Real-time permission updates with MenuProvider context
- Comprehensive audit logging

**Data Management:**
- School and user management
- Observation data collection
- Analytics and reporting
- Training progress tracking

**UI Architecture:**
- Responsive design with collapsible sidebar navigation
- Context-based state management (AuthProvider, MenuProvider)
- Error boundaries and loading states
- Toast notifications for user feedback

### Navigation System

**Dynamic Menu Loading:**
- `DynamicSidebarNav` component loads menu from database
- Supports user personal ordering via `user_menu_order` table
- Category-based grouping (Overview, Management, Data Collection, etc.)
- Icon mapping with Lucide React icons

**Menu Customization:**
- Admin: Global menu ordering affects all users (`menu-order-manager.tsx`)
- Users: Personal menu ordering in Settings (`personal-menu-order.tsx`)
- Real-time updates via MenuProvider context

### API Design Patterns

**Consistent Structure:**
- Session validation on protected endpoints
- Role-based access checks
- Structured error responses with status codes
- Comprehensive logging for debugging

**Database Service Layer:**
- `lib/database.ts` - Centralized data access layer
- `lib/action-permissions.ts` - Permission-specific operations
- Error handling with fallback to empty arrays
- Type-safe responses with validation

### Development Patterns

**Component Architecture:**
- Higher-order components for permission wrapping
- Custom hooks for permission checking (`useActionPermissions`)
- Context providers for global state
- Consistent error boundary implementation

**Permission Integration:**
```tsx
// Page-level protection
<ActionPermissionWrapper pageName="schools" action="view">
  <SchoolsList />
</ActionPermissionWrapper>

// Component-level checks
const { canCreate, canUpdate } = useActionPermissions('schools');

// API integration
const success = await ActionPermissionManager.updateActionPermission(
  pageId, role, actionName, isAllowed, changedBy
);
```

**Database Connection:**
- PostgreSQL connection via `pg` library
- Connection pooling for performance
- Environment variable configuration
- Parameterized queries for security

### Important Implementation Details

**Permission System Setup:**
1. Run `node scripts/setup-permissions.js` to initialize tables
2. Use `/api/setup-action-permissions` to enable fine-grained permissions
3. Access management UI at `/settings/page-permissions`

**Menu System Setup:**
1. Default order from `page_permissions.sort_order`
2. User customization via `/settings` → Menu Order tab
3. Admin global ordering at `/settings/page-permissions`

**Error Handling:**
- Defensive programming with Array.isArray() checks
- Fallback to empty arrays on API failures
- Comprehensive console logging for debugging
- User-friendly toast notifications

### File Organization

**Critical Files:**
- `lib/auth-context.tsx` - Authentication state management
- `lib/action-permissions.ts` - Core permission logic
- `lib/hierarchy-permissions.ts` - Hierarchical permission management
- `components/dynamic-sidebar-nav.tsx` - Main navigation
- `components/hierarchy-assignment-manager.tsx` - Hierarchy assignment UI
- `middleware.ts` - Route protection
- `PERMISSION_SYSTEM.md` - Detailed permission documentation
- `HIERARCHY_SYSTEM.md` - Hierarchical permission system documentation

**API Organization:**
- `/api/auth/` - Authentication endpoints
- `/api/data/` - Data management APIs
- `/api/user/` - User-specific operations
- `/api/action-permissions/` - Permission management
- `/api/setup-*` - System initialization

This architecture prioritizes security, scalability, and user experience with comprehensive permission management and flexible customization options.
> make sure all functions in training are implemented and wll working
- I'll perform a comprehensive audit of all training functions to ensure they are fully implemented and working. Let me check each component systematically: