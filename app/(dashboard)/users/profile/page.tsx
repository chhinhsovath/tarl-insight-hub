"use client"

import { useState, useEffect } from "react"
import { PageLayout } from "@/components/page-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth-context"
import { DatabaseService } from "@/lib/database"
import { useToast } from "@/hooks/use-toast"
import { UserForm } from "@/components/user-form"
import { PasswordForm } from "@/components/password-form"
import { ActivityLog } from "@/components/activity-log"
import { Loader2 } from "lucide-react"

export default function ProfilePage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState<any>(null)
  const [activities, setActivities] = useState<any[]>([])

  useEffect(() => {
    if (user?.id) {
      loadUserData()
      loadUserActivities()
    }
  }, [user?.id])

  const loadUserData = async () => {
    try {
      const data = await DatabaseService.getUserById(user?.id)
      setUserData(data)
    } catch (error) {
      console.error("Error loading user data:", error)
      toast({
        title: "Error",
        description: "Failed to load user data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadUserActivities = async () => {
    try {
      const data = await DatabaseService.getUserActivities(user?.id)
      setActivities(data)
    } catch (error) {
      console.error("Error loading user activities:", error)
    }
  }

  const handleProfileUpdate = async () => {
    await loadUserData()
    toast({
      title: "Success",
      description: "Profile updated successfully",
    })
  }

  const handlePasswordUpdate = async () => {
    toast({
      title: "Success",
      description: "Password updated successfully",
    })
  }

  if (loading) {
    return (
      <PageLayout title="Profile" description="Manage your profile and settings">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout title="Profile" description="Manage your profile and settings">
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent>
              <UserForm
                initialData={userData}
                onSuccess={handleProfileUpdate}
                isProfile
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
              <PasswordForm onSuccess={handlePasswordUpdate} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityLog activities={activities} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageLayout>
  )
} 