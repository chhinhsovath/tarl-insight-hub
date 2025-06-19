"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
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
  // Fallback
  default: FileText
};

// Category mapping based on path patterns
const getCategoryFromPath = (path: string): string => {
  if (path === '/dashboard') return 'overview';
  if (['/schools', '/users', '/students'].includes(path)) return 'management';
  if (['/observations', '/collection', '/visits'].includes(path) || path.startsWith('/observations/')) return 'data';
  if (['/analytics', '/reports', '/progress'].includes(path)) return 'analytics';
  if (['/training'].includes(path) || path.startsWith('/training/')) return 'learning';
  if (['/settings'].includes(path) || path.startsWith('/settings/')) return 'admin';
  return 'other';
};

// We'll define a function to get translated category labels

export function DynamicSidebarNav({ open, setOpen }: SidebarNavProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { refreshTrigger } = useMenu();
  const { t } = useTrainingTranslation();
  const [pages, setPages] = useState<PagePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Function to get translated category labels
  const getCategoryLabels = () => ({
    overview: "Overview",
    management: "Management", 
    data: "Data Collection",
    analytics: "Analytics & Reports",
    learning: t.trainingManagement || "Learning",
    admin: "Administration",
    other: "Other"
  });

  // Function to get translated menu item names
  const getTranslatedMenuName = (originalName: string, path: string) => {
    // For training-related paths, use translation system
    if (path.startsWith('/training/')) {
      switch (path) {
        case '/training/sessions':
          return t.trainingSessions;
        case '/training/programs':
          return t.trainingPrograms;
        case '/training/participants':
          return t.participants;
        case '/training/qr-codes':
          return t.qrCodes;
        case '/training/feedback':
          return t.trainingFeedback;
        case '/training':
          return t.trainingManagement;
        default:
          return originalName;
      }
    }
    // For non-training paths, return original name
    return originalName;
  };

  useEffect(() => {
    loadPages();
  }, [refreshTrigger]);

  // Auto-expand parent menus that contain the current page
  useEffect(() => {
    if (pages.length > 0) {
      const newExpanded = new Set<string>();
      
      // Find if current path is a child page
      pages.forEach(page => {
        if (page.parent_page_id && (pathname === page.page_path || pathname.startsWith(page.page_path + '/'))) {
          // Find the parent page
          const parent = pages.find(p => p.id === page.parent_page_id);
          if (parent) {
            newExpanded.add(parent.page_name);
            console.log(`Auto-expanding parent: ${parent.page_name} for active child: ${page.page_name}`);
          }
        }
      });
      
      if (newExpanded.size > 0) {
        setExpandedItems(newExpanded);
      }
    }
  }, [pages, pathname]);

  const loadPages = async () => {
    try {
      setLoading(true);
      
      // First try to get user's personal menu order
      const userMenuResponse = await fetch(`/api/user/menu-order?t=${Date.now()}`);
      if (userMenuResponse.ok) {
        const userData = await userMenuResponse.json();
        console.log('User menu data:', userData);
        if (userData.pages && userData.pages.length > 0) {
          console.log('Using user personal menu order:', userData.pages);
          setPages(userData.pages);
          return;
        } else {
          console.log('No user personal menu found, falling back to system default');
        }
      } else {
        console.log('Failed to fetch user menu order:', userMenuResponse.status);
      }
      
      // Fallback to permission-filtered pages
      const response = await fetch("/api/user/menu-permissions", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched permission-filtered menu data:', data);
        
        // Convert hierarchical menu items to flat pages array
        const flattenMenuItems = (items: any[]): PagePermission[] => {
          const result: PagePermission[] = [];
          items.forEach(item => {
            result.push({
              id: item.id,
              page_path: item.page_path,
              page_name: item.page_name,
              icon_name: item.icon_name,
              parent_page_id: item.parent_page_id,
              is_parent_menu: item.children && item.children.length > 0,
              sort_order: item.sort_order,
              created_at: '',
              updated_at: ''
            });
            
            // Add children to flat array
            if (item.children && item.children.length > 0) {
              item.children.forEach((child: any) => {
                result.push({
                  id: child.id,
                  page_path: child.page_path,
                  page_name: child.page_name,
                  icon_name: child.icon_name,
                  parent_page_id: child.parent_page_id,
                  is_parent_menu: false,
                  sort_order: child.sort_order,
                  created_at: '',
                  updated_at: ''
                });
              });
            }
          });
          return result;
        };
        
        const flatPages = flattenMenuItems(data.menuItems || []);
        console.log('Flattened permission-filtered pages:', flatPages);
        setPages(flatPages);
      } else {
        console.error('Failed to fetch permission-filtered pages from database');
        setPages([
          { id: 1, page_path: '/dashboard', page_name: 'Dashboard', icon_name: 'LayoutDashboard', created_at: '', updated_at: '' },
          { id: 2, page_path: '/settings', page_name: 'Settings', icon_name: 'Settings', created_at: '', updated_at: '' }
        ]);
      }
    } catch (error) {
      console.error('Error loading pages:', error);
      setPages([
        { id: 1, page_path: '/dashboard', page_name: 'Dashboard', icon_name: 'LayoutDashboard', created_at: '', updated_at: '' },
        { id: 2, page_path: '/settings', page_name: 'Settings', icon_name: 'Settings', created_at: '', updated_at: '' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const buildHierarchicalMenu = (): Record<string, MenuItem[]> => {
    if (!user) return {};

    console.log('Building hierarchical menu from pages:', pages);

    // Convert to menu items
    const filteredPages = pages;
    
    // Create menu items
    const allMenuItems: MenuItem[] = filteredPages.map(page => ({
      id: page.id,
      name: getTranslatedMenuName(page.page_name, page.page_path),
      path: page.page_path,
      icon: iconMap[page.icon_name || 'default'] || iconMap.default,
      category: getCategoryFromPath(page.page_path),
      isActive: pathname === page.page_path || pathname.startsWith(page.page_path + '/'),
      isParent: page.is_parent_menu || false,
      parentId: page.parent_page_id,
      level: page.menu_level || 0,
      children: []
    }));

    console.log('All menu items:', allMenuItems);

    // Build hierarchical structure
    const rootItems: MenuItem[] = [];
    const itemsMap = new Map<number, MenuItem>();
    
    // Create a map for quick lookup
    allMenuItems.forEach(item => {
      itemsMap.set(item.id, item);
    });

    // Build the hierarchy - separate root items and child items
    allMenuItems.forEach(item => {
      console.log(`Processing item: ${item.name}, parentId: ${item.parentId}, id: ${item.id}`);
      if (item.parentId && itemsMap.has(item.parentId)) {
        // This is a child item
        const parent = itemsMap.get(item.parentId)!;
        if (!parent.children) {
          parent.children = [];
        }
        parent.children.push(item);
        console.log(`✅ Added child ${item.name} to parent ${parent.name}`);
      } else {
        // This is a root item
        rootItems.push(item);
        console.log(`📁 Added root item: ${item.name}`);
      }
    });

    // Sort children within each parent by sort order from database
    rootItems.forEach(item => {
      if (item.children && item.children.length > 0) {
        // Find the original page data to get sort_order
        item.children.sort((a, b) => {
          const aPage = pages.find(p => p.id === a.id);
          const bPage = pages.find(p => p.id === b.id);
          const aSortOrder = aPage?.sort_order || 999;
          const bSortOrder = bPage?.sort_order || 999;
          return aSortOrder - bSortOrder;
        });
        console.log(`Parent ${item.name} has ${item.children.length} children:`, item.children.map(c => c.name));
      }
    });

    // Group root items by category
    const grouped = rootItems.reduce((acc, item) => {
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

    console.log('Final grouped items:', sortedGrouped);
    return sortedGrouped;
  };

  const groupedItems = buildHierarchicalMenu();

  const toggleExpanded = (itemName: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemName)) {
      newExpanded.delete(itemName);
    } else {
      newExpanded.add(itemName);
    }
    setExpandedItems(newExpanded);
    console.log('Toggled item:', itemName, 'Expanded items:', Array.from(newExpanded));
  };

  const renderMenuItem = (item: MenuItem) => {
    const isExpanded = expandedItems.has(item.name);
    const hasChildren = item.children && item.children.length > 0;
    
    console.log(`Rendering menu item: ${item.name}, hasChildren: ${hasChildren}, isExpanded: ${isExpanded}`);
    
    return (
      <div key={item.id} className="space-y-1">
        {hasChildren ? (
          // Parent item with children - render with toggle functionality
          <div>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start rounded-lg group",
                item.isActive
                  ? "bg-blue-50 text-blue-700 hover:bg-blue-50"
                  : "text-gray-600 hover:bg-gray-50",
                !open && "justify-center px-2"
              )}
              onClick={() => {
                // Navigate to parent page if it's a real page
                if (item.path && item.path !== '#') {
                  window.location.href = item.path;
                }
              }}
            >
              <item.icon className={cn("h-4 w-4 flex-shrink-0", open && "mr-3")} />
              {open && (
                <>
                  <span className="flex-1 text-left">{item.name}</span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleExpanded(item.name);
                    }}
                    className="ml-2 p-1 hover:bg-gray-200 rounded transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                  </button>
                </>
              )}
            </Button>
            
            {/* Render children if expanded */}
            {open && isExpanded && (
              <div className="ml-6 space-y-1 border-l border-gray-200 pl-3 mt-1">
                {item.children!.map(child => (
                  <Link key={child.id} href={child.path}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start text-sm font-normal rounded-lg",
                        child.isActive
                          ? "bg-blue-50 text-blue-700 hover:bg-blue-50"
                          : "text-gray-600 hover:bg-gray-50"
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
        ) : (
          // Regular menu item - render as link
          <Link href={item.path}>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start rounded-lg group",
                item.isActive
                  ? "bg-blue-50 text-blue-700 hover:bg-blue-50"
                  : "text-gray-600 hover:bg-gray-50",
                !open && "justify-center px-2"
              )}
            >
              <item.icon className={cn("h-4 w-4 flex-shrink-0", open && "mr-3")} />
              {open && <span className="flex-1 text-left">{item.name}</span>}
            </Button>
          </Link>
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
                    {getCategoryLabels()[category as keyof ReturnType<typeof getCategoryLabels>] || category}
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
          {/* {open && user && (
            <div className="px-3 py-2 mx-2 bg-gray-50 rounded-lg">
              <div className="flex items-center text-xs text-gray-500">
                <Database className="h-3 w-3 mr-2" />
                <span>Hierarchical menu</span>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Role: <span className="capitalize font-medium">{user.role}</span>
              </div>
              <div className="text-xs text-gray-400">
                Items: {pages.length}
              </div>
            </div>
          )} */}
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