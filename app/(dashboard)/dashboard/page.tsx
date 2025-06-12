"use client"

import { useAuth } from "@/lib/auth-context"
import { getStaticData } from "@/lib/static-data"
import { StatsCard } from "@/components/stats-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  School,
  Users,
  BookOpen,
  BarChart3,
  Eye,
  TrendingUp,
  MapPin,
  FileText,
  Plus,
  Settings,
  PieChart,
  Database,
  Clock,
  CheckCircle,
  Activity,
} from "lucide-react"

const iconMap = {
  School,
  Users,
  BookOpen,
  BarChart3,
  Eye,
  TrendingUp,
  MapPin,
  FileText,
  Plus,
  Settings,
  PieChart,
  Database,
  LayoutDashboard: BarChart3,
  Upload: Plus,
}

export default function DashboardPage() {
  const { user } = useAuth()

  if (!user) return null

  const stats = getStaticData(user.role, "dashboardStats") || {}
  const quickActions = getStaticData(user.role, "quickActions") || []

  const getWelcomeMessage = () => {
    const timeOfDay = new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"
    const firstName = user.full_name ? user.full_name.split(" ")[0] : "User"
    return `Good ${timeOfDay}, ${firstName}!`
  }

  const getRoleDescription = () => {
    switch (user.role) {
      case "Admin":
        return "System Administrator Dashboard - Complete oversight of the TaRL program"
      case "Teacher":
        return "Teacher Dashboard - Track your students and classroom progress"
      case "Coordinator":
        return "Coordinator Dashboard - Manage field visits and data collection"
      default:
        return "Welcome to TaRL Insight Hub"
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "school":
        return School
      case "user":
        return Users
      case "observation":
        return Eye
      case "training":
        return BookOpen
      case "student":
        return Users
      case "assessment":
        return FileText
      case "data":
        return Database
      case "visit":
        return MapPin
      case "report":
        return BarChart3
      default:
        return Activity
    }
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{getWelcomeMessage()}</h1>
            <p className="text-blue-100 text-lg mb-4">{getRoleDescription()}</p>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                {user.role}
              </Badge>
              {user.school_id && (
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  School ID: {user.school_id}
                </Badge>
              )}
              {user.district_id && (
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  District ID: {user.district_id}
                </Badge>
              )}
            </div>
          </div>
          <div className="hidden md:block">
            <div className="w-24 h-24 bg-white/20 rounded-2xl flex items-center justify-center">
              {user.role === "Admin" && <BarChart3 className="w-12 h-12 text-white" />}
              {user.role === "Teacher" && <BookOpen className="w-12 h-12 text-white" />}
              {user.role === "Coordinator" && <Database className="w-12 h-12 text-white" />}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(stats)
          .filter(([key]) => key !== "recentActivity")
          .map(([key, value]) => {
            const getStatConfig = (key: string, value: any) => {
              switch (key) {
                case "totalSchools":
                  return { title: "Total Schools", value, icon: School, color: "blue" }
                case "totalTeachers":
                  return { title: "Total Teachers", value, icon: Users, color: "green" }
                case "totalStudents":
                  return { title: "Total Students", value, icon: Users, color: "purple" }
                case "activeObservations":
                  return { title: "Active Observations", value, icon: Eye, color: "orange" }
                case "myStudents":
                  return { title: "My Students", value, icon: Users, color: "blue" }
                case "completedObservations":
                  return { title: "Completed Observations", value, icon: CheckCircle, color: "green" }
                case "upcomingTrainings":
                  return { title: "Upcoming Trainings", value, icon: BookOpen, color: "purple" }
                case "averageProgress":
                  return { title: "Average Progress", value: `${value}%`, icon: TrendingUp, color: "orange" }
                case "observationsThisMonth":
                  return { title: "This Month", value, icon: Eye, color: "blue" }
                case "schoolsVisited":
                  return { title: "Schools Visited", value, icon: MapPin, color: "green" }
                case "dataPointsCollected":
                  return { title: "Data Points", value, icon: Database, color: "purple" }
                case "completionRate":
                  return { title: "Completion Rate", value: `${value}%`, icon: CheckCircle, color: "orange" }
                default:
                  return { title: key, value, icon: Activity, color: "gray" }
              }
            }

            const config = getStatConfig(key, value)
            return (
              <StatsCard key={key} title={config.title} value={config.value} icon={config.icon} color={config.color} />
            )
          })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action: any, index: number) => {
            const Icon = iconMap[action.icon as keyof typeof iconMap] || Activity
            return (
              <Card
                key={index}
                className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md hover:-translate-y-1"
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{action.title}</h3>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{action.description}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full group-hover:bg-blue-50 group-hover:border-blue-200 transition-colors"
                  >
                    Open
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Recent Activity
          </CardTitle>
          <CardDescription>Your latest actions and updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.recentActivity?.map((activity: any) => {
              const Icon = getActivityIcon(activity.type)
              return (
                <div
                  key={activity.id}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{activity.message}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              )
            }) || (
              <div className="text-center py-8 text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No recent activity to display</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
