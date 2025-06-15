"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Shield, Users as UsersIcon, User as UserIcon, GraduationCap } from "lucide-react"
import { useRouter } from "next/navigation"
import { DatabaseService } from "@/lib/database"
import { User } from "@/lib/types"
import { UserCard } from "@/components/user-card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { StatsCard } from "@/components/stats-card"

export default function UsersPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user: currentUser, isAllowed } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  
  const isAdmin = isAllowed(['admin'])
  
  // Debug logging
  console.log("Current user:", currentUser)
  console.log("Is admin:", isAdmin)

  useEffect(() => {
    loadUsers()
  }, [search])

  const loadUsers = async () => {
    setLoading(true)
    try {
      console.log("Loading users with search:", search) // Debug log
      const data = await DatabaseService.getUsers({ search })
      console.log("Received users data:", data) // Debug log
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        setUsers(data)
        console.log("Set users:", data.length, "users loaded") // Debug log
      } else {
        console.warn("Users data is not an array:", data)
        setUsers([])
      }
    } catch (error) {
      console.error("Error loading users:", error)
      setUsers([]) // Reset to empty array on error
      toast({
        title: "Error",
        description: "Failed to load users. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Show access denied for non-admin users
  if (!isAdmin) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <Shield className="h-12 w-12 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-600 mb-2">Access Denied</h2>
            <p className="text-gray-500 text-center">
              You need admin privileges to view and manage users.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Ensure users is always an array before filtering
  const usersArray = Array.isArray(users) ? users : []
  
  const totalUsers = usersArray.length
  const totalAdmins = usersArray.filter(user => user.role?.toLowerCase() === "admin").length
  const totalCoordinators = usersArray.filter(user => user.role?.toLowerCase() === "coordinator").length
  const totalCollectors = usersArray.filter(user => user.role?.toLowerCase() === "collector").length
  const totalTeachers = usersArray.filter(user => user.role?.toLowerCase() === "teacher").length

  return (
    <div className="flex flex-col space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
        <StatsCard
          title="Total Users"
          value={totalUsers.toString()}
          icon={UsersIcon}
          iconColor="text-blue-500"
        />
        <StatsCard
          title="Admins"
          value={totalAdmins.toString()}
          icon={Shield}
          iconColor="text-red-500"
        />
        <StatsCard
          title="Coordinators"
          value={totalCoordinators.toString()}
          icon={UserIcon}
          iconColor="text-green-500"
        />
        <StatsCard
          title="Collectors"
          value={totalCollectors.toString()}
          icon={UserIcon}
          iconColor="text-yellow-500"
        />
        <StatsCard
          title="Teachers"
          value={totalTeachers.toString()}
          icon={GraduationCap}
          iconColor="text-purple-500"
        />
      </div>

      <div className="flex items-center justify-between mb-4">
        <Input
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm w-full"
        />
        <Button onClick={() => router.push("/users/new")} className="ml-4">
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : usersArray.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <p className="text-gray-500">No users found</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push("/users/new")}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {usersArray.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              onUpdate={loadUsers}
            />
          ))}
        </div>
      )}
    </div>
  )
}