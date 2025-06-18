"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CalendarDays, 
  Users, 
  QrCode, 
  ClipboardList, 
  Plus,
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  Circle,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  Activity,
  MessageSquare,
  Star,
  ThumbsUp
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import Link from 'next/link';
import { TrainingBreadcrumb } from '@/components/training-breadcrumb';
import { TrainingLocaleProvider } from '@/components/training-locale-provider';
import { TrainingLanguageSwitcher } from '@/components/training-language-switcher';
import { useTrainingTranslation } from '@/lib/training-i18n';
import { PageLoader } from '@/components/page-loader';
import { useAsyncOperation } from '@/hooks/use-async-operation';

interface TrainingSession {
  id: number;
  session_title: string;
  session_date: string;
  session_time: string;
  location: string;
  session_status: string;
  participant_count: number;
  confirmed_count: number;
  program_name: string;
  trainer_name: string;
  before_status?: string;
  during_status?: string;
  after_status?: string;
}

interface TrainingProgram {
  id: number;
  program_name: string;
  description: string;
  program_type: string;
  duration_hours: number;
  session_count: number;
  total_participants: number;
}

interface QuickStats {
  totalSessions: number;
  totalPrograms: number;
  totalParticipants: number;
  confirmedParticipants: number;
  activeQrCodes: number;
  upcomingSessions: number;
  completedSessions: number;
  ongoingSessions: number;
}

interface FeedbackStats {
  total_feedback: number;
  positive_feedback: number;
  negative_feedback: number;
  average_rating: number;
  would_recommend: number;
  sessions_with_feedback: number;
}

interface RecentFeedback {
  id: number;
  overall_rating: number;
  comments: string;
  submission_time: string;
  is_anonymous: boolean;
  session_title: string;
  program_name: string;
}

function TrainingOverviewPageContent() {
  const { user } = useAuth();
  const { t } = useTrainingTranslation();
  const { isLoading, execute } = useAsyncOperation();
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [feedbackStats, setFeedbackStats] = useState<FeedbackStats>({
    total_feedback: 0,
    positive_feedback: 0,
    negative_feedback: 0,
    average_rating: 0,
    would_recommend: 0,
    sessions_with_feedback: 0
  });
  const [recentFeedback, setRecentFeedback] = useState<RecentFeedback[]>([]);
  const [stats, setStats] = useState<QuickStats>({
    totalSessions: 0,
    totalPrograms: 0,
    totalParticipants: 0,
    confirmedParticipants: 0,
    activeQrCodes: 0,
    upcomingSessions: 0,
    completedSessions: 0,
    ongoingSessions: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    await execute(async () => {
      // Fetch sessions, programs, and feedback in parallel
      const [sessionsResponse, programsResponse, feedbackResponse] = await Promise.all([
        fetch('/api/training/sessions', {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        }),
        fetch('/api/training/programs', {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        }),
        fetch('/api/training/feedback?stats=true', {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        })
      ]);

      if (sessionsResponse.ok && programsResponse.ok) {
        const sessionsData = await sessionsResponse.json();
        const programsData = await programsResponse.json();
        
        setSessions(sessionsData);
        setPrograms(programsData);

        // Handle feedback data
        if (feedbackResponse.ok) {
          const feedbackData = await feedbackResponse.json();
          setFeedbackStats(feedbackData.statistics || {
            total_feedback: 0,
            positive_feedback: 0,
            negative_feedback: 0,
            average_rating: 0,
            would_recommend: 0,
            sessions_with_feedback: 0
          });
          setRecentFeedback(feedbackData.recent_feedback || []);
        } else {
          console.warn('Failed to fetch feedback data:', await feedbackResponse.text());
          // Set default feedback stats if API fails
          setFeedbackStats({
            total_feedback: 0,
            positive_feedback: 0,
            negative_feedback: 0,
            average_rating: 0,
            would_recommend: 0,
            sessions_with_feedback: 0
          });
          setRecentFeedback([]);
        }

        // Calculate stats - ensure counts are numbers, not strings
        const totalParticipants = sessionsData.reduce((sum: number, session: TrainingSession) => {
          const count = session.participant_count;
          const numericCount = typeof count === 'string' ? parseInt(count, 10) : (count || 0);
          return sum + numericCount;
        }, 0);
        const confirmedParticipants = sessionsData.reduce((sum: number, session: TrainingSession) => {
          const count = session.confirmed_count;
          const numericCount = typeof count === 'string' ? parseInt(count, 10) : (count || 0);
          return sum + numericCount;
        }, 0);
        
        setStats({
          totalSessions: sessionsData.length,
          totalPrograms: programsData.length,
          totalParticipants,
          confirmedParticipants,
          activeQrCodes: 0, // This would need a separate API call
          upcomingSessions: sessionsData.filter((s: TrainingSession) => s.session_status === 'scheduled').length,
          completedSessions: sessionsData.filter((s: TrainingSession) => s.session_status === 'completed').length,
          ongoingSessions: sessionsData.filter((s: TrainingSession) => s.session_status === 'ongoing').length
        });
      } else {
        toast.error('Failed to fetch training data');
      }
      return true;
    }, {
      loadingMessage: 'Loading training overview...',
      minLoadingTime: 500
    });
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Please log in to access training management.</p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'active':
      case 'ongoing':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      'scheduled': 'bg-blue-100 text-blue-800',
      'ongoing': 'bg-yellow-100 text-yellow-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const canCreateSessions = ['admin', 'director', 'partner', 'coordinator'].includes(user.role);
  const canCreatePrograms = ['admin', 'director', 'partner'].includes(user.role);

  // Get recent sessions (last 5)
  const recentSessions = sessions
    .sort((a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime())
    .slice(0, 5);

  // Get upcoming sessions
  const upcomingSessions = sessions
    .filter(s => new Date(s.session_date) > new Date() && s.session_status === 'scheduled')
    .sort((a, b) => new Date(a.session_date).getTime() - new Date(b.session_date).getTime())
    .slice(0, 3);

  return (
    <PageLoader isLoading={isLoading} message={t.loading}>
      <div className="space-y-6">
        <TrainingBreadcrumb />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t.trainingManagement}</h1>
          <p className="text-muted-foreground mt-1">
            {t.overviewDescription}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <TrainingLanguageSwitcher />
          {/* <Badge className="bg-blue-100 text-blue-800" variant="secondary">
            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
          </Badge> */}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t.totalSessions}</p>
                <p className="text-2xl font-bold">{stats.totalSessions}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.upcomingSessions} {t.upcoming}
                </p>
              </div>
              <CalendarDays className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t.totalParticipants}</p>
                <p className="text-2xl font-bold">{stats.totalParticipants}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.confirmedParticipants} {t.confirmed}
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t.totalFeedback}</p>
                <p className="text-2xl font-bold">{feedbackStats.total_feedback}</p>
                <p className="text-xs text-muted-foreground">
                  {feedbackStats.positive_feedback} {t.positive}
                </p>
              </div>
              <MessageSquare className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t.avgRating}</p>
                <p className="text-2xl font-bold">
                  {feedbackStats.average_rating ? feedbackStats.average_rating.toFixed(1) : '0.0'}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  {feedbackStats.would_recommend} {t.recommend}
                </p>
              </div>
              <Star className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t.activePrograms}</p>
                <p className="text-2xl font-bold">{stats.totalPrograms}</p>
                <p className="text-xs text-muted-foreground">
                  {programs.reduce((sum, p) => sum + p.session_count, 0)} {t.sessions}
                </p>
              </div>
              <ClipboardList className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t.completionRate}</p>
                <p className="text-2xl font-bold">
                  {stats.totalSessions > 0 
                    ? Math.round((stats.completedSessions / stats.totalSessions) * 100)
                    : 0}%
                </p>
                <p className="text-xs text-muted-foreground">
                  {stats.completedSessions} {t.completed}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t.sessionsWithFeedback}</p>
                <p className="text-2xl font-bold">{feedbackStats.sessions_with_feedback}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.totalSessions > 0 
                    ? Math.round((feedbackStats.sessions_with_feedback / stats.totalSessions) * 100)
                    : 0}% {t.coverage}
                </p>
              </div>
              <Activity className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t.recommendationRate}</p>
                <p className="text-2xl font-bold">
                  {feedbackStats.total_feedback > 0 
                    ? Math.round((feedbackStats.would_recommend / feedbackStats.total_feedback) * 100)
                    : 0}%
                </p>
                <p className="text-xs text-muted-foreground">
                  {t.wouldRecommend}
                </p>
              </div>
              <ThumbsUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Training Management Navigation */}
      <Card>
        <CardHeader>
          <CardTitle>{t.trainingManagement}</CardTitle>
          <p className="text-sm text-muted-foreground">
            Access all training management functions from this centralized hub
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Primary Actions */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-muted-foreground">{t.primaryFunctions}</h3>
              
              <Link href="/training/sessions">
                <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold flex items-center gap-2">
                          <CalendarDays className="h-5 w-5 text-blue-600" />
                          {t.trainingSessions}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {t.sessionsDescription}
                        </p>
                        <div className="text-xs text-blue-600 mt-2">
                          {stats.totalSessions} {t.sessions} • {stats.upcomingSessions} {t.upcoming}
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/training/programs">
                <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold flex items-center gap-2">
                          <ClipboardList className="h-5 w-5 text-green-600" />
                          {t.trainingPrograms}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {t.programsDescription}
                        </p>
                        <div className="text-xs text-green-600 mt-2">
                          {stats.totalPrograms} {t.programs} available
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>

            {/* Secondary Actions */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-muted-foreground">{t.supportFunctions}</h3>
              
              <Link href="/training/participants">
                <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-purple-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold flex items-center gap-2">
                          <Users className="h-5 w-5 text-purple-600" />
                          {t.participants}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {t.participantsDescription}
                        </p>
                        <div className="text-xs text-purple-600 mt-2">
                          {stats.totalParticipants} {t.registered} • {stats.confirmedParticipants} {t.confirmed}
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/training/qr-codes">
                <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-orange-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold flex items-center gap-2">
                          <QrCode className="h-5 w-5 text-orange-600" />
                          {t.qrCodes}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {t.qrCodesDescription}
                        </p>
                        <div className="text-xs text-orange-600 mt-2">
                          Digital registration and tracking
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/training/feedback">
                <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold flex items-center gap-2">
                          <MessageSquare className="h-5 w-5 text-green-600" />
                          {t.trainingFeedback}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {t.feedbackDescription}
                        </p>
                        <div className="text-xs text-green-600 mt-2">
                          {feedbackStats.total_feedback} feedback • {feedbackStats.average_rating ? feedbackStats.average_rating.toFixed(1) : '0.0'} avg rating
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Sessions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t.upcomingSessions}</CardTitle>
              <Link href="/training/sessions">
                <Button variant="outline" size="sm">
                  {t.viewAll} <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">{t.loading}</p>
            ) : upcomingSessions.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">{t.noUpcomingSessions}</p>
                {canCreateSessions && (
                  <Link href="/training/sessions">
                    <Button className="mt-2" size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      {t.createSession}
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{session.session_title}</h4>
                      <p className="text-sm text-muted-foreground">{session.program_name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDate(session.session_date)}
                        <Clock className="h-3 w-3" />
                        {formatTime(session.session_time)}
                      </div>
                    </div>
                    <Badge className={getStatusBadge(session.session_status)} variant="secondary">
                      {session.session_status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Programs */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t.trainingPrograms}</CardTitle>
              <Link href="/training/programs">
                <Button variant="outline" size="sm">
                  {t.viewAll} <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">{t.loading}</p>
            ) : programs.length === 0 ? (
              <div className="text-center py-8">
                <ClipboardList className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">{t.noTrainingPrograms}</p>
                {canCreatePrograms && (
                  <Link href="/training/programs">
                    <Button className="mt-2" size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      {t.createProgram}
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {programs.slice(0, 3).map((program) => (
                  <div key={program.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{program.program_name}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {program.description || 'No description'}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span>{program.duration_hours}h {t.duration}</span>
                        <span>{program.session_count} sessions</span>
                        <span>{program.total_participants} participants</span>
                      </div>
                    </div>
                    <Badge variant="outline">{program.program_type}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Feedback */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t.recentFeedback}</CardTitle>
              <Link href="/training/feedback">
                <Button variant="outline" size="sm">
                  {t.viewAll} <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">{t.loading}</p>
            ) : recentFeedback.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">{t.noFeedback}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {t.feedbackWillAppear}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentFeedback.map((feedback) => (
                  <div key={feedback.id} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star}
                              className={`h-4 w-4 ${
                                star <= feedback.overall_rating 
                                  ? 'fill-yellow-400 text-yellow-400' 
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-medium">{feedback.overall_rating}/5</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(feedback.submission_time).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="font-medium text-sm">{feedback.session_title}</h4>
                    <p className="text-sm text-muted-foreground">{feedback.program_name}</p>
                    {feedback.comments && (
                      <p className="text-sm mt-2 line-clamp-2 text-gray-700">
                        "{feedback.comments}"
                      </p>
                    )}
                    {feedback.is_anonymous && (
                      <Badge variant="outline" className="mt-2 text-xs">
                        {t.anonymous}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Training Workflow Help */}
      <Card>
        <CardHeader>
          <CardTitle>{t.trainingWorkflow}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <Circle className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <h3 className="font-medium">1. {t.beforeTraining}</h3>
              <p className="text-sm text-muted-foreground">
                {t.beforeDescription}
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
              <h3 className="font-medium">2. {t.duringTraining}</h3>
              <p className="text-sm text-muted-foreground">
                {t.duringDescription}
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <h3 className="font-medium">3. {t.afterTraining}</h3>
              <p className="text-sm text-muted-foreground">
                {t.afterDescription}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </PageLoader>
  );
}

export default function TrainingOverviewPage() {
  return (
    <TrainingLocaleProvider>
      <div className="p-6">
        <TrainingOverviewPageContent />
      </div>
    </TrainingLocaleProvider>
  );
}