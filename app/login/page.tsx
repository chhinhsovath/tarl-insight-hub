"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, School, User, Users } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type React from "react"

const demoUsers = [
  {
    role: "Admin",
    emailOrUsername: "admin@tarl.edu.kh",
    description: "Complete system oversight and management",
    icon: <Users className="h-12 w-12 text-blue-600" />,
    features: ["User Management", "School Administration", "System Analytics", "Report Generation"],
  },
  {
    role: "Teacher",
    emailOrUsername: "teacher@tarl.edu.kh",
    description: "Classroom and student management",
    icon: <User className="h-12 w-12 text-green-600" />,
    features: ["Student Progress", "Classroom Data", "Learning Materials", "Assessment Tools"],
  },
  {
    role: "Coordinator",
    emailOrUsername: "coordinator@tarl.edu.kh",
    description: "Regional oversight and school coordination",
    icon: <School className="h-12 w-12 text-purple-600" />,
    features: ["School Monitoring", "Teacher Support", "Regional Analytics", "Training Management"],
  },
]

interface UserListItem {
  email: string
  username: string
}

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("12345") // Default password
  const [isLoading, setIsLoading] = useState(false)
  const [userList, setUserList] = useState<UserListItem[]>([])
  const { login, error } = useAuth()

  useEffect(() => {
    const fetchUserList = async () => {
      try {
        const response = await fetch("/api/users/list")
        if (response.ok) {
          const data = await response.json()
          setUserList(data)
        } else {
          console.error("Failed to fetch user list:", await response.text())
        }
      } catch (err) {
        console.error("Error fetching user list:", err)
      }
    }
    fetchUserList()
  }, [])

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

  const handleQuickLogin = async (emailOrUsername: string) => {
    setIdentifier(emailOrUsername)
    setPassword("12345") // Default password for demo accounts
    setIsLoading(true)

    try {
      await login(emailOrUsername, "12345")
    } catch (error) {
      // Error is handled by the auth context
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">TaRL Insight Hub</h1>
          <p className="text-gray-600">Teaching at the Right Level - Data Management System</p>
        </div>

        <Tabs defaultValue="quick" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="quick">Users Role</TabsTrigger>
            <TabsTrigger value="manual">Manual Login</TabsTrigger>
          </TabsList>

          <TabsContent value="quick">
            <div className="grid md:grid-cols-3 gap-4">
              {demoUsers.map((user, index) => (
                <RoleCard
                  key={index}
                  title={`${user.role} User`}
                  description={user.description}
                  icon={user.icon}
                  features={user.features}
                  emailOrUsername={user.emailOrUsername}
                  onLogin={handleQuickLogin}
                  isLoading={isLoading}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="manual">
            <Card>
              <CardHeader>
                <CardTitle>Login to Your Account</CardTitle>
                <CardDescription>Enter your credentials to access the TaRL Insight Hub</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="identifier">Email or Username</Label>
                    <Select value={identifier} onValueChange={setIdentifier}>
                      <SelectTrigger id="identifier">
                        <SelectValue placeholder="Select an email or username" />
                      </SelectTrigger>
                      <SelectContent>
                        {userList.map((user, index) => (
                          <SelectItem key={index} value={user.email}>
                            {user.email} {user.username ? `(${user.username})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
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
              <CardFooter className="flex flex-col items-start">
                <p className="text-sm text-gray-500 mb-2">Demo Accounts:</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 w-full text-xs">
                  {demoUsers.map((user, index) => (
                    <div key={index} className="flex items-center space-x-1">
                      <span className="font-medium">{user.role}:</span>
                      <span className="text-gray-600">{user.emailOrUsername}</span>
                    </div>
                  ))}
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
  description: string
  icon: React.ReactNode
  features: string[]
  emailOrUsername: string
  onLogin: (emailOrUsername: string) => void
  isLoading: boolean
}

function RoleCard({ title, description, icon, features, emailOrUsername, onLogin, isLoading }: RoleCardProps) {
  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg">
      <CardHeader className="bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex justify-center mb-2">{icon}</div>
        <CardTitle className="text-center">{title}</CardTitle>
        <CardDescription className="text-center">{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
              {feature}
            </li>
          ))}
        </ul>
      </CardContent>
      
    </Card>
  )
}
