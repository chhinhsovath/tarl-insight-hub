"use client";

import { createContext, useContext } from 'react';

export type ParticipantLocale = 'en' | 'km';

export interface ParticipantTranslations {
  // Authentication
  participantPortal: string;
  participantLogin: string;
  accessTrainingHistory: string;
  enterNamePhone: string;
  fullName: string;
  phoneNumber: string;
  enterFullName: string;
  enterPhoneNumber: string;
  accessPortal: string;
  signingIn: string;
  welcomeBack: string;
  
  // Dashboard
  welcomeBackName: string;
  trackProgress: string;
  profileInformation: string;
  contact: string;
  role: string;
  organization: string;
  location: string;
  participant: string;
  
  // Statistics
  totalTrainings: string;
  attended: string;
  attendanceRate: string;
  materialsAvailable: string;
  
  // Training History
  trainingHistory: string;
  loadingTrainingHistory: string;
  noTrainingRecords: string;
  registered: string;
  materials: string;
  attendedOn: string;
  upcomingTrainings: string;
  checkEmail: string;
  
  // Materials
  materialsDownloaded: string;
  failedDownloadMaterials: string;
  failedToFetchTrainingHistory: string;
  
  // Actions
  logout: string;
  loggedOutSuccess: string;
  download: string;
  
  // Errors
  namePhoneRequired: string;
  validPhoneNumber: string;
  noRecordsFound: string;
  checkDetails: string;
  connectionError: string;
  tryAgain: string;
  loginFailed: string;
  
  // Features
  whatYouCanDo: string;
  viewTrainingSessions: string;
  viewTrainingDesc: string;
  downloadTrainingMaterials: string;
  downloadMaterialsDesc: string;
  certificatesProgress: string;
  certificatesProgressDesc: string;
  personalDashboard: string;
  personalDashboardDesc: string;
  secureAccess: string;
  secureAccessDesc: string;
  
  // General
  loading: string;
  date: string;
  time: string;
  locationLabel: string;
  na: string;
  onlyAttendedSessions: string;
  contactCoordinator: string;
}

export const participantEnTranslations: ParticipantTranslations = {
  // Authentication
  participantPortal: "Training Participant Portal",
  participantLogin: "Participant Login",
  accessTrainingHistory: "Access your training history, download materials, and track your learning progress",
  enterNamePhone: "Enter your name and phone number to access your training portal",
  fullName: "Full Name",
  phoneNumber: "Phone Number",
  enterFullName: "Enter your full name",
  enterPhoneNumber: "Enter your phone number",
  accessPortal: "Access Portal",
  signingIn: "Signing In...",
  welcomeBack: "Welcome back",
  
  // Dashboard
  welcomeBackName: "Welcome back",
  trackProgress: "Track your training progress and access your materials",
  profileInformation: "Profile Information",
  contact: "Contact",
  role: "Role",
  organization: "Organization",
  location: "Location",
  participant: "Participant",
  
  // Statistics
  totalTrainings: "Total Trainings",
  attended: "Attended",
  attendanceRate: "Attendance Rate",
  materialsAvailable: "Materials Available",
  
  // Training History
  trainingHistory: "Training History",
  loadingTrainingHistory: "Loading training history...",
  noTrainingRecords: "No training records found",
  registered: "Registered",
  materials: "Materials",
  attendedOn: "Attended on",
  upcomingTrainings: "Upcoming Trainings",
  checkEmail: "Check your email for session details and location information",
  
  // Materials
  materialsDownloaded: "Materials downloaded successfully",
  failedDownloadMaterials: "Failed to download materials",
  failedToFetchTrainingHistory: "Failed to load training history",
  
  // Actions
  logout: "Logout",
  loggedOutSuccess: "Logged out successfully",
  download: "Download",
  
  // Errors
  namePhoneRequired: "Please enter both name and phone number",
  validPhoneNumber: "Please enter a valid phone number",
  noRecordsFound: "No training records found for this name and phone combination. Please check your details or contact your training coordinator.",
  checkDetails: "Please check your details",
  connectionError: "Connection error. Please try again.",
  tryAgain: "Please try again",
  loginFailed: "Login failed. Please check your details.",
  
  // Features
  whatYouCanDo: "What You Can Do",
  viewTrainingSessions: "Training History",
  viewTrainingDesc: "View all training sessions you've attended with dates, locations, and completion status",
  downloadTrainingMaterials: "Download Materials",
  downloadMaterialsDesc: "Access and download training materials, handouts, and resources from your sessions",
  certificatesProgress: "Certificates & Progress",
  certificatesProgressDesc: "Track your learning progress and download completion certificates",
  personalDashboard: "Personal Learning Dashboard",
  personalDashboardDesc: "Monitor your attendance rate, skills gained, and upcoming training opportunities",
  secureAccess: "Secure Access",
  secureAccessDesc: "Your data is protected and only accessible with your registered name and phone number.",
  
  // General
  loading: "Loading...",
  date: "Date",
  time: "Time",
  locationLabel: "Location",
  na: "N/A",
  onlyAttendedSessions: "Only participants who have attended training sessions can access this portal.",
  contactCoordinator: "Contact your training coordinator if you need assistance."
};

export const participantKmTranslations: ParticipantTranslations = {
  // Authentication
  participantPortal: "ប័ណ្ណគេហទំព័រអ្នកចូលរួមបណ្តុះបណ្តាល",
  participantLogin: "ចូលគណនីអ្នកចូលរួម",
  accessTrainingHistory: "ចូលមើលប្រវត្តិបណ្តុះបណ្តាល ទាញយកឯកសារ និងតាមដានដំណើរការរៀនរបស់អ្នក",
  enterNamePhone: "បញ្ចូលឈ្មោះ និងលេខទូរស័ព្ទរបស់អ្នកដើម្បីចូលមើលគេហទំព័របណ្តុះបណ្តាល",
  fullName: "ឈ្មោះពេញ",
  phoneNumber: "លេខទូរស័ព្ទ",
  enterFullName: "បញ្ចូលឈ្មោះពេញរបស់អ្នក",
  enterPhoneNumber: "បញ្ចូលលេខទូរស័ព្ទរបស់អ្នក",
  accessPortal: "ចូលប័ណ្ណ",
  signingIn: "កំពុងចូល...",
  welcomeBack: "សូមស្វាគមន៍ការត្រលប់មកវិញ",
  
  // Dashboard
  welcomeBackName: "សូមស្វាគមន៍ការត្រលប់មកវិញ",
  trackProgress: "តាមដានដំណើរការបណ្តុះបណ្តាល និងចូលមើលឯកសាររបស់អ្នក",
  profileInformation: "ព័ត៌មានប្រវត្តិរូប",
  contact: "ទំនាក់ទំនង",
  role: "តួនាទី",
  organization: "អង្គការ",
  location: "ទីតាំង",
  participant: "អ្នកចូលរួម",
  
  // Statistics
  totalTrainings: "បណ្តុះបណ្តាលសរុប",
  attended: "បានចូលរួម",
  attendanceRate: "អត្រាចូលរួម",
  materialsAvailable: "ឯកសារអាចរកបាន",
  
  // Training History
  trainingHistory: "ប្រវត្តិបណ្តុះបណ្តាល",
  loadingTrainingHistory: "កំពុងផ្ទុកប្រវត្តិបណ្តុះបណ្តាល...",
  noTrainingRecords: "រកមិនឃើញកំណត់ត្រាបណ្តុះបណ្តាល",
  registered: "បានចុះឈ្មោះ",
  materials: "ឯកសារ",
  attendedOn: "បានចូលរួមនៅ",
  upcomingTrainings: "បណ្តុះបណ្តាលខាងមុខ",
  checkEmail: "ពិនិត្យអ៊ីមែលរបស់អ្នកសម្រាប់ព័ត៌មានលម្អិត និងទីតាំង",
  
  // Materials
  materialsDownloaded: "ទាញយកឯកសារបានជោគជ័យ",
  failedDownloadMaterials: "បរាជ័យក្នុងការទាញយកឯកសារ",
  failedToFetchTrainingHistory: "បរាជ័យក្នុងការផ្ទុកប្រវត្តិបណ្តុះបណ្តាល",
  
  // Actions
  logout: "ចាកចេញ",
  loggedOutSuccess: "បានចាកចេញជោគជ័យ",
  download: "ទាញយក",
  
  // Errors
  namePhoneRequired: "សូមបញ្ចូលឈ្មោះ និងលេខទូរស័ព្ទ",
  validPhoneNumber: "សូមបញ្ចូលលេខទូរស័ព្ទត្រឹមត្រូវ",
  noRecordsFound: "រកមិនឃើញកំណត់ត្រាបណ្តុះបណ្តាលសម្រាប់ឈ្មោះ និងលេខទូរស័ព្ទនេះ។ សូមពិនិត្យព័ត៌មានរបស់អ្នក ឬទាក់ទងអ្នកសម្របសម្រួលបណ្តុះបណ្តាល។",
  checkDetails: "សូមពិនិត្យព័ត៌មានរបស់អ្នក",
  connectionError: "កំហុសក្នុងការតភ្ជាប់។ សូមព្យាយាមម្តងទៀត។",
  tryAgain: "សូមព្យាយាមម្តងទៀត",
  loginFailed: "ចូលបរាជ័យ។ សូមពិនិត្យព័ត៌មានរបស់អ្នក។",
  
  // Features
  whatYouCanDo: "អ្វីដែលអ្នកអាចធ្វើបាន",
  viewTrainingSessions: "ប្រវត្តិបណ្តុះបណ្តាល",
  viewTrainingDesc: "មើលវគ្គបណ្តុះបណ្តាលទាំងអស់ដែលអ្នកបានចូលរួម ជាមួយនឹងកាលបរិច្ឆេទ ទីតាំង និងស្ថានភាពបញ្ចប់",
  downloadTrainingMaterials: "ទាញយកឯកសារ",
  downloadMaterialsDesc: "ចូលមើល និងទាញយកឯកសារបណ្តុះបណ្តាល សៀវភៅណែនាំ និងធនធានពីវគ្គរបស់អ្នក",
  certificatesProgress: "វិញ្ញាបនបត្រ & ដំណើរការ",
  certificatesProgressDesc: "តាមដានដំណើរការរៀនរបស់អ្នក និងទាញយកវិញ្ញាបនបត្របញ្ចប់",
  personalDashboard: "ទំព័រគ្រប់គ្រងការរៀនផ្ទាល់ខ្លួន",
  personalDashboardDesc: "តាមដានអត្រាចូលរួម ជំនាញដែលទទួលបាន និងឱកាសបណ្តុះបណ្តាលខាងមុខ",
  secureAccess: "ការចូលដំណើរការសុវត្ថិភាព",
  secureAccessDesc: "ទិន្នន័យរបស់អ្នកត្រូវបានការពារ និងអាចចូលបានតែជាមួយឈ្មោះ និងលេខទូរស័ព្ទដែលបានចុះឈ្មោះប៉ុណ្ណោះ។",
  
  // General
  loading: "កំពុងផ្ទុក...",
  date: "កាលបរិច្ឆេទ",
  time: "ពេលវេលា",
  locationLabel: "ទីតាំង",
  na: "គ្មាន",
  onlyAttendedSessions: "មានតែអ្នកចូលរួមដែលបានចូលរួមវគ្គបណ្តុះបណ្តាលប៉ុណ្ណោះដែលអាចចូលប័ណ្ណនេះបាន។",
  contactCoordinator: "ទាក់ទងអ្នកសម្របសម្រួលបណ្តុះបណ្តាលរបស់អ្នក ប្រសិនបើអ្នកត្រូវការជំនួយ។"
};

export const participantTranslations = {
  en: participantEnTranslations,
  km: participantKmTranslations
};

export interface ParticipantLocaleContextType {
  locale: ParticipantLocale;
  setLocale: (locale: ParticipantLocale) => void;
  t: ParticipantTranslations;
}

export const ParticipantLocaleContext = createContext<ParticipantLocaleContextType | undefined>(undefined);

export function useParticipantTranslation() {
  const context = useContext(ParticipantLocaleContext);
  if (context === undefined) {
    throw new Error('useParticipantTranslation must be used within a ParticipantLocaleProvider');
  }
  return context;
}