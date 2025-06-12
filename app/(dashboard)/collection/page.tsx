"use client"

import { useState, useEffect } from "react"
import { PageLayout } from "@/components/page-layout"
import { StatsCard } from "@/components/stats-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ProtectedRoute } from "@/components/protected-route"
import { useToast } from "@/hooks/use-toast"
import { Database, Upload, CheckCircle, Clock, AlertCircle, Plus } from "lucide-react"

interface DataCollection {
  id: string
  title: string
  type: "observation" | "survey" | "assessment"
  status: "pending" | "in_progress" | "completed" | "synced"
  created_at: string
  updated_at: string
  records_count: number
  school_name?: string
}

export default function CollectionPage() {
  const [collections, setCollections] = useState<DataCollection[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadCollections()
  }, [])

  const loadCollections = async () => {
    setLoading(true)
    try {
      // Mock data for demonstration
      const mockCollections: DataCollection[] = [
        {
          id: "1",
          title: "Morning Observation - Angkor High School",
          type: "observation",
          status: "completed",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          records_count: 25,
          school_name: "Angkor High School",
        },
        {
          id: "2",
          title: "Student Assessment - Grade 5",
          type: "assessment",
          status: "in_progress",
          created_at: new Date(Date.now() - 86400000).toISOString(),
          updated_at: new Date(Date.now() - 3600000).toISOString(),
          records_count: 18,
          school_name: "Battambang Provincial School",
        },
        {
          id: "3",
          title: "Teacher Feedback Survey",
          type: "survey",
          status: "pending",
          created_at: new Date(Date.now() - 172800000).toISOString(),
          updated_at: new Date(Date.now() - 172800000).toISOString(),
          records_count: 0,
          school_name: "Bayon Primary School",
        },
      ]
      setCollections(mockCollections)
    } catch (error) {
      console.error("Error loading collections:", error)
    } finally {
      setLoading(false)
    }
  }

  const syncData = async (collectionId: string) => {
    toast({
      title: "Sync Started",
      description: "Data synchronization has been initiated.",
    })
    // In real app, implement actual sync logic
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
      in_progress: { color: "bg-blue-100 text-blue-800", icon: Clock },
      completed: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      synced: { color: "bg-purple-100 text-purple-800", icon: Upload },
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const IconComponent = config.icon

    return (
      <Badge className={config.color}>
        <IconComponent className="h-3 w-3 mr-1" />
        {status.replace("_", " ").charAt(0).toUpperCase() + status.replace("_", " ").slice(1)}
      </Badge>
    )
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "observation":
        return "👁️"
      case "survey":
        return "📋"
      case "assessment":
        return "📝"
      default:
        return "📄"
    }
  }

  const pendingCount = collections.filter((c) => c.status === "pending").length
  const inProgressCount = collections.filter((c) => c.status === "in_progress").length
  const completedCount = collections.filter((c) => c.status === "completed").length
  const totalRecords = collections.reduce((sum, c) => sum + c.records_count, 0)

  return (
    <ProtectedRoute allowedRoles={["Collector", "Admin"]}>
      <PageLayout
        title="Data Collection"
        description="Manage offline data collection and synchronization"
        action={{
          label: "New Collection",
          onClick: () => console.log("New collection"),
          icon: Plus,
        }}
      >
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatsCard
              title="Total Collections"
              value={loading ? "..." : collections.length}
              description="Data collections"
              icon={Database}
              iconColor="text-blue-500"
            />
            <StatsCard
              title="Pending Sync"
              value={loading ? "..." : pendingCount + inProgressCount}
              description="Need synchronization"
              icon={Upload}
              iconColor="text-yellow-500"
            />
            <StatsCard
              title="Completed"
              value={loading ? "..." : completedCount}
              description="Ready to sync"
              icon={CheckCircle}
              iconColor="text-green-500"
            />
            <StatsCard
              title="Total Records"
              value={loading ? "..." : totalRecords}
              description="Data points collected"
              icon={AlertCircle}
              iconColor="text-purple-500"
            />
          </div>

          {/* Quick Actions */}
          <Card className="soft-card">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  onClick={() => console.log("Start observation")}
                  className="soft-button h-auto p-4 flex flex-col items-center space-y-2"
                  variant="outline"
                >
                  <span className="text-2xl">👁️</span>
                  <span>Start Observation</span>
                </Button>
                <Button
                  onClick={() => console.log("Create survey")}
                  className="soft-button h-auto p-4 flex flex-col items-center space-y-2"
                  variant="outline"
                >
                  <span className="text-2xl">📋</span>
                  <span>Create Survey</span>
                </Button>
                <Button
                  onClick={() => console.log("Sync all")}
                  className="soft-button h-auto p-4 flex flex-col items-center space-y-2 soft-gradient text-white"
                >
                  <Upload className="h-6 w-6" />
                  <span>Sync All Data</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Collections List */}
          <Card className="soft-card">
            <CardHeader>
              <CardTitle>Recent Collections</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-gray-500">Loading collections...</div>
                </div>
              ) : collections.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No data collections found. Start your first collection using the buttons above.
                </div>
              ) : (
                <div className="space-y-4">
                  {collections.map((collection) => (
                    <div key={collection.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{getTypeIcon(collection.type)}</span>
                          <div>
                            <h3 className="font-medium">{collection.title}</h3>
                            <p className="text-sm text-gray-600">{collection.school_name}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(collection.status)}
                          {collection.status === "completed" && (
                            <Button onClick={() => syncData(collection.id)} size="sm" className="soft-button">
                              <Upload className="h-4 w-4 mr-1" />
                              Sync
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                        <div>
                          <span className="font-medium">Type:</span>
                          <p className="text-gray-600 capitalize">{collection.type}</p>
                        </div>
                        <div>
                          <span className="font-medium">Records:</span>
                          <p className="text-gray-600">{collection.records_count}</p>
                        </div>
                        <div>
                          <span className="font-medium">Created:</span>
                          <p className="text-gray-600">{new Date(collection.created_at).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <span className="font-medium">Updated:</span>
                          <p className="text-gray-600">{new Date(collection.updated_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    </ProtectedRoute>
  )
}
