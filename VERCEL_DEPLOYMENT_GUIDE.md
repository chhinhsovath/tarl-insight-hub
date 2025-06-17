# 🚀 TARL Insight Hub - Vercel + Supabase Deployment Guide

This guide will help you deploy the TARL Insight Hub application using Vercel's free tier with Supabase as the database backend.

## 📋 Prerequisites

- GitHub account
- Vercel account (free tier)
- Supabase account (free tier)
- Access to the TARL Insight Hub repository

---

## 🗄️ Database Setup (Supabase)

### Step 1: Create Supabase Project

1. Go to [Supabase](https://supabase.com) and sign in
2. Click "New Project"
3. Choose organization and name your project: `tarl-insight-hub`
4. Set a strong database password
5. Choose a region close to your users
6. Click "Create new project"

### Step 2: Import Database Schema

1. In your Supabase dashboard, go to the **SQL Editor**
2. Copy and paste the contents of `supabase-migration/schema.sql`
3. Click "Run" to create all tables and indexes

### Step 3: Import Data

Use the CSV files in `supabase-export/` directory:

#### Core Data (Required):
1. **Countries & Geographic Data**:
   ```sql
   -- Import countries
   \copy tbl_tarl_countries FROM 'countries.csv' WITH CSV HEADER;
   
   -- Import zones
   \copy tbl_tarl_zones FROM 'zones.csv' WITH CSV HEADER;
   
   -- Import provinces  
   \copy tbl_tarl_provinces FROM 'provinces.csv' WITH CSV HEADER;
   
   -- Import districts
   \copy tbl_tarl_districts FROM 'districts.csv' WITH CSV HEADER;
   ```

2. **Roles and Permissions**:
   ```sql
   -- Import roles
   \copy tbl_tarl_roles FROM 'roles.csv' WITH CSV HEADER;
   
   -- Import page permissions
   \copy page_permissions FROM 'page_permissions.csv' WITH CSV HEADER;
   
   -- Import role-page permissions
   \copy role_page_permissions FROM 'role_page_permissions.csv' WITH CSV HEADER;
   
   -- Import action permissions
   \copy page_action_permissions FROM 'page_action_permissions.csv' WITH CSV HEADER;
   ```

3. **Users and Schools**:
   ```sql
   -- Import schools
   \copy tbl_tarl_schools FROM 'schools.csv' WITH CSV HEADER;
   
   -- Import users (includes all test accounts)
   \copy tbl_tarl_users FROM 'users.csv' WITH CSV HEADER;
   ```

#### Optional Data:
- Training programs, sessions, participants
- Students and classes
- QR codes and feedback data

### Step 4: Get Database Connection Details

1. In Supabase dashboard, go to **Settings** → **Database**
2. Copy the connection details:
   - **Host**: `db.[project-ref].supabase.co`
   - **Port**: `5432`
   - **Database**: `postgres`
   - **Username**: `postgres`
   - **Password**: [your database password]

---

## 🌐 Vercel Deployment

### Step 1: Connect Repository

1. Go to [Vercel](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository: `tarl-insight-hub`
4. Choose the repository and click "Import"

### Step 2: Configure Environment Variables

In Vercel dashboard, go to **Settings** → **Environment Variables** and add:

```bash
# Database Configuration (Supabase)
PGUSER=postgres
PGHOST=db.[your-project-ref].supabase.co
PGDATABASE=postgres
PGPASSWORD=[your-supabase-password]
PGPORT=5432

# Alternative: Use Supabase connection string
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres

# Next.js Configuration
NEXTAUTH_SECRET=[generate-random-32-char-string]
NEXTAUTH_URL=https://[your-vercel-domain].vercel.app

# Optional: Supabase API (if using Supabase client)
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]
```

### Step 3: Build Settings

Vercel should auto-detect Next.js settings:
- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### Step 4: Deploy

1. Click "Deploy"
2. Wait for the build to complete
3. Test the deployment URL

---

## ⚙️ Environment Variables Guide

### Required Variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `PGUSER` | Database username | `postgres` |
| `PGHOST` | Database host | `db.abc123.supabase.co` |
| `PGDATABASE` | Database name | `postgres` |
| `PGPASSWORD` | Database password | `your-strong-password` |
| `PGPORT` | Database port | `5432` |

### Optional Variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXTAUTH_SECRET` | Authentication secret | `random-32-char-string` |
| `NEXTAUTH_URL` | App URL | `https://yourapp.vercel.app` |

---

## 🔧 Post-Deployment Configuration

### 1. Test Database Connection

Visit your deployed app and check:
- Can you reach the login page?
- Can you log in with test accounts?
- Are permissions working correctly?

### 2. Test User Accounts

Default test accounts (from CSV export):
- **Admin**: `admin` / `admin123`
- **Director**: `director1` / `director123`
- **Teacher**: `teacher1` / `teacher123`
- **Coordinator**: `coordinator1` / `coordinator123`

### 3. Verify Training Module

1. Log in as admin user
2. Navigate to Training modules
3. Test creating a training program
4. Test creating a training session
5. Verify permissions are working

### 4. Check Localization

1. Test English/Khmer language switching
2. Verify training pages show correct translations
3. Test loading indicators

---

## 🛠️ Troubleshooting

### Database Connection Issues

If you get database connection errors:

1. **Check Environment Variables**: Ensure all database variables are correctly set
2. **Verify Supabase Connection**: Test connection in Supabase SQL Editor
3. **Check Network**: Ensure Vercel can reach Supabase (should work by default)

### Build Failures

Common issues and solutions:

1. **TypeScript Errors**: Fix any type errors in the code
2. **Missing Dependencies**: Ensure all packages are in `package.json`
3. **Environment Variables**: Make sure all required env vars are set

### Permission Issues

If permissions aren't working:

1. **Check Data Import**: Ensure all permission tables were imported correctly
2. **Verify User Roles**: Check that users have correct roles assigned
3. **Test Queries**: Use Supabase SQL Editor to test permission queries

---

## 📊 Performance Optimization

### 1. Database Indexes

The schema includes optimized indexes for:
- User lookups by role, email, username
- Permission checks
- Training session queries
- Geographic data queries

### 2. Vercel Edge Functions

Consider using Vercel Edge Functions for:
- Authentication middleware
- Permission checking
- API rate limiting

### 3. Caching Strategy

Implement caching for:
- User permissions (in-memory cache)
- Geographic data (static)
- Training data (with invalidation)

---

## 🔒 Security Considerations

### 1. Environment Variables

- Never commit real passwords to Git
- Use strong, unique passwords for production
- Rotate passwords regularly

### 2. Database Security

- Enable Supabase Row Level Security (RLS)
- Configure appropriate database policies
- Limit database user permissions

### 3. Application Security

- Keep dependencies updated
- Use HTTPS only
- Implement proper CORS policies

---

## 📚 File Structure for Deployment

```
tarl-insight-hub/
├── supabase-migration/
│   ├── schema.sql          # Complete database schema
│   └── README.md           # Migration instructions
├── supabase-export/        # Data files for import
│   ├── users.csv
│   ├── roles.csv
│   ├── page_permissions.csv
│   ├── role_page_permissions.csv
│   ├── page_action_permissions.csv
│   ├── schools.csv
│   ├── training_programs.csv
│   └── [other data files]
├── .env.example            # Environment variable template
├── VERCEL_DEPLOYMENT_GUIDE.md
└── [app files]
```

---

## ✅ Deployment Checklist

- [ ] Supabase project created
- [ ] Database schema imported
- [ ] Core data imported (users, roles, permissions)
- [ ] Vercel project configured
- [ ] Environment variables set
- [ ] Application deployed successfully
- [ ] Database connection tested
- [ ] User authentication working
- [ ] Permission system validated
- [ ] Training modules functional
- [ ] Localization working
- [ ] Performance optimized

---

## 🆘 Support

If you encounter issues:

1. Check Vercel deployment logs
2. Review Supabase database logs
3. Test database queries in Supabase SQL Editor
4. Verify environment variables are correctly set
5. Check the application logs for specific errors

---

## 🎯 Next Steps

After successful deployment:

1. **Custom Domain**: Add your custom domain in Vercel
2. **SSL Certificate**: Ensure HTTPS is properly configured
3. **Monitoring**: Set up error tracking and performance monitoring
4. **Backups**: Configure automated database backups
5. **Documentation**: Update user documentation with production URLs

Your TARL Insight Hub application is now ready for production use! 🚀