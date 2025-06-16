# Complete Hierarchical User Management Workflow

This document outlines the complete workflow for the hierarchical user management system implemented in the TaRL platform.

## 🎯 **System Overview**

The platform now supports a complete hierarchical workflow:
**Admin → Director → Teacher → Class → Student → Monthly Transcripts**

## 👥 **Role Hierarchy & Capabilities**

### **1. Admin (Level 1)**
- **Global Access**: Full system control
- **Can Create**: Directors, Partners, Coordinators, Collectors, Interns
- **Can Manage**: All users, schools, classes, students globally
- **Special Powers**: System configuration, global menu ordering, all permissions

### **2. Director & Partner (Level 2)**
- **Regional Access**: Assigned zones, provinces, districts, schools
- **Can Create**: Teachers, Coordinators, Collectors
- **Can Manage**: Users and data within their assigned regions only
- **Hierarchy Assignment**: Must be assigned to specific geographic regions

### **3. Teacher (Level 3)**
- **Class-Level Access**: Their assigned classes and students
- **Can Create**: Classes, Students
- **Can Manage**: Their class students, monthly transcripts
- **Auto-Assignment**: Automatically assigned to classes they create

### **4. Coordinator (Level 3)**
- **School-Level Access**: Students and classes in assigned schools
- **Can Create**: Students (with permission)
- **Can Manage**: School-level academic coordination

### **5. Collector (Level 3)**
- **Data Collection Focus**: Observations, visits, learning data
- **Can Create**: Data collection records
- **Can Manage**: Data collection activities in assigned schools

## 🔄 **Complete Workflow**

### **Step 1: Admin Creates Directors**
```
1. Admin logs into /management/hierarchical
2. Goes to "User Management" tab
3. Creates Director with:
   - Username, email, name
   - Role: Director
   - School assignment (optional)
4. System auto-generates password
5. Director account is created
```

### **Step 2: Admin Assigns Director to Region**
```
1. Admin uses "Manage" button for the Director
2. In Hierarchy Assignment Manager:
   - Assigns Director to Province/District/Zone
   - Director now has access to schools in that region
```

### **Step 3: Director Creates Teachers**
```
1. Director logs into /management/hierarchical
2. Can only see schools in their assigned region
3. Creates Teacher with:
   - Username, email, name
   - Role: Teacher  
   - School assignment from their accessible schools
4. Teacher account is created in Director's region
```

### **Step 4: Teacher Creates Classes**
```
1. Teacher logs into /management/hierarchical
2. Goes to "Class Management" tab
3. Creates class with:
   - Class name (e.g., "Mathematics Grade 5A")
   - Grade level (1-12)
   - Academic year
   - Subject (optional)
4. Teacher is automatically assigned to the class
```

### **Step 5: Teacher Adds Students**
```
1. In "Class Management", teacher clicks "Manage Students"
2. Goes to "Add New Student" tab
3. Adds student with:
   - Auto-generated or custom Student ID
   - First name, last name
   - Date of birth, gender
   - Parent/guardian info
4. Student is automatically assigned to the class
```

### **Step 6: Teacher Manages Monthly Transcripts**
```
1. Teacher clicks "Manage Transcripts" for a student
2. Adds monthly transcript with:
   - Month/Year
   - Reading Level (A-P scale)
   - Math Level (Beginner to Expert)
   - Attendance percentage
   - Behavior score (1-5)
   - Notes
3. Transcripts are saved and tracked over time
```

## 📱 **User Interface Features**

### **Navigation Menu**
- New "Hierarchical Management" page accessible to admins, directors, partners, teachers, coordinators
- Role-based tab visibility
- Contextual help and workflow guidance

### **Smart Form Features**
- Auto-generation of usernames, passwords, student IDs
- Role-based dropdown filtering
- Hierarchy assignment validation
- Real-time form validation

### **Permission Integration**
- Automatic data filtering based on user hierarchy
- Session-based authentication
- Role-based component visibility
- Secure API endpoints with hierarchy checks

## 🔐 **Security & Permissions**

### **Database-Level Security**
- All data queries filtered by user hierarchy
- Session token validation on all endpoints
- Role-based data access control
- Foreign key constraints maintain data integrity

### **API Endpoint Security**
- `/api/data/classes` - Create/read classes with hierarchy filtering
- `/api/data/students` - Create/read students with access control
- `/api/data/students/[id]/transcripts` - Manage transcripts with permission checks
- `/api/data/hierarchy/*` - Hierarchy management endpoints

### **Frontend Security**
- Components check user role before rendering
- Forms validate user permissions
- Dynamic menu based on accessible features
- Error handling for unauthorized access

## 📊 **Data Structure**

### **Core Tables Created**
```sql
-- User hierarchy assignments
user_school_assignments
user_district_assignments  
user_province_assignments
user_zone_assignments

-- Academic structure
tbl_tarl_classes
tbl_tarl_students
teacher_class_assignments
student_transcripts

-- Permission control
role_data_scope
```

### **Key Relationships**
- Users → Hierarchy Assignments → Geographic Regions
- Teachers → Classes → Students → Transcripts
- Roles → Data Scope → Permission Levels

## 🚀 **Getting Started**

### **1. Database Setup**
```bash
# Apply hierarchy schema (already done)
node scripts/setup-hierarchy-system.js
```

### **2. Access the System**
```
1. Navigate to /management/hierarchical
2. Your available tabs depend on your role
3. Follow the workflow: Users → Classes → Students → Transcripts
```

### **3. Role Assignment**
```
1. Admins: Assign Directors to regions
2. Directors: Create Teachers in their regions  
3. Teachers: Create classes and add students
4. All: Maintain accurate data and transcripts
```

## 📈 **Reporting & Analytics**

### **Available Data Views**
- **Admin**: Global view of all users, classes, students
- **Director**: Regional view of their assigned areas
- **Teacher**: Class-specific view of their students
- **Automatic Filtering**: Data automatically filtered by hierarchy

### **Academic Tracking**
- Monthly transcript progression
- Reading and math level advancement
- Attendance and behavior tracking
- Historical academic performance

## 🔧 **Technical Implementation**

### **Frontend Components**
- `HierarchicalUserCreator` - User creation with role filtering
- `ClassManagement` - Class creation and management
- `StudentManagement` - Student and transcript management
- `HierarchyAssignmentManager` - Geographic assignments

### **Backend Logic**
- `HierarchyPermissionManager` - Core permission logic
- Session-based authentication
- Automatic data filtering
- Audit trail for all changes

## ✅ **System Benefits**

1. **Complete Hierarchy**: Full admin → director → teacher → student chain
2. **Data Security**: Users only see data they're authorized for
3. **Easy Management**: Intuitive interface for each role level
4. **Academic Tracking**: Comprehensive student transcript system
5. **Scalable**: Supports complex organizational structures
6. **Audit Ready**: All changes tracked and logged

## 🎉 **Ready for Production**

The hierarchical user management system is now fully operational and ready for use. Users can immediately start creating the complete organizational structure and managing academic data within their authorized scope.

Access the system at: `/management/hierarchical`