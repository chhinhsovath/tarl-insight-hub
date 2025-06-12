"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
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
} from "lucide-react"

interface SidebarNavProps {
  open: boolean
  setOpen: (open: boolean) => void
}

const adminNavItems = [
  { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { name: "Schools", href: "/schools", icon: School },
  { name: "Users", href: "/users", icon: Users },
  {
    name: "Observations",
    icon: Eye,
    children: [
      { name: "Overview", href: "/observations", icon: BarChart3 },
      { name: "New Observation", href: "/observations/new", icon: Plus },
      { name: "All Observations", href: "/observations/list", icon: List },
    ],
  },
  { name: "Progress", href: "/progress", icon: TrendingUp },
  { name: "Training", href: "/training", icon: GraduationCap },
  { name: "Reports", href: "/reports", icon: FileText },
  { name: "Settings", href: "/settings", icon: Settings },
]

const teacherNavItems = [
  { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { name: "Students", href: "/students", icon: Users },
  {
    name: "Observations",
    icon: Eye,
    children: [
      { name: "Overview", href: "/observations", icon: BarChart3 },
      { name: "New Observation", href: "/observations/new", icon: Plus },
      { name: "My Observations", href: "/observations/list", icon: List },
    ],
  },
  { name: "Progress", href: "/progress", icon: TrendingUp },
  { name: "Training", href: "/training", icon: GraduationCap },
  { name: "Settings", href: "/settings", icon: Settings },
]

const collectorNavItems = [
  { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
  {
    name: "Observations",
    icon: Eye,
    children: [
      { name: "Overview", href: "/observations", icon: BarChart3 },
      { name: "New Observation", href: "/observations/new", icon: Plus },
      { name: "My Observations", href: "/observations/list", icon: List },
    ],
  },
  { name: "Data Collection", href: "/collection", icon: ClipboardList },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function SidebarNav({ open, setOpen }: SidebarNavProps) {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const getNavItems = () => {
    switch (user?.role.toLowerCase()) {
      case "admin":
        return adminNavItems
      case "teacher":
        return teacherNavItems
      case "collector":
        return collectorNavItems
      default:
        return []
    }
  }

  const navItems = getNavItems()

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
        <div className="space-y-1">
          {navItems.map((item) => (
            <div key={item.name}>
              {item.children ? (
                <div className="space-y-1">
                  <div
                    className={cn(
                      "flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-lg",
                      !open && "justify-center",
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {open && <span className="ml-3">{item.name}</span>}
                  </div>
                  {open && (
                    <div className="ml-4 space-y-1">
                      {item.children.map((child) => (
                        <Link key={child.href} href={child.href}>
                          <Button
                            variant="ghost"
                            className={cn(
                              "w-full justify-start text-sm font-normal rounded-lg",
                              pathname === child.href
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
                    )}
                  >
                    <item.icon className={cn("h-4 w-4", open && "mr-3")} />
                    {open && <span>{item.name}</span>}
                  </Button>
                </Link>
              )}
            </div>
          ))}
        </div>
      </nav>

      {/* User Section */}
      <div className="p-4 border-t">
        <div className={cn("flex items-center", open ? "justify-between" : "justify-center")}>
          {open && (
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-900">{user?.name || user?.full_name}</span>
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
  )
}
