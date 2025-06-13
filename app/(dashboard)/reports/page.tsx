"use client"

import { useState, useEffect } from "react"
import { PageLayout } from "@/components/page-layout"
import { StatsCard } from "@/components/stats-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ProtectedRoute } from "@/components/protected-route"
import { useToast } from "@/hooks/use-toast"
import { FileText, Download, Calendar, TrendingUp, Users, School } from "lucide-react"

interface ReportData {
  id: string
  title: string
  description: string
  type: "observations" | "schools" | "users" | "training"
  generatedAt: string
  status: "ready" | "generating" | "failed"
  downloadUrl?: string
}

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportData[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadReports()
  }, [])

  const loadReports = async () => {
    setLoading(true)
    try {
      // Mock data for demonstration
      const mockReports: ReportData[] = [
        {
          id: "1",
          title: "Monthly Observations Report",
          description: "Comprehensive report of all observations conducted this month",
          type: "observations",
          generatedAt: new Date().toISOString(),
          status: "ready",
          downloadUrl: "#",
        },
        {
          id: "2",
          title: "School Performance Summary",
          description: "Performance metrics and statistics for all participating schools",
          type: "schools",
          generatedAt: new Date(Date.now() - 86400000).toISOString(),
          status: "ready",
          downloadUrl: "#",
        },
        {
          id: "3",
          title: "User Activity Report",
          description: "User engagement and activity statistics",
          type: "users",
          generatedAt: new Date(Date.now() - 172800000).toISOString(),
          status: "generating",
        },
        {
          id: "4",
          title: "Training Effectiveness Report",
          description: "Analysis of training feedback and effectiveness metrics",
          type: "training",
          generatedAt: new Date(Date.now() - 259200000).toISOString(),
          status: "ready",
          downloadUrl: "#",
        },
      ]
      setReports(mockReports)
    } catch (error) {
      console.error("Error loading reports:", error)
    } finally {
      setLoading(false)
    }
  }

  const generateReport = async (type: string) => {
    toast({
      title: "Report Generation Started",
      description: `Generating ${type} report. You'll be notified when it's ready.`,
    })
  }

  const downloadReport = (report: ReportData) => {
    if (report.downloadUrl) {
      // In a real app, this would trigger the actual download
      toast({
        title: "Download Started",
        description: `Downloading ${report.title}`,
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const statusColors = {
      ready: "bg-green-100 text-green-800",
      generating: "bg-yellow-100 text-yellow-800",
      failed: "bg-red-100 text-red-800",
    }
    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "observations":
        return TrendingUp
      case "schools":
        return School
      case "users":
        return Users
      case "training":
        return FileText
      default:
        return FileText
    }
  }

  return (
    <ProtectedRoute allowedRoles={["Admin", "Coordinator"]}>
      <PageLayout title="Reports & Analytics" description="Generate and download comprehensive reports">
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatsCard
              title="Total Reports"
              value={loading ? "..." : reports.length}
              description="Generated reports"
              icon={FileText}
              iconColor="text-blue-500"
            />
            <StatsCard
              title="Ready Reports"
              value={loading ? "..." : reports.filter((r) => r.status === "ready").length}
              description="Available for download"
              icon={Download}
              iconColor="text-green-500"
            />
            <StatsCard
              title="Generating"
              value={loading ? "..." : reports.filter((r) => r.status === "generating").length}
              description="In progress"
              icon={Calendar}
              iconColor="text-yellow-500"
            />
            <StatsCard
              title="This Month"
              value={
                loading
                  ? "..."
                  : reports.filter((r) => {
                      const reportDate = new Date(r.generatedAt)
                      const now = new Date()
                      return reportDate.getMonth() === now.getMonth() && reportDate.getFullYear() === now.getFullYear()
                    }).length
              }
              description="Reports generated"
              icon={TrendingUp}
              iconColor="text-purple-500"
            />
          </div>

          {/* Quick Actions */}
          <Card className="soft-card">
            <CardHeader>
              <CardTitle>Generate New Report</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button
                  onClick={() => generateReport("observations")}
                  className="soft-button h-auto p-4 flex flex-col items-center space-y-2"
                  variant="outline"
                >
                  <TrendingUp className="h-6 w-6" />
                  <span>Observations Report</span>
                </Button>
                <Button
                  onClick={() => generateReport("schools")}
                  className="soft-button h-auto p-4 flex flex-col items-center space-y-2"
                  variant="outline"
                >
                  <School className="h-6 w-6" />
                  <span>Schools Report</span>
                </Button>
                <Button
                  onClick={() => generateReport("users")}
                  className="soft-button h-auto p-4 flex flex-col items-center space-y-2"
                  variant="outline"
                >
                  <Users className="h-6 w-6" />
                  <span>Users Report</span>
                </Button>
                <Button
                  onClick={() => generateReport("training")}
                  className="soft-button h-auto p-4 flex flex-col items-center space-y-2"
                  variant="outline"
                >
                  <FileText className="h-6 w-6" />
                  <span>Training Report</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Reports List */}
          <Card className="soft-card">
            <CardHeader>
              <CardTitle>Recent Reports</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-gray-500">Loading reports...</div>
                </div>
              ) : reports.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No reports generated yet. Create your first report using the buttons above.
                </div>
              ) : (
                <div className="space-y-4">
                  {reports.map((report) => {
                    const IconComponent = getTypeIcon(report.type)
                    return (
                      <div key={report.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <IconComponent className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                              <h3 className="font-medium">{report.title}</h3>
                              <p className="text-sm text-gray-600">{report.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getStatusBadge(report.status)}
                            {report.status === "ready" && (
                              <Button onClick={() => downloadReport(report)} size="sm" className="soft-button">
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          Generated: {new Date(report.generatedAt).toLocaleString()}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    </ProtectedRoute>
  )
}
