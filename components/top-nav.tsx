"use client"

import { usePathname } from "next/navigation"
import { Bell, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"

export function TopNav() {
  const pathname = usePathname()
  const { user } = useAuth()

  const getPageTitle = () => {
    const segments = pathname.split("/").filter(Boolean)
    if (segments.length === 0) return "Dashboard"

    const pageMap: Record<string, string> = {
      dashboard: "Dashboard",
      schools: "Schools Management",
      users: "User Management",
      observations: "Observations",
      analytics: "Analytics",
      reports: "Reports",
      settings: "Settings",
    }

    return pageMap[segments[0]] || segments[0].charAt(0).toUpperCase() + segments[0].slice(1)
  }

  const getPageDescription = () => {
    const segments = pathname.split("/").filter(Boolean)

    const descriptionMap: Record<string, string> = {
      dashboard: "Overview of your TaRL implementation",
      schools: "Manage participating schools and their information",
      users: "Manage system users and their roles",
      observations: "Classroom observation data and analytics",
      analytics: "Detailed insights and performance metrics",
      reports: "Generate and export comprehensive reports",
      settings: "System configuration and preferences",
    }

    return descriptionMap[segments[0]] || ""
  }

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="flex items-center space-x-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{getPageTitle()}</h1>
          <p className="text-sm text-gray-500">{getPageDescription()}</p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input placeholder="Search..." className="w-64 pl-10 soft-input border-gray-200" />
        </div>

        <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-gray-100">
          <Bell className="h-4 w-4" />
          <Badge className="absolute -top-1 -right-1 h-2 w-2 p-0 bg-red-500" />
        </Button>

        <div className="flex items-center space-x-2 text-sm">
          <div className="text-right">
            <div className="font-medium text-gray-900">{user?.name}</div>
            <div className="text-gray-500 capitalize">{user?.role}</div>
          </div>
          <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  )
}
