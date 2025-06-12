"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context" // Removed mockUsers
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle2, School, User, Users } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const success = await login(email, password)
      if (success) {
        router.push("/dashboard")
      } else {
        setError("Invalid credentials. Try using one of the demo accounts.")
      }
    } catch (err) {
      setError("An error occurred during login.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickLogin = async (userEmail: string) => {
    setEmail(userEmail)
    setPassword("password")
    setIsLoading(true)

    try {
      const success = await login(userEmail, "password")
      if (success) {
        router.push("/dashboard")
      } else {
        setError("Quick login failed. Please try again.")
      }
    } catch (err) {
      setError("An error occurred during login.")
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
            <TabsTrigger value="quick">Quick Access</TabsTrigger>
            <TabsTrigger value="manual">Manual Login</TabsTrigger>
          </TabsList>

          <TabsContent value="quick">
            <div className="grid md:grid-cols-3 gap-4">
              {/* Admin Card */}
              <RoleCard
                title="System Administrator"
                description="Complete system oversight and management"
                icon={<Users className="h-12 w-12 text-blue-600" />}
                features={["User Management", "School Administration", "System Analytics", "Report Generation"]}
                email="kosal.vann@tarl.edu.kh" // Hardcoded Admin email
                onLogin={handleQuickLogin}
                isLoading={isLoading}
              />

              {/* Teacher Card */}
              <RoleCard
                title="Teacher"
                description="Classroom and student management"
                icon={<User className="h-12 w-12 text-green-600" />}
                features={["Student Progress", "Classroom Data", "Learning Materials", "Assessment Tools"]}
                email="sophea.lim@tarl.edu.kh" // Hardcoded Teacher email
                onLogin={handleQuickLogin}
                isLoading={isLoading}
              />

              {/* Coordinator Card */}
              <RoleCard
                title="Coordinator"
                description="Regional oversight and school coordination"
                icon={<School className="h-12 w-12 text-purple-600" />}
                features={["School Monitoring", "Teacher Support", "Regional Analytics", "Training Management"]}
                email="bopha.keo@tarl.edu.kh" // Hardcoded Coordinator email
                onLogin={handleQuickLogin}
                isLoading={isLoading}
              />
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
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@tarl.edu.kh"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
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
                      required
                    />
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Logging in..." : "Login"}
                  </Button>
                </form>
              </CardContent>
              <CardFooter className="flex flex-col items-start">
                <p className="text-sm text-gray-500 mb-2">Demo Accounts (password: "password"):</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 w-full text-xs">
                  <div>
                    <span className="font-medium">Admin:</span>
                    <span className="text-gray-600"> kosal.vann@tarl.edu.kh</span>
                  </div>
                  <div>
                    <span className="font-medium">Teacher:</span>
                    <span className="text-gray-600"> sophea.lim@tarl.edu.kh</span>
                  </div>
                  <div>
                    <span className="font-medium">Coordinator:</span>
                    <span className="text-gray-600"> bopha.keo@tarl.edu.kh</span>
                  </div>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>For demonstration purposes, use "password" for all accounts</p>
        </div>
      </div>
    </div>
  )
}

function RoleCard({
  title,
  description,
  icon,
  features,
  email,
  onLogin,
  isLoading,
}: {
  title: string
  description: string
  icon: React.ReactNode
  features: string[]
  email: string
  onLogin: (email: string) => void
  isLoading: boolean
}) {
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
      <CardFooter>
        <Button className="w-full" onClick={() => onLogin(email)} disabled={isLoading}>
          {isLoading ? "Logging in..." : "Login as " + title}
        </Button>
      </CardFooter>
    </Card>
  )
}
