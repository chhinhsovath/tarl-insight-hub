"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"

export type UserRole = "admin" | "teacher" | "collector"

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  school_id?: string
  school_name?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  isAllowed: (allowedRoles: UserRole[]) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Mock users for development
export const mockUsers: User[] = [
  {
    id: "1",
    name: "Admin User",
    email: "admin@tarl.org",
    role: "admin",
  },
  {
    id: "2",
    name: "Teacher John",
    email: "teacher@school.edu",
    role: "teacher",
    school_id: "1",
    school_name: "Primary School A",
  },
  {
    id: "3",
    name: "Data Collector",
    email: "collector@tarl.org",
    role: "collector",
  },
]

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem("tarl_user")
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        setUser(parsedUser)
      } catch (error) {
        console.error("Error parsing stored user:", error)
        localStorage.removeItem("tarl_user")
      }
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    // Handle routing based on auth state
    if (!loading) {
      const isAuthPage = pathname === "/login" || pathname === "/unauthorized"
      const isRootPage = pathname === "/"

      if (!user && !isAuthPage && !isRootPage) {
        router.push("/login")
      } else if (user && (isAuthPage || isRootPage)) {
        router.push("/dashboard")
      }
    }
  }, [user, loading, pathname, router])

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const foundUser = mockUsers.find((u) => u.email === email)

    if (foundUser && password === "password") {
      setUser(foundUser)
      localStorage.setItem("tarl_user", JSON.stringify(foundUser))
      setLoading(false)
      return true
    }

    setLoading(false)
    return false
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("tarl_user")
    router.push("/login")
  }

  const isAllowed = (allowedRoles: UserRole[]): boolean => {
    return user !== null && allowedRoles.includes(user.role)
  }

  return <AuthContext.Provider value={{ user, loading, login, logout, isAllowed }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
