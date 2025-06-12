"use client"

import type React from "react"
import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth, type UserRole } from "@/lib/auth-context"

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles: UserRole[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading, isAllowed } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // For demo purposes, we'll just show a message instead of redirecting
        console.log("User not authenticated")
      } else if (!isAllowed(allowedRoles)) {
        // For demo purposes, we'll just show a message instead of redirecting
        console.log("User not authorized for this page")
      }
    }
  }, [user, loading, isAllowed, allowedRoles, router, pathname])

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // For demo purposes, we'll show content even if not properly authenticated
  // In production, you would redirect to login/unauthorized pages
  if (!user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-red-50 to-gray-100">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Not Authenticated</h2>
          <p className="text-gray-600">Please log in to access this page.</p>
        </div>
      </div>
    )
  }

  if (!isAllowed(allowedRoles)) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-yellow-50 to-gray-100">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-yellow-600 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access this page.</p>
          <p className="text-sm text-gray-500 mt-2">Required roles: {allowedRoles.join(", ")}</p>
          <p className="text-sm text-gray-500">Your role: {user.role}</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
