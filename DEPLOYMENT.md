# Deployment Guide for TaRL Insight Hub

## Pre-Deployment Checklist

### 1. Environment Variables
Create a `.env.production` file with the following variables:

```bash
# Database Configuration
PGUSER=your_production_db_user
PGPASSWORD=your_production_db_password
PGHOST=your_production_db_host
PGPORT=5432
PGDATABASE=your_production_db_name

# Application Settings
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Session Configuration (generate a secure secret)
SESSION_SECRET=your-secure-session-secret-key
```

### 2. Database Setup

#### Initial Setup
```bash
# 1. Connect to your production database
psql -h your_host -U your_user -d your_database

# 2. Run the master schema
psql -h your_host -U your_user -d your_database -f scripts/99_master_schema.sql

# 3. Run additional setup scripts in order
psql -h your_host -U your_user -d your_database -f scripts/training_management_schema.sql
psql -h your_host -U your_user -d your_database -f scripts/create-missing-training-tables.sql
psql -h your_host -U your_user -d your_database -f scripts/create-master-participants-system.sql
psql -h your_host -U your_user -d your_database -f scripts/add-attendance-columns.sql
```

#### Permission System Setup
```bash
# Run these Node.js scripts after deployment
node scripts/setup-permissions.js
node scripts/setup-default-permissions.js
node scripts/setup-hierarchy-system.js
```

### 3. Build & Deployment Options

#### Option A: Vercel Deployment (Recommended)

1. **Connect to GitHub:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Configure environment variables in Vercel dashboard

2. **Configure Build Settings:**
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`

3. **Deploy:**
   - Vercel will automatically deploy on push to main branch

#### Option B: Docker Deployment

Create a `Dockerfile`:
```dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package*.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

#### Option C: Traditional Server Deployment

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Start the production server:**
   ```bash
   npm run start
   ```

3. **Use PM2 for process management:**
   ```bash
   npm install -g pm2
   pm2 start npm --name "tarl-insight-hub" -- start
   pm2 save
   pm2 startup
   ```

### 4. Post-Deployment Setup

#### Initialize Admin Account
1. Access the login page at `/login`
2. Use default admin credentials:
   - Username: admin1
   - Password: admin123
3. **IMPORTANT:** Change the admin password immediately

#### Setup Permissions
1. Navigate to `/settings/setup`
2. Click "Run Setup" to initialize:
   - Page permissions
   - Role permissions
   - Action permissions

#### Create Initial Data
1. Add schools: `/schools/new`
2. Create user accounts: `/users/new`
3. Set up training programs: `/training/programs`

### 5. Security Considerations

#### SSL/TLS
- Ensure HTTPS is enabled
- Use strong SSL certificates
- Enable HSTS headers

#### Database Security
- Use connection pooling
- Enable SSL for database connections
- Restrict database access to application server only

#### Application Security
- Change all default passwords
- Enable rate limiting
- Set up monitoring and alerts
- Regular security updates

### 6. Performance Optimization

#### Caching
- Enable Next.js caching
- Use CDN for static assets
- Configure database query caching

#### Database Optimization
- Run ANALYZE on tables periodically
- Monitor slow queries
- Ensure proper indexing

### 7. Monitoring & Maintenance

#### Application Monitoring
- Set up error tracking (e.g., Sentry)
- Monitor server resources
- Track user sessions

#### Database Maintenance
```bash
# Regular maintenance tasks
VACUUM ANALYZE;
REINDEX DATABASE your_database;
```

#### Backup Strategy
```bash
# Daily database backup
pg_dump -h your_host -U your_user your_database > backup_$(date +%Y%m%d).sql

# Backup uploads directory
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz public/uploads/
```

### 8. Environment-Specific Settings

#### Production Optimizations
Add to `next.config.js`:
```javascript
module.exports = {
  output: 'standalone',
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  reactStrictMode: true,
}
```

### 9. Troubleshooting

#### Common Issues
1. **Database Connection Errors**
   - Verify connection string
   - Check firewall rules
   - Ensure database is accessible

2. **Permission Errors**
   - Run permission setup scripts
   - Check role assignments
   - Verify session handling

3. **Build Failures**
   - Clear `.next` directory
   - Update dependencies
   - Check for TypeScript errors

### 10. Health Checks

Create an API health check endpoint to monitor:
- Database connectivity
- Session management
- File system access
- External service availability

## Deployment Commands Summary

```bash
# Local build test
npm run build
npm run start

# Production deployment
git push origin main  # If using Vercel/automated deployment

# Manual deployment
npm run build
pm2 start npm --name "tarl-insight-hub" -- start

# Database setup
psql -f scripts/99_master_schema.sql
node scripts/setup-permissions.js
```

## Support

For deployment issues, check:
- Application logs
- Database logs
- Network connectivity
- Environment variables

Remember to test thoroughly in a staging environment before deploying to production.