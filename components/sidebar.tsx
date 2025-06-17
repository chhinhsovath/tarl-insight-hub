"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useTrainingLoading } from "./training-loading-provider"
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
      console.log(`Fetching hierarchical navigation for user role: ${user.role}`)
      
      const response = await fetch(`/api/data/page-permissions?t=${Date.now()}`)
      if (!response.ok) {
        console.error("Failed to fetch page permissions:", response.status)
        throw new Error("Failed to fetch page permissions")
      }
      
      const data = await response.json()
      console.log("Page permissions from database:", data)

      // Convert ALL pages to navigation items (removed the shouldHideFromSidebar filter)
      const allItems: NavigationItem[] = data.map((item: any) => ({
        id: item.id,
        name: item.page_name,
        href: item.page_path,
        icon: item.icon_name || 'FileText',
        isParent: item.is_parent_menu || false,
        parentId: item.parent_page_id,
        sortOrder: item.sort_order || 999,
        children: []
      }))

      console.log('All navigation items:', allItems)

      // Build hierarchical structure
      const rootItems: NavigationItem[] = []
      const itemsMap = new Map<number, NavigationItem>()
      
      // Create a map for quick lookup
      allItems.forEach(item => {
        itemsMap.set(item.id, item)
      })

      // Build the hierarchy
      allItems.forEach(item => {
        console.log(`Processing item: ${item.name}, parentId: ${item.parentId}, id: ${item.id}`)
        if (item.parentId && itemsMap.has(item.parentId)) {
          // This is a child item
          const parent = itemsMap.get(item.parentId)!
          if (!parent.children) {
            parent.children = []
          }
          parent.children.push(item)
          console.log(`✅ Added child ${item.name} to parent ${parent.name}`)
        } else {
          // This is a root item
          rootItems.push(item)
          console.log(`📁 Added root item: ${item.name}`)
        }
      })

      // Sort root items by sort_order
      rootItems.sort((a, b) => (a.sortOrder || 999) - (b.sortOrder || 999))

      // Sort children within each parent by sort_order
      rootItems.forEach(item => {
        if (item.children && item.children.length > 0) {
          item.children.sort((a, b) => (a.sortOrder || 999) - (b.sortOrder || 999))
          console.log(`Parent ${item.name} has ${item.children.length} children:`, item.children.map(c => c.name))
        }
      })

      console.log('Final hierarchical navigation:', rootItems)

      // Apply role-based filtering (but keep hierarchical structure intact)
      if (user.role.toLowerCase() === 'admin') {
        console.log(`Admin user: showing all ${rootItems.length} items`)
        setNavigation(rootItems)
      } else {
        // For non-admin users, show all items but let the backend handle permissions
        console.log(`User role ${user.role}: showing ${rootItems.length} items`)
        setNavigation(rootItems)
      }
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