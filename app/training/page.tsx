"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Navigation } from "@/components/navigation"
import { Filters } from "@/components/filters"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { DatabaseService } from "@/lib/database"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Star, Users, ThumbsUp } from "lucide-react"
import type { TarlTrainingFeedback } from "@/lib/types"

export default function TrainingPage() {
  const [feedback, setFeedback] = useState<TarlTrainingFeedback[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<any>({})

  // Use useCallback to prevent infinite re-renders
  const handleFilterChange = useCallback((newFilters: any) => {
    setFilters(newFilters)
  }, [])

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
          <h2 className="text-xl font-semibold text-gray-900">Training Feedback</h2>
          <p className="text-sm text-gray-600">Monitor training effectiveness and participant satisfaction</p>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Filters */}
            <div className="lg:col-span-1">
              <Filters onFilterChange={handleFilterChange} />
            </div>

            {/* Feedback Content */}
            <div className="lg:col-span-3">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-lg">Loading training feedback...</div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{feedback.length}</div>
                        <p className="text-xs text-muted-foreground">Responses collected</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Overall Rating</CardTitle>
                        <Star className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats.avgOverallRating.toFixed(1)}/5</div>
                        <div className="flex items-center space-x-2">{getRatingBadge(stats.avgOverallRating)}</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Recommendation Rate</CardTitle>
                        <ThumbsUp className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats.recommendationRate.toFixed(1)}%</div>
                        <p className="text-xs text-muted-foreground">Would recommend training</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Rating Breakdown */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Ratings Chart */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Average Ratings by Category</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis domain={[0, 5]} />
                            <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}/5`, "Rating"]} />
                            <Bar dataKey="rating" fill="#3b82f6" />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* Key Metrics */}
                    <Card>
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
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Feedback</CardTitle>
                    </CardHeader>
                    <CardContent>
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

                        {feedback.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            No training feedback found for the selected filters.
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
