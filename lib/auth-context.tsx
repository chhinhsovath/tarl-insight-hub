"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { supabase } from "../lib/supabase" // Adjusted path
import type { AuthChangeEvent, Session } from "@supabase/supabase-js"

export type UserRole = "Admin" | "Teacher" | "Coordinator" | "Staff"

// Updated User type
export type User = {
  id: string // Supabase auth user ID (auth.users.id)
  app_id: number // tnr_users.id (SERIAL PRIMARY KEY)
  full_name: string
  email: string
  role: UserRole
  school_id?: number
  province_id?: number
  district_id?: number
  phone?: string
  gender?: string
  years_of_experience?: number
  profile_picture_url?: string
}

type AuthContextType = {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void> // Updated to Promise<void>
  isAllowed: (allowedRoles: UserRole[]) => boolean
  // switchUser is removed
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      if (event === "SIGNED_OUT") {
        setUser(null)
        setLoading(false)
      } else if (session && (event === "SIGNED_IN" || event === "USER_UPDATED" || event === "INITIAL_SESSION")) {
        const { data: profile, error } = await supabase
          .from("tnr_users")
          .select("*")
          .eq("auth_user_id", session.user.id)
          .single()

        if (error) {
          console.error("Error fetching user profile:", error)
          setUser(null) // Or handle more gracefully, maybe sign out
          setLoading(false)
          // Potentially sign out the user if profile is essential and not found
          // await supabase.auth.signOut();
        } else if (profile) {
          const fullUser: User = {
            id: session.user.id, // Supabase auth user ID
            app_id: profile.id, // tnr_users.id, renamed to app_id for clarity
            full_name: profile.full_name,
            email: session.user.email || profile.email, // Prefer session email
            role: profile.role as UserRole, // Ensure role is correctly typed
            school_id: profile.school_id,
            province_id: profile.province_id,
            district_id: profile.district_id,
            phone: profile.phone,
            gender: profile.gender,
            years_of_experience: profile.years_of_experience,
            profile_picture_url: profile.profile_picture_url,
          }
          setUser(fullUser)
          setLoading(false)
        } else {
          // No profile found, but user is signed in. This might be an error condition.
          console.warn("User signed in but no profile found in tnr_users for auth_user_id:", session.user.id)
          // Decide how to handle: sign out, set partial user, etc.
          // For now, treating as if not fully logged in:
          setUser(null)
          setLoading(false)
          // Optionally sign them out:
          // await supabase.auth.signOut();
        }
      } else if (event === "INITIAL_SESSION" && !session) {
        // No active session on initial load
        setUser(null)
        setLoading(false)
      }
      // Consider other events if necessary: TOKEN_REFRESHED, USER_DELETED, PASSWORD_RECOVERY
    })

    // Check initial session explicitly in case onAuthStateChange doesn't fire INITIAL_SESSION immediately with a session
    // or if there's a race condition.
    const checkInitialSession = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) {
        console.error("Error getting initial session:", sessionError)
        setLoading(false)
        return
      }

      if (session) {
        // If session exists, and onAuthStateChange hasn't set the user yet, fetch profile
        // This logic is similar to SIGNED_IN, ensure it doesn't cause duplicate fetches if onAuthStateChange is reliable
        // For safety, only proceed if user is not yet set by onAuthStateChange
        if (!user) { // Check if user is already set to avoid race condition / re-fetch
          const { data: profile, error } = await supabase
            .from("tnr_users")
            .select("*")
            .eq("auth_user_id", session.user.id)
            .single()

          if (error) {
            console.error("Error fetching user profile on initial check:", error)
            setUser(null)
          } else if (profile) {
            const fullUser: User = {
              id: session.user.id,
              app_id: profile.id,
              full_name: profile.full_name,
              email: session.user.email || profile.email,
              role: profile.role as UserRole,
              school_id: profile.school_id,
              province_id: profile.province_id,
              district_id: profile.district_id,
              phone: profile.phone,
              gender: profile.gender,
              years_of_experience: profile.years_of_experience,
              profile_picture_url: profile.profile_picture_url,
            }
            setUser(fullUser)
          } else {
            setUser(null) // No profile found
          }
        }
      } else {
        setUser(null) // No session
      }
      setLoading(false) // Ensure loading is set to false after initial check
    }

    checkInitialSession();


    return () => {
      subscription?.unsubscribe()
    }
  }, [user]) // Added user to dependency array to re-evaluate if user changes elsewhere, though primarily driven by auth events.

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false) // onAuthStateChange will handle setting user and final loading state
    if (error) {
      console.error("Login error:", error.message)
      return false
    }
    return true // User state will be updated by onAuthStateChange
  }

  const logout = async (): Promise<void> => {
    setLoading(true) // Optional: set loading true during sign out
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error("Logout error:", error.message)
      // setLoading(false) // if error, ensure loading is reset
    }
    // User state will be set to null by onAuthStateChange, which also sets loading to false.
  }

  const isAllowed = (allowedRoles: UserRole[]): boolean => {
    if (!user) return false
    return allowedRoles.includes(user.role)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAllowed }}>
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
