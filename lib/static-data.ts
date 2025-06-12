import type { UserRole } from "./auth-context"

// Static data for the application
export const staticData = {
  // Dashboard stats by role
  dashboardStats: {
    admin: {
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
    teacher: {
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
    collector: {
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
    admin: [
      {
        title: "Manage Schools",
        description: "Add, edit, or view school information",
        icon: "School",
        href: "/schools",
      },
      { title: "User Management", description: "Manage teachers and data collectors", icon: "Users", href: "/users" },
      {
        title: "View Reports",
        description: "Access comprehensive system reports",
        icon: "BarChart3",
        href: "/reports",
      },
      { title: "System Settings", description: "Configure system preferences", icon: "Settings", href: "/settings" },
    ],
    teacher: [
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
    collector: [
      { title: "New Collection", description: "Start new data collection session", icon: "Plus", href: "/collection" },
      { title: "My Observations", description: "View completed observations", icon: "Eye", href: "/observations" },
      { title: "School Visits", description: "Schedule and manage school visits", icon: "MapPin", href: "/visits" },
      { title: "Upload Data", description: "Upload collected assessment data", icon: "Upload", href: "/upload" },
    ],
  },

  // Navigation items by role
  navigation: {
    admin: [
      { name: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
      { name: "Schools", href: "/schools", icon: "School" },
      { name: "Users", href: "/users", icon: "Users" },
      { name: "Reports", href: "/reports", icon: "BarChart3" },
      { name: "Analytics", href: "/analytics", icon: "PieChart" },
      { name: "Settings", href: "/settings", icon: "Settings" },
    ],
    teacher: [
      { name: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
      { name: "My Students", href: "/students", icon: "Users" },
      { name: "Observations", href: "/observations", icon: "Eye" },
      { name: "Progress", href: "/progress", icon: "TrendingUp" },
      { name: "Training", href: "/training", icon: "BookOpen" },
    ],
    collector: [
      { name: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
      { name: "Collection", href: "/collection", icon: "Database" },
      { name: "Observations", href: "/observations", icon: "Eye" },
      { name: "School Visits", href: "/visits", icon: "MapPin" },
      { name: "Reports", href: "/reports", icon: "FileText" },
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
    {
      id: 4,
      name: "Valley Primary",
      district: "Port Elizabeth",
      province: "Eastern Cape",
      students: 298,
      teachers: 12,
      status: "Active",
    },
    {
      id: 5,
      name: "Riverside School",
      district: "Bloemfontein",
      province: "Free State",
      students: 367,
      teachers: 15,
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
    {
      id: 3,
      name: "Zara Patel",
      grade: "Grade 2",
      school: "Greenfield Primary",
      mathLevel: "Grade 2",
      readingLevel: "Grade 3",
      progress: 91,
    },
    {
      id: 4,
      name: "Liam van der Merwe",
      grade: "Grade 5",
      school: "Greenfield Primary",
      mathLevel: "Grade 4",
      readingLevel: "Grade 5",
      progress: 68,
    },
    {
      id: 5,
      name: "Fatima Al-Rashid",
      grade: "Grade 3",
      school: "Greenfield Primary",
      mathLevel: "Grade 3",
      readingLevel: "Grade 4",
      progress: 88,
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
    {
      id: 3,
      school: "Mountain View School",
      teacher: "Mrs. Patel",
      grade: "Grade 2",
      subject: "Mathematics",
      date: "2024-12-08",
      status: "In Progress",
      studentsPresent: 25,
    },
    {
      id: 4,
      school: "Valley Primary",
      teacher: "Mr. Brown",
      grade: "Grade 5",
      subject: "Reading",
      date: "2024-12-07",
      status: "Completed",
      studentsPresent: 29,
    },
  ],

  users: [
    { id: 1, name: "Sarah Johnson", email: "admin@tarl.org", role: "admin", status: "Active", lastLogin: "2024-12-10" },
    {
      id: 2,
      name: "Michael Chen",
      email: "teacher@school.edu",
      role: "teacher",
      school: "Greenfield Primary",
      status: "Active",
      lastLogin: "2024-12-10",
    },
    {
      id: 3,
      name: "Priya Patel",
      email: "collector@tarl.org",
      role: "collector",
      district: "Johannesburg",
      status: "Active",
      lastLogin: "2024-12-09",
    },
    {
      id: 4,
      name: "David Wilson",
      email: "teacher2@school.edu",
      role: "teacher",
      school: "Sunrise Elementary",
      status: "Active",
      lastLogin: "2024-12-08",
    },
  ],
}

export function getStaticData(role: UserRole, dataType: string) {
  return staticData[dataType as keyof typeof staticData]?.[role] || staticData[dataType as keyof typeof staticData]
}
