"use client"

import { useState, useCallback } from "react"
import { PageLayout } from "@/components/page-layout"
import { StatsCard } from "@/components/stats-card"
import { Filters } from "@/components/filters"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import {
  BookOpen,
  FileText,
  Users,
  Star,
  BarChart3,
  TrendingUp,
  Plus,
  Eye,
  Settings,
  Download,
  School,
  Target,
  Clock,
} from "lucide-react"

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    total_schools: 8,
    total_users: 10,
    total_observations: 25,
    completed_observations: 18,
    completion_rate: 72,
    total_feedback: 12,
    avg_rating: 4.2,
    unique_respondents: 15,
    offline_responses: 3,
  })
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<any>({})

  const handleFilterChange = useCallback((newFilters: any) => {
    setFilters(newFilters)
  }, [])

  const getQuickActions = () => {
    switch (user?.role) {
      case "admin":
        return [
          {
            title: "View Analytics",
            description: "Comprehensive system analytics and insights",
            icon: BarChart3,
            href: "/observations",
            color: "bg-blue-500",
          },
          {
            title: "Manage Schools",
            description: "Add and manage participating schools",
            icon: School,
            href: "/schools",
            color: "bg-green-500",
          },
          {
            title: "User Management",
            description: "Manage system users and permissions",
            icon: Users,
            href: "/users",
            color: "bg-purple-500",
          },
          {
            title: "Generate Reports",
            description: "Export comprehensive system reports",
            icon: Download,
            href: "/reports",
            color: "bg-orange-500",
          },
        ]
      case "teacher":
        return [
          {
            title: "New Observation",
            description: "Record a new classroom observation",
            icon: Plus,
            href: "/observations/new",
            color: "bg-blue-500",
          },
          {
            title: "Student Progress",
            description: "Monitor student learning progress",
            icon: TrendingUp,
            href: "/progress",
            color: "bg-green-500",
          },
          {
            title: "My Observations",
            description: "View your recorded observations",
            icon: Eye,
            href: "/observations/list",
            color: "bg-purple-500",
          },
          {
            title: "Training Resources",
            description: "Access training materials and feedback",
            icon: BookOpen,
            href: "/training",
            color: "bg-orange-500",
          },
        ]
      case "collector":
        return [
          {
            title: "Start Collection",
            description: "Begin a new data collection session",
            icon: Plus,
            href: "/observations/new",
            color: "bg-blue-500",
          },
          {
            title: "My Collections",
            description: "View and manage your data collections",
            icon: FileText,
            href: "/observations/list",
            color: "bg-green-500",
          },
          {
            title: "Sync Data",
            description: "Synchronize offline data with server",
            icon: Settings,
            href: "/collection",
            color: "bg-purple-500",
          },
        ]
      default:
        return []
    }
  }

  const getRoleSpecificStats = () => {
    switch (user?.role) {
      case "admin":
        return [
          {
            title: "Total Schools",
            value: stats.total_schools,
            description: "Active schools in system",
            icon: School,
            iconColor: "text-blue-500",
            trend: { value: 12, isPositive: true },
          },
          {
            title: "System Users",
            value: stats.total_users,
            description: "Active users across all roles",
            icon: Users,
            iconColor: "text-green-500",
            trend: { value: 8, isPositive: true },
          },
          {
            title: "Observations",
            value: stats.total_observations,
            description: `${stats.completion_rate}% completion rate`,
            icon: Eye,
            iconColor: "text-purple-500",
            trend: { value: 15, isPositive: true },
          },
          {
            title: "Training Feedback",
            value: `${stats.avg_rating}/5`,
            description: `${stats.total_feedback} responses`,
            icon: Star,
            iconColor: "text-yellow-500",
            trend: { value: 5, isPositive: true },
          },
        ]
      case "teacher":
        return [
          {
            title: "My Observations",
            value: 8,
            description: "Observations completed",
            icon: Eye,
            iconColor: "text-blue-500",
          },
          {
            title: "Students Tracked",
            value: 45,
            description: "Active student records",
            icon: Users,
            iconColor: "text-green-500",
          },
          {
            title: "Avg Progress",
            value: "78%",
            description: "Student learning progress",
            icon: Target,
            iconColor: "text-purple-500",
          },
          {
            title: "This Week",
            value: 3,
            description: "New observations",
            icon: Clock,
            iconColor: "text-orange-500",
          },
        ]
      case "collector":
        return [
          {
            title: "Collections",
            value: 12,
            description: "Data collection sessions",
            icon: FileText,
            iconColor: "text-blue-500",
          },
          {
            title: "Pending Sync",
            value: stats.offline_responses,
            description: "Offline records",
            icon: Clock,
            iconColor: "text-yellow-500",
          },
          {
            title: "This Month",
            value: 8,
            description: "Completed collections",
            icon: Target,
            iconColor: "text-green-500",
          },
          {
            title: "Success Rate",
            value: "94%",
            description: "Successful submissions",
            icon: TrendingUp,
            iconColor: "text-purple-500",
          },
        ]
      default:
        return []
    }
  }

  return (
    <PageLayout title="Dashboard" description={`Welcome back, ${user?.full_name || user?.name}`}>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters - Only for admin */}
        {user?.role === "admin" && (
          <div className="lg:col-span-1">
            <Card className="bg-white shadow-sm border border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg">Filters</CardTitle>
              </CardHeader>
              <CardContent>
                <Filters onFilterChange={handleFilterChange} />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <div className={user?.role === "admin" ? "lg:col-span-3" : "lg:col-span-4"}>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {getRoleSpecificStats().map((stat, index) => (
              <StatsCard key={index} {...stat} />
            ))}
          </div>

          {/* Quick Actions */}
          <Card className="bg-white shadow-sm border border-slate-200 mb-6">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {getQuickActions().map((action, index) => (
                  <div
                    key={index}
                    className="group p-4 border border-slate-200 rounded-xl hover:border-slate-300 hover:shadow-md cursor-pointer transition-all duration-200"
                  >
                    <div className="flex items-start space-x-4">
                      <div
                        className={`p-3 ${action.color} rounded-lg group-hover:scale-110 transition-transform duration-200`}
                      >
                        <action.icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {action.title}
                        </h3>
                        <p className="text-sm text-slate-600 mt-1">{action.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-white shadow-sm border border-slate-200">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { action: "New observation recorded", time: "2 hours ago", user: "Maly Sok" },
                  { action: "Training feedback submitted", time: "4 hours ago", user: "Pisach Lim" },
                  { action: "School data updated", time: "1 day ago", user: "Sreypov Keo" },
                ].map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">{activity.action}</p>
                      <p className="text-xs text-slate-500">by {activity.user}</p>
                    </div>
                    <span className="text-xs text-slate-400">{activity.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  )
}
