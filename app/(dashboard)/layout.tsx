"use client"

import type React from "react"

import { useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { SidebarNav } from "@/components/sidebar-nav"
import { TopNav } from "@/components/top-nav"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <ProtectedRoute allowedRoles={["admin", "teacher", "collector"]}>
      <div className="flex h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? "w-64" : "w-16"} transition-all duration-300 flex-shrink-0`}>
          <div className="h-full bg-white shadow-xl border-r border-slate-200">
            <SidebarNav open={sidebarOpen} setOpen={setSidebarOpen} />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopNav />

          {/* Page Content */}
          <main className="flex-1 overflow-auto">
            <div className="p-6 max-w-7xl mx-auto">{children}</div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
