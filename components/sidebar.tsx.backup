"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useTrainingLoading } from "./training-loading-provider"
import { useTrainingTranslation } from "@/lib/training-i18n"
import {
  Users,
  FileText,
  Settings,
  Eye,
  TrendingUp,
  Database,
  MapPin,
  PieChart,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  Shield,
  Plus,
  List,
  Building,
  Home,
  ClipboardList,
  GraduationCap,
  CalendarDays,
  QrCode,
  MessageSquare,
} from "lucide-react"

const iconMap = {
  LayoutDashboard: Home,
  School: Building,
  Users,
  BarChart3: PieChart,
  FileText,
  Settings,
  BookOpen: GraduationCap,
  Eye,
  TrendingUp,
  Database: ClipboardList,
  MapPin,
  PieChart,
  Shield,
  Plus,
  List,
  CalendarDays,
  ClipboardList,
  QrCode,
  MessageSquare,
}

interface NavigationItem {
  id: number
  name: string
  href: string
  icon: string
  children?: NavigationItem[]
  isParent?: boolean
  parentId?: number
  sortOrder?: number
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [navigation, setNavigation] = useState<NavigationItem[]>([])
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const { startLoading } = useTrainingLoading()
  const { t } = useTrainingTranslation()

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
    if (user) {
      fetchNavigationItems()
    }
  }, [user])

  // Auto-expand parent menus that contain the current page
  useEffect(() => {
    if (navigation.length > 0) {
      const newExpanded = new Set<string>()
      
      // Check if current path is a child page and auto-expand its parent
      navigation.forEach(item => {
        if (item.children && item.children.length > 0) {
          const hasActiveChild = item.children.some(child => 
            pathname === child.href || pathname.startsWith(child.href + '/')
          )
          if (hasActiveChild) {
            newExpanded.add(item.name)
            console.log(`Auto-expanding parent: ${item.name} for active child`)
          }
        }
      })
      
      if (newExpanded.size > 0) {
        setExpandedItems(newExpanded)
      }
    }
  }, [navigation, pathname])

  const fetchNavigationItems = async () => {
    if (!user) return

    try {
      console.log(`Fetching permission-filtered navigation for user role: ${user.role}`)
      
      // First try the new permission-filtered API
      let response = await fetch("/api/user/menu-permissions", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })
      
      let data;
      if (response.ok) {
        data = await response.json()
        console.log("Permission-filtered menu data:", data)
      } else {
        console.error("Permission API failed, falling back to page-permissions API:", response.status)
        
        // Fallback to the original working API and filter client-side
        response = await fetch(`/api/data/page-permissions?t=${Date.now()}`)
        if (!response.ok) {
          console.error("Failed to fetch page permissions:", response.status)
          throw new Error("Failed to fetch page permissions")
        }
        
        const allPages = await response.json()
        console.log("All page permissions from database:", allPages)
        
        // Apply basic client-side filtering based on role
        let filteredPages = allPages;
        if (user.role.toLowerCase() !== 'admin') {
          // For non-admin users, show only basic pages
          const allowedPaths = [
            '/dashboard',
            '/training',
            '/schools', 
            '/students',
            '/observations',
            '/progress'
          ];
          filteredPages = allPages.filter((item: any) => 
            allowedPaths.some(path => item.page_path === path || item.page_path.startsWith(path + '/'))
          );
        }
        
        data = {
          menuItems: filteredPages.map((item: any) => ({
            id: item.id,
            page_name: item.page_name,
            page_path: item.page_path,
            icon_name: item.icon_name,
            parent_page_id: item.parent_page_id,
            sort_order: item.sort_order,
            children: []
          })),
          userRole: user.role,
          totalAllowed: filteredPages.length
        }
        console.log("Converted to menu data:", data)
      }

      // Use permission-filtered menu items from API
      const menuItems = data.menuItems || []
      console.log(`User ${user.role} has access to ${data.totalAllowed} menu items`)
      
      const allItems: NavigationItem[] = menuItems.map((item: any) => ({
        id: item.id,
        name: getTranslatedMenuName(item.page_name, item.page_path),
        href: item.page_path,
        icon: item.icon_name || 'FileText',
        isParent: false, // Will be determined by presence of children
        parentId: item.parent_page_id,
        sortOrder: item.sort_order || 999,
        children: item.children ? item.children.map((child: any) => ({
          id: child.id,
          name: getTranslatedMenuName(child.page_name, child.page_path),
          href: child.page_path,
          icon: child.icon_name || 'FileText',
          isParent: false,
          parentId: child.parent_page_id,
          sortOrder: child.sort_order || 999,
          children: []
        })) : []
      }))

      console.log('Permission-filtered navigation items:', allItems)

      // Items are already hierarchically structured and permission-filtered by the API
      // Just need to update isParent flag for items with children
      allItems.forEach(item => {
        if (item.children && item.children.length > 0) {
          item.isParent = true
        }
      })

      console.log(`Final filtered navigation for ${user.role}:`, allItems.length, 'items')
      setNavigation(allItems)
    } catch (error) {
      console.error("Error fetching navigation items:", error)
      // Ultimate fallback navigation
      setNavigation([
        { id: 1, name: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
        { id: 2, name: "Training Management", href: "/training", icon: "BookOpen" },
      ])
    }
  }

  const toggleExpanded = (itemName: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(itemName)) {
      newExpanded.delete(itemName)
    } else {
      newExpanded.add(itemName)
    }
    setExpandedItems(newExpanded)
    console.log('Toggled item:', itemName, 'Expanded items:', Array.from(newExpanded))
  }

  const renderNavigationItem = (item: NavigationItem) => {
    const Icon = iconMap[item.icon as keyof typeof iconMap] || FileText
    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.has(item.name)

    console.log(`Rendering ${item.name}: hasChildren=${hasChildren}, isExpanded=${isExpanded}, children count=${item.children?.length || 0}`)

    return (
      <li key={item.id} className="space-y-1">
        {hasChildren ? (
          // Parent item with children
          <div>
            <div
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                isActive
                  ? "bg-blue-100 text-blue-700 font-medium"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
              }`}
              onClick={() => {
                // Navigate to parent page if it's a real page
                if (item.href && item.href !== '#') {
                  if (item.href.startsWith('/training')) {
                    startLoading()
                  }
                  window.location.href = item.href
                }
              }}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1">{item.name}</span>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      toggleExpanded(item.name)
                    }}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                  </button>
                </>
              )}
            </div>
            
            {/* Render children if expanded and sidebar is not collapsed */}
            {!collapsed && isExpanded && (
              <ul className="ml-6 space-y-1 border-l border-gray-200 pl-3 mt-1">
                {item.children!.map(child => {
                  const ChildIcon = iconMap[child.icon as keyof typeof iconMap] || FileText
                  const childIsActive = pathname === child.href || pathname.startsWith(child.href + '/')
                  
                  return (
                    <li key={child.id}>
                      <Link
                        href={child.href}
                        onClick={() => {
                          if (child.href.startsWith('/training')) {
                            startLoading()
                          }
                        }}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm ${
                          childIsActive
                            ? "bg-blue-100 text-blue-700 font-medium"
                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                        }`}
                      >
                        <ChildIcon className="w-4 h-4 flex-shrink-0" />
                        <span>{child.name}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        ) : (
          // Regular navigation item
          <Link
            href={item.href}
            onClick={() => {
              if (item.href.startsWith('/training')) {
                startLoading()
              }
            }}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              isActive
                ? "bg-blue-100 text-blue-700 font-medium"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
            }`}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>{item.name}</span>}
          </Link>
        )}
      </li>
    )
  }

  if (!user) return null

  return (
    <div
      className={`bg-white border-r border-gray-200 transition-all duration-300 ${collapsed ? "w-16" : "w-64"} flex flex-col shadow-lg`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div>
              <h2 className="text-lg font-bold text-gray-800">TaRL Hub</h2>
              <Badge variant="secondary" className="text-xs mt-1">
                {user.role}
              </Badge>
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={() => setCollapsed(!collapsed)} className="p-2">
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-auto">
        <ul className="space-y-2">
          {navigation.map(item => renderNavigationItem(item))}
        </ul>
        
        {/* Debug info */}
        {/* {!collapsed && user && (
          <div className="mt-6 p-3 bg-gray-50 rounded-lg text-xs text-gray-500">
            <div className="flex items-center gap-2 mb-1">
              <Database className="w-3 h-3" />
              <span>Hierarchical menu</span>
            </div>
            <div>Role: {user.role}</div>
            <div>Items: {navigation.length}</div>
            <div>Training subs: {navigation.find(n => n.name === 'Training Management')?.children?.length || 0}</div>
          </div>
        )} */}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-gray-200">
        {!collapsed && (
          <div className="mb-3">
            <p className="text-sm font-medium text-gray-800">{user.full_name}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span className="ml-2">Logout</span>}
        </Button>
      </div>
    </div>
  )
}