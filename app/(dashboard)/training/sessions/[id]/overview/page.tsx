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
import { TrainingBreadcrumb } from '@/components/training-breadcrumb';
import { PhotoActivitiesManager } from '@/components/training/photo-activities-manager';

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

export default function SessionOverviewPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
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
      toast.error('Failed to fetch session overview');
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
      <div className="p-6 space-y-6">
        <TrainingBreadcrumb />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">
              {authLoading ? 'Checking authentication...' : 'Loading session overview...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6 space-y-6">
        <TrainingBreadcrumb />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Please log in to access session overview.</p>
            <Button onClick={() => router.push('/login')}>
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="p-6 space-y-6">
        <TrainingBreadcrumb />
        <div className="text-center py-8">
          <p className="text-muted-foreground">Session not found</p>
          <Button 
            className="mt-4" 
            onClick={() => router.push('/training/sessions')}
          >
            Back to Sessions
          </Button>
        </div>
      </div>
    );
  }

  const { session, statistics, recentActivities } = overview;

  return (
    <div className="p-6 space-y-6">
      <TrainingBreadcrumb />
      
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-4">
            <div>
              <h1 className="text-3xl font-bold">{session.session_title}</h1>
              <p className="text-lg text-muted-foreground">{session.program_name}</p>
            </div>
            <Badge className={getStatusBadge(session.session_status)} variant="secondary">
              {session.session_status}
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span>{formatDate(session.session_date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span>{formatTime(session.session_time)}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-600" />
              <span>{session.location}</span>
            </div>
          </div>
          
          {session.trainer_name && (
            <p className="text-sm text-muted-foreground mt-2">
              Trainer: <span className="font-medium">{session.trainer_name}</span>
              {session.coordinator_name && (
                <span className="ml-4">Coordinator: <span className="font-medium">{session.coordinator_name}</span></span>
              )}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => router.push(`/training/sessions/${sessionId}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Session
          </Button>
          <Button 
            onClick={() => router.push(`/training/qr-codes?session=${sessionId}`)}
          >
            <QrCode className="h-4 w-4 mr-2" />
            QR Codes
          </Button>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Registrations</p>
                <p className="text-2xl font-bold">{statistics.registration.total_registrations || 0}</p>
                <p className="text-xs text-green-600">{statistics.registration.confirmed_count || 0} confirmed</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Attendance</p>
                <p className="text-2xl font-bold">{statistics.attendance.present_count || 0}</p>
                <p className="text-xs text-green-600">
                  {statistics.attendance.total_attendance > 0 
                    ? Math.round((statistics.attendance.present_count / statistics.attendance.total_attendance) * 100)
                    : 0}% present
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
                <p className="text-sm text-muted-foreground">Feedback</p>
                <p className="text-2xl font-bold">{statistics.feedback.total_feedback || 0}</p>
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 text-yellow-500" />
                  <p className="text-xs text-yellow-600">
                    {statistics.feedback.average_rating ? parseFloat(statistics.feedback.average_rating).toFixed(1) : '0.0'}
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
                <p className="text-sm text-muted-foreground">Materials</p>
                <p className="text-2xl font-bold">{statistics.engagePrograms.total_materials || 0}</p>
                <p className="text-xs text-purple-600">{statistics.engagePrograms.total_programs || 0} programs</p>
              </div>
              <FileText className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Photos</p>
                <p className="text-2xl font-bold">{statistics.photoActivities.total_photos || 0}</p>
                <p className="text-xs text-pink-600">{statistics.photoActivities.featured_count || 0} featured</p>
              </div>
              <Camera className="h-8 w-8 text-pink-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="participants">Participants</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="photos">Photo Activities</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="qr-codes">QR Codes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Session Details */}
            <Card>
              <CardHeader>
                <CardTitle>Session Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium">Agenda</h4>
                  <div className="text-sm text-muted-foreground mt-1">
                    {session.agenda ? (
                      <div dangerouslySetInnerHTML={{ __html: session.agenda }} />
                    ) : (
                      <p>No agenda set</p>
                    )}
                  </div>
                </div>
                
                {session.notes && (
                  <div>
                    <h4 className="font-medium">Notes</h4>
                    <div className="text-sm text-muted-foreground mt-1">
                      <div dangerouslySetInnerHTML={{ __html: session.notes }} />
                    </div>
                  </div>
                )}
                
                <div>
                  <h4 className="font-medium">Venue Details</h4>
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
                  Recent Activities
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
                  <p className="text-sm text-muted-foreground">No recent activities</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="participants">
          <Card>
            <CardHeader>
              <CardTitle>Participant Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Button 
                  className="flex items-center gap-2"
                  onClick={() => router.push(`/training/participants?session=${sessionId}`)}
                >
                  <Users className="h-4 w-4" />
                  View All Participants
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => router.push(`/training/session/${sessionId}/register`)}
                >
                  <Share2 className="h-4 w-4" />
                  Registration Page
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => router.push(`/training/session/${sessionId}/attendance`)}
                >
                  <UserCheck className="h-4 w-4" />
                  Attendance Page
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Registration Status</h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Total Registered:</span>
                      <span className="font-medium">{statistics.registration.total_registrations || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Confirmed:</span>
                      <span className="font-medium text-green-600">{statistics.registration.confirmed_count || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pending:</span>
                      <span className="font-medium text-yellow-600">{statistics.registration.pending_count || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cancelled:</span>
                      <span className="font-medium text-red-600">{statistics.registration.cancelled_count || 0}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Attendance Status</h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Total Checked:</span>
                      <span className="font-medium">{statistics.attendance.total_attendance || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Present:</span>
                      <span className="font-medium text-green-600">{statistics.attendance.present_count || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Late:</span>
                      <span className="font-medium text-yellow-600">{statistics.attendance.late_count || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Absent:</span>
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
              <CardTitle>Training Materials</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Button 
                  className="flex items-center gap-2"
                  onClick={() => router.push(`/training/materials?session=${sessionId}`)}
                >
                  <FileText className="h-4 w-4" />
                  Manage Materials
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => window.open(generateQRLink('materials'), '_blank')}
                >
                  <Eye className="h-4 w-4" />
                  Public Materials Page
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => router.push(`/training/qr-codes?session=${sessionId}`)}
                >
                  <QrCode className="h-4 w-4" />
                  QR Code for Materials
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{statistics.engagePrograms.before_count || 0}</p>
                  <p className="text-sm text-blue-600">Before Training</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">{statistics.engagePrograms.during_count || 0}</p>
                  <p className="text-sm text-yellow-600">During Training</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{statistics.engagePrograms.after_count || 0}</p>
                  <p className="text-sm text-green-600">After Training</p>
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
              <CardTitle>Feedback Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Star className="h-6 w-6 text-yellow-500" />
                      <p className="text-2xl font-bold">
                        {statistics.feedback.average_rating ? parseFloat(statistics.feedback.average_rating).toFixed(1) : '0.0'}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">Average Rating</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Responses:</span>
                      <span className="font-medium">{statistics.feedback.total_feedback || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Positive (4-5 stars):</span>
                      <span className="font-medium text-green-600">{statistics.feedback.positive_feedback || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Negative (1-2 stars):</span>
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
                    View All Feedback
                  </Button>
                  <Button 
                    variant="outline"
                    className="w-full"
                    onClick={() => window.open(generateQRLink('feedback'), '_blank')}
                  >
                    <Share2 className="h-4 w-4" />
                    Public Feedback Page
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="qr-codes">
          <Card>
            <CardHeader>
              <CardTitle>QR Code Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <QrCode className="h-12 w-12 mx-auto mb-2 text-blue-600" />
                  <h4 className="font-medium">Registration</h4>
                  <p className="text-xs text-muted-foreground mb-3">For participant signup</p>
                  <Button size="sm" variant="outline" className="w-full">
                    Generate QR
                  </Button>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <QrCode className="h-12 w-12 mx-auto mb-2 text-green-600" />
                  <h4 className="font-medium">Attendance</h4>
                  <p className="text-xs text-muted-foreground mb-3">For check-in/check-out</p>
                  <Button size="sm" variant="outline" className="w-full">
                    Generate QR
                  </Button>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <QrCode className="h-12 w-12 mx-auto mb-2 text-purple-600" />
                  <h4 className="font-medium">Materials</h4>
                  <p className="text-xs text-muted-foreground mb-3">For accessing resources</p>
                  <Button size="sm" variant="outline" className="w-full">
                    Generate QR
                  </Button>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <QrCode className="h-12 w-12 mx-auto mb-2 text-yellow-600" />
                  <h4 className="font-medium">Feedback</h4>
                  <p className="text-xs text-muted-foreground mb-3">For session evaluation</p>
                  <Button size="sm" variant="outline" className="w-full">
                    Generate QR
                  </Button>
                </div>
              </div>
              
              <div className="mt-6">
                <Button 
                  className="w-full"
                  onClick={() => router.push(`/training/qr-codes?session=${sessionId}`)}
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  Manage All QR Codes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}