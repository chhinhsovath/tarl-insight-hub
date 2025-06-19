"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, School, User, Users, Shield, UserCheck, GraduationCap, Briefcase, BookOpen } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type React from "react"

const demoUsers = [
  {
    role: "Admin",
    username: "admin1",
    password: "admin123",
    description: "Complete system oversight",
    icon: <Shield className="h-12 w-12 text-blue-600" />,
    features: ["User Management", "System Settings", "Full Access", "Reports"],
    color: "from-blue-50 to-blue-100"
  },
  {
    role: "Director", 
    username: "director1",
    password: "director123",
    description: "Strategic oversight",
    icon: <Briefcase className="h-12 w-12 text-purple-600" />,
    features: ["School Management", "Strategic Planning", "Analytics", "Training"],
    color: "from-purple-50 to-purple-100"
  },
  {
    role: "Partner",
    username: "partner1", 
    password: "partner123",
    description: "External collaboration",
    icon: <Users className="h-12 w-12 text-indigo-600" />,
    features: ["Program Monitoring", "Collaboration", "Reports", "Resources"],
    color: "from-indigo-50 to-indigo-100"
  },
  {
    role: "Coordinator",
    username: "coordinator1",
    password: "coordinator123", 
    description: "Regional coordination",
    icon: <School className="h-12 w-12 text-green-600" />,
    features: ["School Monitoring", "Teacher Support", "Training", "Analytics"],
    color: "from-green-50 to-green-100"
  },
  {
    role: "Teacher",
    username: "teacher1",
    password: "teacher123",
    description: "Classroom management", 
    icon: <GraduationCap className="h-12 w-12 text-emerald-600" />,
    features: ["Student Progress", "Classroom Data", "Materials", "Assessment"],
    color: "from-emerald-50 to-emerald-100"
  },
  {
    role: "Training Organizer",
    username: "Training Organizer1",
    password: "Training Organizer123",
    description: "Training coordination",
    icon: <BookOpen className="h-12 w-12 text-orange-600" />,
    features: ["Session Planning", "Participant Management", "QR Codes", "Reports"],
    color: "from-orange-50 to-orange-100"
  },
  {
    role: "Collector",
    username: "collector1",
    password: "collector123",
    description: "Data collection",
    icon: <UserCheck className="h-12 w-12 text-teal-600" />,
    features: ["Data Entry", "Field Collection", "Observations", "Sync Data"],
    color: "from-teal-50 to-teal-100"
  },
  {
    role: "Intern",
    username: "intern1",
    password: "intern123",
    description: "Learning support",
    icon: <User className="h-12 w-12 text-gray-600" />,
    features: ["Limited Access", "View Reports", "Learning", "Support Tasks"],
    color: "from-gray-50 to-gray-100"
  },
  {
    role: "Participant",
    username: "Demo Participant",
    password: "012345678",
    description: "Training participant portal",
    icon: <GraduationCap className="h-12 w-12 text-pink-600" />,
    features: ["Training History", "Download Materials", "Track Progress", "Certificates"],
    color: "from-pink-50 to-pink-100"
  }
]

// All available users for manual login
const allUsers = [
  // Admin
  { username: "admin1", password: "admin123", role: "Admin" },
  { username: "admin2", password: "admin123", role: "Admin" },
  // Director
  { username: "director1", password: "director123", role: "Director" },
  { username: "director2", password: "director123", role: "Director" },
  // Partner
  { username: "partner1", password: "partner123", role: "Partner" },
  { username: "partner2", password: "partner123", role: "Partner" },
  // Coordinator
  { username: "coordinator1", password: "coordinator123", role: "Coordinator" },
  { username: "coordinator2", password: "coordinator123", role: "Coordinator" },
  // Teacher
  { username: "teacher1", password: "teacher123", role: "Teacher" },
  { username: "teacher2", password: "teacher123", role: "Teacher" },
  // Training Organizer
  { username: "Training Organizer1", password: "Training Organizer123", role: "Training Organizer" },
  { username: "Training Organizer2", password: "Training Organizer123", role: "Training Organizer" },
  // Collector
  { username: "collector1", password: "collector123", role: "Collector" },
  { username: "collector2", password: "collector123", role: "Collector" },
  // Intern
  { username: "intern1", password: "intern123", role: "Intern" },
  { username: "intern2", password: "intern123", role: "Intern" },
  // Participant
  { username: "Demo Participant", password: "012345678", role: "Participant" },
]

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState("")
  const { login, error } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await login(identifier, password)
    } catch (error) {
      // Error is handled by the auth context
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickLogin = async (username: string, userPassword: string) => {
    setIdentifier(username)
    setPassword(userPassword)
    setIsLoading(true)

    try {
      await login(username, userPassword)
    } catch (error) {
      // Error is handled by the auth context
    } finally {
      setIsLoading(false)
    }
  }

  const handleUserSelection = (value: string) => {
    setSelectedUser(value)
    const user = allUsers.find(u => u.username === value)
    if (user) {
      setIdentifier(user.username)
      setPassword(user.password)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">TaRL Insight Hub</h1>
          <p className="text-gray-600">Teaching at the Right Level - Data Management System</p>
        </div>

        <Tabs defaultValue="quick" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="quick">Quick Login by Role</TabsTrigger>
            <TabsTrigger value="manual">Manual Login</TabsTrigger>
          </TabsList>

          <TabsContent value="quick">
            <div className="grid md:grid-cols-4 gap-4">
              {demoUsers.map((user, index) => (
                <RoleCard
                  key={index}
                  title={user.role}
                  username={user.username}
                  password={user.password}
                  description={user.description}
                  icon={user.icon}
                  features={user.features}
                  color={user.color}
                  onLogin={handleQuickLogin}
                  isLoading={isLoading}
                />
              ))}
            </div>
            <div className="mt-6 text-center text-sm text-gray-600">
              <p>Click any card to login with that role. Each role has 2 users (e.g., admin1, admin2)</p>
            </div>
          </TabsContent>

          <TabsContent value="manual">
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle>Manual Login</CardTitle>
                <CardDescription>Select a user or enter credentials manually</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Quick Select User</Label>
                    <Select value={selectedUser} onValueChange={handleUserSelection}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a user account" />
                      </SelectTrigger>
                      <SelectContent>
                        {allUsers.map((user, index) => (
                          <SelectItem key={index} value={user.username}>
                            {user.username} - {user.role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-gray-500">Or enter manually</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="identifier">Username</Label>
                    <Input
                      id="identifier"
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="Enter username"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      required
                    />
                  </div>
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </CardContent>
              <CardFooter>
                <div className="w-full space-y-2 text-xs text-gray-600">
                  <p className="font-medium">Password Pattern: {"{role}123"}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>• admin1 / admin123</div>
                    <div>• teacher1 / teacher123</div>
                    <div>• coordinator1 / coordinator123</div>
                    <div>• participant1 / participant123</div>
                  </div>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

interface RoleCardProps {
  title: string
  username: string
  password: string
  description: string
  icon: React.ReactNode
  features: string[]
  color: string
  onLogin: (username: string, password: string) => void
  isLoading: boolean
}

function RoleCard({ title, username, password, description, icon, features, color, onLogin, isLoading }: RoleCardProps) {
  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg hover:scale-105 cursor-pointer h-full">
      <CardHeader className={`bg-gradient-to-br ${color} pb-3`}>
        <div className="flex justify-center mb-2">{icon}</div>
        <CardTitle className="text-center text-lg">{title}</CardTitle>
        <CardDescription className="text-center text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-3 pb-2">
        <ul className="space-y-1">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center text-xs">
              <CheckCircle2 className="h-3 w-3 text-green-500 mr-1 flex-shrink-0" />
              <span className="truncate">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="pt-2 pb-3">
        <Button 
          onClick={() => onLogin(username, password)} 
          disabled={isLoading}
          className="w-full h-8 text-xs"
          size="sm"
        >
          {isLoading ? "Signing in..." : `Login as ${username}`}
        </Button>
      </CardFooter>
    </Card>
  )
}