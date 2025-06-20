# Digital Ocean Database Deployment Guide

## Your Database Configuration

**Server Details:**
- Host: `137.184.109.21`
- Database: `tarl_ptom`
- Username: `postgres`
- Password: `P@ssw0rd`
- Root Password: `6UYNIx4uWaVzkBy`
- Port: `5432`

## Local vs Production Setup

### 🏠 Local Development
Your `.env.local` file is configured to use your local PostgreSQL:
- Host: `localhost`
- Database: `pratham_tarl`
- This remains unchanged for local development

### 🌐 Production Deployment (Vercel)
Use your Digital Ocean server for production deployment.

## Step-by-Step Vercel Deployment

### 1. Set Environment Variables in Vercel

Go to your Vercel project → Settings → Environment Variables

Add these variables one by one:

```bash
PGUSER=postgres
PGHOST=137.184.109.21
PGDATABASE=tarl_ptom
PGPASSWORD=P@ssw0rd
PGPORT=5432

DATABASE_URL=postgres://postgres:P%40ssw0rd@137.184.109.21:5432/tarl_ptom
DATABASE_URL_UNPOOLED=postgres://postgres:P%40ssw0rd@137.184.109.21:5432/tarl_ptom

POSTGRES_URL=postgres://postgres:P%40ssw0rd@137.184.109.21:5432/tarl_ptom
POSTGRES_URL_NON_POOLING=postgres://postgres:P%40ssw0rd@137.184.109.21:5432/tarl_ptom
POSTGRES_USER=postgres
POSTGRES_HOST=137.184.109.21
POSTGRES_PASSWORD=P@ssw0rd
POSTGRES_DATABASE=tarl_ptom
POSTGRES_URL_NO_SSL=postgres://postgres:P%40ssw0rd@137.184.109.21:5432/tarl_ptom

NODE_ENV=production
```

**Important Notes:**
- Set Environment to "Production" for each variable
- The password `P@ssw0rd` becomes `P%40ssw0rd` in URL strings (@ becomes %40)

### 2. Generate Session Secret

Run this command to generate a secure session secret:
```bash
openssl rand -base64 32
```

Add the output as `SESSION_SECRET` in Vercel environment variables.

### 3. Database Schema Setup

Before first deployment, ensure your Digital Ocean database has the required tables:

#### Option A: Import from Local
```bash
# Export from local
pg_dump -h localhost -U postgres -d pratham_tarl > local_backup.sql

# Import to Digital Ocean
psql -h 137.184.109.21 -U postgres -d tarl_ptom < local_backup.sql
```

#### Option B: Run Schema Scripts
```bash
# Connect to Digital Ocean database
psql -h 137.184.109.21 -U postgres -d tarl_ptom

# Run schema setup
\i scripts/99_master_schema.sql
\i scripts/training_management_schema.sql
\i database/permissions_schema.sql
```

### 4. Deploy

Once environment variables are set, trigger a new deployment:
- Push code to GitHub (already done)
- Vercel will automatically redeploy with new database settings

## Testing the Deployment

### 1. Check Database Connection
Visit: `https://your-app.vercel.app/api/health`

Should return:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "..."
}
```

### 2. Test Login
- Try logging in with your admin credentials
- Check if dashboard loads properly
- Verify training system functions

## Database Security Considerations

### 🔒 Security Best Practices

1. **Firewall Configuration**
   - Ensure your Digital Ocean server allows connections from Vercel IPs
   - Consider restricting to specific IP ranges if possible

2. **SSL Connection**
   - The app will automatically use SSL for remote connections
   - No additional configuration needed

3. **Connection Pooling**
   - The app uses connection pooling (max 20 connections)
   - Suitable for production workloads

## Troubleshooting

### Connection Issues
If deployment fails with database connection errors:

1. **Check Firewall**: Ensure port 5432 is open on Digital Ocean server
2. **Verify Credentials**: Test connection manually:
   ```bash
   psql -h 137.184.109.21 -U postgres -d tarl_ptom
   ```
3. **Check Environment Variables**: Ensure all variables are set correctly in Vercel

### Performance Optimization
- Monitor connection usage in Vercel function logs
- Consider database indexing for large datasets
- Use connection pooling efficiently

## Summary

✅ **Local Development**: Uses `localhost` database (unchanged)  
✅ **Production**: Uses Digital Ocean database `137.184.109.21`  
✅ **Environment Variables**: Configured in `VERCEL_ENV_TEMPLATE.txt`  
✅ **Security**: SSL connections and connection pooling enabled  
✅ **Schema**: TaRL training system fully supported  

Your TaRL Insight Hub is now configured to use your Digital Ocean PostgreSQL database for production deployment while keeping local development unchanged.