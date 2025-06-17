import {
  Home,
  Building,
  Users,
  ClipboardList,
  BarChart3,
  Eye,
  TrendingUp,
  FileText,
  MapPin,
  Settings,
  GraduationCap,
  Calendar,
  QrCode,
  MessageSquare,
  UserCheck,
  Circle,
  Database,
  Shield,
  Menu,
  ChevronRight,
  ChevronDown,
  Plus,
  Edit,
  Trash2,
  Download,
  Upload,
  Search,
  Filter,
  Star,
  Bell,
  Mail,
  Phone,
  Globe,
  Lock,
  Unlock,
  Key,
  Zap,
  Target,
  Award,
  BookOpen,
  Bookmark,
  Calendar as CalendarIcon,
  Clock,
  Map,
  Navigation,
  Compass,
  Flag,
  Heart,
  ThumbsUp,
  Share,
  Link,
  ExternalLink,
  Copy,
  CheckCircle,
  AlertCircle,
  XCircle,
  Info,
  HelpCircle,
  LucideIcon
} from "lucide-react";

// Icon mapping for menu items
const iconMap: Record<string, LucideIcon> = {
  // Navigation
  'Home': Home,
  'Dashboard': Home,
  'Menu': Menu,
  'ChevronRight': ChevronRight,
  'ChevronDown': ChevronDown,
  
  // Core entities
  'Building': Building,
  'Schools': Building,
  'Users': Users,
  'Students': Users,
  'UserCheck': UserCheck,
  
  // Data & Analytics
  'ClipboardList': ClipboardList,
  'Collection': ClipboardList,
  'BarChart3': BarChart3,
  'Analytics': BarChart3,
  'Eye': Eye,
  'Observations': Eye,
  'TrendingUp': TrendingUp,
  'Progress': TrendingUp,
  'FileText': FileText,
  'Reports': FileText,
  'MapPin': MapPin,
  'Visits': MapPin,
  'Database': Database,
  
  // Training
  'GraduationCap': GraduationCap,
  'Training': GraduationCap,
  'Calendar': Calendar,
  'Sessions': Calendar,
  'Programs': BookOpen,
  'QrCode': QrCode,
  'MessageSquare': MessageSquare,
  'Feedback': MessageSquare,
  'Participants': Users,
  
  // System
  'Settings': Settings,
  'Shield': Shield,
  'Permissions': Shield,
  'Lock': Lock,
  'Unlock': Unlock,
  'Key': Key,
  
  // Actions
  'Plus': Plus,
  'Edit': Edit,
  'Trash2': Trash2,
  'Download': Download,
  'Upload': Upload,
  'Search': Search,
  'Filter': Filter,
  'Copy': Copy,
  'Share': Share,
  'Link': Link,
  'ExternalLink': ExternalLink,
  
  // Status
  'CheckCircle': CheckCircle,
  'AlertCircle': AlertCircle,
  'XCircle': XCircle,
  'Info': Info,
  'HelpCircle': HelpCircle,
  'Star': Star,
  'Bell': Bell,
  'Flag': Flag,
  'Heart': Heart,
  'ThumbsUp': ThumbsUp,
  
  // Content
  'BookOpen': BookOpen,
  'Bookmark': Bookmark,
  'CalendarIcon': CalendarIcon,
  'Clock': Clock,
  'Map': Map,
  'Navigation': Navigation,
  'Compass': Compass,
  
  // Communication
  'Mail': Mail,
  'Phone': Phone,
  'Globe': Globe,
  
  // Utilities
  'Zap': Zap,
  'Target': Target,
  'Award': Award,
  
  // Default
  'Circle': Circle
};

// Function to get icon component by name
export function getIconComponent(iconName: string): LucideIcon {
  // Clean up the icon name (remove spaces, hyphens, underscores)
  const cleanName = iconName
    .replace(/[-_\s]/g, '')
    .replace(/^\w/, c => c.toUpperCase());
  
  // Try exact match first
  if (iconMap[iconName]) {
    return iconMap[iconName];
  }
  
  // Try cleaned name
  if (iconMap[cleanName]) {
    return iconMap[cleanName];
  }
  
  // Try lowercase
  const lowerName = iconName.toLowerCase();
  for (const [key, icon] of Object.entries(iconMap)) {
    if (key.toLowerCase() === lowerName) {
      return icon;
    }
  }
  
  // Try partial match
  for (const [key, icon] of Object.entries(iconMap)) {
    if (key.toLowerCase().includes(lowerName) || lowerName.includes(key.toLowerCase())) {
      return icon;
    }
  }
  
  // Default fallback
  return Circle;
}

// Function to get all available icons
export function getAvailableIcons(): Record<string, LucideIcon> {
  return iconMap;
}

// Function to get icon names for selection
export function getIconNames(): string[] {
  return Object.keys(iconMap).sort();
}

// Function to validate if an icon exists
export function isValidIcon(iconName: string): boolean {
  return iconName in iconMap;
}

// WordPress-style icon categories
export const iconCategories = {
  navigation: ['Home', 'Menu', 'ChevronRight', 'ChevronDown', 'Navigation', 'Compass'],
  entities: ['Building', 'Users', 'UserCheck', 'Database'],
  analytics: ['BarChart3', 'TrendingUp', 'Eye', 'Target'],
  content: ['FileText', 'BookOpen', 'Bookmark', 'ClipboardList'],
  training: ['GraduationCap', 'Calendar', 'QrCode', 'MessageSquare'],
  system: ['Settings', 'Shield', 'Lock', 'Key', 'Zap'],
  actions: ['Plus', 'Edit', 'Trash2', 'Download', 'Upload', 'Search', 'Filter'],
  status: ['CheckCircle', 'AlertCircle', 'XCircle', 'Info', 'Star', 'Bell', 'Flag'],
  communication: ['Mail', 'Phone', 'Globe', 'Share', 'Link'],
  time: ['Clock', 'Calendar', 'CalendarIcon'],
  location: ['MapPin', 'Map', 'Globe'],
  social: ['Heart', 'ThumbsUp', 'Share', 'Star']
};

// Function to get icons by category
export function getIconsByCategory(category: keyof typeof iconCategories): Record<string, LucideIcon> {
  const categoryIcons = iconCategories[category] || [];
  const result: Record<string, LucideIcon> = {};
  
  categoryIcons.forEach(iconName => {
    if (iconMap[iconName]) {
      result[iconName] = iconMap[iconName];
    }
  });
  
  return result;
}