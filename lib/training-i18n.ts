import { createContext, useContext } from 'react';

// Supported languages for training pages
export type TrainingLocale = 'en' | 'km';

// Training translations interface
export interface TrainingTranslations {
  // Main training page
  trainingManagement: string;
  overviewDescription: string;
  
  // Stats labels
  totalSessions: string;
  totalParticipants: string;
  totalFeedback: string;
  totalPrograms: string;
  totalQrCodes: string;
  totalUsage: string;
  avgRating: string;
  avgDuration: string;
  activePrograms: string;
  completionRate: string;
  sessionsWithFeedback: string;
  recommendationRate: string;
  
  // Navigation labels
  primaryFunctions: string;
  supportFunctions: string;
  trainingSessions: string;
  trainingPrograms: string;
  qrCodes: string;
  trainingFeedback: string;
  
  // Descriptions
  sessionsDescription: string;
  programsDescription: string;
  participantsDescription: string;
  qrCodesDescription: string;
  feedbackDescription: string;
  
  // Status labels
  upcoming: string;
  ongoing: string;
  completed: string;
  scheduled: string;
  cancelled: string;
  active: string;
  inactive: string;
  expired: string;
  
  // Action labels
  viewAll: string;
  createSession: string;
  createProgram: string;
  newSession: string;
  editSession: string;
  deleteSession: string;
  viewSession: string;
  
  // Common labels
  sessions: string;
  programs: string;
  participants: string;
  materials: string;
  confirmed: string;
  unconfirmed: string;
  positive: string;
  recommend: string;
  registered: string;
  duration: string;
  wouldRecommend: string;
  coverage: string;
  anonymous: string;
  attendanceConfirmed: string;
  
  // Workflow labels
  trainingWorkflow: string;
  beforeTraining: string;
  duringTraining: string;
  afterTraining: string;
  beforeDescription: string;
  duringDescription: string;
  afterDescription: string;
  
  // Section titles
  upcomingSessions: string;
  recentFeedback: string;
  
  // Empty states
  noUpcomingSessions: string;
  noTrainingPrograms: string;
  noFeedback: string;
  feedbackWillAppear: string;
  
  // Loading states
  loading: string;
  loadingTrainingOverview: string;
  loadingTrainingSessions: string;
  loadingTrainingPrograms: string;
  loadingParticipants: string;
  loadingQrCodes: string;
  loadingFeedback: string;
  loadingSessions: string;
  loadingPrograms: string;
  pleaseWait: string;
  processingRequest: string;
  
  // Time formats
  hour: string;
  hours: string;
  
  // Common words
  and: string;
  or: string;
  with: string;
  in: string;
  on: string;
  at: string;
  by: string;
  for: string;
  from: string;
  to: string;
  
  // Program types
  programType: string;
  workshop: string;
  seminar: string;
  training: string;
  course: string;
  
  // Auth & Access
  pleaseLogIn: string;
  goToLogin: string;
  accessDenied: string;
  
  // Search & Filter
  searchSessions: string;
  searchPrograms: string;
  searchParticipants: string;
  searchQrCodes: string;
  searchFeedback: string;
  allStatus: string;
  allTypes: string;
  allSessions: string;
  allRatings: string;
  status: string;
  type: string;
  rating: string;
  session: string;
  
  // Actions & Buttons
  backToSessions: string;
  generateQrCode: string;
  generateAllQrTypes: string;
  viewDetails: string;
  delete: string;
  cancel: string;
  confirm: string;
  unconfirm: string;
  download: string;
  selectSession: string;
  
  // Table Headers & Labels
  trainer: string;
  program: string;
  location: string;
  method: string;
  role: string;
  codeType: string;
  expiresAt: string;
  maxUsage: string;
  unlimited: string;
  uses: string;
  lastUsed: string;
  created: string;
  updated: string;
  
  // Session Flow
  trainingFlowProgress: string;
  before: string;
  during: string;
  after: string;
  
  // Participant Info
  sessionDetails: string;
  registrationInfo: string;
  
  // QR Code Types
  registration: string;
  attendance: string;
  feedback: string;
  
  // Feedback Related
  ratingBreakdown: string;
  overallQuality: string;
  contentQuality: string;
  trainerEffectiveness: string;
  venueFacilities: string;
  feedbackResponses: string;
  comments: string;
  suggestions: string;
  wouldNotRecommend: string;
  positiveRating: string;
  neutralRating: string;
  negativeRating: string;
  percentOfTotal: string;
  percentRate: string;
  
  // Messages
  noSessionsFound: string;
  noProgramsFound: string;
  noParticipantsFound: string;
  noQrCodesFound: string;
  noFeedbackFound: string;
  noMatchingFilters: string;
  createFirstSession: string;
  createFirstProgram: string;
  createFirstQrCode: string;
  showingForSession: string;
  generatingForSession: string;
  noDescriptionAvailable: string;
  
  // Success Messages
  sessionDeletedSuccess: string;
  programDeletedSuccess: string;
  participantUpdatedSuccess: string;
  qrCodeGeneratedSuccess: string;
  qrCodeUpdatedSuccess: string;
  allQrCodesGeneratedSuccess: string;
  copiedToClipboard: string;
  deleteSuccess: string;
  
  // Error Messages
  fetchSessionsError: string;
  fetchProgramsError: string;
  fetchParticipantsError: string;
  fetchQrCodesError: string;
  fetchFeedbackError: string;
  deleteSessionError: string;
  deleteProgramError: string;
  updateParticipantError: string;
  generateQrCodeError: string;
  updateQrCodeError: string;
  selectSessionAndType: string;
  deleteConfirmation: string;
  failedToFetch: string;
  errorLoading: string;
  deleteFailed: string;
  deleteError: string;
  
  // Page Descriptions
  manageParticipants: string;
  generateManageQrCodes: string;
  viewAnalyzeFeedback: string;
  
  // Attendance Page
  trainingAttendance: string;
  markAttendanceDescription: string;
  markAttendance: string;
  walkInRegistration: string;
  attendanceManagement: string;
  markPresent: string;
  totalRegistered: string;
  attended: string;
  notAttended: string;
  searchByNameEmailSchool: string;
  filterByStatus: string;
  allParticipants: string;
  searchExistingParticipant: string;
  newParticipant: string;
  searchByNameEmailPhone: string;
  enterAtLeast2Chars: string;
  search: string;
  foundParticipants: string;
  noExistingParticipantsFound: string;
  canRegisterAsNew: string;
  fillDetailsForNew: string;
  fullName: string;
  emailAddress: string;
  phoneNumber: string;
  schoolOrganization: string;
  district: string;
  province: string;
  markWalkInAttendance: string;
  resetForm: string;
  trainingHistory: string;
  firstTraining: string;
  attendanceRate: string;
  nameEmailRequired: string;
  attendanceMarkedSuccess: string;
  walkInAttendanceMarkedSuccess: string;
  failedToMarkAttendance: string;
  failedToSearchParticipants: string;
  noRegistrationsFound: string;
  registerWalkInDescription: string;
  selectParticipant: string;
  
  // Public Feedback Page
  trainingSessionFeedback: string;
  shareFeedbackDescription: string;
  overallExperience: string;
  contentRelevance: string;
  trainerKnowledge: string;
  venueAndFacilities: string;
  excellent: string;
  good: string;
  average: string;
  poor: string;
  veryPoor: string;
  overallExperienceDesc: string;
  contentRelevanceDesc: string;
  trainerKnowledgeDesc: string;
  venueAndFacilitiesDesc: string;
  additionalFeedback: string;
  whatDidYouLike: string;
  whatCouldImprove: string;
  wouldYouRecommend: string;
  yes: string;
  no: string;
  maybe: string;
  submitFeedback: string;
  submittingFeedback: string;
  feedbackSubmittedSuccess: string;
  thankYouForFeedback: string;
  feedbackAppreciated: string;
  returnToHome: string;
  provideFeedbackAnonymously: string;
  orProvideContactInfo: string;
  nameOptional: string;
  emailOptional: string;
  yourRatings: string;
  pleaseRateAllCategories: string;
  failedToSubmitFeedback: string;
}

// English translations
export const enTranslations: TrainingTranslations = {
  // Main training page
  trainingManagement: 'Training Management',
  overviewDescription: 'Overview of training programs, sessions, and participants',
  
  // Stats labels
  totalSessions: 'Total Sessions',
  totalParticipants: 'Total Participants',
  totalFeedback: 'Total Feedback',
  totalPrograms: 'Total Programs',
  totalQrCodes: 'Total QR Codes',
  totalUsage: 'Total Usage',
  avgRating: 'Avg Rating',
  avgDuration: 'Avg Duration',
  activePrograms: 'Active Programs',
  completionRate: 'Completion Rate',
  sessionsWithFeedback: 'Sessions w/ Feedback',
  recommendationRate: 'Recommendation Rate',
  
  // Navigation labels
  primaryFunctions: 'Primary Functions',
  supportFunctions: 'Support Functions',
  trainingSessions: 'Training Sessions',
  trainingPrograms: 'Training Programs',
  qrCodes: 'QR Codes',
  trainingFeedback: 'Training Feedback',
  
  // Descriptions
  sessionsDescription: 'Create, schedule, and manage training sessions',
  programsDescription: 'Design and organize training curricula',
  participantsDescription: 'Manage registrations and attendance',
  qrCodesDescription: 'Generate codes for registration and feedback',
  feedbackDescription: 'View and analyze training feedback',
  
  // Status labels
  upcoming: 'upcoming',
  ongoing: 'ongoing',
  completed: 'completed',
  scheduled: 'scheduled',
  cancelled: 'cancelled',
  active: 'Active',
  inactive: 'Inactive',
  expired: 'Expired',
  
  // Action labels
  viewAll: 'View All',
  createSession: 'Create Session',
  createProgram: 'Create Program', 
  newSession: 'New Session',
  editSession: 'Edit Session',
  deleteSession: 'Delete Session',
  viewSession: 'View Session',
  
  // Common labels
  sessions: 'sessions',
  programs: 'programs',
  participants: 'participants',
  materials: 'materials',
  confirmed: 'confirmed',
  unconfirmed: 'Unconfirmed',
  positive: 'positive',
  recommend: 'recommend',
  registered: 'registered',
  duration: 'duration',
  wouldRecommend: 'would recommend',
  coverage: 'coverage',
  anonymous: 'Anonymous',
  attendanceConfirmed: 'Attendance Confirmed',
  
  // Workflow labels
  trainingWorkflow: 'Training Management Workflow',
  beforeTraining: 'Before Training',
  duringTraining: 'During Training',
  afterTraining: 'After Training',
  beforeDescription: 'Create programs and sessions, generate QR codes, send invitations',
  duringDescription: 'Confirm attendance, distribute materials, conduct session',
  afterDescription: 'Collect feedback, generate reports, follow up',
  
  // Section titles
  upcomingSessions: 'Upcoming Sessions',
  recentFeedback: 'Recent Feedback',
  
  // Empty states
  noUpcomingSessions: 'No upcoming sessions',
  noTrainingPrograms: 'No training programs',
  noFeedback: 'No feedback yet',
  feedbackWillAppear: 'Feedback will appear here as participants submit responses',
  
  // Loading states
  loading: 'Loading...',
  loadingTrainingOverview: 'Loading training overview...',
  loadingTrainingSessions: 'Loading training sessions...',
  loadingTrainingPrograms: 'Loading training programs...',
  loadingParticipants: 'Loading participants...',
  loadingQrCodes: 'Loading QR codes...',
  loadingFeedback: 'Loading feedback...',
  loadingSessions: 'Loading sessions...',
  loadingPrograms: 'Loading programs...',
  pleaseWait: 'Please wait while we load your content',
  processingRequest: 'Processing your request...',
  
  // Time formats
  hour: 'h',
  hours: 'hours',
  
  // Common words
  and: 'and',
  or: 'or',
  with: 'with',
  in: 'in',
  on: 'on',
  at: 'at',
  by: 'by',
  for: 'for',
  from: 'from',
  to: 'to',
  
  // Program types
  programType: 'program type',
  workshop: 'Workshop',
  seminar: 'Seminar',
  training: 'Training',
  course: 'Course',
  
  // Auth & Access
  pleaseLogIn: 'Please log in to access',
  goToLogin: 'Go to Login',
  accessDenied: 'Access Denied',
  
  // Search & Filter
  searchSessions: 'Search sessions, programs, locations, or trainers...',
  searchPrograms: 'Search programs by name, description, or type...',
  searchParticipants: 'Search participants by name, email, session, or school...',
  searchQrCodes: 'Search QR codes by session, type, or creator...',
  searchFeedback: 'Search feedback by session, program, or comments...',
  allStatus: 'All Status',
  allTypes: 'All Types',
  allSessions: 'All Sessions',
  allRatings: 'All Ratings',
  status: 'Status',
  type: 'Type',
  rating: 'Rating',
  session: 'Session',
  
  // Actions & Buttons
  backToSessions: 'Back to Sessions',
  generateQrCode: 'Generate QR Code',
  generateAllQrTypes: 'Generate All QR Types',
  viewDetails: 'View Details',
  delete: 'Delete',
  cancel: 'Cancel',
  confirm: 'Confirm',
  unconfirm: 'Unconfirm',
  download: 'Download',
  selectSession: 'Select session',
  
  // Table Headers & Labels
  trainer: 'Trainer',
  program: 'Program',
  location: 'Location',
  method: 'Method',
  role: 'Role',
  codeType: 'Code Type',
  expiresAt: 'Expires At (Optional)',
  maxUsage: 'Max Usage (Optional)',
  unlimited: 'Unlimited',
  uses: 'uses',
  lastUsed: 'Last used',
  created: 'Created',
  updated: 'Updated',
  
  // Session Flow
  trainingFlowProgress: 'Training Flow Progress',
  before: 'Before',
  during: 'During',
  after: 'After',
  
  // Participant Info
  sessionDetails: 'Session Details',
  registrationInfo: 'Registration Info',
  
  // QR Code Types
  registration: 'Registration',
  attendance: 'Attendance',
  feedback: 'Feedback',
  
  // Feedback Related
  ratingBreakdown: 'Rating Breakdown',
  overallQuality: 'Overall Quality',
  contentQuality: 'Content Quality',
  trainerEffectiveness: 'Trainer Effectiveness',
  venueFacilities: 'Venue & Facilities',
  feedbackResponses: 'Feedback Responses',
  comments: 'Comments',
  suggestions: 'Suggestions',
  wouldNotRecommend: 'Would not recommend',
  positiveRating: 'Positive (4-5)',
  neutralRating: 'Neutral (3)',
  negativeRating: 'Negative (1-2)',
  percentOfTotal: '% of total',
  percentRate: '% rate',
  
  // Messages
  noSessionsFound: 'No training sessions found.',
  noProgramsFound: 'No training programs found.',
  noParticipantsFound: 'No participants found.',
  noQrCodesFound: 'No QR codes found.',
  noFeedbackFound: 'No feedback found.',
  noMatchingFilters: 'No items match your filters.',
  createFirstSession: 'Create your first session',
  createFirstProgram: 'Create your first program',
  createFirstQrCode: 'Generate your first QR code',
  showingForSession: 'Showing for session ID',
  generatingForSession: 'Generating for session ID',
  noDescriptionAvailable: 'No description available',
  
  // Success Messages
  sessionDeletedSuccess: 'Training session deleted successfully',
  programDeletedSuccess: 'Program deleted successfully',
  participantUpdatedSuccess: 'Participant status updated successfully',
  qrCodeGeneratedSuccess: 'QR code generated successfully',
  qrCodeUpdatedSuccess: 'QR code updated successfully',
  allQrCodesGeneratedSuccess: 'All QR codes generated successfully!',
  copiedToClipboard: 'Copied to clipboard',
  deleteSuccess: 'Program deleted successfully',
  
  // Error Messages
  fetchSessionsError: 'Failed to fetch training sessions',
  fetchProgramsError: 'Failed to fetch training programs',
  fetchParticipantsError: 'Failed to fetch participants',
  fetchQrCodesError: 'Failed to fetch QR codes',
  fetchFeedbackError: 'Failed to fetch feedback',
  deleteSessionError: 'Failed to delete training session',
  deleteProgramError: 'Failed to delete program',
  updateParticipantError: 'Failed to update participant status',
  generateQrCodeError: 'Failed to generate QR code',
  updateQrCodeError: 'Failed to update QR code status',
  selectSessionAndType: 'Please select a session and code type',
  deleteConfirmation: 'Are you sure you want to delete this program? This action cannot be undone.',
  failedToFetch: 'Failed to fetch training programs',
  errorLoading: 'Error loading training programs',
  deleteFailed: 'Failed to delete program',
  deleteError: 'Error deleting program',
  
  // Page Descriptions
  manageParticipants: 'Manage participant registration and attendance',
  generateManageQrCodes: 'Generate and manage QR codes for training sessions',
  viewAnalyzeFeedback: 'View and analyze participant feedback from training sessions',
  
  // Attendance Page
  trainingAttendance: 'Training Attendance',
  markAttendanceDescription: 'Mark attendance for training participants',
  markAttendance: 'Mark Attendance',
  walkInRegistration: 'Walk-in Registration',
  attendanceManagement: 'Attendance Management',
  markPresent: 'Mark Present',
  totalRegistered: 'Total Registered',
  attended: 'Attended',
  notAttended: 'Not Attended',
  searchByNameEmailSchool: 'Search by name, email, or school...',
  filterByStatus: 'Filter by status',
  allParticipants: 'All Participants',
  searchExistingParticipant: 'Search Existing Participant',
  newParticipant: 'New Participant',
  searchByNameEmailPhone: 'Search by Name, Email, or Phone',
  enterAtLeast2Chars: 'Please enter at least 2 characters to search',
  search: 'Search',
  foundParticipants: 'Found Participants:',
  noExistingParticipantsFound: 'No existing participants found. You can register as new.',
  canRegisterAsNew: 'You can register as new.',
  fillDetailsForNew: 'Fill in the details below for a new participant',
  fullName: 'Full Name',
  emailAddress: 'Email Address',
  phoneNumber: 'Phone Number',
  schoolOrganization: 'School/Organization',
  district: 'District',
  province: 'Province',
  markWalkInAttendance: 'Mark Walk-in Attendance',
  resetForm: 'Reset Form',
  trainingHistory: 'Training History',
  firstTraining: 'First Training',
  attendanceRate: 'Attendance Rate',
  nameEmailRequired: 'Name and email are required',
  attendanceMarkedSuccess: 'Attendance marked successfully',
  walkInAttendanceMarkedSuccess: 'Walk-in attendance marked successfully!',
  failedToMarkAttendance: 'Failed to mark attendance',
  failedToSearchParticipants: 'Failed to search participants',
  noRegistrationsFound: 'No registrations found for this session',
  registerWalkInDescription: 'Register walk-in participants who haven\'t pre-registered for this session',
  selectParticipant: 'Selected',
  
  // Public Feedback Page
  trainingSessionFeedback: 'Training Session Feedback',
  shareFeedbackDescription: 'Share your feedback to help us improve',
  overallExperience: 'Overall Experience',
  contentRelevance: 'Content Relevance',
  trainerKnowledge: 'Trainer Knowledge',
  venueAndFacilities: 'Venue & Facilities',
  excellent: 'Excellent',
  good: 'Good',
  average: 'Average',
  poor: 'Poor',
  veryPoor: 'Very Poor',
  overallExperienceDesc: 'How was your overall training experience?',
  contentRelevanceDesc: 'Was the content relevant and useful?',
  trainerKnowledgeDesc: 'How knowledgeable was the trainer?',
  venueAndFacilitiesDesc: 'How were the venue and facilities?',
  additionalFeedback: 'Additional Feedback',
  whatDidYouLike: 'What did you like most about the training?',
  whatCouldImprove: 'What could be improved?',
  wouldYouRecommend: 'Would you recommend this training to others?',
  yes: 'Yes',
  no: 'No',
  maybe: 'Maybe',
  submitFeedback: 'Submit Feedback',
  submittingFeedback: 'Submitting feedback...',
  feedbackSubmittedSuccess: 'Feedback submitted successfully!',
  thankYouForFeedback: 'Thank You!',
  feedbackAppreciated: 'Your feedback has been submitted successfully. We appreciate your input!',
  returnToHome: 'Return to Home',
  provideFeedbackAnonymously: 'You can provide feedback anonymously',
  orProvideContactInfo: 'Or provide your contact information (optional)',
  nameOptional: 'Your Name (Optional)',
  emailOptional: 'Your Email (Optional)',
  yourRatings: 'Your Ratings',
  pleaseRateAllCategories: 'Please rate all categories',
  failedToSubmitFeedback: 'Failed to submit feedback'
};

// Khmer translations
export const kmTranslations: TrainingTranslations = {
  // Main training page
  trainingManagement: 'ការគ្រប់គ្រងការបណ្តុះបណ្តាល',
  overviewDescription: 'ទិដ្ឋភាពទូទៅនៃកម្មវិធីបណ្តុះបណ្តាល វគ្គសិក្សា និងអ្នកចូលរួម',
  
  // Stats labels
  totalSessions: 'វគ្គសិក្សាសរុប',
  totalParticipants: 'អ្នកចូលរួមសរុប',
  totalFeedback: 'មតិយោបល់សរុប',
  totalPrograms: 'កម្មវិធីសរុប',
  totalQrCodes: 'កូដ QR សរុប',
  totalUsage: 'ការប្រើប្រាស់សរុប',
  avgRating: 'ការវាយតម្លៃជាមធ្យម',
  avgDuration: 'រយៈពេលជាមធ្យម',
  activePrograms: 'កម្មវិធីដែលកំពុងសកម្ម',
  completionRate: 'អត្រាបញ្ចប់',
  sessionsWithFeedback: 'វគ្គសិក្សាដែលមានមតិយោបល់',
  recommendationRate: 'អត្រាការណែនាំ',
  
  // Navigation labels
  primaryFunctions: 'មុខងារសំខាន់',
  supportFunctions: 'មុខងារជំនួយ',
  trainingSessions: 'វគ្គបណ្តុះបណ្តាល',
  trainingPrograms: 'កម្មវិធីបណ្តុះបណ្តាល',
  qrCodes: 'កូដ QR',
  trainingFeedback: 'មតិយោបល់ពីការបណ្តុះបណ្តាល',
  
  // Descriptions
  sessionsDescription: 'បង្កើត កំណត់ពេល និងគ្រប់គ្រងវគ្គបណ្តុះបណ្តាល',
  programsDescription: 'រចនា និងរៀបចំកម្មវិធីសិក្សា',
  participantsDescription: 'គ្រប់គ្រងការចុះឈ្មោះ និងវត្តមាន',
  qrCodesDescription: 'បង្កើតកូដសម្រាប់ការចុះឈ្មោះ និងមតិយោបល់',
  feedbackDescription: 'មើល និងវិភាគមតិយោបល់ពីការបណ្តុះបណ្តាល',
  
  // Status labels
  upcoming: 'នឹងមកដល់',
  ongoing: 'កំពុងដំណើរការ',
  completed: 'បានបញ្ចប់',
  scheduled: 'បានកំណត់ពេល',
  cancelled: 'បានលុបចោល',
  active: 'សកម្ម',
  inactive: 'អសកម្ម',
  expired: 'ផុតកំណត់',
  
  // Action labels
  viewAll: 'មើលទាំងអស់',
  createSession: 'បង្កើតវគ្គសិក្សា',
  createProgram: 'បង្កើតកម្មវិធី',
  newSession: 'វគ្គសិក្សាថ្មី',
  editSession: 'កែសម្រួលវគ្គសិក្សា',
  deleteSession: 'លុបវគ្គសិក្សា',
  viewSession: 'មើលវគ្គសិក្សា',
  
  // Common labels
  sessions: 'វគ្គសិក្សា',
  programs: 'កម្មវិធី',
  participants: 'អ្នកចូលរួម',
  materials: 'សម្ភារៈ',
  confirmed: 'បានបញ្ជាក់',
  unconfirmed: 'មិនបានបញ្ជាក់',
  positive: 'វិជ្ជមាន',
  recommend: 'ណែនាំ',
  registered: 'បានចុះឈ្មោះ',
  duration: 'រយៈពេល',
  wouldRecommend: 'នឹងណែនាំ',
  coverage: 'គ្របដណ្តប់',
  anonymous: 'អនាមិក',
  attendanceConfirmed: 'បានបញ្ជាក់វត្តមាន',
  
  // Workflow labels
  trainingWorkflow: 'លំហូរការគ្រប់គ្រងការបណ្តុះបណ្តាល',
  beforeTraining: 'មុនការបណ្តុះបណ្តាល',
  duringTraining: 'ក្នុងអំឡុងការបណ្តុះបណ្តាល',
  afterTraining: 'បន្ទាប់ពីការបណ្តុះបណ្តាល',
  beforeDescription: 'បង្កើតកម្មវិធី និងវគ្គសិក្សា បង្កើតកូដ QR ផ្ញើការអញ្ជើញ',
  duringDescription: 'បញ្ជាក់វត្តមាន ចែកចាយសម្ភារៈ ធ្វើវគ្គសិក្សា',
  afterDescription: 'ប្រមូលមតិយោបល់ បង្កើតរបាយការណ៍ តាមដាន',
  
  // Section titles
  upcomingSessions: 'វគ្គសិក្សានឹងមកដល់',
  recentFeedback: 'មតិយោបល់ថ្មីៗ',
  
  // Empty states
  noUpcomingSessions: 'មិនមានវគ្គសិក្សានឹងមកដល់',
  noTrainingPrograms: 'មិនមានកម្មវិធីបណ្តុះបណ្តាល',
  noFeedback: 'មិនមានមតិយោបល់នៅឡើយ',
  feedbackWillAppear: 'មតិយោបល់នឹងបង្ហាញនៅទីនេះ នៅពេលអ្នកចូលរួមដាក់ស្នើ',
  
  // Loading states
  loading: 'កំពុងផ្ទុក...',
  loadingTrainingOverview: 'កំពុងផ្ទុកទិដ្ឋភាពទូទៅនៃការបណ្តុះបណ្តាល...',
  loadingTrainingSessions: 'កំពុងផ្ទុកវគ្គបណ្តុះបណ្តាល...',
  loadingTrainingPrograms: 'កំពុងផ្ទុកកម្មវិធីបណ្តុះបណ្តាល...',
  loadingParticipants: 'កំពុងផ្ទុកអ្នកចូលរួម...',
  loadingQrCodes: 'កំពុងផ្ទុកកូដ QR...',
  loadingFeedback: 'កំពុងផ្ទុកមតិយោបល់...',
  loadingSessions: 'កំពុងផ្ទុកវគ្គសិក្សា...',
  loadingPrograms: 'កំពុងផ្ទុកកម្មវិធី...',
  pleaseWait: 'សូមរង់ចាំពេលយើងផ្ទុកមាតិការរបស់អ្នក',
  processingRequest: 'កំពុងដំណើរការសំណើរបស់អ្នក...',
  
  // Time formats
  hour: 'ម៉ោង',
  hours: 'ម៉ោង',
  
  // Common words
  and: 'និង',
  or: 'ឬ',
  with: 'ជាមួយ',
  in: 'នៅក្នុង',
  on: 'នៅលើ',
  at: 'នៅ',
  by: 'ដោយ',
  for: 'សម្រាប់',
  from: 'ពី',
  to: 'ទៅ',
  
  // Program types
  programType: 'ប្រភេទកម្មវិធី',
  workshop: 'សិក្ខាសាលា',
  seminar: 'សេមីណា',
  training: 'បណ្តុះបណ្តាល',
  course: 'វគ្គសិក្សា',
  
  // Auth & Access
  pleaseLogIn: 'សូមចូលប្រើប្រាស់ដើម្បីចូលទៅកាន់',
  goToLogin: 'ទៅកាន់ការចូលប្រើ',
  accessDenied: 'ការចូលត្រូវបានបដិសេធ',
  
  // Search & Filter
  searchSessions: 'ស្វែងរកវគ្គសិក្សា កម្មវិធី ទីតាំង ឬគ្រូបណ្តុះបណ្តាល...',
  searchPrograms: 'ស្វែងរកកម្មវិធីតាមឈ្មោះ ការពិពណ៌នា ឬប្រភេទ...',
  searchParticipants: 'ស្វែងរកអ្នកចូលរួមតាមឈ្មោះ អ៊ីមែល វគ្គសិក្សា ឬសាលា...',
  searchQrCodes: 'ស្វែងរកកូដ QR តាមវគ្គសិក្សា ប្រភេទ ឬអ្នកបង្កើត...',
  searchFeedback: 'ស្វែងរកមតិយោបល់តាមវគ្គសិក្សា កម្មវិធី ឬមតិយោបល់...',
  allStatus: 'គ្រប់ស្ថានភាព',
  allTypes: 'គ្រប់ប្រភេទ',
  allSessions: 'គ្រប់វគ្គសិក្សា',
  allRatings: 'គ្រប់ការវាយតម្លៃ',
  status: 'ស្ថានភាព',
  type: 'ប្រភេទ',
  rating: 'ការវាយតម្លៃ',
  session: 'វគ្គសិក្សា',
  
  // Actions & Buttons
  backToSessions: 'ត្រឡប់ទៅវគ្គសិក្សា',
  generateQrCode: 'បង្កើតកូដ QR',
  generateAllQrTypes: 'បង្កើតគ្រប់ប្រភេទកូដ QR',
  viewDetails: 'មើលព័ត៌មានលម្អិត',
  delete: 'លុប',
  cancel: 'បោះបង់',
  confirm: 'បញ្ជាក់',
  unconfirm: 'មិនបញ្ជាក់',
  download: 'ទាញយក',
  selectSession: 'ជ្រើសរើសវគ្គសិក្សា',
  
  // Table Headers & Labels
  trainer: 'គ្រូបណ្តុះបណ្តាល',
  program: 'កម្មវិធី',
  location: 'ទីតាំង',
  method: 'វិធីសាស្ត្រ',
  role: 'តួនាទី',
  codeType: 'ប្រភេទកូដ',
  expiresAt: 'ផុតកំណត់នៅ (ស្រេចចិត្ត)',
  maxUsage: 'ការប្រើប្រាស់អតិបរមា (ស្រេចចិត្ត)',
  unlimited: 'គ្មានកំណត់',
  uses: 'ការប្រើ',
  lastUsed: 'ប្រើចុងក្រោយ',
  created: 'បានបង្កើត',
  updated: 'បានធ្វើបច្ចុប្បន្នភាព',
  
  // Session Flow
  trainingFlowProgress: 'ដំណើរការនៃលំហូរការបណ្តុះបណ្តាល',
  before: 'មុន',
  during: 'អំឡុង',
  after: 'ក្រោយ',
  
  // Participant Info
  sessionDetails: 'ព័ត៌មានលម្អិតវគ្គសិក្សា',
  registrationInfo: 'ព័ត៌មានការចុះឈ្មោះ',
  
  // QR Code Types
  registration: 'ការចុះឈ្មោះ',
  attendance: 'វត្តមាន',
  feedback: 'មតិយោបល់',
  
  // Feedback Related
  ratingBreakdown: 'ការបែងចែកការវាយតម្លៃ',
  overallQuality: 'គុណភាពទូទៅ',
  contentQuality: 'គុណភាពមាតិកា',
  trainerEffectiveness: 'ប្រសិទ្ធភាពគ្រូបណ្តុះបណ្តាល',
  venueFacilities: 'ទីតាំង និងសម្ភារៈ',
  feedbackResponses: 'ការឆ្លើយតបមតិយោបល់',
  comments: 'មតិយោបល់',
  suggestions: 'យោបល់',
  wouldNotRecommend: 'មិននឹងណែនាំ',
  positiveRating: 'វិជ្ជមាន (៤-៥)',
  neutralRating: 'អព្យាក្រឹត (៣)',
  negativeRating: 'អវិជ្ជមាន (១-២)',
  percentOfTotal: '% នៃសរុប',
  percentRate: '% អត្រា',
  
  // Messages
  noSessionsFound: 'រកមិនឃើញវគ្គបណ្តុះបណ្តាល។',
  noProgramsFound: 'រកមិនឃើញកម្មវិធីបណ្តុះបណ្តាល។',
  noParticipantsFound: 'រកមិនឃើញអ្នកចូលរួម។',
  noQrCodesFound: 'រកមិនឃើញកូដ QR។',
  noFeedbackFound: 'រកមិនឃើញមតិយោបល់។',
  noMatchingFilters: 'មិនមានធាតុដែលត្រូវនឹងតម្រងរបស់អ្នក។',
  createFirstSession: 'បង្កើតវគ្គសិក្សាដំបូងរបស់អ្នក',
  createFirstProgram: 'បង្កើតកម្មវិធីដំបូងរបស់អ្នក',
  createFirstQrCode: 'បង្កើតកូដ QR ដំបូងរបស់អ្នក',
  showingForSession: 'បង្ហាញសម្រាប់លេខសម្គាល់វគ្គសិក្សា',
  generatingForSession: 'កំពុងបង្កើតសម្រាប់លេខសម្គាល់វគ្គសិក្សា',
  noDescriptionAvailable: 'មិនមានការពិពណ៌នា',
  
  // Success Messages
  sessionDeletedSuccess: 'បានលុបវគ្គបណ្តុះបណ្តាលដោយជោគជ័យ',
  programDeletedSuccess: 'បានលុបកម្មវិធីដោយជោគជ័យ',
  participantUpdatedSuccess: 'បានធ្វើបច្ចុប្បន្នភាពស្ថានភាពអ្នកចូលរួមដោយជោគជ័យ',
  qrCodeGeneratedSuccess: 'បានបង្កើតកូដ QR ដោយជោគជ័យ',
  qrCodeUpdatedSuccess: 'បានធ្វើបច្ចុប្បន្នភាពកូដ QR ដោយជោគជ័យ',
  allQrCodesGeneratedSuccess: 'បានបង្កើតកូដ QR ទាំងអស់ដោយជោគជ័យ!',
  copiedToClipboard: 'បានចម្លងទៅក្តារតម្បៀតខ្ទាស់',
  deleteSuccess: 'បានលុបកម្មវិធីដោយជោគជ័យ',
  
  // Error Messages
  fetchSessionsError: 'បរាជ័យក្នុងការទាញយកវគ្គបណ្តុះបណ្តាល',
  fetchProgramsError: 'បរាជ័យក្នុងការទាញយកកម្មវិធីបណ្តុះបណ្តាល',
  fetchParticipantsError: 'បរាជ័យក្នុងការទាញយកអ្នកចូលរួម',
  fetchQrCodesError: 'បរាជ័យក្នុងការទាញយកកូដ QR',
  fetchFeedbackError: 'បរាជ័យក្នុងការទាញយកមតិយោបល់',
  deleteSessionError: 'បរាជ័យក្នុងការលុបវគ្គបណ្តុះបណ្តាល',
  deleteProgramError: 'បរាជ័យក្នុងការលុបកម្មវិធី',
  updateParticipantError: 'បរាជ័យក្នុងការធ្វើបច្ចុប្បន្នភាពស្ថានភាពអ្នកចូលរួម',
  generateQrCodeError: 'បរាជ័យក្នុងការបង្កើតកូដ QR',
  updateQrCodeError: 'បរាជ័យក្នុងការធ្វើបច្ចុប្បន្នភាពស្ថានភាពកូដ QR',
  selectSessionAndType: 'សូមជ្រើសរើសវគ្គសិក្សា និងប្រភេទកូដ',
  deleteConfirmation: 'តើអ្នកប្រាកដទេថាចង់លុបកម្មវិធីនេះ? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។',
  failedToFetch: 'បរាជ័យក្នុងការទាញយកកម្មវិធីបណ្តុះបណ្តាល',
  errorLoading: 'កំហុសក្នុងការផ្ទុកកម្មវិធីបណ្តុះបណ្តាល',
  deleteFailed: 'បរាជ័យក្នុងការលុបកម្មវិធី',
  deleteError: 'កំហុសក្នុងការលុបកម្មវិធី',
  
  // Page Descriptions
  manageParticipants: 'គ្រប់គ្រងការចុះឈ្មោះ និងវត្តមានរបស់អ្នកចូលរួម',
  generateManageQrCodes: 'បង្កើត និងគ្រប់គ្រងកូដ QR សម្រាប់វគ្គបណ្តុះបណ្តាល',
  viewAnalyzeFeedback: 'មើល និងវិភាគមតិយោបល់ពីអ្នកចូលរួមពីវគ្គបណ្តុះបណ្តាល',
  
  // Attendance Page
  trainingAttendance: 'វត្តមានការបណ្តុះបណ្តាល',
  markAttendanceDescription: 'កត់ត្រាវត្តមានសម្រាប់អ្នកចូលរួមបណ្តុះបណ្តាល',
  markAttendance: 'កត់ត្រាវត្តមាន',
  walkInRegistration: 'ការចុះឈ្មោះនៅទីកន្លែង',
  attendanceManagement: 'ការគ្រប់គ្រងវត្តមាន',
  markPresent: 'កត់ត្រាវត្តមាន',
  totalRegistered: 'ចុះឈ្មោះសរុប',
  attended: 'បានចូលរួម',
  notAttended: 'មិនបានចូលរួម',
  searchByNameEmailSchool: 'ស្វែងរកតាមឈ្មោះ អ៊ីមែល ឬសាលា...',
  filterByStatus: 'ចម្រាញ់តាមស្ថានភាព',
  allParticipants: 'អ្នកចូលរួមទាំងអស់',
  searchExistingParticipant: 'ស្វែងរកអ្នកចូលរួមដែលមានស្រាប់',
  newParticipant: 'អ្នកចូលរួមថ្មី',
  searchByNameEmailPhone: 'ស្វែងរកតាមឈ្មោះ អ៊ីមែល ឬលេខទូរស័ព្ទ',
  enterAtLeast2Chars: 'សូមបញ្ចូលយ៉ាងហោចណាស់ ២ តួអក្សរដើម្បីស្វែងរក',
  search: 'ស្វែងរក',
  foundParticipants: 'អ្នកចូលរួមដែលរកឃើញ៖',
  noExistingParticipantsFound: 'រកមិនឃើញអ្នកចូលរួមដែលមានស្រាប់។ អ្នកអាចចុះឈ្មោះជាថ្មី។',
  canRegisterAsNew: 'អ្នកអាចចុះឈ្មោះជាថ្មី។',
  fillDetailsForNew: 'បំពេញព័ត៌មានលម្អិតខាងក្រោមសម្រាប់អ្នកចូលរួមថ្មី',
  fullName: 'ឈ្មោះពេញ',
  emailAddress: 'អាសយដ្ឋានអ៊ីមែល',
  phoneNumber: 'លេខទូរស័ព្ទ',
  schoolOrganization: 'សាលា/ស្ថាប័ន',
  district: 'ស្រុក/ខណ្ឌ',
  province: 'ខេត្ត/រាជធានី',
  markWalkInAttendance: 'កត់ត្រាវត្តមាននៅទីកន្លែង',
  resetForm: 'កំណត់ទម្រង់ឡើងវិញ',
  trainingHistory: 'ប្រវត្តិការបណ្តុះបណ្តាល',
  firstTraining: 'ការបណ្តុះបណ្តាលដំបូង',
  attendanceRate: 'អត្រាវត្តមាន',
  nameEmailRequired: 'ឈ្មោះ និងអ៊ីមែលត្រូវតែបំពេញ',
  attendanceMarkedSuccess: 'បានកត់ត្រាវត្តមានដោយជោគជ័យ',
  walkInAttendanceMarkedSuccess: 'បានកត់ត្រាវត្តមាននៅទីកន្លែងដោយជោគជ័យ!',
  failedToMarkAttendance: 'បរាជ័យក្នុងការកត់ត្រាវត្តមាន',
  failedToSearchParticipants: 'បរាជ័យក្នុងការស្វែងរកអ្នកចូលរួម',
  noRegistrationsFound: 'មិនមានការចុះឈ្មោះសម្រាប់វគ្គនេះ',
  registerWalkInDescription: 'ចុះឈ្មោះអ្នកចូលរួមនៅទីកន្លែងដែលមិនបានចុះឈ្មោះទុកជាមុនសម្រាប់វគ្គនេះ',
  selectParticipant: 'បានជ្រើសរើស',
  
  // Public Feedback Page
  trainingSessionFeedback: 'មតិយោបល់វគ្គបណ្តុះបណ្តាល',
  shareFeedbackDescription: 'ចែករំលែកមតិយោបល់របស់អ្នកដើម្បីជួយយើងកែលម្អ',
  overallExperience: 'បទពិសោធន៍ទូទៅ',
  contentRelevance: 'ភាពពាក់ព័ន្ធនៃមាតិកា',
  trainerKnowledge: 'ចំណេះដឹងរបស់គ្រូបណ្តុះបណ្តាល',
  venueAndFacilities: 'ទីតាំង និងសម្ភារៈ',
  excellent: 'ល្អបំផុត',
  good: 'ល្អ',
  average: 'មធ្យម',
  poor: 'អន់',
  veryPoor: 'អន់ខ្លាំង',
  overallExperienceDesc: 'តើបទពិសោធន៍បណ្តុះបណ្តាលទូទៅរបស់អ្នកយ៉ាងដូចម្តេច?',
  contentRelevanceDesc: 'តើមាតិកាមានភាពពាក់ព័ន្ធ និងមានប្រយោជន៍ដែរឬទេ?',
  trainerKnowledgeDesc: 'តើគ្រូបណ្តុះបណ្តាលមានចំណេះដឹងប៉ុណ្ណា?',
  venueAndFacilitiesDesc: 'តើទីតាំង និងសម្ភារៈយ៉ាងដូចម្តេច?',
  additionalFeedback: 'មតិយោបល់បន្ថែម',
  whatDidYouLike: 'តើអ្នកចូលចិត្តអ្វីបំផុតអំពីការបណ្តុះបណ្តាលនេះ?',
  whatCouldImprove: 'តើអ្វីដែលអាចកែលម្អបាន?',
  wouldYouRecommend: 'តើអ្នកនឹងណែនាំការបណ្តុះបណ្តាលនេះទៅអ្នកដទៃដែរឬទេ?',
  yes: 'បាទ/ចាស',
  no: 'ទេ',
  maybe: 'ប្រហែល',
  submitFeedback: 'ដាក់ស្នើមតិយោបល់',
  submittingFeedback: 'កំពុងដាក់ស្នើមតិយោបល់...',
  feedbackSubmittedSuccess: 'បានដាក់ស្នើមតិយោបល់ដោយជោគជ័យ!',
  thankYouForFeedback: 'សូមអរគុណ!',
  feedbackAppreciated: 'មតិយោបល់របស់អ្នកត្រូវបានដាក់ស្នើដោយជោគជ័យ។ យើងសូមកោតសរសើរចំពោះការបញ្ចូលរបស់អ្នក!',
  returnToHome: 'ត្រឡប់ទៅទំព័រដើម',
  provideFeedbackAnonymously: 'អ្នកអាចផ្តល់មតិយោបល់ដោយអនាមិក',
  orProvideContactInfo: 'ឬផ្តល់ព័ត៌មានទំនាក់ទំនងរបស់អ្នក (ស្រេចចិត្ត)',
  nameOptional: 'ឈ្មោះរបស់អ្នក (ស្រេចចិត្ត)',
  emailOptional: 'អ៊ីមែលរបស់អ្នក (ស្រេចចិត្ត)',
  yourRatings: 'ការវាយតម្លៃរបស់អ្នក',
  pleaseRateAllCategories: 'សូមវាយតម្លៃគ្រប់ប្រភេទ',
  failedToSubmitFeedback: 'បរាជ័យក្នុងការដាក់ស្នើមតិយោបល់'
};

// Translation map
export const trainingTranslations: Record<TrainingLocale, TrainingTranslations> = {
  en: enTranslations,
  km: kmTranslations
};

// Training locale context
export const TrainingLocaleContext = createContext<{
  locale: TrainingLocale;
  setLocale: (locale: TrainingLocale) => void;
  t: TrainingTranslations;
}>({
  locale: 'en',
  setLocale: () => {},
  t: enTranslations
});

// Hook to use training translations
export const useTrainingTranslation = () => {
  const context = useContext(TrainingLocaleContext);
  if (!context) {
    throw new Error('useTrainingTranslation must be used within a TrainingLocaleProvider');
  }
  return context;
};

// Utility function to get translations
export const getTrainingTranslations = (locale: TrainingLocale): TrainingTranslations => {
  return trainingTranslations[locale] || enTranslations;
};