
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { usePermissions } from "@/hooks/use-permissions";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Users,
  School,
  Eye,
  Plus,
  List,
  FileText,
  Settings,
  TrendingUp,
  ClipboardList,
  GraduationCap,
  ChevronLeft,
  LogOut,
  BookOpen,
  Shield,
  Calendar,
  MapPin,
  PieChart,
  Database,
  UserCheck,
  FileEdit,
  Home,
  Building,
  UserCog,
  Activity,
} from "lucide-react";

interface SidebarNavProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: any;
  children?: NavItem[];
  requiresAdmin?: boolean;
  category?: string;
}

// Complete navigation structure organized by categories
const allNavItems: NavItem[] = [
  // OVERVIEW
  {
    name: "Dashboard",
    href: "/dashboard", 
    icon: Home,
    category: "overview"
  },

  // MANAGEMENT
  {
    name: "Schools",
    href: "/schools",
    icon: Building,
    category: "management"
  },
  {
    name: "Users",
    href: "/users",
    icon: Users,
    category: "management"
  },
  {
    name: "Students",
    href: "/students",
    icon: GraduationCap,
    category: "management"
  },

  // DATA COLLECTION
  {
    name: "Observations",
    href: "/observations",
    icon: Eye,
    category: "data",
    children: [
      { name: "Overview", href: "/observations", icon: BarChart3 },
      { name: "New Observation", href: "/observations/new", icon: Plus },
      { name: "All Observations", href: "/observations/list", icon: List },
    ]
  },
  {
    name: "Data Collection", 
    href: "/collection",
    icon: ClipboardList,
    category: "data"
  },
  {
    name: "Visits",
    href: "/visits",
    icon: MapPin,
    category: "data"
  },

  // ANALYTICS & REPORTS
  {
    name: "Analytics",
    href: "/analytics",
    icon: PieChart,
    category: "analytics"
  },
  {
    name: "Reports",
    href: "/reports",
    icon: FileText,
    category: "analytics"
  },
  {
    name: "Progress",
    href: "/progress",
    icon: TrendingUp,
    category: "analytics"
  },

  // LEARNING
  {
    name: "Training",
    href: "/training",
    icon: BookOpen,
    category: "learning"
  },

  // ADMINISTRATION
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
    category: "admin",
    children: [
      { name: "General", href: "/settings", icon: Settings },
      { name: "Page Permissions", href: "/settings/page-permissions", icon: Shield, requiresAdmin: true },
    ]
  },
  {
    name: "Page Management",
    href: "/settings/page-permissions",
    icon: Shield,
    category: "admin",
    requiresAdmin: true
  }
];

const categoryLabels = {
  overview: "Overview",
  management: "Management", 
  data: "Data Collection",
  analytics: "Analytics & Reports",
  learning: "Learning",
  admin: "Administration",
  other: "Other"
};

export function SidebarNav({ open, setOpen }: SidebarNavProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { hasPermission } = usePermissions();

  // Filter nav items based on user permissions
  const getFilteredNavItems = () => {
    if (!user) return [];

    const filterNavItem = (item: NavItem): NavItem | null => {
      // Check admin requirements first
      if (item.requiresAdmin && user.role.toLowerCase() !== 'admin') {
        return null;
      }

      // For admin users, show all items (including children)
      if (user.role.toLowerCase() === 'admin') {
        console.log(`Processing admin item: ${item.name}, has children: ${!!item.children}, children count: ${item.children?.length || 0}`);
        
        // For admin, include all children without filtering
        if (item.children && item.children.length > 0) {
          const processedChildren = item.children.map(child => {
            console.log(`  Processing child: ${child.name}, requiresAdmin: ${child.requiresAdmin}`);
            return child; // Return all children for admin
          });
          
          return {
            ...item,
            children: processedChildren
          };
        }
        return item;
      }

      // For non-admin users, check permissions normally
      if (!hasPermission(item.href)) {
        return null;
      }

      // Filter children recursively
      if (item.children) {
        const filteredChildren = item.children
          .map(child => filterNavItem(child))
          .filter(Boolean) as NavItem[];
        
        return {
          ...item,
          children: filteredChildren.length > 0 ? filteredChildren : undefined
        };
      }

      return item;
    };

    return allNavItems
      .map(item => filterNavItem(item))
      .filter(Boolean) as NavItem[];
  };

  const filteredNavItems = getFilteredNavItems();

  // Group items by category in specific order
  const categoryOrder = ['overview', 'management', 'data', 'analytics', 'learning', 'admin'];
  
  const groupedNavItems = categoryOrder.reduce((acc, category) => {
    const categoryItems = filteredNavItems.filter(item => item.category === category);
    if (categoryItems.length > 0) {
      acc[category] = categoryItems;
    }
    return acc;
  }, {} as Record<string, NavItem[]>);

  // Add any items without categories to 'other'
  const uncategorizedItems = filteredNavItems.filter(item => !item.category);
  if (uncategorizedItems.length > 0) {
    groupedNavItems['other'] = uncategorizedItems;
  }

  const renderNavItem = (item: NavItem, depth = 0) => {
    const isActive = pathname === item.href || (item.children && item.children.some(child => pathname === child.href));
    
    return (
      <div key={`${item.name}-${item.href}`} className={cn(depth > 0 && "ml-4")}>
        {item.children && item.children.length > 0 ? (
          <div className="space-y-1">
            {/* Parent item - clickable if it has an href */}
            {item.href ? (
              <Link href={item.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start rounded-lg",
                    isActive
                      ? "bg-blue-50 text-blue-700 hover:bg-blue-50"
                      : "text-gray-600 hover:bg-gray-50",
                    !open && "justify-center px-2",
                  )}
                >
                  <item.icon className={cn("h-4 w-4", open && "mr-3")} />
                  {open && <span>{item.name}</span>}
                </Button>
              </Link>
            ) : (
              <div
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-lg",
                  isActive ? "text-blue-700" : "text-gray-600",
                  !open && "justify-center",
                )}
              >
                <item.icon className="h-4 w-4" />
                {open && <span className="ml-3">{item.name}</span>}
              </div>
            )}
            
            {/* Children - only show when sidebar is open */}
            {open && (
              <div className="ml-4 space-y-1">
                {item.children.map((child) => renderNavItem(child, depth + 1))}
              </div>
            )}
          </div>
        ) : (
          <Link href={item.href}>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start rounded-lg",
                pathname === item.href
                  ? "bg-blue-50 text-blue-700 hover:bg-blue-50"
                  : "text-gray-600 hover:bg-gray-50",
                !open && "justify-center px-2",
                depth > 0 && "text-sm font-normal"
              )}
            >
              <item.icon className={cn("h-4 w-4", open && "mr-3")} />
              {open && <span>{item.name}</span>}
            </Button>
          </Link>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className={cn("flex items-center", open ? "justify-start" : "justify-center w-full")}>
          <BookOpen className="h-8 w-8 text-blue-500" />
          {open && (
            <div className="ml-3">
              <h1 className="text-lg font-bold text-gray-900">TaRL Hub</h1>
              <p className="text-xs text-gray-500">Teaching at the Right Level</p>
            </div>
          )}
        </div>
        {open && (
          <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="rounded-full hover:bg-gray-100">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-auto py-4 px-2">
        <div className="space-y-6">
          {Object.entries(groupedNavItems).map(([category, items]) => (
            <div key={category} className="space-y-2">
              {/* Category Label */}
              {open && items.length > 0 && (
                <div className="px-3 py-1">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {categoryLabels[category as keyof typeof categoryLabels] || category}
                  </h3>
                </div>
              )}
              
              {/* Category Items */}
              <div className="space-y-1">
                {items.map((item) => renderNavItem(item))}
              </div>
            </div>
          ))}
          
          {/* Permission Status Indicator */}
          {open && user && (
            <div className="px-3 py-2 mx-2 bg-gray-50 rounded-lg">
              <div className="flex items-center text-xs text-gray-500">
                <Shield className="h-3 w-3 mr-2" />
                <span>Permission-based access</span>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Role: <span className="capitalize font-medium">{user.role}</span>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Items shown: {filteredNavItems.length}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* User Section */}
      <div className="p-4 border-t">
        <div className={cn("flex items-center", open ? "justify-between" : "justify-center")}>
          {open && (
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-900">{user?.full_name}</span>
              <span className="text-xs text-gray-500 capitalize">{user?.role}</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            className="rounded-full hover:bg-red-50 hover:text-red-500"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
