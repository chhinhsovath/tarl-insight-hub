import type React from "react"
import { Sidebar } from "@/components/sidebar"
import { AuthProvider } from "@/lib/auth-context"
import { MenuProvider } from "@/lib/menu-context"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <MenuProvider>
        <div className="flex h-screen bg-gray-50">
          <Sidebar />
          <div className="flex flex-col flex-1 overflow-hidden">
            
            <main className="flex-1 overflow-y-auto p-6">{children}</main>
          </div>
        </div>
      </MenuProvider>
    </AuthProvider>
  )
}
