"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useMenu } from "@/lib/menu-context";
import {
  ChevronLeft,
  LogOut,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Settings,
  Shield,
  BarChart3,
  Users,
  School,
  Eye,
  Plus,
  List,
  FileText,
  TrendingUp,
  ClipboardList,
  GraduationCap,
  MapPin,
  PieChart,
  Database,
  Home,
  Building,
} from "lucide-react";

interface SidebarNavProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

interface PagePermission {
  id: number;
  page_path: string;
  page_name: string;
  icon_name?: string;
  created_at: string;
  updated_at: string;
}

interface MenuItem {
  id: number;
  name: string;
  path: string;
  icon: any;
  children?: MenuItem[];
  category?: string;
  isActive?: boolean;
}

// Icon mapping
const iconMap: Record<string, any> = {
  LayoutDashboard: Home,
  School: Building,
  Users: Users,
  BarChart3: PieChart,
  FileText: FileText,
  Settings: Settings,
  Eye: Eye,
  TrendingUp: TrendingUp,
  BookOpen: GraduationCap,
  MapPin: MapPin,
  Database: ClipboardList,
  Shield: Shield,
  // Fallback
  default: FileText
};

// Category mapping based on path patterns
const getCategoryFromPath = (path: string): string => {
  if (path === '/dashboard') return 'overview';
  if (['/schools', '/users', '/students'].includes(path)) return 'management';
  if (['/observations', '/collection', '/visits'].includes(path) || path.startsWith('/observations/')) return 'data';
  if (['/analytics', '/reports', '/progress'].includes(path)) return 'analytics';
  if (['/training'].includes(path)) return 'learning';
  if (['/settings'].includes(path) || path.startsWith('/settings/')) return 'admin';
  return 'other';
};

const categoryLabels = {
  overview: "Overview",
  management: "Management", 
  data: "Data Collection",
  analytics: "Analytics & Reports",
  learning: "Learning",
  admin: "Administration",
  other: "Other"
};

export function DynamicSidebarNav({ open, setOpen }: SidebarNavProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { refreshTrigger } = useMenu();
  const [pages, setPages] = useState<PagePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadPages();
  }, [refreshTrigger]); // Re-load when menu context changes

  const loadPages = async () => {
    try {
      setLoading(true);
      
      // First try to get user's personal menu order
      const userMenuResponse = await fetch('/api/user/menu-order');
      if (userMenuResponse.ok) {
        const userData = await userMenuResponse.json();
        if (userData.pages && userData.pages.length > 0) {
          setPages(userData.pages);
          return;
        }
      }
      
      // Fallback to system default pages
      const response = await fetch('/api/data/page-permissions');
      if (response.ok) {
        const pagesData = await response.json();
        setPages(pagesData);
      } else {
        console.error('Failed to fetch pages from database');
        // Fallback to basic pages
        setPages([
          { id: 1, page_path: '/dashboard', page_name: 'Dashboard', icon_name: 'LayoutDashboard', created_at: '', updated_at: '' },
          { id: 2, page_path: '/settings/page-permissions', page_name: 'Page Management', icon_name: 'Shield', created_at: '', updated_at: '' }
        ]);
      }
    } catch (error) {
      console.error('Error loading pages:', error);
      // Fallback
      setPages([
        { id: 1, page_path: '/dashboard', page_name: 'Dashboard', icon_name: 'LayoutDashboard', created_at: '', updated_at: '' },
        { id: 2, page_path: '/settings/page-permissions', page_name: 'Page Management', icon_name: 'Shield', created_at: '', updated_at: '' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const organizeMenuItems = (): Record<string, MenuItem[]> => {
    if (!user) return {};

    // Convert pages to menu items
    const menuItems: MenuItem[] = pages.map(page => ({
      id: page.id,
      name: page.page_name,
      path: page.page_path,
      icon: iconMap[page.icon_name || 'default'] || iconMap.default,
      category: getCategoryFromPath(page.page_path),
      isActive: pathname === page.page_path || pathname.startsWith(page.page_path + '/')
    }));

    // Group items by category
    const grouped = menuItems.reduce((acc, item) => {
      const category = item.category || 'other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {} as Record<string, MenuItem[]>);

    // Sort categories in preferred order
    const categoryOrder = ['overview', 'management', 'data', 'analytics', 'learning', 'admin', 'other'];
    const sortedGrouped: Record<string, MenuItem[]> = {};
    
    categoryOrder.forEach(category => {
      if (grouped[category]) {
        sortedGrouped[category] = grouped[category];
      }
    });

    return sortedGrouped;
  };

  const groupedItems = organizeMenuItems();

  const toggleExpanded = (itemName: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemName)) {
      newExpanded.delete(itemName);
    } else {
      newExpanded.add(itemName);
    }
    setExpandedItems(newExpanded);
  };

  const renderMenuItem = (item: MenuItem) => {
    const isExpanded = expandedItems.has(item.name);
    
    return (
      <div key={item.id} className="space-y-1">
        <Link href={item.path}>
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start rounded-lg group",
              item.isActive
                ? "bg-blue-50 text-blue-700 hover:bg-blue-50"
                : "text-gray-600 hover:bg-gray-50",
              !open && "justify-center px-2",
            )}
          >
            <item.icon className={cn("h-4 w-4 flex-shrink-0", open && "mr-3")} />
            {open && (
              <>
                <span className="flex-1 text-left">{item.name}</span>
                {item.children && item.children.length > 0 && (
                  <div 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleExpanded(item.name);
                    }}
                    className="ml-2 p-1 hover:bg-gray-200 rounded"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                  </div>
                )}
              </>
            )}
          </Button>
        </Link>
        
        {/* Render children if expanded */}
        {open && item.children && item.children.length > 0 && isExpanded && (
          <div className="ml-6 space-y-1">
            {item.children.map(child => (
              <Link key={child.id} href={child.path}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start text-sm font-normal rounded-lg",
                    child.isActive
                      ? "bg-blue-50 text-blue-700 hover:bg-blue-50"
                      : "text-gray-600 hover:bg-gray-50",
                  )}
                >
                  <child.icon className="h-3 w-3 mr-3" />
                  {child.name}
                </Button>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-center flex-1">
          <div className="text-gray-500">Loading menu...</div>
        </div>
      </div>
    );
  }

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
          {Object.entries(groupedItems).map(([category, items]) => (
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
                {items.map(item => renderMenuItem(item))}
              </div>
            </div>
          ))}

          {/* Status Indicator */}
          {open && user && (
            <div className="px-3 py-2 mx-2 bg-gray-50 rounded-lg">
              <div className="flex items-center text-xs text-gray-500">
                <Database className="h-3 w-3 mr-2" />
                <span>Database-driven menu</span>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Role: <span className="capitalize font-medium">{user.role}</span>
              </div>
              <div className="text-xs text-gray-400">
                Items: {pages.length}
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