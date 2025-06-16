# Training Programs Issue Diagnosis

## Current Status
- ✅ Frontend form component created with tabbed interface (Basic Info + Materials)
- ✅ API endpoints created for programs and materials
- ✅ Database schema defined for both programs and materials
- ✅ QR code feedback URL fixed
- ⚠️ Program saving not working (needs investigation)
- ⚠️ Material upload needs testing

## Key Issues to Check

### 1. Database Connection
- Environment variables: Check .env.local for correct database credentials
- Table existence: Ensure `tbl_tarl_training_programs` and `tbl_tarl_training_materials` exist
- Permissions: Database user needs CREATE, INSERT, UPDATE permissions

### 2. Authentication
- Session validation: Check if user session is valid for training operations
- Permission checks: Ensure training permissions are properly set up
- Role validation: Check if user has required role for program creation

### 3. API Endpoints
- `/api/training/programs` (GET/POST/PUT/DELETE)
- `/api/training/materials` (GET/POST/PUT/DELETE)  
- `/api/training/materials/upload` (POST for file uploads)

### 4. Frontend Debug Steps
1. Open browser dev tools
2. Go to training programs page
3. Try to create a new program
4. Check Console tab for JavaScript errors
5. Check Network tab for API request/response details

### 5. Expected Error Messages
- "Training programs table not found" = Database table missing
- "Database connection failed" = Connection issue
- "Insufficient permissions" = Authorization issue
- "Internal server error" = Check server logs

## Testing Commands

```bash
# Test database connection
node scripts/ensure-training-setup.js

# Test API endpoints
node scripts/test-training-api.js

# Check tables exist
psql -d pratham_tarl -c "\\dt tbl_tarl_training*"

# Check database permissions
psql -d pratham_tarl -c "SELECT * FROM tbl_tarl_training_programs LIMIT 1;"
```

## Quick Fixes

### If Tables Don't Exist
```sql
-- Run this in PostgreSQL:
CREATE TABLE IF NOT EXISTS tbl_tarl_training_programs (
    id SERIAL PRIMARY KEY,
    program_name VARCHAR(255) NOT NULL,
    description TEXT,
    program_type VARCHAR(50) DEFAULT 'standard',
    duration_hours INTEGER DEFAULT 8,
    created_by INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### If Permissions Issue
- Check user role in database
- Verify session token validity
- Ensure training permissions are set up

### If Upload Directory Missing
```bash
mkdir -p uploads/training-materials
chmod 755 uploads/training-materials
```