// Global translations interface
export interface GlobalTranslations {
  // App
  appTitle: string;
  appSubtitle: string;
  
  // Navigation
  dashboard: string;
  schools: string;
  students: string;
  users: string;
  analytics: string;
  reports: string;
  settings: string;
  observations: string;
  progress: string;
  training: string;
  visits: string;
  
  // Common actions
  add: string;
  edit: string;
  delete: string;
  save: string;
  cancel: string;
  search: string;
  filter: string;
  export: string;
  import: string;
  submit: string;
  reset: string;
  back: string;
  next: string;
  previous: string;
  
  // Status
  active: string;
  inactive: string;
  pending: string;
  completed: string;
  cancelled: string;
  approved: string;
  rejected: string;
  
  // Common phrases
  loading: string;
  noData: string;
  error: string;
  success: string;
  confirmation: string;
  
  // Dashboard
  goodMorning: string;
  goodAfternoon: string;
  goodEvening: string;
  welcomeToDashboard: string;
  totalSchools: string;
  totalStudents: string;
  activeUsers: string;
  trainingSessions: string;
  recentActivity: string;
  systemOverview: string;
  chartVisualizationArea: string;
  manageSchools: string;
  manageUsers: string;
  viewAnalytics: string;
  newSchoolRegistered: string;
  trainingSessionCompleted: string;
  newUserCreated: string;
  reportGenerated: string;
  hoursAgo: string;
  dayAgo: string;
  daysAgo: string;
  warning: string;
  welcome: string;
  logout: string;
  login: string;
  profile: string;
  notifications: string;
  
  // Page titles
  schoolManagement: string;
  studentManagement: string;
  userManagement: string;
  trainingManagement: string;
  settingsManagement: string;
  
  // Form labels
  name: string;
  email: string;
  phone: string;
  address: string;
  date: string;
  time: string;
  description: string;
  status: string;
  role: string;
  permissions: string;
}

// English translations
export const enTranslations: GlobalTranslations = {
  // App
  appTitle: 'TaRL Insight Hub',
  appSubtitle: 'Hub',
  
  // Navigation
  dashboard: 'Dashboard',
  schools: 'Schools',
  students: 'Students',
  users: 'Users',
  analytics: 'Analytics',
  reports: 'Reports',
  settings: 'Settings',
  observations: 'Observations',
  progress: 'Progress',
  training: 'Training',
  visits: 'Visits',
  
  // Common actions
  add: 'Add',
  edit: 'Edit',
  delete: 'Delete',
  save: 'Save',
  cancel: 'Cancel',
  search: 'Search',
  filter: 'Filter',
  export: 'Export',
  import: 'Import',
  submit: 'Submit',
  reset: 'Reset',
  back: 'Back',
  next: 'Next',
  previous: 'Previous',
  
  // Status
  active: 'Active',
  inactive: 'Inactive',
  pending: 'Pending',
  completed: 'Completed',
  cancelled: 'Cancelled',
  approved: 'Approved',
  rejected: 'Rejected',
  
  // Common phrases
  loading: 'Loading...',
  noData: 'No data available',
  error: 'Error',
  success: 'Success',
  confirmation: 'Confirmation',
  warning: 'Warning',
  welcome: 'Welcome',
  logout: 'Sign out',
  login: 'Sign in',
  profile: 'Profile',
  notifications: 'Notifications',
  
  // Dashboard
  goodMorning: 'Good morning',
  goodAfternoon: 'Good afternoon',
  goodEvening: 'Good evening',
  welcomeToDashboard: 'Welcome to your TaRL Insight Hub dashboard',
  totalSchools: 'Total Schools',
  totalStudents: 'Total Students',
  activeUsers: 'Active Users',
  trainingSessions: 'Training Sessions',
  recentActivity: 'Recent Activity',
  systemOverview: 'System Overview',
  chartVisualizationArea: 'Chart visualization area',
  manageSchools: 'Manage schools',
  manageUsers: 'Manage users',
  viewAnalytics: 'View analytics',
  newSchoolRegistered: 'New school registered',
  trainingSessionCompleted: 'Training session completed',
  newUserCreated: 'New user created',
  reportGenerated: 'Report generated',
  hoursAgo: 'hours ago',
  dayAgo: 'day ago',
  daysAgo: 'days ago',
  
  // Page titles
  schoolManagement: 'School Management',
  studentManagement: 'Student Management',
  userManagement: 'User Management',
  trainingManagement: 'Training Management',
  settingsManagement: 'Settings Management',
  
  // Form labels
  name: 'Name',
  email: 'Email',
  phone: 'Phone',
  address: 'Address',
  date: 'Date',
  time: 'Time',
  description: 'Description',
  status: 'Status',
  role: 'Role',
  permissions: 'Permissions',
};

// Khmer translations
export const khTranslations: GlobalTranslations = {
  // App
  appTitle: 'ប្រព័ន្ធគ្រប់គ្រង TaRL',
  appSubtitle: 'មជ្ឈមណ្ឌលព័ត៌មាន',
  
  // Navigation
  dashboard: 'ផ្ទាំងគ្រប់គ្រង',
  schools: 'សាលាសិក្សា',
  students: 'សិស្សានុសិស្ស',
  users: 'អ្នកប្រើប្រាស់',
  analytics: 'ការវិភាគទិន្នន័យ',
  reports: 'របាយការណ៍',
  settings: 'ការកំណត់ប្រព័ន្ធ',
  observations: 'ការតាមដានថ្នាក់រៀន',
  progress: 'ការរីកចម្រើនសិស្ស',
  training: 'ការបណ្តុះបណ្តាលគ្រូ',
  visits: 'ការទស្សនកិច្ច',
  
  // Common actions
  add: 'បន្ថែម',
  edit: 'កែសម្រួល',
  delete: 'លុប',
  save: 'រក្សាទុក',
  cancel: 'បោះបង់',
  search: 'ស្វែងរក',
  filter: 'តម្រង',
  export: 'នាំចេញ',
  import: 'នាំចូល',
  submit: 'ដាក់ស្នើ',
  reset: 'កំណត់ឡើងវិញ',
  back: 'ថយក្រោយ',
  next: 'បន្ទាប់',
  previous: 'មុន',
  
  // Status
  active: 'សកម្ម',
  inactive: 'អសកម្ម',
  pending: 'កំពុងរង់ចាំ',
  completed: 'បានបញ្ចប់',
  cancelled: 'បានបោះបង់',
  approved: 'បានអនុម័ត',
  rejected: 'បានបដិសេធ',
  
  // Common phrases
  loading: 'កំពុងផ្ទុក...',
  noData: 'មិនមានទិន្នន័យ',
  error: 'កំហុស',
  success: 'ជោគជ័យ',
  confirmation: 'ការបញ្ជាក់',
  warning: 'ការព្រមាន',
  welcome: 'សូមស្វាគមន៍',
  logout: 'ចាកចេញ',
  login: 'ចូល',
  profile: 'ប្រវត្តិរូប',
  notifications: 'ការជូនដំណឹង',
  
  // Dashboard
  goodMorning: 'អរុណសួស្តី',
  goodAfternoon: 'រសៀលសួស្តី',
  goodEvening: 'ល្ងាចសួស្តី',
  welcomeToDashboard: 'សូមស្វាគមន៍មកកាន់ផ្ទាំងគ្រប់គ្រង TaRL Insight Hub របស់អ្នក',
  totalSchools: 'សាលារៀនសរុប',
  totalStudents: 'សិស្សានុសិស្សសរុប',
  activeUsers: 'អ្នកប្រើប្រាស់សកម្ម',
  trainingSessions: 'វគ្គបណ្តុះបណ្តាល',
  recentActivity: 'សកម្មភាពថ្មីៗ',
  systemOverview: 'ទិដ្ឋភាពទូទៅនៃប្រព័ន្ធ',
  chartVisualizationArea: 'តំបន់បង្ហាញក្រាផ',
  manageSchools: 'គ្រប់គ្រងសាលារៀន',
  manageUsers: 'គ្រប់គ្រងអ្នកប្រើប្រាស់',
  viewAnalytics: 'មើលការវិភាគ',
  newSchoolRegistered: 'បានចុះឈ្មោះសាលារៀនថ្មី',
  trainingSessionCompleted: 'បានបញ្ចប់វគ្គបណ្តុះបណ្តាល',
  newUserCreated: 'បានបង្កើតអ្នកប្រើប្រាស់ថ្មី',
  reportGenerated: 'បានបង្កើតរបាយការណ៍',
  hoursAgo: 'ម៉ោងមុន',
  dayAgo: 'ថ្ងៃមុន',
  daysAgo: 'ថ្ងៃមុន',
  
  // Page titles
  schoolManagement: 'ការគ្រប់គ្រងសាលារៀន',
  studentManagement: 'ការគ្រប់គ្រងសិស្ស',
  userManagement: 'ការគ្រប់គ្រងអ្នកប្រើប្រាស់',
  trainingManagement: 'ការគ្រប់គ្រងការបណ្តុះបណ្តាល',
  settingsManagement: 'ការគ្រប់គ្រងការកំណត់',
  
  // Form labels
  name: 'ឈ្មោះ',
  email: 'អ៊ីមែល',
  phone: 'ទូរស័ព្ទ',
  address: 'អាសយដ្ឋាន',
  date: 'កាលបរិច្ឆេទ',
  time: 'ពេលវេលា',
  description: 'ការពិពណ៌នា',
  status: 'ស្ថានភាព',
  role: 'តួនាទី',
  permissions: 'សិទ្ធិ',
};

// Combined translations
export const globalTranslations = {
  en: enTranslations,
  kh: khTranslations,
};

// This hook will be created separately to avoid circular dependency