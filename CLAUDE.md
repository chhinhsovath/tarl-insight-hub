# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TaRL Insight Hub is a Next.js 15 full-stack educational assessment platform for "Teaching at the Right Level" programs. It manages observations, assessments, users, schools, and analytics with PostgreSQL database integration and AI-powered insights via Claude.

## Technology Stack

- **Framework:** Next.js 15.3.3 with App Router and React 19
- **Language:** TypeScript 5
- **Database:** PostgreSQL with Drizzle ORM 0.44.2
- **Authentication:** NextAuth.js 4.24.11
- **Styling:** Tailwind CSS with shadcn/ui components
- **AI Integration:** Anthropic Claude SDK
- **Forms:** React Hook Form with Zod validation

## Common Commands

```bash
# Development
npm run dev              # Start development server on localhost:3000
npm run build            # Create production build
npm run start            # Start production server
npm run lint             # Run ESLint

# Database
npm run db:generate      # Generate Drizzle migrations from schema changes
npm run db:migrate       # Apply pending migrations to database
```

## Database Architecture

The application uses PostgreSQL with a hierarchical geographical structure:
- **Geographical:** countries → provinces → districts → communes → villages → schools
- **Core Entities:** users (tbl_tarl_users), students, subjects, observations
- **Schema Location:** `/src/lib/schema.ts` (Drizzle) and `/scripts/99_master_schema.sql` (master)

### Database Service Layer

Use the `DatabaseService` class in `lib/database.ts` for all database operations. It provides:
- Connection management with environment-based config
- CRUD operations for all entities
- Error handling and logging
- Transaction support

## App Router Structure

- **`app/(dashboard)/`** - Main application pages with shared dashboard layout
- **`app/api/`** - API routes for data operations and authentication
- **`components/`** - Reusable UI components (shadcn/ui in `components/ui/`)
- **`lib/`** - Utilities, types, and service layers

## Authentication & User Management

- NextAuth.js handles authentication with custom session management
- User roles: Admin, Teacher, Coordinator, Staff
- Role-based permissions implemented throughout the application
- Password hashing with bcrypt
- User context in `lib/auth-context.tsx`

## Key Configuration Files

- **`drizzle.config.ts`** - Database connection and migration config
- **`next.config.mjs`** - Next.js configuration (ESLint/TypeScript errors ignored during builds)
- **`tailwind.config.ts`** - Custom theming with CSS variables and dark mode support
- **`components.json`** - shadcn/ui component configuration

## Development Patterns

### Database Schema Changes
1. Modify schema in `/src/lib/schema.ts`
2. Run `npm run db:generate` to create migration
3. Run `npm run db:migrate` to apply changes
4. Update TypeScript types in `lib/types.ts` if needed

### API Routes
- Use Server Actions where possible for form submissions
- API routes in `app/api/` follow REST conventions
- Database operations go through `DatabaseService` class
- Error responses include proper HTTP status codes

### Component Development
- Follow shadcn/ui patterns for new components
- Use TypeScript interfaces from `lib/types.ts`
- Client components marked with 'use client' directive
- Server components for data fetching by default

## Environment Variables Required

```
# Database
PGHOST=
PGPORT=
PGUSER=
PGPASSWORD=
PGDATABASE=

# NextAuth
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# Anthropic Claude
ANTHROPIC_API_KEY=
```

## Data Flow Architecture

1. **Frontend** → Server Actions/API Routes → **DatabaseService** → **PostgreSQL**
2. **Authentication** handled by NextAuth with custom user context
3. **Form validation** with Zod schemas matching database constraints
4. **AI insights** processed through Claude API integration
5. **Real-time updates** via React state management and data refetching