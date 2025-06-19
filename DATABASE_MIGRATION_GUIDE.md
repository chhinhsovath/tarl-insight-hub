# TaRL Insight Hub - Database Migration Guide

## 🎯 **Complete Local to Neon.tech Migration**

This guide will help you migrate your complete local PostgreSQL database to Neon.tech with all data intact.

---

## 📊 **Database Overview**

### Source Database (Local PostgreSQL)
- **Database Name**: `pratham_tarl`
- **PostgreSQL Version**: 17.5
- **Total Tables**: 71 tables
- **Total Size**: ~120MB
- **Key Data**: 
  - 126,635 student-teacher-school relationships
  - 63,128 student enrollments  
  - 7,380 schools
  - 14,073 villages
  - Complete training system data
  - Full user management and permissions

### Target Database (Neon.tech)
- **Host**: `ep-flat-firefly-a4zesph4-pooler.us-east-1.aws.neon.tech`
- **Database**: `neondb`  
- **User**: `neondb_owner`
- **Port**: 5432

---

## 🎁 **What's Included in Your Backup**

### ✅ **Complete Database Backup Files**
1. **`database-backup-v17-20250619_221518.tar.gz`** - Complete compressed backup
2. **Individual files available:**
   - `complete_database.dump` - PostgreSQL custom format (8.0MB)
   - `complete_database.sql` - Plain SQL format (56MB) 
   - `schema_only.sql` - Database structure only (269KB)
   - `data_only.sql` - Data only (56MB)
   - `table_statistics.txt` - Table sizes and row counts
   - `restore-to-neon.sh` - Automated restoration script

### 📋 **Top Tables by Size**
| Table | Size | Records | Description |
|-------|------|---------|-------------|
| `tbl_tarl_tc_st_sch` | 40 MB | 126,635 | Teacher-Class-Student-School relationships |
| `tbl_tarl_student_enrollments` | 26 MB | 63,128 | Student enrollment data |
| `tbl_tarl_schools` | 2.5 MB | 7,380 | School information |
| `tbl_tarl_villages` | 1.4 MB | 14,073 | Village data |
| `tbl_tarl_users` | 200 KB | 27 | User accounts |
| `page_action_permissions` | 200 KB | 365 | Permission system |
| `tbl_tarl_training_sessions` | 64 KB | 6 | Training sessions |

---

## 🚀 **Migration Methods**

### **Method 1: Automated Script (Recommended)**
```bash
# Extract the backup
tar -xzf database-backup-v17-20250619_221518.tar.gz

# Run the restoration script
./restore-to-neon-final.sh
```

### **Method 2: Manual using pg_restore**
```bash
# Set your Neon password
export PGPASSWORD="your_neon_password"

# Restore using custom format
pg_restore \
  --host=ep-flat-firefly-a4zesph4-pooler.us-east-1.aws.neon.tech \
  --port=5432 \
  --username=neondb_owner \
  --dbname=neondb \
  --verbose \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  complete_database.dump
```

### **Method 3: Manual using SQL**
```bash
# Set your Neon password  
export PGPASSWORD="your_neon_password"

# Restore using SQL format
psql \
  --host=ep-flat-firefly-a4zesph4-pooler.us-east-1.aws.neon.tech \
  --port=5432 \
  --username=neondb_owner \
  --dbname=neondb \
  --file=complete_database.sql
```

---

## ✅ **Post-Migration Verification**

### 1. **Test Database Connection**
```bash
curl https://tarl-insight-hub.vercel.app/api/test-db
```

### 2. **Test Admin Login**
- URL: https://tarl-insight-hub.vercel.app/login
- Username: `admin1`  
- Password: `admin123`

### 3. **Verify Key Data**
```sql
-- Check user count
SELECT COUNT(*) FROM tbl_tarl_users;

-- Check schools
SELECT COUNT(*) FROM tbl_tarl_schools;

-- Check training sessions
SELECT COUNT(*) FROM tbl_tarl_training_sessions;

-- Check permissions
SELECT COUNT(*) FROM page_permissions;
```

---

## 🔍 **Key Tables Explained**

### **Core System Tables**
- `tbl_tarl_users` - User accounts and authentication
- `tbl_tarl_roles` - User roles (admin, teacher, coordinator, etc.)
- `page_permissions` - Menu and page access control
- `page_action_permissions` - Fine-grained permissions (view, create, edit, delete)

### **Academic Data Tables** 
- `tbl_tarl_schools` - School master data
- `tbl_tarl_students` - Student information
- `tbl_tarl_student_enrollments` - Class enrollments
- `tbl_tarl_tc_st_sch` - Teacher-Class-Student-School relationships

### **Training System Tables**
- `tbl_tarl_training_programs` - Training program definitions
- `tbl_tarl_training_sessions` - Individual training sessions
- `tbl_tarl_training_participants` - Training registrations
- `tbl_tarl_training_feedback` - Post-training feedback
- `tbl_tarl_qr_codes` - QR codes for training activities

### **Geographic Data Tables**
- `tbl_tarl_provinces` - Province/state data
- `tbl_tarl_districts` - District data  
- `tbl_tarl_communes` - Commune data
- `tbl_tarl_villages` - Village data

---

## 🛠️ **Troubleshooting**

### **Common Issues & Solutions**

#### Issue: "Permission denied" errors
**Solution**: Remove the `--clean` flag or use `--no-owner --no-privileges`

#### Issue: "Relation already exists" errors  
**Solution**: Use schema-only + data-only approach:
```bash
# First restore schema
psql --file=schema_only.sql [connection params]

# Then restore data
psql --file=data_only.sql [connection params]
```

#### Issue: "Password authentication failed"
**Solution**: Double-check your Neon.tech password and connection details

#### Issue: Large table timeout
**Solution**: Use parallel restoration:
```bash
pg_restore --jobs=4 complete_database.dump [connection params]
```

---

## 📁 **File Structure**

```
database-backup-v17-20250619_221518/
├── README.md                    # Detailed restoration guide
├── complete_database.dump       # Custom format backup (recommended)
├── complete_database.sql        # SQL format backup  
├── schema_only.sql              # Database structure only
├── data_only.sql                # Data only
├── table_statistics.txt         # Table sizes and row counts
├── database_metadata.txt        # Database info
├── restore-to-neon.sh          # Automated restoration script
└── checksums.txt               # File integrity verification
```

---

## 🎉 **Success Criteria**

After successful migration, you should have:

✅ **All 71 tables restored** with correct data  
✅ **Admin login working** (admin1/admin123)  
✅ **Training system functional** with all features  
✅ **Permission system active** with proper access control  
✅ **All academic data preserved** (schools, students, etc.)  
✅ **Geographic data intact** (provinces, districts, villages)  

---

## 📞 **Support**

If you encounter any issues during migration:

1. Check the backup file integrity using `checksums.txt`
2. Try different restoration methods (custom → SQL → schema+data)
3. Review the PostgreSQL logs for specific error messages
4. Use the debug endpoint: `https://tarl-insight-hub.vercel.app/api/test-db`

---

## 📅 **Migration Summary**

- **Backup Created**: June 19, 2025 at 22:15:21 +07
- **PostgreSQL Version**: 17.5  
- **Total Size**: ~120MB compressed to ~30MB
- **Total Tables**: 71 tables
- **Total Records**: ~210,000+ records
- **Migration Time**: ~5-10 minutes depending on connection speed

Your complete TaRL Insight Hub database is ready for migration to Neon.tech! 🚀