"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export type UserRole = "admin" | "teacher" | "collector"

export type User = {
  id: string
  name: string
  email: string
  role: UserRole
  school?: string
  district?: string
  province?: string
}

// Mock users for each role
export const mockUsers: User[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    email: "admin@tarl.org",
    role: "admin",
    province: "Western Cape",
  },
  {
    id: "2",
    name: "Michael Chen",
    email: "teacher@school.edu",
    role: "teacher",
    school: "Greenfield Primary School",
    district: "Cape Town Metro",
    province: "Western Cape",
  },
  {
    id: "3",
    name: "Priya Patel",
    email: "collector@tarl.org",
    role: "collector",
    district: "Johannesburg",
    province: "Gauteng",
  },
]

type AuthContextType = {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  isAllowed: (allowedRoles: UserRole[]) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem("tarl-user")
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (error) {
        localStorage.removeItem("tarl-user")
      }
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true)

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Find user by email (password is ignored for demo)
    const foundUser = mockUsers.find((u) => u.email === email)

    if (foundUser && password === "password") {
      setUser(foundUser)
      localStorage.setItem("tarl-user", JSON.stringify(foundUser))
      setLoading(false)
      return true
    }

    setLoading(false)
    return false
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("tarl-user")
  }

  const isAllowed = (allowedRoles: UserRole[]): boolean => {
    if (!user) return false
    return allowedRoles.includes(user.role)
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
