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
import { Shield, BookOpen, Database, User, Mail, Lock, BarChart3 } from "lucide-react"

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
      title: "System Administrator",
      description: "Complete system oversight, user management, and comprehensive analytics",
      icon: Shield,
      gradient: "from-red-500 to-pink-600",
      features: [
        "Manage all schools and users",
        "Access comprehensive reports",
        "System configuration",
        "Data analytics",
      ],
      user: mockUsers.find((u) => u.role === "admin")!,
    },
    {
      role: "teacher" as UserRole,
      title: "Teacher",
      description: "Classroom management, student progress tracking, and TaRL implementation",
      icon: BookOpen,
      gradient: "from-blue-500 to-cyan-600",
      features: ["Track student progress", "Record observations", "Access training materials", "Manage classroom data"],
      user: mockUsers.find((u) => u.role === "teacher")!,
    },
    {
      role: "collector" as UserRole,
      title: "Data Collector",
      description: "Field data collection, school visits, and assessment coordination",
      icon: Database,
      gradient: "from-green-500 to-emerald-600",
      features: ["Conduct school visits", "Collect assessment data", "Record observations", "Generate field reports"],
      user: mockUsers.find((u) => u.role === "collector")!,
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl mb-6 shadow-lg">
            <BarChart3 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent mb-4">
            TaRL Insight Hub
          </h1>
          <p className="text-xl text-gray-600 mb-4">Teaching at the Right Level - Data Management System</p>
          <Badge variant="secondary" className="text-sm px-4 py-2">
            🚀 Static Demo Mode
          </Badge>
        </div>

        {/* Mode Toggle */}
        <div className="flex justify-center mb-8">
          <div className="flex bg-white rounded-xl p-1 shadow-lg border">
            <Button
              variant={loginMode === "quick" ? "default" : "ghost"}
              onClick={() => setLoginMode("quick")}
              className="rounded-lg px-6"
            >
              Quick Access
            </Button>
            <Button
              variant={loginMode === "manual" ? "default" : "ghost"}
              onClick={() => setLoginMode("manual")}
              className="rounded-lg px-6"
            >
              Manual Login
            </Button>
          </div>
        </div>

        {loginMode === "quick" ? (
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-3 gap-8">
              {roleConfigs.map(({ role, title, description, icon: Icon, gradient, features, user }) => (
                <Card
                  key={role}
                  className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-lg hover:-translate-y-1"
                >
                  <CardHeader className="text-center pb-4">
                    <div
                      className={`w-20 h-20 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                    >
                      <Icon className="w-10 h-10 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-800">{title}</CardTitle>
                    <CardDescription className="text-gray-600 text-base leading-relaxed">{description}</CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {/* User Info */}
                    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <User className="w-5 h-5 text-gray-500" />
                        <span className="font-medium text-gray-800">{user.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-gray-500" />
                        <span className="text-sm text-gray-600">{user.email}</span>
                      </div>
                      {user.school && (
                        <div className="flex items-center gap-3">
                          <BookOpen className="w-5 h-5 text-gray-500" />
                          <span className="text-sm text-gray-600">{user.school}</span>
                        </div>
                      )}
                    </div>

                    {/* Features */}
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Key Features</h4>
                      <ul className="space-y-2">
                        {features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Login Button */}
                    <Button
                      onClick={() => handleQuickLogin(role)}
                      disabled={isLoading}
                      className={`w-full bg-gradient-to-r ${gradient} hover:shadow-lg transition-all duration-300 text-white font-semibold py-3 text-base`}
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Logging in...
                        </div>
                      ) : (
                        `Access ${title} Dashboard`
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <Card className="max-w-md mx-auto shadow-2xl border-0">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-3xl font-bold text-gray-800">Manual Login</CardTitle>
              <CardDescription className="text-gray-600 text-base">
                Enter your credentials to access the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleManualLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-11 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-11 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
                {error && (
                  <Alert variant="destructive" className="border-red-200 bg-red-50">
                    <AlertDescription className="text-red-700">{error}</AlertDescription>
                  </Alert>
                )}
                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-semibold text-base"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Signing In...
                    </div>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>

              <div className="mt-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                <p className="text-sm font-semibold text-blue-800 mb-3">Demo Credentials:</p>
                <div className="text-sm text-blue-700 space-y-2">
                  <div className="flex justify-between">
                    <span>Any email from above</span>
                    <code className="bg-blue-200 px-2 py-1 rounded text-xs">password</code>
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
