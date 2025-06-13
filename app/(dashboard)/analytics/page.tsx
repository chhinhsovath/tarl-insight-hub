"use client"

import { useState, useEffect, useCallback } from "react"
import { PageLayout } from "@/components/page-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Filters } from "@/components/filters"
import { ProtectedRoute } from "@/components/protected-route"
import { DatabaseService } from "@/lib/database"
import { StatsCard } from "@/components/stats-card"
import { BarChart3, LineChart, Users } from "lucide-react"

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<any>({})
  const [analyticsData, setAnalyticsData] = useState<any>({
    surveyAnalytics: [],
    dashboardStats: {},
    schoolDistribution: [],
    userRoleDistribution: [],
    observationTrends: [],
    studentProgress: [],
  })

  useEffect(() => {
    async function loadAnalyticsData() {
      setLoading(true)
      try {
        // Load survey analytics
        const surveyAnalytics = await DatabaseService.getSurveyAnalytics()

        // Load dashboard stats
        const dashboardStats = await DatabaseService.getDashboardStats(filters)

        // Generate school distribution by province
        const schools = await DatabaseService.getSchools()
        const provinces = await DatabaseService.getProvinces()

        const schoolDistribution = provinces
          .map((province) => {
            const schoolsInProvince = schools.filter((school) => school.province_id === province.id)
            return {
              name: province.name,
              schools: schoolsInProvince.length,
              students: schoolsInProvince.reduce((sum, school) => sum + (school.total_students || 0), 0),
            }
          })
          .filter((item) => item.schools > 0)

        // Generate user role distribution
        const users = await DatabaseService.getUsers()
        const userRoles = [...new Set(users.map((user) => user.role))]
        const userRoleDistribution = userRoles.map((role) => ({
          name: role,
          value: users.filter((user) => user.role === role).length,
        }))

        // Generate observation trends (mock data)
        const observationTrends = [
          { month: "Jan", observations: 45 },
          { month: "Feb", observations: 52 },
          { month: "Mar", observations: 48 },
          { month: "Apr", observations: 70 },
          { month: "May", observations: 65 },
          { month: "Jun", observations: 58 },
        ]

        // Generate student progress data (mock data)
        const studentProgress = [
          { grade: "Grade 1", reading: 65, math: 70 },
          { grade: "Grade 2", reading: 68, math: 72 },
          { grade: "Grade 3", reading: 75, math: 78 },
          { grade: "Grade 4", reading: 80, math: 76 },
          { grade: "Grade 5", reading: 85, math: 82 },
        ]

        setAnalyticsData({
          surveyAnalytics,
          dashboardStats,
          schoolDistribution,
          userRoleDistribution,
          observationTrends,
          studentProgress,
        })
      } catch (error) {
        console.error("Error loading analytics data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadAnalyticsData()
  }, [filters])

  const handleFilterChange = useCallback((newFilters: any) => {
    setFilters(newFilters)
  }, [])

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"]

  return (
    <ProtectedRoute allowedRoles={["Admin", "Coordinator"]}>
      <PageLayout title="Analytics Dashboard" description="Comprehensive data analytics and insights">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters */}
          <div className="lg:col-span-1">
            <Filters onFilterChange={handleFilterChange} />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatsCard
                title="Total Schools"
                value={loading ? "..." : analyticsData.dashboardStats.total_schools || 0}
                description="Across all regions"
                icon={BarChart3}
                iconColor="text-blue-500"
              />
              <StatsCard
                title="Total Teachers"
                value={loading ? "..." : analyticsData.dashboardStats.total_teachers || 0}
                description="Active in the system"
                icon={Users}
                iconColor="text-green-500"
              />
              <StatsCard
                title="Total Students"
                value={loading ? "..." : analyticsData.dashboardStats.total_students || 0}
                description="Enrolled in TaRL"
                icon={Users}
                iconColor="text-purple-500"
              />
              <StatsCard
                title="Observations"
                value={loading ? "..." : analyticsData.dashboardStats.active_observations || 0}
                description="Completed this year"
                icon={LineChart}
                iconColor="text-orange-500"
              />
            </div>

            {/* Tabs for different analytics views */}
            <Tabs defaultValue="schools" className="w-full">
              <TabsList className="grid grid-cols-4 mb-4">
                <TabsTrigger value="schools">Schools</TabsTrigger>
                <TabsTrigger value="users">Users</TabsTrigger>
                <TabsTrigger value="observations">Observations</TabsTrigger>
                <TabsTrigger value="progress">Student Progress</TabsTrigger>
              </TabsList>

              {/* Schools Tab */}
              <TabsContent value="schools" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>School Distribution by Province</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80">
                    {loading ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-gray-500">Loading chart data...</div>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={analyticsData.schoolDistribution}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="schools" fill="#8884d8" name="Schools" />
                          <Bar dataKey="total_students" fill="#82ca9d" name="Students (x100)" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>School Types</CardTitle>
                    </CardHeader>
                    <CardContent className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: "Primary", value: 65 },
                              { name: "Secondary", value: 25 },
                              { name: "Combined", value: 10 },
                            ]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {[
                              { name: "Primary", value: 65 },
                              { name: "Secondary", value: 25 },
                              { name: "Combined", value: 10 },
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>School Locations</CardTitle>
                    </CardHeader>
                    <CardContent className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: "Urban", value: 40 },
                              { name: "Rural", value: 45 },
                              { name: "Remote", value: 15 },
                            ]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {[
                              { name: "Urban", value: 40 },
                              { name: "Rural", value: 45 },
                              { name: "Remote", value: 15 },
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Users Tab */}
              <TabsContent value="users" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>User Role Distribution</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80">
                    {loading ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-gray-500">Loading chart data...</div>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analyticsData.userRoleDistribution}
                            cx="50%"
                            cy="50%"
                            labelLine={true}
                            outerRadius={120}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, value }) => `${name}: ${value}`}
                          >
                            {analyticsData.userRoleDistribution.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>User Activity</CardTitle>
                    </CardHeader>
                    <CardContent className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={[
                            { period: "Last 24h", active: 125 },
                            { period: "Last Week", active: 348 },
                            { period: "Last Month", active: 589 },
                          ]}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="period" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="active" fill="#8884d8" name="Active Users" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>User Experience</CardTitle>
                    </CardHeader>
                    <CardContent className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: "< 1 year", value: 30 },
                              { name: "1-3 years", value: 35 },
                              { name: "3-5 years", value: 20 },
                              { name: "5+ years", value: 15 },
                            ]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {[
                              { name: "< 1 year", value: 30 },
                              { name: "1-3 years", value: 35 },
                              { name: "3-5 years", value: 20 },
                              { name: "5+ years", value: 15 },
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Observations Tab */}
              <TabsContent value="observations" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Observation Trends</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80">
                    {loading ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-gray-500">Loading chart data...</div>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={analyticsData.observationTrends}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="observations" fill="#8884d8" name="Observations" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Observation Types</CardTitle>
                    </CardHeader>
                    <CardContent className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: "Classroom", value: 60 },
                              { name: "Teacher", value: 25 },
                              { name: "Student", value: 15 },
                            ]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {[
                              { name: "Classroom", value: 60 },
                              { name: "Teacher", value: 25 },
                              { name: "Student", value: 15 },
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Observation Subjects</CardTitle>
                    </CardHeader>
                    <CardContent className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: "Mathematics", value: 45 },
                              { name: "Reading", value: 40 },
                              { name: "Writing", value: 15 },
                            ]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {[
                              { name: "Mathematics", value: 45 },
                              { name: "Reading", value: 40 },
                              { name: "Writing", value: 15 },
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Student Progress Tab */}
              <TabsContent value="progress" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Student Progress by Grade</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80">
                    {loading ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-gray-500">Loading chart data...</div>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={analyticsData.studentProgress}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="grade" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="reading" fill="#8884d8" name="Reading %" />
                          <Bar dataKey="math" fill="#82ca9d" name="Math %" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Reading Level Distribution</CardTitle>
                    </CardHeader>
                    <CardContent className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: "Below Grade", value: 25 },
                              { name: "At Grade", value: 55 },
                              { name: "Above Grade", value: 20 },
                            ]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {[
                              { name: "Below Grade", value: 25 },
                              { name: "At Grade", value: 55 },
                              { name: "Above Grade", value: 20 },
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Math Level Distribution</CardTitle>
                    </CardHeader>
                    <CardContent className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: "Below Grade", value: 30 },
                              { name: "At Grade", value: 50 },
                              { name: "Above Grade", value: 20 },
                            ]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {[
                              { name: "Below Grade", value: 30 },
                              { name: "At Grade", value: 50 },
                              { name: "Above Grade", value: 20 },
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </PageLayout>
    </ProtectedRoute>
  )
}
