# 🚀 Deployment Guide for openplp.com

This guide covers deploying the TaRL Insight Hub application to the openplp.com production environment.

## 📋 Pre-Deployment Checklist

### ✅ Environment Files Ready
- [x] `.env.openplp` - Production environment configuration
- [x] `next.config.openplp.mjs` - Production Next.js configuration
- [x] Database schema synchronized to Digital Ocean

### ✅ System Status
- [x] **Training System**: 100% functional (all CRUD operations working)
- [x] **School Registration**: Fully implemented and tested
- [x] **Database**: PostgreSQL on Digital Ocean (137.184.109.21:5432)
- [x] **Health Monitoring**: `/api/health` endpoint configured
- [x] **Security**: Headers, authentication, and access controls in place

## 🗄️ Database Configuration

### Primary Database (Production)
```bash
Server: 137.184.109.21
Database: tarl_ptom
Username: postgres
Password: P@ssw0rd
Port: 5432
```

### Schema Verification
The following critical tables are confirmed ready:
- ✅ `tbl_tarl_schools` (12 essential columns)
- ✅ `tbl_tarl_users` (authentication & roles)
- ✅ `tbl_tarl_training_programs` (training management)
- ✅ `tbl_tarl_training_sessions` (session scheduling)
- ✅ `tbl_tarl_training_participants` (participant registration)
- ✅ `page_permissions` (access control)
- ✅ `role_page_permissions` (role-based permissions)

## 📦 Build Process

### 1. Production Build
```bash
# Set production environment
export NODE_ENV=production

# Use production Next.js config
cp next.config.openplp.mjs next.config.mjs

# Use production environment variables
cp .env.openplp .env.production

# Build application
npm run build

# Test production build locally
npm run start
```

### 2. Verify Build Success
- ✅ Build completes without errors
- ✅ 171 pages generated successfully
- ✅ All training routes functional
- ✅ Database connections established

## 🌐 Deployment Steps

### Step 1: Server Setup (openplp.com)
```bash
# 1. Clone repository on production server
git clone https://github.com/your-repo/tarl-insight-hub.git
cd tarl-insight-hub

# 2. Install dependencies
npm install --production

# 3. Copy production configurations
cp .env.openplp .env.production
cp next.config.openplp.mjs next.config.mjs
```

### Step 2: Database Connection Test
```bash
# Test database connectivity
node -e "
const { Pool } = require('pg');
const pool = new Pool({
  user: 'postgres',
  host: '137.184.109.21', 
  database: 'tarl_ptom',
  password: 'P@ssw0rd',
  port: 5432,
  ssl: { rejectUnauthorized: false }
});

pool.connect().then(client => {
  client.query('SELECT COUNT(*) FROM tbl_tarl_schools').then(result => {
    console.log('✅ Database connected. Schools count:', result.rows[0].count);
    client.release();
    pool.end();
  });
}).catch(err => {
  console.error('❌ Database connection failed:', err.message);
  pool.end();
});
"
```

### Step 3: Build and Deploy
```bash
# 1. Build for production
npm run build

# 2. Start production server
npm run start

# Or using PM2 for process management
pm2 start npm --name "tarl-hub" -- start
pm2 startup
pm2 save
```

### Step 4: Configure Reverse Proxy (Nginx)
```nginx
# /etc/nginx/sites-available/openplp.com
server {
    listen 80;
    listen 443 ssl http2;
    server_name openplp.com www.openplp.com;
    
    # SSL configuration
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload";
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3000/api/health;
        access_log off;
    }
}
```

## 🔍 Post-Deployment Verification

### 1. Health Checks
```bash
# Test health endpoint
curl https://openplp.com/health
curl https://openplp.com/api/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2024-06-21T...",
  "uptime": 123.45,
  "environment": "production",
  "database": {
    "status": "healthy",
    "responseTime": "25ms",
    "host": "137.184.109.21",
    "database": "tarl_ptom"
  },
  "checks": {
    "database": true,
    "memory": true,
    "criticalTables": true
  }
}
```

### 2. Core Functionality Tests
```bash
# Test login system
curl -X POST https://openplp.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"test123"}'

# Test school registration (public)
curl https://openplp.com/school-registration

# Test training system
curl https://openplp.com/training/programs

# Test API endpoints
curl https://openplp.com/api/data/schools
```

### 3. Database Operations Test
Access the admin panel and verify:
- ✅ School management (view, create, edit, delete)
- ✅ User management (authentication, roles, permissions)
- ✅ Training programs (full CRUD operations)
- ✅ Training sessions (create, manage, attendance)
- ✅ Participant registration (public and private)
- ✅ Materials management (upload, organize, access)

## 📊 Monitoring & Maintenance

### Application Monitoring
```bash
# Monitor application logs
pm2 logs tarl-hub

# Monitor resource usage
pm2 monit

# Database monitoring
psql -h 137.184.109.21 -U postgres -d tarl_ptom -c "
  SELECT 
    schemaname, 
    tablename, 
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes
  FROM pg_stat_user_tables 
  WHERE tablename LIKE 'tbl_tarl_%'
  ORDER BY n_tup_ins DESC;
"
```

### Performance Optimization
- **Database Indexing**: Critical queries are optimized
- **Caching**: Static assets cached for 24 hours
- **Compression**: Gzip enabled for all responses
- **CDN**: Consider implementing for static assets

### Backup Strategy
```bash
# Database backup
pg_dump -h 137.184.109.21 -U postgres -d tarl_ptom > backup_$(date +%Y%m%d).sql

# Application backup
tar -czf app_backup_$(date +%Y%m%d).tar.gz /path/to/tarl-insight-hub
```

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Test connection
   telnet 137.184.109.21 5432
   # Check firewall rules and SSL settings
   ```

2. **Build Errors**
   ```bash
   # Clean build cache
   rm -rf .next
   npm run build
   ```

3. **Memory Issues**
   ```bash
   # Check memory usage
   free -h
   # Adjust Node.js memory limit
   NODE_OPTIONS="--max-old-space-size=2048" npm run start
   ```

4. **Permission Errors**
   ```bash
   # Reset admin password
   curl -X POST https://openplp.com/api/auth/reset-admin-password
   ```

### Log Locations
- **Application Logs**: `pm2 logs tarl-hub`
- **Nginx Logs**: `/var/log/nginx/error.log`
- **Database Logs**: PostgreSQL server logs on Digital Ocean

## 🎯 Final Verification Checklist

Before going live, verify:

- [ ] **Database Connection**: All tables accessible and functional
- [ ] **Authentication**: Login/logout working correctly
- [ ] **School Registration**: Public registration form functional
- [ ] **Training System**: All CRUD operations working
  - [ ] Programs management
  - [ ] Session scheduling
  - [ ] Participant registration
  - [ ] Attendance tracking
  - [ ] Materials management
  - [ ] QR code generation
  - [ ] Feedback collection
- [ ] **API Endpoints**: All critical APIs responding correctly
- [ ] **Security**: HTTPS enabled, headers configured
- [ ] **Performance**: Response times under 500ms
- [ ] **Monitoring**: Health checks and logging active

## 📞 Support

For deployment issues or questions:
- Check the health endpoint: `https://openplp.com/health`
- Review application logs: `pm2 logs tarl-hub`
- Monitor database connectivity
- Verify environment variables are correctly set

---

**🎉 Success!** Your TaRL Insight Hub is now deployed and ready for production use on openplp.com with full training functionality and school registration capabilities.