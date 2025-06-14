"use client"

import { useState, useEffect, use } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DatabaseService } from "@/lib/database"
import { SessionList } from "@/components/session-list"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface UserSessionsPageProps {
  params: Promise<{
    id: string
  }>
}

export default function UserSessionsPage({ params }: UserSessionsPageProps) {
  const resolvedParams = use(params)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadUser()
  }, [resolvedParams.id])

  const loadUser = async () => {
    setLoading(true)
    try {
      const data = await DatabaseService.getUserById(parseInt(resolvedParams.id))
      setUser(data)
    } catch (error) {
      console.error("Error loading user:", error)
      toast({
        title: "Error",
        description: "Failed to load user details. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">User not found</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">User Sessions</h1>
        <p className="text-gray-500 mt-2">
          Manage active sessions for {user.full_name}
        </p>
      </div>

      <SessionList userId={parseInt(resolvedParams.id)} />
    </div>
  )
} 