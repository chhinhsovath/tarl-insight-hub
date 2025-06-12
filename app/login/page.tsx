"use client"

import type React from "react"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth, mockUsers, type UserRole } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Shield, BookOpen, Database, User, Mail, Lock } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [loginMode, setLoginMode] = useState<"quick" | "manual">("quick")

  const { login } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirect") || "/dashboard"

  const handleQuickLogin = async (userRole: UserRole) => {
    setIsLoading(true)
    setError("")

    const user = mockUsers.find((u) => u.role === userRole)
    if (user) {
      try {
        const success = await login(user.email, "password")
        if (success) {
          router.push(redirectTo)
        } else {
          setError("Login failed. Please try again.")
        }
      } catch (err) {
        setError("An error occurred during login.")
      }
    }
    setIsLoading(false)
  }

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const success = await login(email, password)
      if (success) {
        router.push(redirectTo)
      } else {
        setError("Invalid email or password.")
      }
    } catch (err) {
      setError("An error occurred during login.")
    }
    setIsLoading(false)
  }

  const roleConfigs = [
    {
      role: "admin" as UserRole,
      title: "Admin User",
      description: "Full system access, user management, analytics",
      icon: Shield,
      color: "bg-red-500",
      user: mockUsers.find((u) => u.role === "admin")!,
    },
    {
      role: "teacher" as UserRole,
      title: "Teacher",
      description: "School-level access, observations, student data",
      icon: BookOpen,
      color: "bg-blue-500",
      user: mockUsers.find((u) => u.role === "teacher")!,
    },
    {
      role: "collector" as UserRole,
      title: "Data Collector",
      description: "Observation creation and data collection",
      icon: Database,
      color: "bg-green-500",
      user: mockUsers.find((u) => u.role === "collector")!,
    },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100 p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">TaRL Insight Hub</h1>
          <p className="text-gray-600">Teaching at the Right Level - Data Management System</p>
          <Badge variant="secondary" className="mt-2">
            Development Mode
          </Badge>
        </div>

        <div className="flex justify-center mb-6">
          <div className="flex bg-white rounded-lg p-1 shadow-sm">
            <Button
              variant={loginMode === "quick" ? "default" : "ghost"}
              onClick={() => setLoginMode("quick")}
              className="rounded-md"
            >
              Quick Login
            </Button>
            <Button
              variant={loginMode === "manual" ? "default" : "ghost"}
              onClick={() => setLoginMode("manual")}
              className="rounded-md"
            >
              Manual Login
            </Button>
          </div>
        </div>

        {loginMode === "quick" ? (
          <div className="grid md:grid-cols-3 gap-6">
            {roleConfigs.map(({ role, title, description, icon: Icon, color, user }) => (
              <Card key={role} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="text-center">
                  <div className={`w-16 h-16 ${color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">{title}</CardTitle>
                  <CardDescription className="text-sm">{description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>{user.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span className="text-xs">{user.email}</span>
                    </div>
                  </div>
                  <Button onClick={() => handleQuickLogin(role)} disabled={isLoading} className="w-full">
                    {isLoading ? "Logging in..." : `Login as ${title}`}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Manual Login</CardTitle>
              <CardDescription className="text-center">Enter your credentials to access the system</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleManualLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </form>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-2">Test Credentials:</p>
                <div className="text-xs text-gray-600 space-y-1">
                  <div>• Any email from the quick login cards</div>
                  <div>
                    • Password: <code className="bg-gray-200 px-1 rounded">password</code>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
