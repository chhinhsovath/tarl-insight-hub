import type { UserRole } from "./auth-context"

// Static data for the application
export const staticData = {
  // Dashboard stats by role
  dashboardStats: {
    Admin: {
      totalSchools: 1247,
      totalTeachers: 8934,
      totalStudents: 156789,
      activeObservations: 342,
      completedSurveys: 1205,
      trainingsSessions: 89,
      recentActivity: [
        { id: 1, type: "school", message: "New school registered: Sunrise Primary", time: "2 hours ago" },
        { id: 2, type: "user", message: "5 new teachers added to the system", time: "4 hours ago" },
        { id: 3, type: "observation", message: "Weekly observation report generated", time: "1 day ago" },
        { id: 4, type: "training", message: "Teacher training completed in Eastern Cape", time: "2 days ago" },
      ],
    },
    Teacher: {
      myStudents: 34,
      completedObservations: 12,
      upcomingTrainings: 3,
      averageProgress: 78,
      recentActivity: [
        { id: 1, type: "observation", message: "Completed observation for Grade 3A", time: "1 hour ago" },
        { id: 2, type: "student", message: "Updated progress for 5 students", time: "3 hours ago" },
        { id: 3, type: "training", message: "Attended TaRL methodology workshop", time: "2 days ago" },
        { id: 4, type: "assessment", message: "Submitted monthly assessment report", time: "3 days ago" },
      ],
    },
    Coordinator: {
      schoolsManaged: 15,
      teachersSupervised: 89,
      observationsThisMonth: 28,
      completionRate: 94,
      recentActivity: [
        { id: 1, type: "visit", message: "Completed school visit at Hillview Primary", time: "30 minutes ago" },
        { id: 2, type: "training", message: "Conducted teacher training session", time: "2 hours ago" },
        { id: 3, type: "report", message: "Monthly progress report submitted", time: "5 hours ago" },
        { id: 4, type: "meeting", message: "District coordination meeting attended", time: "1 day ago" },
      ],
    },
    Staff: {
      observationsThisMonth: 28,
      schoolsVisited: 15,
      dataPointsCollected: 456,
      completionRate: 94,
      recentActivity: [
        { id: 1, type: "observation", message: "Completed observation at Hillview Primary", time: "30 minutes ago" },
        { id: 2, type: "data", message: "Uploaded 23 student assessments", time: "2 hours ago" },
        { id: 3, type: "visit", message: "School visit scheduled for tomorrow", time: "5 hours ago" },
        { id: 4, type: "report", message: "Weekly collection report submitted", time: "1 day ago" },
      ],
    },
  },

  // Quick actions by role
  quickActions: {
    Admin: [
      {
        title: "Manage Schools",
        description: "Add, edit, or view school information",
        icon: "School",
        href: "/schools",
      },
      { title: "User Management", description: "Manage teachers and data collectors", icon: "Users", href: "/users" },
      {
        title: "View Analytics",
        description: "Access comprehensive system analytics",
        icon: "BarChart3",
        href: "/analytics",
      },
      { title: "System Settings", description: "Configure system preferences", icon: "Settings", href: "/settings" },
    ],
    Teacher: [
      { title: "My Students", description: "View and manage student progress", icon: "Users", href: "/students" },
      { title: "New Observation", description: "Record classroom observation", icon: "Eye", href: "/observations/new" },
      {
        title: "Progress Tracking",
        description: "Track student learning progress",
        icon: "TrendingUp",
        href: "/progress",
      },
      {
        title: "Training Materials",
        description: "Access TaRL training resources",
        icon: "BookOpen",
        href: "/training",
      },
    ],
    Coordinator: [
      { title: "School Visits", description: "Schedule and manage school visits", icon: "MapPin", href: "/visits" },
      { title: "Teacher Support", description: "Support and mentor teachers", icon: "Users", href: "/teachers" },
      {
        title: "Progress Reports",
        description: "View district progress reports",
        icon: "TrendingUp",
        href: "/progress",
      },
      { title: "Analytics Dashboard", description: "Access district analytics", icon: "BarChart3", href: "/analytics" },
    ],
    Staff: [
      { title: "New Collection", description: "Start new data collection session", icon: "Plus", href: "/collection" },
      { title: "My Observations", description: "View completed observations", icon: "Eye", href: "/observations" },
      { title: "School Visits", description: "Schedule and manage school visits", icon: "MapPin", href: "/visits" },
      { title: "Upload Data", description: "Upload collected assessment data", icon: "Upload", href: "/upload" },
    ],
  },

  // Sample data for different entities
  schools: [
    {
      id: 1,
      name: "Greenfield Primary School",
      district: "Cape Town Metro",
      province: "Western Cape",
      students: 456,
      teachers: 18,
      status: "Active",
    },
    {
      id: 2,
      name: "Sunrise Elementary",
      district: "Johannesburg",
      province: "Gauteng",
      students: 523,
      teachers: 22,
      status: "Active",
    },
    {
      id: 3,
      name: "Mountain View School",
      district: "Durban",
      province: "KwaZulu-Natal",
      students: 389,
      teachers: 16,
      status: "Active",
    },
  ],

  students: [
    {
      id: 1,
      name: "Amara Johnson",
      grade: "Grade 3",
      school: "Greenfield Primary",
      mathLevel: "Grade 2",
      readingLevel: "Grade 3",
      progress: 85,
    },
    {
      id: 2,
      name: "Thabo Mthembu",
      grade: "Grade 4",
      school: "Greenfield Primary",
      mathLevel: "Grade 3",
      readingLevel: "Grade 4",
      progress: 72,
    },
  ],

  observations: [
    {
      id: 1,
      school: "Greenfield Primary",
      teacher: "Ms. Smith",
      grade: "Grade 3",
      subject: "Mathematics",
      date: "2024-12-10",
      status: "Completed",
      studentsPresent: 28,
    },
    {
      id: 2,
      school: "Sunrise Elementary",
      teacher: "Mr. Johnson",
      grade: "Grade 4",
      subject: "Reading",
      date: "2024-12-09",
      status: "Completed",
      studentsPresent: 32,
    },
  ],

  users: [
    {
      id: 1,
      full_name: "Sarah Johnson",
      email: "admin@tarl.org",
      phone: null,
      role: "Admin",
      position: "System Administrator",
      school_id: null,
      province_id: null,
      district_id: null,
      gender: null,
      years_of_experience: null,
      is_active: true,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
    {
      id: 2,
      full_name: "Michael Chen",
      email: "teacher@school.edu",
      phone: "012-345-678",
      role: "Teacher",
      position: "Classroom Teacher",
      school_id: 1,
      province_id: 1,
      district_id: 1,
      gender: "Male",
      years_of_experience: 5,
      is_active: true,
      created_at: "2024-01-02T00:00:00Z",
      updated_at: "2024-01-02T00:00:00Z",
    },
    {
      id: 3,
      full_name: "Priya Patel",
      email: "coordinator@tarl.org",
      phone: "012-567-890",
      role: "Coordinator",
      position: "District Coordinator",
      school_id: null,
      province_id: 1,
      district_id: 2,
      gender: "Female",
      years_of_experience: 10,
      is_active: true,
      created_at: "2024-01-03T00:00:00Z",
      updated_at: "2024-01-03T00:00:00Z",
    },
    {
      id: 4,
      full_name: "David Lee",
      email: "staff@tarl.org",
      phone: "012-789-012",
      role: "Staff",
      position: "Data Collector",
      school_id: null,
      province_id: 2,
      district_id: 3,
      gender: "Male",
      years_of_experience: 2,
      is_active: true,
      created_at: "2024-01-04T00:00:00Z",
      updated_at: "2024-01-04T00:00:00Z",
    },
  ],
}

export function getStaticData(role: UserRole, dataType: string) {
  const roleData = staticData[dataType as keyof typeof staticData]
  if (typeof roleData === "object" && roleData !== null && role in roleData) {
    return roleData[role as keyof typeof roleData]
  }
  return staticData[dataType as keyof typeof staticData] || []
}
