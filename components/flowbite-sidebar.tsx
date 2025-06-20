"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { useState, useEffect } from "react";
import { useMenu } from "@/lib/menu-context";
import { useTrainingTranslation } from "@/lib/training-i18n";
import {
  ChevronLeft,
  LogOut,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Settings,
  Shield,
  Users,
  Eye,
  FileText,
  TrendingUp,
  ClipboardList,
  GraduationCap,
  MapPin,
  PieChart,
  Home,
  Building,
  CalendarDays,
  QrCode,
  MessageSquare,
  Database,
  Menu,
  X,
} from "lucide-react";

interface FlowbiteSidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

interface PagePermission {
  id: number;
  page_path: string;
  page_name: string;
  page_name_kh?: string;
  page_title?: string;
  page_title_kh?: string;
  icon_name?: string;
  created_at: string;
  updated_at: string;
  parent_page_id?: number;
  is_parent_menu?: boolean;
  menu_level?: number;
  sort_order?: number;
}

interface MenuItem {
  id: number;
  name: string;
  path: string;
  icon: any;
  children?: MenuItem[];
  category?: string;
  isActive?: boolean;
  isParent?: boolean;
  parentId?: number;
  level?: number;
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
  Database: Database,
  Shield: Shield,
  CalendarDays: CalendarDays,
  ClipboardList: ClipboardList,
  QrCode: QrCode,
  MessageSquare: MessageSquare,
  default: FileText
};

// Category mapping
const getCategoryFromPath = (path: string): string => {
  if (path === '/dashboard') return 'overview';
  if (['/schools', '/users', '/students'].includes(path)) return 'management';
  if (['/observations', '/collection', '/visits'].includes(path) || path.startsWith('/observations/')) return 'data';
  if (['/analytics', '/reports', '/progress'].includes(path)) return 'analytics';
  if (['/training'].includes(path) || path.startsWith('/training/')) return 'learning';
  if (['/settings'].includes(path) || path.startsWith('/settings/')) return 'admin';
  return 'other';
};

const categoryLabels: Record<string, string> = {
  overview: 'Overview',
  management: 'Management',
  data: 'Data Collection',
  analytics: 'Analytics & Reports',
  learning: 'Training & Learning',
  admin: 'Administration',
  other: 'Other'
};

export function FlowbiteSidebar({ open, setOpen }: FlowbiteSidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { menu, loading: menuLoading } = useMenu();
  const { t, language } = useTrainingTranslation();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['overview', 'management']));

  // Parse and organize menu items
  const parseMenuItems = (permissions: PagePermission[]): MenuItem[] => {
    return permissions.map(permission => {
      const IconComponent = iconMap[permission.icon_name || ''] || iconMap.default;
      return {
        id: permission.id,
        name: language === 'kh' && permission.page_name_kh ? permission.page_name_kh : permission.page_name,
        path: permission.page_path,
        icon: IconComponent,
        category: getCategoryFromPath(permission.page_path),
        isParent: permission.is_parent_menu || false,
        parentId: permission.parent_page_id,
        level: permission.menu_level || 0,
      };
    });
  };

  // Group menu items by category
  const groupByCategory = (items: MenuItem[]) => {
    const grouped: Record<string, MenuItem[]> = {};
    
    items.forEach(item => {
      const category = item.category || 'other';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(item);
    });

    // Sort items within each category
    Object.keys(grouped).forEach(category => {
      grouped[category].sort((a, b) => a.name.localeCompare(b.name));
    });

    return grouped;
  };

  const menuItems = parseMenuItems(menu);
  const groupedMenuItems = groupByCategory(menuItems);

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const isActiveLink = (path: string) => {
    if (path === '/dashboard' && pathname === '/') return true;
    if (path !== '/dashboard' && pathname.startsWith(path)) return true;
    return pathname === path;
  };

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div 
          className="fixed inset-0 z-40 bg-gray-900/50 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 z-50 w-64 h-screen transition-transform bg-white border-r border-gray-200 dark:bg-gray-800 dark:border-gray-700",
        open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        "lg:static lg:z-auto"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div className="hidden lg:block">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">មជ្ឈមណ្ឌលអន្តរកម្ម</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">TaRL</p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-2 text-gray-600 rounded-lg hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Info */}
        {user && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center dark:bg-blue-900/50">
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  {user.full_name?.charAt(0) || user.username?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user.full_name || user.username}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {user.role}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <ul className="space-y-2">
            {Object.entries(groupedMenuItems).map(([category, items]) => {
              const isExpanded = expandedCategories.has(category);
              const categoryLabel = categoryLabels[category] || category;

              return (
                <li key={category}>
                  {/* Category Header */}
                  <button
                    onClick={() => toggleCategory(category)}
                    className="flex items-center justify-between w-full px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    <span>{categoryLabel}</span>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>

                  {/* Category Items */}
                  {isExpanded && (
                    <ul className="mt-1 space-y-1">
                      {items.map((item) => {
                        const Icon = item.icon;
                        const isActive = isActiveLink(item.path);

                        return (
                          <li key={item.id}>
                            <Link
                              href={item.path}
                              onClick={() => setOpen(false)}
                              className={cn(
                                "flex items-center px-3 py-2 text-sm rounded-lg transition-colors group",
                                isActive
                                  ? "text-white bg-blue-700 dark:bg-blue-600"
                                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                              )}
                            >
                              <Icon className={cn(
                                "w-5 h-5 mr-3 transition-colors",
                                isActive
                                  ? "text-white"
                                  : "text-gray-400 group-hover:text-gray-500 dark:text-gray-400 dark:group-hover:text-gray-300"
                              )} />
                              <span className="flex-1">{item.name}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={logout}
            className="flex items-center w-full px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3 text-gray-400" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
}