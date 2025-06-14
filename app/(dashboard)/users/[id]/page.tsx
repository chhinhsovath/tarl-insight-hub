"use client"

import { useState, useEffect, use } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DatabaseService } from "@/lib/database"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Clock, Activity } from "lucide-react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserForm } from "@/components/user-form"
import { PasswordForm } from "@/components/password-form"

interface UserProfilePageProps {
  params: Promise<{
    id: string
  }>
}

export default function UserProfilePage({ params }: UserProfilePageProps) {
  const resolvedParams = use(params)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const router = useRouter()

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

  const handleUserUpdated = () => {
    loadUser()
    toast({
      title: "Success",
      description: "User profile updated successfully",
    })
  }

  const handlePasswordUpdated = () => {
    toast({
      title: "Success",
      description: "Password updated successfully",
    })
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{user.full_name}</h1>
          <p className="text-gray-500 mt-2">{user.email}</p>
        </div>
        <div className="flex space-x-4">
          <Button
            variant="outline"
            onClick={() => router.push(`/users/${resolvedParams.id}/sessions`)}
          >
            <Clock className="mr-2 h-4 w-4" />
            Sessions
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/users/${resolvedParams.id}/activities`)}
          >
            <Activity className="mr-2 h-4 w-4" />
            Activities
          </Button>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Edit Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <UserForm
                initialData={user}
                onSuccess={handleUserUpdated}
                onCancel={() => router.back()}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
            </CardHeader>
            <CardContent>
              <PasswordForm
                userId={parseInt(resolvedParams.id)}
                onSuccess={handlePasswordUpdated}
                onCancel={() => router.back()}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 