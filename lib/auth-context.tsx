"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export type UserRole = "Admin" | "Teacher" | "Coordinator" | "Staff"

export type User = {
  id: string
  full_name: string
  email: string
  role: UserRole
  school_id?: number
  province_id?: number
  district_id?: number
  phone?: string
  gender?: string
  years_of_experience?: number
}

// Mock users for each role - keeping the name as mockUsers to avoid breaking imports
export const mockUsers: User[] = [
  {
    id: "12",
    full_name: "Mr. Kosal Vann",
    email: "kosal.vann@tarl.edu.kh",
    role: "Admin",
    phone: "012-345-689",
    gender: "Male",
    years_of_experience: 20,
  },
  {
    id: "1",
    full_name: "Ms. Sophea Lim",
    email: "sophea.lim@tarl.edu.kh",
    role: "Teacher",
    school_id: 1,
    province_id: 1,
    district_id: 1,
    phone: "012-345-678",
    gender: "Female",
    years_of_experience: 8,
  },
  {
    id: "9",
    full_name: "Ms. Bopha Keo",
    email: "bopha.keo@tarl.edu.kh",
    role: "Coordinator",
    province_id: 1,
    phone: "012-345-686",
    gender: "Female",
    years_of_experience: 15,
  },
]

type AuthContextType = {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  switchUser: (userId: string) => void
  isAllowed: (allowedRoles: (UserRole | string)[]) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for stored user session or set default admin user
    const storedUser = localStorage.getItem("tarl-user")
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (error) {
        localStorage.removeItem("tarl-user")
        // Set default admin user for demo
        setUser(mockUsers[0])
      }
    } else {
      // Set default admin user for demo
      setUser(mockUsers[0])
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

  const switchUser = (userId: string) => {
    const foundUser = mockUsers.find((u) => u.id === userId)
    if (foundUser) {
      setUser(foundUser)
      localStorage.setItem("tarl-user", JSON.stringify(foundUser))
    }
  }

  const isAllowed = (allowedRoles: (UserRole | string)[]): boolean => {
    if (!user) return false
    const role = user.role.toLowerCase()
    return allowedRoles.some((r) => r.toLowerCase() === role)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, switchUser, isAllowed }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
