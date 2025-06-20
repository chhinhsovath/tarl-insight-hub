"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Star, 
  MessageSquare, 
  Camera,
  FileText,
  QrCode,
  UserCheck,
  TrendingUp,
  Activity,
  Edit,
  Eye,
  Download,
  Share2,
  Upload
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import { makeAuthenticatedRequest, handleApiResponse } from '@/lib/session-utils';
import { PhotoActivitiesManager } from '@/components/training/photo-activities-manager';
import { TrainingLocaleProvider } from '@/components/training-locale-provider';
import { useTrainingTranslation } from '@/lib/training-i18n';
import { ArrowLeft } from 'lucide-react';

interface SessionInfo {
  id: number;
  session_title: string;
  session_date: string;
  session_time: string;
  location: string;
  venue_address?: string;
  session_status: string;
  max_participants?: number;
  program_name: string;
  trainer_name: string;
  coordinator_name?: string;
  agenda?: string;
  notes?: string;
}

interface Statistics {
  registration: {
    total_registrations: number;
    confirmed_count: number;
    pending_count: number;
    cancelled_count: number;
  };
  attendance: {
    total_attendance: number;
    present_count: number;
    absent_count: number;
    late_count: number;
  };
  feedback: {
    total_feedback: number;
    average_rating: number;
    positive_feedback: number;
    negative_feedback: number;
  };
  engagePrograms: {
    total_programs: number;
    before_count: number;
    during_count: number;
    after_count: number;
    total_materials: number;
  };
  photoActivities: {
    total_photos: number;
    featured_count: number;
    public_count: number;
  };
}

interface RecentActivity {
  type: string;
  participant_name: string;
  created_at: string;
  action: string;
}

interface SessionOverview {
  session: SessionInfo;
  statistics: Statistics;
  recentActivities: RecentActivity[];
}

function SessionOverviewPageContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { t } = useTrainingTranslation();
  const sessionId = params.id as string;
  const [overview, setOverview] = useState<SessionOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && sessionId) {
      fetchSessionOverview();
    } else if (!authLoading && !user) {
      // Redirect to login if auth is loaded but no user found
      router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
    }
  }, [user, sessionId, authLoading, router]);

  const fetchSessionOverview = async () => {
    try {
      const response = await makeAuthenticatedRequest(`/api/training/sessions/${sessionId}/overview`);
      const data = await handleApiResponse<SessionOverview>(response);
      
      if (data) {
        setOverview(data);
      }
    } catch (error) {
      console.error('Error fetching session overview:', error);
      toast.error(t.failedToFetch || 'Failed to fetch session overview');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
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

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      'scheduled': 'bg-blue-100 text-blue-800',
      'ongoing': 'bg-yellow-100 text-yellow-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const generateQRLink = (type: string) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/training/session/${sessionId}/${type}`;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">
              {authLoading ? (t.checkingAuth || 'Checking authentication...') : (t.loadingOverview || 'Loading session overview...')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">{t.pleaseLogIn} {t.overview.toLowerCase()}.</p>
            <Button onClick={() => router.push('/login')}>
              {t.goToLogin || 'Go to Login'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-muted-foreground">{t.sessionNotFound || 'Session not found'}</p>
            <Button 
              className="mt-4" 
              onClick={() => router.push('/training/sessions')}
            >
              {t.backToSessions || 'Back to Sessions'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const { session, statistics, recentActivities } = overview;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header Section - Full Width */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="mb-4">
                <div className="flex items-center gap-4 mb-2">
                  <h1 className="text-4xl font-bold text-gray-900">{session.session_title}</h1>
                  <Badge className={getStatusBadge(session.session_status)} variant="secondary">
                    {(t as any)[session.session_status] || session.session_status}
                  </Badge>
                </div>
                <p className="text-xl text-gray-600">{session.program_name}</p>
              </div>
              
              <div className="flex flex-wrap gap-6 text-base">
                <div className="flex items-center gap-2 text-gray-700">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">{formatDate(session.session_date)}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Clock className="h-5 w-5 text-green-600" />
                  <span className="font-medium">{formatTime(session.session_time)}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <MapPin className="h-5 w-5 text-purple-600" />
                  <span className="font-medium">{session.location}</span>
                </div>
              </div>
              
              {session.trainer_name && (
                <div className="mt-4 text-base text-gray-600">
                  <span className="font-medium">{t.trainer}:</span> {session.trainer_name}
                  {session.coordinator_name && (
                    <span className="ml-6">
                      <span className="font-medium">{t.coordinator}:</span> {session.coordinator_name}
                    </span>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.back()}
                className="flex items-center gap-2 hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                {t.back}
              </Button>
              
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Full Width Container */}
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Action Buttons Row */}
        <div className="flex flex-wrap gap-4 mb-8">
          <Button 
            onClick={() => router.push(`/training/sessions/${sessionId}/edit`)}
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            {t.editSession}
          </Button>
          <Button 
            variant="outline"
            onClick={() => router.push(`/training/qr-codes?session=${sessionId}`)}
            className="flex items-center gap-2"
          >
            <QrCode className="h-4 w-4" />
            {t.qrCodes}
          </Button>
          <Button 
            variant="outline"
            onClick={() => router.push(`/training/sessions/${sessionId}/quick-register`)}
            className="flex items-center gap-2"
          >
            <UserCheck className="h-4 w-4" />
            Quick Register
          </Button>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t.registrations}</p>
                <p className="text-2xl font-bold">{statistics.registration.total_registrations || 0}</p>
                <p className="text-xs text-green-600">{statistics.registration.confirmed_count || 0} {t.confirmed}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t.attendance}</p>
                <p className="text-2xl font-bold">{statistics.attendance.present_count || 0}</p>
                <p className="text-xs text-green-600">
                  {statistics.attendance.total_attendance > 0 
                    ? Math.round((statistics.attendance.present_count / statistics.attendance.total_attendance) * 100)
                    : 0}% {t.present}
                </p>
              </div>
              <UserCheck className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t.feedback}</p>
                <p className="text-2xl font-bold">{statistics.feedback.total_feedback || 0}</p>
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 text-yellow-500" />
                  <p className="text-xs text-yellow-600">
                    {statistics.feedback.average_rating ? Number(statistics.feedback.average_rating).toFixed(1) : '0.0'}
                  </p>
                </div>
              </div>
              <MessageSquare className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t.materials}</p>
                <p className="text-2xl font-bold">{statistics.engagePrograms.total_materials || 0}</p>
                <p className="text-xs text-purple-600">{statistics.engagePrograms.total_programs || 0} {t.programs}</p>
              </div>
              <FileText className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t.photoActivities}</p>
                <p className="text-2xl font-bold">{statistics.photoActivities.total_photos || 0}</p>
                <p className="text-xs text-pink-600">{statistics.photoActivities.featured_count || 0} {t.featured}</p>
              </div>
              <Camera className="h-8 w-8 text-pink-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">{t.overview}</TabsTrigger>
          <TabsTrigger value="participants">{t.participants}</TabsTrigger>
          <TabsTrigger value="materials">{t.materials}</TabsTrigger>
          <TabsTrigger value="photos">{t.photoActivities}</TabsTrigger>
          <TabsTrigger value="feedback">{t.feedback}</TabsTrigger>
          <TabsTrigger value="qr-codes">{t.qrCodes}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Session Details */}
            <Card>
              <CardHeader>
                <CardTitle>{t.sessionInformation}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium">{t.agenda}</h4>
                  <div className="text-sm text-muted-foreground mt-1">
                    {session.agenda ? (
                      <div dangerouslySetInnerHTML={{ __html: session.agenda }} />
                    ) : (
                      <p>{t.noAgendaSet}</p>
                    )}
                  </div>
                </div>
                
                {session.notes && (
                  <div>
                    <h4 className="font-medium">{t.notes}</h4>
                    <div className="text-sm text-muted-foreground mt-1">
                      <div dangerouslySetInnerHTML={{ __html: session.notes }} />
                    </div>
                  </div>
                )}
                
                <div>
                  <h4 className="font-medium">{t.venueDetails}</h4>
                  <p className="text-sm text-muted-foreground">{session.location}</p>
                  {session.venue_address && (
                    <p className="text-sm text-muted-foreground">{session.venue_address}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  {t.recentActivities}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentActivities.length > 0 ? (
                  <div className="space-y-3">
                    {recentActivities.map((activity, index) => (
                      <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{activity.participant_name}</p>
                          <p className="text-xs text-muted-foreground">{activity.action}</p>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(activity.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{t.noRecentActivities}</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="participants">
          <Card>
            <CardHeader>
              <CardTitle>{t.participantManagement}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Button 
                  className="flex items-center gap-2"
                  onClick={() => router.push(`/training/participants?session=${sessionId}`)}
                >
                  <Users className="h-4 w-4" />
                  {t.viewAllParticipants}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => window.open(`/training/register?session=${sessionId}`, '_blank')}
                >
                  <Share2 className="h-4 w-4" />
                  {t.registrationPage}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => window.open(`/training/attendance?session=${sessionId}`, '_blank')}
                >
                  <UserCheck className="h-4 w-4" />
                  {t.attendancePage}
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">{t.registrationStatus}</h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>{t.totalRegistered}:</span>
                      <span className="font-medium">{statistics.registration.total_registrations || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t.confirmed}:</span>
                      <span className="font-medium text-green-600">{statistics.registration.confirmed_count || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t.pending}:</span>
                      <span className="font-medium text-yellow-600">{statistics.registration.pending_count || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t.cancelled}:</span>
                      <span className="font-medium text-red-600">{statistics.registration.cancelled_count || 0}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">{t.attendanceStatus}</h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>{t.totalChecked}:</span>
                      <span className="font-medium">{statistics.attendance.total_attendance || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t.present}:</span>
                      <span className="font-medium text-green-600">{statistics.attendance.present_count || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t.late}:</span>
                      <span className="font-medium text-yellow-600">{statistics.attendance.late_count || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t.absent}:</span>
                      <span className="font-medium text-red-600">{statistics.attendance.absent_count || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="materials">
          <Card>
            <CardHeader>
              <CardTitle>{t.trainingMaterials}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Button 
                  className="flex items-center gap-2"
                  onClick={() => router.push(`/training/materials?session=${sessionId}`)}
                >
                  <FileText className="h-4 w-4" />
                  {t.manageMaterials}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => window.open(generateQRLink('materials'), '_blank')}
                >
                  <Eye className="h-4 w-4" />
                  {t.publicMaterialsPage}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => router.push(`/training/qr-codes?session=${sessionId}`)}
                >
                  <QrCode className="h-4 w-4" />
                  {t.qrCodeForMaterials}
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{statistics.engagePrograms.before_count || 0}</p>
                  <p className="text-sm text-blue-600">{t.before}</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">{statistics.engagePrograms.during_count || 0}</p>
                  <p className="text-sm text-yellow-600">{t.during}</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{statistics.engagePrograms.after_count || 0}</p>
                  <p className="text-sm text-green-600">{t.after}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="photos">
          <PhotoActivitiesManager sessionId={parseInt(sessionId)} />
        </TabsContent>

        <TabsContent value="feedback">
          <Card>
            <CardHeader>
              <CardTitle>{t.feedbackOverview}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Star className="h-6 w-6 text-yellow-500" />
                      <p className="text-2xl font-bold">
                        {statistics.feedback.average_rating ? Number(statistics.feedback.average_rating).toFixed(1) : '0.0'}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">{t.averageRating}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>{t.totalResponses}:</span>
                      <span className="font-medium">{statistics.feedback.total_feedback || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t.positiveRating}:</span>
                      <span className="font-medium text-green-600">{statistics.feedback.positive_feedback || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t.negativeRating}:</span>
                      <span className="font-medium text-red-600">{statistics.feedback.negative_feedback || 0}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <Button 
                    className="w-full flex items-center gap-2"
                    onClick={() => router.push(`/training/feedback?session=${sessionId}`)}
                  >
                    <MessageSquare className="h-4 w-4" />
                    {t.viewAllFeedback}
                  </Button>
                  <Button 
                    variant="outline"
                    className="w-full"
                    onClick={() => window.open(`/training/public-feedback?session=${sessionId}`, '_blank')}
                  >
                    <Share2 className="h-4 w-4" />
                    {t.publicFeedbackPage}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="qr-codes">
          <Card>
            <CardHeader>
              <CardTitle>{t.qrCodeManagement}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <QrCode className="h-12 w-12 mx-auto mb-2 text-blue-600" />
                  <h4 className="font-medium">{t.qrCodeForRegistration}</h4>
                  <p className="text-xs text-muted-foreground mb-3">{t.forParticipantSignup}</p>
                  <Button size="sm" variant="outline" className="w-full">
                    {t.generateQr}
                  </Button>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <QrCode className="h-12 w-12 mx-auto mb-2 text-green-600" />
                  <h4 className="font-medium">{t.qrCodeForAttendance}</h4>
                  <p className="text-xs text-muted-foreground mb-3">{t.forCheckInCheckOut}</p>
                  <Button size="sm" variant="outline" className="w-full">
                    {t.generateQr}
                  </Button>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <QrCode className="h-12 w-12 mx-auto mb-2 text-purple-600" />
                  <h4 className="font-medium">{t.qrCodeForMaterials}</h4>
                  <p className="text-xs text-muted-foreground mb-3">{t.forAccessingResources}</p>
                  <Button size="sm" variant="outline" className="w-full">
                    {t.generateQr}
                  </Button>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <QrCode className="h-12 w-12 mx-auto mb-2 text-yellow-600" />
                  <h4 className="font-medium">{t.qrCodeForFeedback}</h4>
                  <p className="text-xs text-muted-foreground mb-3">{t.forSessionEvaluation}</p>
                  <Button size="sm" variant="outline" className="w-full">
                    {t.generateQr}
                  </Button>
                </div>
              </div>
              
              <div className="mt-6">
                <Button 
                  className="w-full"
                  onClick={() => router.push(`/training/qr-codes?session=${sessionId}`)}
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  {t.manageAllQrCodes}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}

export default function SessionOverviewPage() {
  return (
    <TrainingLocaleProvider>
      <SessionOverviewPageContent />
    </TrainingLocaleProvider>
  );
}