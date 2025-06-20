"use client";

import type React from "react"
import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { FlowbiteNavbar } from "@/components/flowbite-navbar"
import { AuthProvider } from "@/lib/auth-context"
import { MenuProvider } from "@/lib/menu-context"
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AuthProvider>
      <MenuProvider>
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
          {/* Sidebar */}
          <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
          
          {/* Main Content Area */}
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Top Navbar */}
            <FlowbiteNavbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
            
            {/* Page Content */}
            <main className="flex-1 overflow-y-auto p-4 lg:p-6">
              {children}
            </main>
          </div>
        </div>
      </MenuProvider>
    </AuthProvider>
  )
}