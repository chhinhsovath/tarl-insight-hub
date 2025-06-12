"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Navigation } from "@/components/navigation"
import { Filters } from "@/components/filters"
import { Button } from "@/components/ui/button"
import { DatabaseService } from "@/lib/database"
import { Download, FileText, BarChart3, Users, Calendar } from "lucide-react"

export default function ReportsPage() {
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<any>({})
  const [stats, setStats] = useState<any>({})

  useEffect(() => {
    loadStats()
  }, [filters])

  const loadStats = async () => {
    setLoading(true)
    try {
      const data = await DatabaseService.getDashboardStats(filters)
      setStats(data)
    } catch (error) {
      console.error("Error loading stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = useCallback((newFilters: any) => {
    setFilters(newFilters)
  }, [])

  const handleExport = (type: string) => {
    // Placeholder for export functionality
    console.log(`Exporting ${type} report with filters:`, filters)
    alert(`${type} export functionality will be implemented here`)
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-sm border-r">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900">TaRL Insight Hub</h1>
          <p className="text-sm text-gray-600 mt-1">Teaching at the Right Level</p>
        </div>
        <div className="px-4">
          <Navigation />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm border-b px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-900">Reports & Analytics</h2>
          <p className="text-sm text-gray-600">Generate and export program reports</p>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Filters */}
            <div className="lg:col-span-1">
              <Filters onFilterChange={handleFilterChange} />
            </div>

            {/* Reports Content */}
            <div className="lg:col-span-3">
              <div className="space-y-6">
                {/* Summary Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle>Report Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-blue-600">{stats.totalSchools || 0}</div>
                        <div className="text-sm text-gray-600">Schools</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">{stats.totalResponses || 0}</div>
                        <div className="text-sm text-gray-600">Responses</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-purple-600">{stats.uniqueRespondents || 0}</div>
                        <div className="text-sm text-gray-600">Participants</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-orange-600">{stats.totalFeedback || 0}</div>
                        <div className="text-sm text-gray-600">Feedback</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Available Reports */}
                <Card>
                  <CardHeader>
                    <CardTitle>Available Reports</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <FileText className="h-8 w-8 text-blue-500" />
                          <div>
                            <h3 className="font-medium">Survey Response Report</h3>
                            <p className="text-sm text-gray-600">Detailed survey responses and analytics</p>
                          </div>
                        </div>
                        <Button onClick={() => handleExport("Survey Response")} className="w-full" disabled={loading}>
                          <Download className="h-4 w-4 mr-2" />
                          Export CSV
                        </Button>
                      </div>

                      <div className="border rounded-lg p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <BarChart3 className="h-8 w-8 text-green-500" />
                          <div>
                            <h3 className="font-medium">Training Feedback Report</h3>
                            <p className="text-sm text-gray-600">Training effectiveness and ratings</p>
                          </div>
                        </div>
                        <Button onClick={() => handleExport("Training Feedback")} className="w-full" disabled={loading}>
                          <Download className="h-4 w-4 mr-2" />
                          Export CSV
                        </Button>
                      </div>

                      <div className="border rounded-lg p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <Users className="h-8 w-8 text-purple-500" />
                          <div>
                            <h3 className="font-medium">Participant Directory</h3>
                            <p className="text-sm text-gray-600">Complete list of program participants</p>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleExport("Participant Directory")}
                          className="w-full"
                          disabled={loading}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Export CSV
                        </Button>
                      </div>

                      <div className="border rounded-lg p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <Calendar className="h-8 w-8 text-orange-500" />
                          <div>
                            <h3 className="font-medium">Activity Summary</h3>
                            <p className="text-sm text-gray-600">Program activity and engagement metrics</p>
                          </div>
                        </div>
                        <Button onClick={() => handleExport("Activity Summary")} className="w-full" disabled={loading}>
                          <Download className="h-4 w-4 mr-2" />
                          Export PDF
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Report Instructions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Report Instructions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 text-sm">
                      <div>
                        <h4 className="font-medium mb-2">How to Generate Reports:</h4>
                        <ol className="list-decimal list-inside space-y-1 text-gray-600">
                          <li>Use the filters on the left to select specific provinces, districts, or schools</li>
                          <li>Choose the type of report you want to generate</li>
                          <li>Click the export button to download the report</li>
                          <li>Reports will include data based on your current filter selection</li>
                        </ol>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Report Formats:</h4>
                        <ul className="list-disc list-inside space-y-1 text-gray-600">
                          <li>
                            <strong>CSV:</strong> Suitable for data analysis in Excel or other tools
                          </li>
                          <li>
                            <strong>PDF:</strong> Formatted reports for presentations and sharing
                          </li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Data Included:</h4>
                        <ul className="list-disc list-inside space-y-1 text-gray-600">
                          <li>Survey responses with completion status and timestamps</li>
                          <li>Training feedback with ratings and comments</li>
                          <li>Participant information and geographic distribution</li>
                          <li>Activity metrics and engagement statistics</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
