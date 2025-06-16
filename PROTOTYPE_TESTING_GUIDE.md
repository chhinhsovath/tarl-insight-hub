# 🧪 Prototype Testing Guide

Complete test user accounts have been created for testing the hierarchical user management system.

## 🔐 **Login Credentials**

| Role | Username | Password | Purpose |
|------|----------|----------|---------|
| **Admin** | `demo_admin` | `admin123` | Full system access, create directors |
| **Director** | `demo_director1` | `director123` | Regional management, create teachers |
| **Director** | `demo_director2` | `director123` | Alternative director for testing |
| **Partner** | `demo_partner1` | `partner123` | Partner-level regional access |
| **Teacher** | `demo_teacher1` | `teacher123` | Create classes and manage students |
| **Teacher** | `demo_teacher2` | `teacher123` | Alternative teacher for testing |
| **Coordinator** | `demo_coordinator1` | `coord123` | School-level coordination |
| **Collector** | `demo_collector1` | `collector123` | Data collection activities |
| **Intern** | `demo_intern1` | `intern123` | Limited access for learning |

## 🔄 **Complete Testing Workflow**

### **Step 1: Admin Setup (demo_admin)**
```
1. Login: demo_admin / admin123
2. Navigate to: /management/hierarchical
3. Go to "User Management" tab
4. Create a new Director:
   - Username: test_director
   - Email: test.director@example.com
   - Role: Director
   - School: Select from available schools
5. Use "Manage" button to assign hierarchy:
   - Assign to specific province/district/school
```

### **Step 2: Director Creates Teachers (demo_director1)**
```
1. Login: demo_director1 / director123
2. Navigate to: /management/hierarchical
3. Notice: Only sees schools in assigned region
4. Go to "User Management" tab
5. Create a new Teacher:
   - Username: test_teacher
   - Email: test.teacher@example.com
   - Role: Teacher
   - School: Select from director's accessible schools
```

### **Step 3: Teacher Creates Classes (demo_teacher1)**
```
1. Login: demo_teacher1 / teacher123
2. Navigate to: /management/hierarchical
3. Go to "Class Management" tab
4. Create new class:
   - Class Name: "Mathematics Grade 5A"
   - Grade Level: Grade 5
   - Academic Year: 2024
   - Subject: Mathematics
5. Teacher is automatically assigned to the class
```

### **Step 4: Teacher Adds Students (demo_teacher1)**
```
1. In "Class Management", click "Manage Students" for the created class
2. Go to "Add New Student" tab
3. Add students:
   - Click "Generate" for Student ID
   - Enter: First Name, Last Name
   - Optional: Date of birth, gender, parent info
4. Students are automatically assigned to the class
```

### **Step 5: Teacher Manages Transcripts (demo_teacher1)**
```
1. Click "Manage Transcripts" for a student
2. Add monthly transcript:
   - Select current month
   - Reading Level: Select from A-P scale
   - Math Level: Select skill level
   - Attendance: Enter percentage
   - Behavior Score: Rate 1-5
   - Notes: Add progress notes
3. Save transcript and view academic history
```

## 🎯 **Role-Specific Testing Scenarios**

### **Admin Testing (demo_admin)**
- ✅ Can see all users globally
- ✅ Can create Directors, Partners, Coordinators
- ✅ Can assign users to any geographic region
- ✅ Can access all schools and data
- ✅ Can manage global system settings

### **Director Testing (demo_director1)**
- ✅ Can only see schools in assigned region
- ✅ Can create Teachers, Coordinators within region
- ✅ Cannot create other Directors or Partners
- ✅ Data is automatically filtered to assigned region
- ✅ Can manage hierarchy assignments for subordinates

### **Teacher Testing (demo_teacher1)**
- ✅ Can create classes in assigned school
- ✅ Can add students to their classes
- ✅ Can manage monthly transcripts for their students
- ✅ Cannot see other teachers' classes/students
- ✅ Cannot create other users

### **Coordinator Testing (demo_coordinator1)**
- ✅ Can view school-level data
- ✅ Can manage students within assigned schools
- ✅ Limited user creation capabilities
- ✅ Focus on coordination activities

### **Collector Testing (demo_collector1)**
- ✅ Can access data collection features
- ✅ Can create observations and visits
- ✅ Limited to data collection scope
- ✅ Cannot manage academic data

## 🔒 **Security Testing**

### **Access Control Verification**
1. **Cross-Role Access**: Try accessing data outside assigned hierarchy
2. **Direct URL Access**: Test accessing management URLs with wrong roles
3. **API Security**: Verify API endpoints respect role permissions
4. **Data Filtering**: Confirm users only see authorized data

### **Expected Behaviors**
- ❌ Teachers cannot see other teachers' students
- ❌ Directors cannot see data outside their regions
- ❌ Lower roles cannot create higher-level users
- ✅ Data automatically filters based on hierarchy
- ✅ Navigation adapts to user role capabilities

## 🐛 **Common Issues & Solutions**

### **Login Issues**
- **Problem**: Cannot login with demo credentials
- **Solution**: Verify user was created successfully in database
- **Check**: `SELECT username, role FROM tbl_tarl_users WHERE username LIKE 'demo_%';`

### **Permission Issues**
- **Problem**: User sees "Access Restricted" message
- **Solution**: Check role permissions in `role_page_permissions` table
- **Fix**: Ensure role has access to `/management/hierarchical` page

### **Data Visibility Issues**
- **Problem**: User cannot see expected schools/data
- **Solution**: Verify hierarchy assignments in `user_*_assignments` tables
- **Fix**: Use Admin account to assign user to appropriate hierarchy

### **Menu Navigation Issues**
- **Problem**: "Hierarchical Management" not showing in menu
- **Solution**: Check if page exists in `page_permissions` table
- **Fix**: Verify role has permission to access the page

## 🚀 **Advanced Testing**

### **Bulk User Creation**
```
1. Login as demo_admin
2. Create multiple directors in different regions
3. Have each director create teachers
4. Verify hierarchy isolation works correctly
```

### **Class and Student Management**
```
1. Login as demo_teacher1
2. Create multiple classes with different subjects
3. Add students to each class
4. Create monthly transcripts spanning several months
5. Verify data tracking and progression
```

### **Cross-Role Collaboration**
```
1. Admin creates organizational structure
2. Directors manage their regions independently
3. Teachers focus on classroom management
4. Verify no unauthorized cross-access occurs
```

## 📊 **Success Metrics**

✅ **Complete Workflow**: Admin → Director → Teacher → Class → Student → Transcript
✅ **Data Security**: Each role sees only authorized data
✅ **User Experience**: Intuitive interface for each role level
✅ **Performance**: Fast loading and responsive interface
✅ **Scalability**: System handles multiple users simultaneously

## 🎉 **Ready for Production**

Once all test scenarios pass successfully, the hierarchical user management system is ready for production use with real organizational data.

**Access Point**: `/management/hierarchical`
**Test Duration**: Allow 30-60 minutes for complete workflow testing
**Recommended**: Test with multiple browser sessions to simulate real multi-user environment