"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  BarChart3,
  School,
  Users,
  FileText,
  Settings,
  BookOpen,
  Eye,
  TrendingUp,
  Database,
  MapPin,
  PieChart,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Shield,
  Plus,
  List,
} from "lucide-react"

const iconMap = {
  LayoutDashboard,
  School,
  Users,
  BarChart3,
  FileText,
  Settings,
  BookOpen,
  Eye,
  TrendingUp,
  Database,
  MapPin,
  PieChart,
  Shield,
  Plus,
  List,
}

interface NavigationItem {
  name: string
  href: string
  icon: string
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [navigation, setNavigation] = useState<NavigationItem[]>([])
  const pathname = usePathname()
  const { user, logout } = useAuth()

  useEffect(() => {
    if (user) {
      fetchNavigationItems()
    }
  }, [user])

  const fetchNavigationItems = async () => {
    if (!user) return

    try {
      console.log(`Fetching navigation for user role: ${user.role}`);
      
      // Always try page_permissions table first since it exists
      const response = await fetch("/api/data/page-permissions")
      if (!response.ok) {
        console.error("Failed to fetch page permissions:", response.status)
        throw new Error("Failed to fetch page permissions");
      }
      
      const data = await response.json()
      console.log("Page permissions from database:", data)

      // For admin users, show all pages from database
      if (user.role.toLowerCase() === 'admin') {
        const items = data.map((item: any) => ({
          name: item.page_name,
          href: item.page_path,
          icon: item.icon_name,
        }))
        console.log(`Admin user: showing ${items.length} items`);
        setNavigation(items)
      } else {
        // Try to get role-based permissions for non-admin users
        try {
          const permResponse = await fetch(`/api/data/user-permissions?role=${user.role.toLowerCase()}`)
          
          if (permResponse.ok && permResponse.status !== 404) {
            // Use role-based permissions if available
            const permData = await permResponse.json()
            console.log("Role-based permissions:", permData)
            
            const items = permData.map((item: any) => ({
              name: item.page_name,
              href: item.page_path,
              icon: item.icon_name,
            }))
            setNavigation(items)
          } else {
            // Fallback for non-admin users when role permissions don't exist
            const basicPages = data.filter((item: any) => 
              ['/dashboard', '/students', '/training'].includes(item.page_path)
            )
            const items = basicPages.map((item: any) => ({
              name: item.page_name,
              href: item.page_path,
              icon: item.icon_name,
            }))
            console.log(`Non-admin fallback: showing ${items.length} items`);
            setNavigation(items)
          }
        } catch (roleError) {
          console.log("Role permissions failed, using basic fallback for non-admin");
          const basicPages = data.filter((item: any) => 
            ['/dashboard', '/students', '/training'].includes(item.page_path)
          )
          const items = basicPages.map((item: any) => ({
            name: item.page_name,
            href: item.page_path,
            icon: item.icon_name,
          }))
          setNavigation(items)
        }
      }
    } catch (error) {
      console.error("Error fetching navigation items:", error)
      // Ultimate fallback navigation
      if (user.role.toLowerCase() === 'admin') {
        setNavigation([
          { name: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
          { name: "Users", href: "/users", icon: "Users" },
          { name: "Schools", href: "/schools", icon: "School" },
          { name: "Settings", href: "/settings", icon: "Settings" },
          { name: "Page Management", href: "/settings/page-permissions", icon: "Shield" }
        ])
      } else {
        setNavigation([
          { name: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" }
        ])
      }
    }
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
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const Icon = iconMap[item.icon as keyof typeof iconMap] || BarChart3
            const isActive = pathname === item.href

            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? "bg-blue-100 text-blue-700 font-medium"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
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
