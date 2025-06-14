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
      const response = await fetch("/api/permissions")
      const data = await response.json()
      
      console.log("API Permissions Data:", data)
      console.log("User Role:", user.role)
      console.log("Permissions for user role:", data[user.role.toLowerCase()])

      const userRole = user.role.toLowerCase()
      if (data[userRole]) {
        const items = data[userRole].map((item: any) => ({
          name: item.page_name,
          href: item.page_path,
          icon: item.icon_name,
        }))
        setNavigation(items)
      } else {
        setNavigation([]) // Clear navigation if no permissions for role
      }
    } catch (error) {
      console.error("Error fetching navigation items:", error)
      setNavigation([]) // Clear navigation on error
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
