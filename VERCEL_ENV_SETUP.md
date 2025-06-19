# Vercel Environment Variables Setup

## Required Environment Variables

You need to add these environment variables in your Vercel project settings:

### Database Configuration
```
PGUSER=your_database_user
PGPASSWORD=your_database_password
PGHOST=your_database_host
PGPORT=5432
PGDATABASE=your_database_name
```

### For Supabase (if using Supabase):
```
PGUSER=postgres
PGPASSWORD=your_supabase_password
PGHOST=db.xbsndhaswzuvkarvzjyq.supabase.co
PGPORT=5432
PGDATABASE=postgres
```

### Additional Variables (if needed):
```
NEXT_PUBLIC_APP_URL=https://your-vercel-app.vercel.app
SESSION_SECRET=generate_a_secure_random_string_here
```

## How to Add Environment Variables in Vercel:

1. Go to your Vercel project dashboard
2. Click on "Settings" tab
3. Navigate to "Environment Variables"
4. Add each variable with the appropriate value
5. Make sure to select the environments where you want the variables available:
   - Production
   - Preview
   - Development

## Generate a Secure Session Secret:

Run this command locally to generate a secure secret:
```bash
openssl rand -base64 32
```

## After Adding Variables:

1. Click "Save" for each variable
2. Redeploy your project by clicking "Redeploy" in the deployments tab
3. The deployment should now work with the proper environment variables

## Note:

Never commit sensitive environment variables to your repository. The `.env.local` file should be in your `.gitignore` (which it is).