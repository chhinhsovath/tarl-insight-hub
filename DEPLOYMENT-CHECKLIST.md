# ✅ cPanel Deployment Checklist

Use this checklist to ensure successful deployment of your TaRL Insight Hub to cPanel hosting.

## 🛠️ Pre-Deployment (Local)

### Environment Setup
- [ ] Node.js 18+ installed locally
- [ ] Project cloned and dependencies installed (`npm install`)
- [ ] `.env.production` file created and configured
- [ ] Database credentials obtained from hosting provider
- [ ] Application builds successfully (`npm run build`)

### Code Preparation
- [ ] All recent changes committed to Git
- [ ] Production environment variables set
- [ ] Database connection tested
- [ ] No TypeScript or build errors
- [ ] All features tested locally

## 🌐 Hosting Setup (cPanel)

### Database Configuration
- [ ] PostgreSQL database created in cPanel
- [ ] Database user created with full privileges
- [ ] Database connection details noted
- [ ] Database accessible from application

### cPanel Configuration
- [ ] Node.js support enabled (version 18+)
- [ ] Application directory created
- [ ] Domain/subdomain configured
- [ ] SSL certificate installed (Let's Encrypt recommended)

## 📤 File Upload

### Required Files
- [ ] `.next/` folder (build output)
- [ ] `app/` folder (application code)
- [ ] `components/` folder
- [ ] `lib/` folder (utilities)
- [ ] `public/` folder (static assets)
- [ ] `scripts/` folder (database scripts)
- [ ] `package.json`
- [ ] `next.config.mjs`
- [ ] `.env.production`

### Upload Method
- [ ] Files uploaded via cPanel File Manager OR
- [ ] Files uploaded via FTP/SFTP OR
- [ ] Files uploaded via Git (if supported)

## 🔧 Server Configuration

### Dependencies Installation
- [ ] Navigate to application directory in cPanel terminal
- [ ] Run `npm install --production`
- [ ] Verify all dependencies installed successfully
- [ ] No installation errors

### Node.js Application Setup
- [ ] Node.js app created in cPanel
- [ ] Startup file configured (`server.js` or `npm start`)
- [ ] Environment variables set in cPanel
- [ ] Application started successfully

### Database Schema Import
- [ ] `scripts/99_master_schema.sql` imported
- [ ] Permission system setup scripts run
- [ ] Hierarchy system scripts run
- [ ] Sample data imported (if needed)
- [ ] Database tables created successfully

## 🧪 Testing

### Basic Functionality
- [ ] Application loads at your domain
- [ ] No 500 or 404 errors on main pages
- [ ] Static assets (CSS, JS, images) loading correctly
- [ ] SSL certificate working (https://)

### Authentication & Database
- [ ] Login page accessible
- [ ] User authentication working
- [ ] Database connections successful
- [ ] User roles and permissions functioning
- [ ] Training management features working

### Feature Testing
- [ ] Dashboard loads for different user roles
- [ ] Training sessions creation and management
- [ ] Participant registration and attendance
- [ ] QR code generation and scanning
- [ ] File uploads working (if applicable)
- [ ] Reports and analytics displaying

## 🔍 Performance & Security

### Performance
- [ ] Page load times acceptable
- [ ] No JavaScript errors in browser console
- [ ] Images and assets optimized
- [ ] Caching configured (if available)

### Security
- [ ] Environment variables not exposed
- [ ] Database credentials secure
- [ ] SSL/HTTPS enforced
- [ ] Admin access restricted
- [ ] File upload restrictions in place

## 📊 Post-Deployment

### Monitoring
- [ ] Error logs checked in cPanel
- [ ] Application logs reviewed
- [ ] User access tested across different roles
- [ ] Mobile responsiveness verified

### Documentation
- [ ] Deployment process documented
- [ ] Admin credentials saved securely
- [ ] Database backup procedures established
- [ ] Update procedures documented

## 🆘 Troubleshooting

### Common Issues
- [ ] **Module not found**: Ensure `npm install --production` completed
- [ ] **Database connection failed**: Check `.env.production` credentials
- [ ] **404 on routes**: Verify Node.js app configuration
- [ ] **Build errors**: Fix TypeScript/ESLint issues locally first
- [ ] **Environment variables**: Ensure cPanel variables match `.env.production`

### Support Resources
- [ ] cPanel error logs location known
- [ ] Hosting provider support contact available
- [ ] Local development environment maintained for testing
- [ ] Git repository up to date for rollbacks

## 🎯 Success Criteria

Your deployment is successful when:
- ✅ Application loads without errors
- ✅ Users can log in with different roles
- ✅ Training management features work
- ✅ Database operations function correctly
- ✅ All major features tested and working
- ✅ SSL certificate active
- ✅ Performance acceptable

---

**🔗 Need Help?**
- Review `DEPLOYMENT.md` for detailed instructions
- Run `node scripts/prepare-deployment.js` for automated preparation
- Check cPanel error logs for specific issues
- Contact your hosting provider for Node.js support