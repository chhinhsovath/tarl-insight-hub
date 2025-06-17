"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MessageSquare, 
  Star,
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  TrendingUp,
  ThumbsUp,
  ThumbsDown,
  ArrowLeft,
  Download
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import { TrainingBreadcrumb } from '@/components/training-breadcrumb';
import { TrainingLocaleProvider } from '@/components/training-locale-provider';
import { useTrainingTranslation } from '@/lib/training-i18n';
import { TrainingLanguageSwitcher } from '@/components/training-language-switcher';

interface TrainingFeedback {
  id: number;
  session_id: number;
  participant_id?: number;
  overall_rating: number;
  trainer_rating?: number;
  content_rating?: number;
  venue_rating?: number;
  would_recommend: boolean;
  comments?: string;
  suggestions?: string;
  is_anonymous: boolean;
  submission_time: string;
  session_title: string;
  session_date: string;
  session_time: string;
  location: string;
  program_name: string;
  participant_name?: string;
  participant_email?: string;
}

interface FeedbackStats {
  total_feedback: number;
  positive_feedback: number;
  negative_feedback: number;
  average_rating: number;
  avg_content_rating: number;
  avg_trainer_rating: number;
  avg_venue_rating: number;
  would_recommend: number;
  sessions_with_feedback: number;
}

function TrainingFeedbackContent() {
  const { user } = useAuth();
  const { t } = useTrainingTranslation();
  const searchParams = useSearchParams();
  const [feedback, setFeedback] = useState<TrainingFeedback[]>([]);
  const [filteredFeedback, setFilteredFeedback] = useState<TrainingFeedback[]>([]);
  const [stats, setStats] = useState<FeedbackStats>({
    total_feedback: 0,
    positive_feedback: 0,
    negative_feedback: 0,
    average_rating: 0,
    avg_content_rating: 0,
    avg_trainer_rating: 0,
    avg_venue_rating: 0,
    would_recommend: 0,
    sessions_with_feedback: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [sessionFilter, setSessionFilter] = useState(searchParams.get('session') || 'all');

  useEffect(() => {
    fetchFeedback();
    fetchStats();
  }, []);

  useEffect(() => {
    filterFeedback();
  }, [feedback, searchTerm, ratingFilter, sessionFilter]);

  const fetchFeedback = async () => {
    try {
      const response = await fetch('/api/training/feedback', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      if (response.ok) {
        const data = await response.json();
        setFeedback(data);
      } else {
        toast.error(t.fetchFeedbackError);
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
      toast.error(t.errorLoading);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/training/feedback?stats=true', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data.statistics || stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const filterFeedback = () => {
    let filtered = feedback;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(fb =>
        fb.session_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fb.program_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (fb.comments && fb.comments.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (fb.participant_name && fb.participant_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Rating filter
    if (ratingFilter !== 'all') {
      if (ratingFilter === 'positive') {
        filtered = filtered.filter(fb => fb.overall_rating >= 4);
      } else if (ratingFilter === 'negative') {
        filtered = filtered.filter(fb => fb.overall_rating <= 2);
      } else if (ratingFilter === 'neutral') {
        filtered = filtered.filter(fb => fb.overall_rating === 3);
      }
    }

    // Session filter
    if (sessionFilter !== 'all') {
      filtered = filtered.filter(fb => fb.session_id.toString() === sessionFilter);
    }

    setFilteredFeedback(filtered);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600';
    if (rating <= 2) return 'text-red-600';
    return 'text-yellow-600';
  };

  const getRatingBadge = (rating: number) => {
    if (rating >= 4) return 'bg-green-100 text-green-800';
    if (rating <= 2) return 'bg-red-100 text-red-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  const StarRating = ({ rating }: { rating: number }) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star 
            key={star}
            className={`h-4 w-4 ${
              star <= rating 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const uniqueSessions = [...new Set(feedback.map(fb => ({ 
    id: fb.session_id, 
    title: fb.session_title 
  })))];

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">{t.pleaseLogIn} {t.trainingFeedback.toLowerCase()}.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <TrainingBreadcrumb />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t.trainingFeedback}</h1>
          <p className="text-muted-foreground mt-1">
            {t.viewAnalyzeFeedback}
          </p>
          {searchParams.get('session') && (
            <p className="text-sm text-blue-600 mt-1">
              {t.showingForSession}: {searchParams.get('session')}
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
        <TrainingLanguageSwitcher />
          {/* <Badge className="bg-blue-100 text-blue-800" variant="secondary">
            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
          </Badge> */}
          {searchParams.get('session') && (
            <Button 
              variant="outline"
              onClick={() => window.history.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {t.backToSessions}
            </Button>
          )}
        </div>
      </div>

      {/* Feedback Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t.totalFeedback}</p>
                <p className="text-2xl font-bold">{stats.total_feedback}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.sessions_with_feedback} {t.sessions}
                </p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t.avgRating}</p>
                <p className="text-2xl font-bold">{stats.average_rating ? stats.average_rating.toFixed(1) : '0.0'}</p>
                <div className="flex items-center gap-1 text-xs">
                  <StarRating rating={Math.round(stats.average_rating)} />
                </div>
              </div>
              <Star className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Positive {t.feedback}</p>
                <p className="text-2xl font-bold">{stats.positive_feedback}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.total_feedback > 0 
                    ? Math.round((stats.positive_feedback / stats.total_feedback) * 100)
                    : 0} {t.percentOfTotal}
                </p>
              </div>
              <ThumbsUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t.wouldRecommend}</p>
                <p className="text-2xl font-bold">{stats.would_recommend}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.total_feedback > 0 
                    ? Math.round((stats.would_recommend / stats.total_feedback) * 100)
                    : 0} {t.percentRate}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rating Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>{t.ratingBreakdown}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">{t.overallQuality}</p>
              <p className="text-xl font-semibold">{stats.average_rating ? stats.average_rating.toFixed(1) : '0.0'}</p>
              <StarRating rating={Math.round(stats.average_rating)} />
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">{t.contentQuality}</p>
              <p className="text-xl font-semibold">{stats.avg_content_rating ? stats.avg_content_rating.toFixed(1) : '0.0'}</p>
              <StarRating rating={Math.round(stats.avg_content_rating)} />
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">{t.trainerEffectiveness}</p>
              <p className="text-xl font-semibold">{stats.avg_trainer_rating ? stats.avg_trainer_rating.toFixed(1) : '0.0'}</p>
              <StarRating rating={Math.round(stats.avg_trainer_rating)} />
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">{t.venueFacilities}</p>
              <p className="text-xl font-semibold">{stats.avg_venue_rating ? stats.avg_venue_rating.toFixed(1) : '0.0'}</p>
              <StarRating rating={Math.round(stats.avg_venue_rating)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder={t.searchFeedback}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={ratingFilter} onValueChange={setRatingFilter}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder={t.rating} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.allRatings}</SelectItem>
                  <SelectItem value="positive">{t.positiveRating}</SelectItem>
                  <SelectItem value="neutral">{t.neutralRating}</SelectItem>
                  <SelectItem value="negative">{t.negativeRating}</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={sessionFilter} onValueChange={setSessionFilter}>
                <SelectTrigger className="w-[160px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder={t.session} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.allSessions}</SelectItem>
                  {uniqueSessions.map(session => (
                    <SelectItem key={session.id} value={session.id.toString()}>
                      {session.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feedback List */}
      <Card>
        <CardHeader>
          <CardTitle>{t.feedbackResponses} ({filteredFeedback.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">{t.loadingFeedback}</p>
            </div>
          ) : filteredFeedback.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {feedback.length === 0 ? t.noFeedbackFound : t.noMatchingFilters}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFeedback.map((fb) => (
                <Card key={fb.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{fb.session_title}</h3>
                          <p className="text-sm text-muted-foreground">{fb.program_name}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(fb.session_date)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDateTime(fb.submission_time)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getRatingBadge(fb.overall_rating)}>
                            {fb.overall_rating}/5
                          </Badge>
                          {fb.is_anonymous && (
                            <Badge variant="outline">{t.anonymous}</Badge>
                          )}
                        </div>
                      </div>

                      {/* Ratings */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Overall</p>
                          <div className="flex items-center gap-2">
                            <StarRating rating={fb.overall_rating} />
                            <span className={getRatingColor(fb.overall_rating)}>
                              {fb.overall_rating}/5
                            </span>
                          </div>
                        </div>
                        {fb.content_rating && (
                          <div>
                            <p className="text-muted-foreground">Content</p>
                            <div className="flex items-center gap-2">
                              <StarRating rating={fb.content_rating} />
                              <span>{fb.content_rating}/5</span>
                            </div>
                          </div>
                        )}
                        {fb.trainer_rating && (
                          <div>
                            <p className="text-muted-foreground">{t.trainer}</p>
                            <div className="flex items-center gap-2">
                              <StarRating rating={fb.trainer_rating} />
                              <span>{fb.trainer_rating}/5</span>
                            </div>
                          </div>
                        )}
                        {fb.venue_rating && (
                          <div>
                            <p className="text-muted-foreground">Venue</p>
                            <div className="flex items-center gap-2">
                              <StarRating rating={fb.venue_rating} />
                              <span>{fb.venue_rating}/5</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Comments */}
                      {(fb.comments || fb.suggestions) && (
                        <div className="space-y-2">
                          {fb.comments && (
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">{t.comments}:</p>
                              <p className="text-sm bg-gray-50 p-3 rounded-lg">"{fb.comments}"</p>
                            </div>
                          )}
                          {fb.suggestions && (
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">{t.suggestions}:</p>
                              <p className="text-sm bg-blue-50 p-3 rounded-lg">"{fb.suggestions}"</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {!fb.is_anonymous && fb.participant_name && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {fb.participant_name}
                            </span>
                          )}
                          {fb.would_recommend && (
                            <span className="flex items-center gap-1 text-green-600">
                              <ThumbsUp className="h-3 w-3" />
                              {t.wouldRecommend}
                            </span>
                          )}
                          {fb.would_recommend === false && (
                            <span className="flex items-center gap-1 text-red-600">
                              <ThumbsDown className="h-3 w-3" />
                              {t.wouldNotRecommend}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function TrainingFeedbackPage() {
  return (
    <TrainingLocaleProvider>
      <TrainingFeedbackContent />
    </TrainingLocaleProvider>
  );
}