"use client";

export interface SchoolRegistrationTranslations {
  // Header
  schoolRegistration: string;
  pageSubtitle: string;
  forDirectorsNote: string;

  // School Search Section
  findYourSchool: string;
  searchDescription: string;
  searchPlaceholder: string;
  searchMinChars: string;
  noSchoolsFound: string;
  tryDifferentKeywords: string;
  changeSchool: string;
  schoolCode: string;
  zone: string;
  cluster: string;
  
  // School Details
  newSchoolCode: string;
  newSchoolCluster: string;
  newSchoolZone: string;
  
  // Demographic Areas
  selectProvince: string;
  selectDistrict: string;
  selectCommune: string;
  selectVillage: string;
  province: string;
  district: string;
  commune: string;
  village: string;
  detailedAddress: string;
  postalCode: string;

  // Basic Information
  basicSchoolInfo: string;
  basicInfoDescription: string;
  schoolType: string;
  schoolLevel: string;
  establishedYear: string;
  totalClasses: string;
  totalStudents: string;
  totalTeachers: string;
  
  // School Types
  publicSchool: string;
  privateSchool: string;
  communitySchool: string;
  
  // School Levels
  primarySchool: string;
  secondarySchool: string;
  highSchool: string;
  mixedLevels: string;

  // Infrastructure
  schoolInfrastructure: string;
  infrastructureDescription: string;
  buildingCondition: string;
  classroomCount: string;
  availableFacilities: string;
  library: string;
  computerLab: string;
  internet: string;
  electricity: string;
  waterSource: string;
  
  // Building Conditions
  excellent: string;
  good: string;
  fair: string;
  poor: string;
  
  // Availability
  available: string;
  notAvailable: string;

  // Director Information
  directorInfo: string;
  directorInfoDescription: string;
  fullName: string;
  gender: string;
  age: string;
  phoneNumber: string;
  emailAddress: string;
  education: string;
  experience: string;
  
  // Genders
  male: string;
  female: string;

  // Contact & Location
  contactLocation: string;
  contactLocationDescription: string;
  schoolPhone: string;
  schoolEmail: string;
  gpsLocation: string;
  getCurrentLocation: string;
  gettingLocation: string;
  latitude: string;
  longitude: string;
  locationCaptured: string;

  // Additional Information
  additionalInfo: string;
  additionalInfoDescription: string;
  mainChallenges: string;
  challengesPlaceholder: string;
  keyAchievements: string;
  achievementsPlaceholder: string;
  supportNeeded: string;
  supportNeededPlaceholder: string;
  additionalNotes: string;
  notesPlaceholder: string;

  // Submit Section
  readyToSubmit: string;
  reviewCarefully: string;
  submitRegistration: string;
  submittingRegistration: string;

  // Success Page
  registrationSuccessful: string;
  registrationSubmitted: string;
  whatHappensNext: string;
  registrationPending: string;
  adminReview: string;
  receiveConfirmation: string;
  accessCredentials: string;
  backToHome: string;
  registerAnother: string;

  // Form Validation
  pleaseSelectSchool: string;
  pleaseEnter: string;
  invalidEmailFormat: string;

  // Status Messages
  failedToSearchSchools: string;
  registrationFailed: string;
  networkError: string;
  yourDevice: string;
  doesntSupportGPS: string;
  couldNotGetLocation: string;
  locationCapturedSuccess: string;

  // Common
  required: string;
  optional: string;
  loading: string;
  yesNo: string;
  cancel: string;
  submit: string;
  active: string;
  inactive: string;
}

const khmerTranslations: SchoolRegistrationTranslations = {
  // Header
  schoolRegistration: "ការចុះឈ្មោះសាលារៀន",
  pageSubtitle: "បំពេញព័ត៌មានលម្អិតអំពីសាលារៀនរបស់អ្នកដើម្បីចូលរួមក្នុងប្រព័ន្ធ TaRL Insight Hub",
  forDirectorsNote: "សម្រាប់នាយកសាលារៀន និងអ្នកគ្រប់គ្រង",

  // School Search Section
  findYourSchool: "ស្វែងរកសាលារៀនរបស់អ្នក",
  searchDescription: "ស្វែងរកសាលារៀនរបស់អ្នកពីមូលដ្ឋានទិន្នន័យសាលារៀនដែលបានចុះបញ្ជី",
  searchPlaceholder: "ស្វែងរកតាមឈ្មោះសាលា កូដ ឬទីតាំង... (យ៉ាងតិច ២ តួអក្សរ)",
  searchMinChars: "សូមបញ្ចូលយ៉ាងតិច ២ តួអក្សរដើម្បីស្វែងរក",
  noSchoolsFound: "រកមិនឃើញសាលារៀនដែលត្រូវនឹង",
  tryDifferentKeywords: "សូមព្យាយាមស្វែងរកដោយប្រើពាក្យគន្លឹះផ្សេង ឬទាក់ទងនឹងបុគ្គលិកជំនួយ",
  changeSchool: "ប្តូរសាលារៀន",
  schoolCode: "កូដសាលារៀន",
  zone: "តំបន់",
  cluster: "ក្រុម",
  
  // School Details
  newSchoolCode: "កូដសាលារៀនថ្មី",
  newSchoolCluster: "ក្រុមសាលារៀន",
  newSchoolZone: "តំបន់សាលារៀន",
  
  // Demographic Areas
  selectProvince: "ជ្រើសរើសខេត្ត",
  selectDistrict: "ជ្រើសរើសស្រុក",
  selectCommune: "ជ្រើសរើសឃុំ",
  selectVillage: "ជ្រើសរើសភូមិ",
  province: "ខេត្ត",
  district: "ស្រុក",
  commune: "ឃុំ",
  village: "ភូមិ",
  detailedAddress: "អាសយដ្ឋានលម្អិត",
  postalCode: "លេខប្រៃសណីយ៍",

  // Basic Information
  basicSchoolInfo: "ព័ត៌មានមូលដ្ឋានសាលារៀន",
  basicInfoDescription: "ផ្តល់ព័ត៌មានសំខាន់ៗអំពីសាលារៀនរបស់អ្នក",
  schoolType: "ប្រភេទសាលារៀន",
  schoolLevel: "កម្រិតសាលារៀន",
  establishedYear: "ឆ្នាំបង្កើត",
  totalClasses: "ចំនួនថ្នាក់សរុប",
  totalStudents: "ចំនួនសិស្សសរុប",
  totalTeachers: "ចំនួនគ្រូសរុប",

  // School Types
  publicSchool: "សាលារៀនរដ្ឋ",
  privateSchool: "សាលារៀនឯកជន",
  communitySchool: "សាលារៀនសហគមន៍",

  // School Levels
  primarySchool: "សាលាបឋមសិក្សា",
  secondarySchool: "សាលាអនុវិទ្យាល័យ",
  highSchool: "សាលាវិទ្យាល័យ",
  mixedLevels: "កម្រិតចម្រុះ",

  // Infrastructure
  schoolInfrastructure: "ហេដ្ឋារចនាសម្ព័ន្ធសាលារៀន",
  infrastructureDescription: "ប្រាប់យើងអំពីកម្មសម្ពន្ធ និងហេដ្ឋារចនាសម្ព័ន្ធរបស់សាលារៀនអ្នក",
  buildingCondition: "ស្ថានភាពអគារ",
  classroomCount: "ចំនួនបន្ទប់រៀន",
  availableFacilities: "កម្មសម្ពន្ធដែលមាន",
  library: "បណ្ណាល័យ",
  computerLab: "បន្ទប់កុំព្យូទ័រ",
  internet: "អ៊ីនធឺណិត",
  electricity: "អគ្គិសនី",
  waterSource: "ប្រភពទឹក",

  // Building Conditions
  excellent: "ល្អប្រសើរ",
  good: "ល្អ",
  fair: "មធ្យម",
  poor: "ខូច - ត្រូវការជួសជុល",

  // Availability
  available: "មាន",
  notAvailable: "គ្មាន",

  // Director Information
  directorInfo: "ព័ត៌មាននាយកសាលារៀន",
  directorInfoDescription: "ព័ត៌មានផ្ទាល់ខ្លួនរបស់អ្នកក្នុងនាមជានាយកសាលារៀន",
  fullName: "ឈ្មោះពេញ",
  gender: "ភេទ",
  age: "អាយុ",
  phoneNumber: "លេខទូរស័ព្ទ",
  emailAddress: "អាសយដ្ឋានអ៊ីមែល",
  education: "កម្រិតសិក្សា",
  experience: "បទពិសោធន៍",

  // Genders
  male: "ប្រុស",
  female: "ស្រី",

  // Contact & Location
  contactLocation: "ទំនាក់ទំនង និងទីតាំង",
  contactLocationDescription: "ព័ត៌មានទំនាក់ទំនងសាលារៀន និងទីតាំងច្បាស់លាស់",
  schoolPhone: "លេខទូរស័ព្ទសាលារៀន",
  schoolEmail: "អ៊ីមែលសាលារៀន",
  gpsLocation: "ទីតាំង GPS (ស្រេចចិត្ត)",
  getCurrentLocation: "យកទីតាំងបច្ចុប្បន្ន",
  gettingLocation: "កំពុងយកទីតាំង...",
  latitude: "រយៈទទឹង",
  longitude: "រយៈបណ្តោយ",
  locationCaptured: "ទីតាំងត្រូវបានកត់ត្រា",

  // Additional Information
  additionalInfo: "ព័ត៌មានបន្ថែម",
  additionalInfoDescription: "ជួយយើងយល់ពីស្ថានភាពពិសេស និងតម្រូវការរបស់សាលារៀនអ្នក",
  mainChallenges: "បញ្ហាប្រឈមសំខាន់ៗ",
  challengesPlaceholder: "ពិពណ៌នាអំពីបញ្ហាប្រឈមសំខាន់ៗដែលសាលារៀនរបស់អ្នកកំពុងជួបប្រទះ...",
  keyAchievements: "សមិទ្ធិផលសំខាន់ៗ",
  achievementsPlaceholder: "ចែករំលែកអំពីសមិទ្ធិផល និងជោគជ័យគួរឱ្យកត់សម្គាល់របស់សាលារៀនអ្នក...",
  supportNeeded: "ការជំនួយដែលត្រូវការ",
  supportNeededPlaceholder: "តើការជំនួយប្រភេទណាដែលនឹងផ្តល់ផលប្រយោជន៍ដល់សាលារៀនរបស់អ្នកបំផុត?",
  additionalNotes: "កំណត់ចំណាំបន្ថែម",
  notesPlaceholder: "ព័ត៌មានផ្សេងៗដែលអ្នកចង់ចែករំលែក...",

  // Submit Section
  readyToSubmit: "ត្រៀមរួចសម្រាប់ដាក់ស្នើការចុះឈ្មោះរបស់អ្នកហើយឬ?",
  reviewCarefully: "សូមពិនិត្យព័ត៌មានទាំងអស់ឱ្យបានដិតដល់មុនពេលដាក់ស្នើ។ បន្ទាប់ពីដាក់ស្នើរួច ការចុះឈ្មោះរបស់អ្នកនឹងត្រូវពិនិត្យដោយក្រុមការងាររបស់យើង។",
  submitRegistration: "ដាក់ស្នើការចុះឈ្មោះសាលារៀន",
  submittingRegistration: "កំពុងដាក់ស្នើការចុះឈ្មោះ...",

  // Success Page
  registrationSuccessful: "ការចុះឈ្មោះបានជោគជ័យ",
  registrationSubmitted: "សំណើការចុះឈ្មោះសាលារៀនរបស់អ្នកត្រូវបានដាក់ស្នើដោយជោគជ័យ",
  whatHappensNext: "តើអ្វីនឹងកើតឡើងបន្ទាប់?",
  registrationPending: "• ការចុះឈ្មោះរបស់អ្នកកំពុងរង់ចាំការអនុម័ត",
  adminReview: "• អ្នកគ្រប់គ្រងប្រព័ន្ធនឹងពិនិត្យសំណើរបស់អ្នក",
  receiveConfirmation: "• អ្នកនឹងទទួលការបញ្ជាក់បន្ទាប់ពីត្រូវបានអនុម័ត",
  accessCredentials: "• អត្តសញ្ញាណចូលប្រព័ន្ធនឹងត្រូវផ្តល់ឱ្យតាមរយៈអ៊ីមែល/ទូរស័ព្ទ",
  backToHome: "ត្រលប់ទៅទំព័រដើម",
  registerAnother: "ចុះឈ្មោះសាលារៀនផ្សេងទៀត",

  // Form Validation
  pleaseSelectSchool: "សូមជ្រើសរើសសាលារៀន",
  pleaseEnter: "សូមបញ្ចូល",
  invalidEmailFormat: "ទម្រង់អ៊ីមែលមិនត្រឹមត្រូវ",

  // Status Messages
  failedToSearchSchools: "ការស្វែងរកសាលារៀនបរាជ័យ",
  registrationFailed: "ការចុះឈ្មោះបរាជ័យ",
  networkError: "មានបញ្ហាបណ្តាញ",
  yourDevice: "ឧបករណ៍របស់អ្នក",
  doesntSupportGPS: "មិនគាំទ្រទីតាំង GPS",
  couldNotGetLocation: "មិនអាចយកទីតាំង GPS បាន",
  locationCapturedSuccess: "ទីតាំង GPS ត្រូវបានកត់ត្រាដោយជោគជ័យ",

  // Common
  required: "*",
  optional: "(ស្រេចចិត្ត)",
  loading: "កំពុងផ្ទុក",
  yesNo: "បាទ/ទេ",
  cancel: "បោះបង់",
  submit: "ដាក់ស្នើ",
  active: "សកម្ម",
  inactive: "អសកម្ម"
};


export function useSchoolRegistrationTranslation() {
  // Always use Khmer translations
  return {
    language: 'km' as const,
    t: khmerTranslations,
    isKhmer: true,
    isEnglish: false
  };
}