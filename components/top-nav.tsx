"use client"

import { useAuth } from "@/lib/auth-context"
import { RoleSwitcher } from "@/components/role-switcher"
import { Button } from "@/components/ui/button"
import { Bell, Settings } from "lucide-react"

export function TopNav() {
  const { user } = useAuth()

  if (!user) return null

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">TaRL Insight Hub</h1>
          <p className="text-sm text-gray-600">Teaching at the Right Level - Data Management System</p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm">
            <Bell className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
          <RoleSwitcher />
        </div>
      </div>
    </header>
  )
}
