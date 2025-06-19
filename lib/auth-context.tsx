"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useRouter } from "next/navigation"

interface User {
  id: number
  full_name: string
  email: string
  username: string
  role: string
  school_id: number | null
  province_id: number | null
  district_id: number | null
  is_active: boolean
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (emailOrUsername: string, password: string) => Promise<void>
  logout: () => void
  error: string | null
  isAllowed: (allowedRoles: string[]) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in on mount
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/check")
        if (response.ok) {
          const userData = await response.json()
          setUser(userData)
        }
      } catch (error) {
        console.error("Auth check failed:", error)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (emailOrUsername: string, password: string) => {
    try {
      setError(null)
      const response = await fetch("/api/auth/unified-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier: emailOrUsername,
          password,
          loginType: "auto"
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 423) {
          throw new Error(`Account is locked until ${new Date(data.lockedUntil).toLocaleString()}`)
        }
        throw new Error(data.message || "Login failed")
      }

      setUser(data.user)
      
      // For participants, also store localStorage data for backward compatibility
      if (data.userType === 'participant' && data.participantSession) {
        localStorage.setItem('participant-session', JSON.stringify(data.participantSession));
      }
      
      // Redirect to role-specific dashboard
      router.push(data.redirectUrl || "/dashboard")
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred during login")
      throw error
    }
  }

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      setUser(null)
      // Clear participant localStorage data if it exists
      localStorage.removeItem("participant-session")
      router.push("/login")
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  const isAllowed = (allowedRoles: string[]): boolean => {
    if (!user) return false
    return allowedRoles.map(role => role.toLowerCase()).includes(user.role.toLowerCase())
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, error, isAllowed }}>
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
