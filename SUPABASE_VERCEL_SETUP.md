# Supabase + Vercel Deployment Guide

## Prerequisites
- Supabase account (free tier is fine)
- Vercel account (free tier is fine)
- Your Supabase project reference: `xbsndhaswzuvkarvzjyq`

## Step 1: Get Your Supabase Database Password

1. Go to your Supabase project dashboard
2. Navigate to Settings → Database
3. Under "Connection string", find your database password
4. If you don't remember it, you can reset it

## Step 2: Set Up Database Schema in Supabase

1. Go to Supabase SQL Editor
2. Create a new query and run these scripts in order:

```sql
-- Run the master schema
-- Copy contents from scripts/99_master_schema.sql

-- Run training schema
-- Copy contents from scripts/training_management_schema.sql

-- Run additional setup scripts as needed
```

## Step 3: Configure Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Click on "Settings" → "Environment Variables"
3. Add these variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://xbsndhaswzuvkarvzjyq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhic25kaGFzd3p1dmthcnZ6anlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyNjc3MjgsImV4cCI6MjA2NDg0MzcyOH0.81UginSeGIP2mJsF4DOcH4cAR75larG69vDrrRNJZHQ

PGUSER=postgres
PGHOST=db.xbsndhaswzuvkarvzjyq.supabase.co
PGDATABASE=postgres
PGPASSWORD=[YOUR_SUPABASE_DATABASE_PASSWORD]
PGPORT=5432

SESSION_SECRET=[GENERATE_A_RANDOM_STRING]
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://[YOUR_VERCEL_APP].vercel.app
```

To generate SESSION_SECRET:
```bash
openssl rand -base64 32
```

## Step 4: Deploy to Vercel

### Option A: Using Vercel CLI
```bash
npm i -g vercel
vercel --prod
```

### Option B: Using GitHub Integration
1. Push your code to GitHub
2. Import the repository in Vercel
3. It will auto-deploy on every push

## Step 5: Initialize Data After Deployment

1. Access your deployed app at `https://your-app.vercel.app`
2. Login with default credentials:
   - Username: `admin1`
   - Password: `admin123`
3. **IMPORTANT**: Change the admin password immediately
4. Navigate to `/settings/setup` and run the setup scripts

## Connection Pooling (Important for Vercel)

Supabase provides connection pooling which is essential for serverless environments like Vercel. The connection string format is:

```
postgres://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
```

This is already configured in the code to use the pooler endpoint.

## Troubleshooting

### "Too many connections" error
- This means you need to use the pooler endpoint
- Make sure PGHOST includes `.pooler.supabase.com`

### "Environment variable not found" error
- Double-check all variables are added in Vercel
- Click "Redeploy" after adding variables

### Database connection timeout
- Check if your Supabase project is active
- Verify the database password is correct
- Ensure you're using the correct host

## Free Tier Limits

### Vercel Free Tier
- 100GB bandwidth/month
- Serverless functions: 100GB-hours
- Perfect for this application

### Supabase Free Tier
- 500MB database
- 1GB file storage
- 50,000 monthly active users
- More than enough for TaRL Insight Hub

## Security Notes

1. Never commit `.env.production` to Git
2. Use strong passwords for database
3. Enable RLS (Row Level Security) in Supabase for sensitive tables
4. Regularly update dependencies

## Next Steps

After successful deployment:
1. Set up custom domain (optional)
2. Configure email service for notifications
3. Set up monitoring and alerts
4. Create database backups schedule