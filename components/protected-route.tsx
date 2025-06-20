"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles: string[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading, isAllowed } = useAuth()
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && user) {
      checkPermission()
    }
  }, [user, loading, pathname])

  const checkPermission = async () => {
    if (!user) return

    // Bypass permission check for /schools and its sub-routes
    if (pathname.startsWith("/schools")) {
      setHasPermission(true);
      return;
    }

    // If user role is in allowed roles (case-insensitive), grant permission
    const roleAllowed = isAllowed(allowedRoles);
    if (roleAllowed) {
      setHasPermission(true);
      return;
    }

    try {
      const response = await fetch("/api/permissions", { cache: 'no-store' })
      const data = await response.json()
      
      const userRole = user.role.toLowerCase()
      
      // Normalize data keys to lowercase for case-insensitive matching
      const normalizedPermissions: { [key: string]: any[] } = {}
      for (const role in data) {
        normalizedPermissions[role.toLowerCase()] = data[role];
      }

      const userPermissions = normalizedPermissions[userRole] || []
      
      const hasAccess = userPermissions.some(
        (permission: any) => {
          // For dynamic routes like /schools/[schoolId], the page_path will be stored as /schools/[schoolId]
          // The actual pathname will be something like /schools/7365
          // We need to compare them flexibly using a regex.
          const permissionPathPattern = new RegExp(
            "^" + permission.page_path.replace(/\[[^]]+\]/g, '[^/]+') + "$"
          );
          return permissionPathPattern.test(pathname) && permission.is_allowed;
        }
      )

      setHasPermission(hasAccess)
    } catch (error) {
      console.error("Error checking permission:", error)
      setHasPermission(false)
    }
  }

  // Show loading spinner while checking authentication and permissions
  if (loading || hasPermission === null) {
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

  // Check if user has allowed role (case-insensitive)
  const roleAllowed = isAllowed(allowedRoles);
  
  if (!roleAllowed || !hasPermission) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-yellow-50 to-gray-100">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-yellow-600 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access this page.</p>
          <p className="text-sm text-gray-500 mt-2">Required roles: {allowedRoles.join(", ")}</p>
          <p className="text-sm text-gray-500">Your role: {user.role}</p>
          <p className="text-sm text-gray-400 mt-1">
            Role check: {roleAllowed ? 'PASS' : 'FAIL'} | 
            Permission check: {hasPermission ? 'PASS' : 'FAIL'}
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
