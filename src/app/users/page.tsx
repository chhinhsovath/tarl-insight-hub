"use client"

import { useState, useEffect } from "react"
import { StatsCard } from "@/components/stats-card"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Users, Shield, GraduationCap, User, Mail, Phone } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import Link from "next/link"
import { ProtectedRoute } from "@/components/protected-route"

interface UserType {
  id: string
  name: string
  email: string
  phone?: string
  role: "Admin" | "Coordinator" | "Teacher"
  status: number
  schoolName?: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserType[]>([])
  const [allUsers, setAllUsers] = useState<UserType[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterRole, setFilterRole] = useState("all")
  const [showInactive, setShowInactive] = useState(false)
  const [inactiveUsersCount, setInactiveUsersCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalUsersCount, setTotalUsersCount] = useState(0)
  const itemsPerPage = 25

  useEffect(() => {
    loadUsers()
    loadAllUsers()
    loadInactiveUsersCount()
    loadUsersCount()
  }, [searchTerm, filterRole, showInactive, currentPage])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const offset = (currentPage - 1) * itemsPerPage
      const res = await fetch(`/api/data/users?search=${searchTerm}&role=${filterRole}&status=${showInactive ? 0 : 1}&page=${currentPage}&limit=${itemsPerPage}&offset=${offset}`)
      if (!res.ok) throw new Error("Failed to fetch users")
      const data = await res.json()
      setUsers(data)
    } catch (error) {
      console.error("Error loading users:", error)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const loadUsersCount = async () => {
    try {
      const res = await fetch(`/api/data/users?count=true&search=${searchTerm}&role=${filterRole}&status=${showInactive ? 0 : 1}`)
      if (!res.ok) throw new Error("Failed to fetch users count")
      const data = await res.json()
      setTotalUsersCount(data.total)
    } catch (error) {
      console.error("Error loading users count:", error)
      setTotalUsersCount(0)
    }
  }

  const loadAllUsers = async () => {
    try {
      const res = await fetch(`/api/data/users?search=${searchTerm}&role=${filterRole}&status=${showInactive ? 0 : 1}`)
      if (!res.ok) throw new Error("Failed to fetch all users")
      const data = await res.json()
      setAllUsers(data)
    } catch (error) {
      console.error("Error loading all users:", error)
      setAllUsers([])
    }
  }

  const loadInactiveUsersCount = async () => {
    try {
      const res = await fetch(`/api/data/users?status=0&count=true`)
      if (!res.ok) throw new Error("Failed to fetch inactive users count")
      const data = await res.json()
      setInactiveUsersCount(data.total)
    } catch (error) {
      console.error("Error loading inactive users count:", error)
      setInactiveUsersCount(0)
    }
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
  }

  const totalUsers = allUsers.length
  const totalAdmins = allUsers.filter(user => user.role === "Admin").length
  const totalCoordinators = allUsers.filter(user => user.role === "Coordinator").length
  const totalTeachers = allUsers.filter(user => user.role === "Teacher").length

  return (
    <ProtectedRoute allowedRoles={["Admin"]}>
      <div className="flex flex-col space-y-4">
        {/* Highlight Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <StatsCard
            title="Total Users"
            value={`${totalUsers} (${inactiveUsersCount} inactive)`}
            icon={Users}
            iconColor="text-blue-500"
          />
          <StatsCard
            title="Administrators"
            value={totalAdmins.toString()}
            icon={Shield}
            iconColor="text-red-500"
          />
          <StatsCard
            title="Coordinators"
            value={totalCoordinators.toString()}
            icon={User}
            iconColor="text-green-500"
          />
          <StatsCard
            title="Teachers"
            value={totalTeachers.toString()}
            icon={GraduationCap}
            iconColor="text-purple-500"
          />
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap gap-4 justify-between items-center">
          <div className="flex gap-4 items-center flex-1 min-w-0">
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm w-full"
            />
            <Select onValueChange={(value) => setFilterRole(value)} value={filterRole}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="Admin">Administrators</SelectItem>
                <SelectItem value="Coordinator">Coordinators</SelectItem>
                <SelectItem value="Teacher">Teachers</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center space-x-2 ml-2">
              <Switch id="show-inactive" checked={showInactive} onCheckedChange={setShowInactive} />
              <label htmlFor="show-inactive" className="text-sm">
                {showInactive ? "Inactive" : "Active"}
                {!showInactive && inactiveUsersCount > 0}
              </label>
            </div>
          </div>
          <Link href="/users/new">
            <Button className={cn(buttonVariants({ variant: "default" }))}>
              Add User
            </Button>
          </Link>
        </div>

        {/* User Cards */}
        {loading ? (
          <p>Loading users...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map((user) => (
              <Card key={user.id} className="w-full">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">{user.name}</CardTitle>
                  <CardDescription>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" /> {user.email}
                    </div>
                    {user.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Phone className="h-4 w-4" /> {user.phone}
                      </div>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-2 mt-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={user.role === "Admin" ? "destructive" : user.role === "Coordinator" ? "default" : "secondary"}>
                        {user.role}
                      </Badge>
                      <Badge variant={user.status === 1 ? "default" : "secondary"}>
                        {user.status === 1 ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    {user.schoolName && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        School: {user.schoolName}
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                  <Link href={`/users/${user.id}/edit`}>
                    <Button className={cn(buttonVariants({ variant: "default", size: "sm" }))}>
                      Edit
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between px-2">
          <div className="flex-1 text-sm text-muted-foreground">
            Showing {users.length} of {totalUsersCount} users.
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage * itemsPerPage >= totalUsersCount}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
} 