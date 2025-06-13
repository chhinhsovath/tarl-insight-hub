"use client"

import { useState, useEffect, useCallback } from "react"
import { PageLayout } from "@/components/page-layout"
import { StatsCard } from "@/components/stats-card"
import { Filters } from "@/components/filters"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { DatabaseService } from "@/lib/database"
import { ProtectedRoute } from "@/components/protected-route"
import { useToast } from "@/hooks/use-toast"
import { Star, Users, ThumbsUp, Plus } from "lucide-react"
import type { TrainingFeedback } from "@/lib/types"

export default function TrainingPage() {
  const [feedback, setFeedback] = useState<TrainingFeedback[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<any>({})
  const [showAddDialog, setShowAddDialog] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadFeedback()
  }, [filters])

  const loadFeedback = async () => {
    setLoading(true)
    try {
      const data = await DatabaseService.getTrainingFeedback()
      setFeedback(data)
    } catch (error) {
      console.error("Error loading training feedback:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = useCallback((newFilters: any) => {
    setFilters(newFilters)
  }, [])

  const getRatingBadge = (rating: number) => {
    if (rating >= 4.5) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>
    if (rating >= 4) return <Badge className="bg-blue-100 text-blue-800">Very Good</Badge>
    if (rating >= 3) return <Badge className="bg-yellow-100 text-yellow-800">Good</Badge>
    if (rating >= 2) return <Badge className="bg-orange-100 text-orange-800">Fair</Badge>
    return <Badge className="bg-red-100 text-red-800">Poor</Badge>
  }

  const calculateStats = () => {
    if (feedback.length === 0)
      return {
        avgOverallRating: 0,
        avgContentRating: 0,
        avgTrainerRating: 0,
        avgVenueRating: 0,
        recommendationRate: 0,
        willApplyRate: 0,
      }

    const validOverall = feedback.filter((f) => f.overall_rating).map((f) => f.overall_rating!)
    const validContent = feedback.filter((f) => f.content_quality_rating).map((f) => f.content_quality_rating!)
    const validTrainer = feedback
      .filter((f) => f.trainer_effectiveness_rating)
      .map((f) => f.trainer_effectiveness_rating!)
    const validVenue = feedback.filter((f) => f.venue_rating).map((f) => f.venue_rating!)

    const willRecommend = feedback.filter((f) => f.will_recommend_training === true).length
    const willApply = feedback.filter((f) => f.will_apply_learning === true).length

    return {
      avgOverallRating: validOverall.length > 0 ? validOverall.reduce((a, b) => a + b, 0) / validOverall.length : 0,
      avgContentRating: validContent.length > 0 ? validContent.reduce((a, b) => a + b, 0) / validContent.length : 0,
      avgTrainerRating: validTrainer.length > 0 ? validTrainer.reduce((a, b) => a + b, 0) / validTrainer.length : 0,
      avgVenueRating: validVenue.length > 0 ? validVenue.reduce((a, b) => a + b, 0) / validVenue.length : 0,
      recommendationRate: feedback.length > 0 ? (willRecommend / feedback.length) * 100 : 0,
      willApplyRate: feedback.length > 0 ? (willApply / feedback.length) * 100 : 0,
    }
  }

  const stats = calculateStats()

  const chartData = [
    { name: "Overall", rating: stats.avgOverallRating },
    { name: "Content", rating: stats.avgContentRating },
    { name: "Trainer", rating: stats.avgTrainerRating },
    { name: "Venue", rating: stats.avgVenueRating },
  ]

  return (
    <ProtectedRoute allowedRoles={["Admin", "Teacher", "Coordinator"]}>
      <PageLayout
        title="Training Feedback"
        description="Monitor training effectiveness and participant satisfaction"
        action={{
          label: "Add Feedback",
          onClick: () => setShowAddDialog(true),
          icon: Plus,
        }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters */}
          <div className="lg:col-span-1">
            <Filters onFilterChange={handleFilterChange} />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatsCard
                title="Total Feedback"
                value={loading ? "..." : feedback.length}
                description="Responses collected"
                icon={Users}
                iconColor="text-blue-500"
              />
              <StatsCard
                title="Avg Overall Rating"
                value={loading ? "..." : `${stats.avgOverallRating.toFixed(1)}/5`}
                description="Training effectiveness"
                icon={Star}
                iconColor="text-yellow-500"
              />
              <StatsCard
                title="Recommendation Rate"
                value={loading ? "..." : `${stats.recommendationRate.toFixed(1)}%`}
                description="Would recommend training"
                icon={ThumbsUp}
                iconColor="text-green-500"
              />
            </div>

            {/* Rating Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Ratings Chart */}
              <Card className="soft-card">
                <CardHeader>
                  <CardTitle>Average Ratings by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <p>Chart visualization would appear here</p>
                      <p className="text-sm mt-2">Data: {JSON.stringify(chartData)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Key Metrics */}
              <Card className="soft-card">
                <CardHeader>
                  <CardTitle>Key Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Content Quality</span>
                      <span>{stats.avgContentRating.toFixed(1)}/5</span>
                    </div>
                    <Progress value={(stats.avgContentRating / 5) * 100} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Trainer Effectiveness</span>
                      <span>{stats.avgTrainerRating.toFixed(1)}/5</span>
                    </div>
                    <Progress value={(stats.avgTrainerRating / 5) * 100} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Venue Rating</span>
                      <span>{stats.avgVenueRating.toFixed(1)}/5</span>
                    </div>
                    <Progress value={(stats.avgVenueRating / 5) * 100} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Will Apply Learning</span>
                      <span>{stats.willApplyRate.toFixed(1)}%</span>
                    </div>
                    <Progress value={stats.willApplyRate} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Feedback */}
            <Card className="soft-card">
              <CardHeader>
                <CardTitle>Recent Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="text-gray-500">Loading training feedback...</div>
                  </div>
                ) : feedback.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No training feedback found for the selected filters.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {feedback.slice(0, 10).map((item) => (
                      <div key={item.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-medium">Training ID: {item.training_id || "N/A"}</h3>
                            <p className="text-sm text-gray-600">
                              {item.respondent_type} • {new Date(item.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {item.overall_rating && getRatingBadge(item.overall_rating)}
                            <span className="text-lg font-bold">{item.overall_rating || "N/A"}/5</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                          <div>
                            <span className="font-medium">Content:</span>
                            <p className="text-gray-600">{item.content_quality_rating || "N/A"}/5</p>
                          </div>
                          <div>
                            <span className="font-medium">Trainer:</span>
                            <p className="text-gray-600">{item.trainer_effectiveness_rating || "N/A"}/5</p>
                          </div>
                          <div>
                            <span className="font-medium">Venue:</span>
                            <p className="text-gray-600">{item.venue_rating || "N/A"}/5</p>
                          </div>
                          <div>
                            <span className="font-medium">Experience:</span>
                            <p className="text-gray-600">{item.years_of_experience || "N/A"} years</p>
                          </div>
                        </div>

                        {item.most_valuable_aspect && (
                          <div className="mt-3 p-2 bg-green-50 rounded text-sm">
                            <span className="font-medium text-green-800">Most Valuable:</span>
                            <p className="text-green-700 mt-1">{item.most_valuable_aspect}</p>
                          </div>
                        )}

                        {item.suggestions_for_improvement && (
                          <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                            <span className="font-medium text-blue-800">Suggestions:</span>
                            <p className="text-blue-700 mt-1">{item.suggestions_for_improvement}</p>
                          </div>
                        )}

                        <div className="flex justify-between text-xs text-gray-500 mt-3">
                          <span>Will recommend: {item.will_recommend_training ? "Yes" : "No"}</span>
                          <span>Will apply learning: {item.will_apply_learning ? "Yes" : "No"}</span>
                          <span>Previous TaRL training: {item.previous_tarl_training ? "Yes" : "No"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </PageLayout>
    </ProtectedRoute>
  )
}
