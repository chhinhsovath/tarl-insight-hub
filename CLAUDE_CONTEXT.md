# Claude Code Context & Project Knowledge Base

## Project Overview
**TaRL Insight Hub** - Teaching at the Right Level Management System
- Next.js 15.3.3 with App Router and React 19
- PostgreSQL database with raw SQL queries
- Tailwind CSS + Shadcn/ui components
- Comprehensive training management system with multi-language support (English/Khmer)

## Key Architecture Decisions
- **Font**: Hanuman font for both English and Khmer (standardized typography)
- **Language**: Global language switching with English/Khmer support
- **Loading**: Standardized UniversalLoading component using favicon with glare effects
- **Database**: Digital Ocean PostgreSQL in production, local PostgreSQL for development
- **Authentication**: Cookie-based sessions with role-based access control

## Current Tech Stack
```
Frontend: Next.js 15 + React 19 + TypeScript
Styling: Tailwind CSS + Shadcn/ui
Database: PostgreSQL (Digital Ocean + Local)
Fonts: Hanuman (Google Fonts)
Icons: Lucide React
State: React Context (Auth, Language, Menu)
Deployment: Vercel
```

## Core Systems Implemented

### 1. Authentication System
- Multi-role support: Admin, Director, Teacher, Coordinator, Collector, Participant
- Session-based authentication with middleware protection
- Role-based page access and permissions
- Context: `lib/auth-context.tsx`

### 2. Training Management System (100% Complete)
**Location:** `app/(dashboard)/training/` and `app/training/`
- **Programs**: Full CRUD operations, materials management
- **Sessions**: Scheduling, capacity management, three-stage workflow
- **Participants**: Registration, returning participant detection, attendance tracking
- **QR Codes**: Dynamic generation for registration/attendance/feedback
- **Feedback**: Multi-criteria rating system with analytics
- **Attendance**: Dual-mode (pre-registered + walk-ins), real-time marking
- **Reports**: Comprehensive dashboard with statistics and analytics

### 3. Multi-Language System
- **Global Language Context**: `lib/global-language-context.tsx`
- **Global Translations**: `lib/global-translations.ts`
- **Training Translations**: `lib/training-i18n.ts`
- **Dynamic Menu Translation**: Database-driven with Khmer support
- **Language Switcher**: Global component in navbar

### 4. Navigation & Menu System
- **Dynamic Sidebar**: `components/sidebar.tsx`
- **Menu Context**: `lib/menu-context.tsx`
- **Database-driven menus** with user customization
- **Category-based grouping** with language-responsive labels
- **Personal menu ordering** for users

### 5. Loading System
- **UniversalLoading**: `components/universal-loading.tsx`
- Uses favicon with glare effects and rotating rings
- Contextual messages based on current page
- Multiple sizes and overlay modes

## Database Schema (Key Tables)

### Training System
```sql
tbl_tarl_training_programs
tbl_tarl_training_sessions  
tbl_tarl_training_participants
tbl_tarl_training_materials
tbl_tarl_training_feedback
tbl_tarl_qr_codes
tbl_tarl_master_participants (returning participant system)
```

### User & Permission System
```sql
tbl_tarl_users
tbl_tarl_roles
page_permissions
role_page_permissions
page_action_permissions
user_menu_order
```

### School & Data Management
```sql
tbl_tarl_schools (7,380+ schools)
tbl_tarl_students
tbl_tarl_observations
```

## Current Development Patterns

### Component Structure
```
app/
├── (dashboard)/          # Protected dashboard pages
├── training/            # Public training pages
├── api/                 # API routes
├── globals.css          # Global styles with Hanuman font
└── layout.tsx           # Root layout with font loading

components/
├── ui/                  # Shadcn components
├── sidebar.tsx          # Main navigation
├── universal-loading.tsx # Standardized loading
└── training-*/          # Training-specific components

lib/
├── auth-context.tsx     # Authentication
├── global-language-context.tsx # Language switching
├── database-config.ts   # PostgreSQL connection
└── training-i18n.ts     # Training translations
```

### API Design Patterns
- RESTful endpoints in `app/api/`
- Session validation on protected routes
- Role-based access control
- Structured error responses
- Comprehensive logging

## Recent Major Changes

### Latest Updates (Current Session)
1. **Font Standardization**: Unified Hanuman font for English/Khmer consistency
2. **Loading System**: Created UniversalLoading component with favicon animations
3. **Translation Improvements**: Enhanced Khmer translations across the system
4. **Build Fixes**: Resolved production build errors with training translations

### Previous Sessions
1. **Database Migration**: Successfully migrated from local to Digital Ocean PostgreSQL
2. **Language System**: Implemented global language switching with menu responsiveness
3. **Training System**: Complete implementation of all training management features
4. **Mobile Responsiveness**: Fixed sidebar overlay issues on mobile devices

## Known Issues & Solutions

### Build Issues
- **useTrainingTranslation imports**: Ensure all training pages import the hook properly
- **Font loading**: Hanuman font loaded via Google Fonts with specific weights
- **Translation contexts**: Wrap components in proper providers

### Database
- **Connection**: Using connection pooling via `lib/database-config.ts`
- **Environment**: VERCEL_ENV_TEMPLATE.txt contains DB configuration template
- **Permissions**: Complex role-based system with hierarchical support

## Development Commands
```bash
npm run dev          # Development server
npm run build        # Production build
npm run lint         # ESLint
npm run db:generate  # Drizzle migrations
npm run db:migrate   # Run migrations
```

## Deployment
- **Platform**: Vercel
- **Database**: Digital Ocean PostgreSQL
- **Domain**: openplp.com (production)
- **Environment**: Uses VERCEL_ENV_TEMPLATE.txt for configuration

## Code Quality Standards
- TypeScript throughout
- ESLint + Prettier
- Consistent error handling
- Comprehensive logging
- Mobile-first responsive design
- Accessibility considerations

## Key Files to Remember
- `CLAUDE.md` - Main project documentation
- `components/sidebar.tsx` - Main navigation with language support
- `lib/global-language-context.tsx` - Language switching system
- `app/globals.css` - Unified Hanuman font styling
- `components/universal-loading.tsx` - Standardized loading component
- `lib/training-i18n.ts` - Training system translations

## Current State
- ✅ All core systems implemented and working
- ✅ Font standardization complete
- ✅ Multi-language system fully functional
- ✅ Training system 100% complete
- ✅ Database migrated to production
- ✅ Mobile responsiveness fixed
- ✅ Loading system standardized

## Next Potential Improvements
- Performance optimizations
- Additional language support
- Advanced analytics features
- Mobile app development
- API documentation
- Testing coverage