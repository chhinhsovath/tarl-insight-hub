# 🚀 cPanel Deployment Guide for TaRL Insight Hub

This guide explains how to deploy your Next.js application to cPanel hosting (like Namecheap shared hosting).

## 📋 Prerequisites

1. **cPanel hosting account** with:
   - Node.js support (version 18+ recommended)
   - PostgreSQL database access
   - File manager or FTP access

2. **Local development environment** with:
   - Node.js 18+
   - npm or yarn
   - Git

## 🛠️ Step-by-Step Deployment

### Step 1: Prepare Your Local Environment

1. **Clone and install dependencies:**
   ```bash
   git clone <your-repo-url>
   cd tarl-insight-hub
   npm install
   ```

2. **Create production environment file:**
   ```bash
   cp .env.production.example .env.production
   ```

3. **Update `.env.production` with your hosting details:**
   ```env
   # Database (from your cPanel PostgreSQL settings)
   PGUSER=your_cpanel_db_user
   PGHOST=your_cpanel_db_host
   PGDATABASE=your_cpanel_db_name
   PGPASSWORD=your_cpanel_db_password
   PGPORT=5432

   # Application
   NODE_ENV=production
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   NEXTAUTH_SECRET=generate-a-secure-random-string
   NEXTAUTH_URL=https://yourdomain.com
   ```

### Step 2: Build for Production

**Important:** Your app uses server-side features (API routes, database connections). You have two deployment options:

#### Option A: Node.js App (Recommended)
If your hosting supports Node.js applications:

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Upload entire project** (except `node_modules`) to your hosting via cPanel File Manager or FTP

3. **In cPanel, navigate to your app directory and run:**
   ```bash
   npm install --production
   npm run start
   ```

#### Option B: Static Export (Limited Functionality)
For basic static hosting (⚠️ **API routes won't work**):

1. **Build static version:**
   ```bash
   npm run build:cpanel
   ```

2. **Upload only the `out` folder contents** to your `public_html` directory

### Step 3: Database Setup

1. **Create PostgreSQL database** in cPanel
2. **Import your database schema:**
   ```bash
   # Run these SQL files in order:
   scripts/99_master_schema.sql
   scripts/setup-permissions.js (convert to SQL)
   scripts/hierarchy_schema.sql
   ```

3. **Update database connection** in your `.env.production`

### Step 4: Configure cPanel

1. **Set up Node.js App** (if supported):
   - Go to "Node.js" in cPanel
   - Create new application
   - Set startup file: `server.js` or use `npm start`
   - Set environment variables from your `.env.production`

2. **Configure domain/subdomain** to point to your app

### Step 5: Post-Deployment

1. **Test your application:**
   - Visit your domain
   - Test login functionality
   - Verify database connections

2. **Set up SSL certificate** (usually free with Let's Encrypt in cPanel)

## 📁 File Structure for Upload

### For Node.js Deployment:
```
your-app-folder/
├── .next/                 # Build output
├── app/                   # Your app directory
├── components/            # React components
├── lib/                   # Utilities
├── public/                # Static assets
├── scripts/               # Database scripts
├── package.json           # Dependencies
├── next.config.mjs        # Next.js config
├── .env.production        # Environment variables
└── node_modules/          # Dependencies (install on server)
```

### For Static Export:
```
public_html/
├── _next/                 # Static assets
├── api/                   # ⚠️ Won't work in static
├── images/                # Image assets
├── index.html             # Home page
├── 404.html              # Error page
└── [other-pages].html     # Generated pages
```

## ⚠️ Important Limitations

### Static Export Limitations:
- ❌ **API routes don't work** (all `/api/*` endpoints)
- ❌ **No server-side rendering**
- ❌ **No database connections**
- ❌ **No authentication**
- ❌ **No file uploads**

### Recommended Approach:
Use **Node.js deployment** to maintain full functionality, including:
- ✅ User authentication
- ✅ Database operations
- ✅ Training management
- ✅ File uploads
- ✅ API endpoints

## 🔧 Troubleshooting

### Common Issues:

1. **"Module not found" errors:**
   - Ensure all dependencies are installed: `npm install --production`

2. **Database connection failed:**
   - Verify database credentials in `.env.production`
   - Check if PostgreSQL service is enabled

3. **404 errors on routes:**
   - Ensure your hosting supports Node.js applications
   - Check if routing is configured correctly

4. **Environment variables not working:**
   - Make sure `.env.production` is in the root directory
   - Verify cPanel environment variable configuration

### Getting Help:
- Check cPanel error logs
- Contact your hosting provider for Node.js support
- Test locally first: `npm run build && npm start`

## 🎯 Quick Checklist

- [ ] Node.js hosting enabled in cPanel
- [ ] PostgreSQL database created and configured
- [ ] Environment variables updated
- [ ] Application built successfully
- [ ] Files uploaded to server
- [ ] Dependencies installed on server
- [ ] Domain/subdomain configured
- [ ] SSL certificate installed
- [ ] Application tested and working

---

**Note:** This application is designed as a full-stack Next.js app with database integration. For best results, use hosting that supports Node.js applications rather than static hosting.