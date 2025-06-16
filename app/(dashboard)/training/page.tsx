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
  Activity
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import Link from 'next/link';

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

export default function TrainingOverviewPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
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
    try {
      // Fetch sessions and programs in parallel
      const [sessionsResponse, programsResponse] = await Promise.all([
        fetch('/api/training/sessions', {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        }),
        fetch('/api/training/programs', {
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

        // Calculate stats
        const totalParticipants = sessionsData.reduce((sum: number, session: TrainingSession) => 
          sum + (session.participant_count || 0), 0);
        const confirmedParticipants = sessionsData.reduce((sum: number, session: TrainingSession) => 
          sum + (session.confirmed_count || 0), 0);
        
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
    } catch (error) {
      console.error('Error fetching training data:', error);
      toast.error('Error loading training overview');
    } finally {
      setLoading(false);
    }
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
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Training Management</h1>
          <p className="text-muted-foreground mt-1">
            Overview of training programs, sessions, and participants
          </p>
        </div>
        <Badge className="bg-blue-100 text-blue-800" variant="secondary">
          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
        </Badge>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Sessions</p>
                <p className="text-2xl font-bold">{stats.totalSessions}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.upcomingSessions} upcoming
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
                <p className="text-sm text-muted-foreground">Active Programs</p>
                <p className="text-2xl font-bold">{stats.totalPrograms}</p>
                <p className="text-xs text-muted-foreground">
                  {programs.reduce((sum, p) => sum + p.session_count, 0)} total sessions
                </p>
              </div>
              <ClipboardList className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Participants</p>
                <p className="text-2xl font-bold">{stats.totalParticipants}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.confirmedParticipants} confirmed
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
                <p className="text-sm text-muted-foreground">Completion Rate</p>
                <p className="text-2xl font-bold">
                  {stats.totalSessions > 0 
                    ? Math.round((stats.completedSessions / stats.totalSessions) * 100)
                    : 0}%
                </p>
                <p className="text-xs text-muted-foreground">
                  {stats.completedSessions} completed
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Training Management Navigation */}
      <Card>
        <CardHeader>
          <CardTitle>Training Management</CardTitle>
          <p className="text-sm text-muted-foreground">
            Access all training management functions from this centralized hub
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Primary Actions */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-muted-foreground">Primary Functions</h3>
              
              <Link href="/training/sessions">
                <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold flex items-center gap-2">
                          <CalendarDays className="h-5 w-5 text-blue-600" />
                          Training Sessions
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Create, schedule, and manage training sessions
                        </p>
                        <div className="text-xs text-blue-600 mt-2">
                          {stats.totalSessions} sessions • {stats.upcomingSessions} upcoming
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
                          Training Programs
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Design and organize training curricula
                        </p>
                        <div className="text-xs text-green-600 mt-2">
                          {stats.totalPrograms} programs available
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
              <h3 className="text-lg font-semibold text-muted-foreground">Support Functions</h3>
              
              <Link href="/training/participants">
                <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-purple-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold flex items-center gap-2">
                          <Users className="h-5 w-5 text-purple-600" />
                          Participants
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Manage registrations and attendance
                        </p>
                        <div className="text-xs text-purple-600 mt-2">
                          {stats.totalParticipants} registered • {stats.confirmedParticipants} confirmed
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
                          QR Codes
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Generate codes for registration and feedback
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
              <CardTitle>Upcoming Sessions</CardTitle>
              <Link href="/training/sessions">
                <Button variant="outline" size="sm">
                  View All <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : upcomingSessions.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No upcoming sessions</p>
                {canCreateSessions && (
                  <Link href="/training/sessions">
                    <Button className="mt-2" size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Create Session
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
              <CardTitle>Training Programs</CardTitle>
              <Link href="/training/programs">
                <Button variant="outline" size="sm">
                  View All <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : programs.length === 0 ? (
              <div className="text-center py-8">
                <ClipboardList className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No training programs</p>
                {canCreatePrograms && (
                  <Link href="/training/programs">
                    <Button className="mt-2" size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Create Program
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
                        <span>{program.duration_hours}h duration</span>
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
      </div>

      {/* Training Workflow Help */}
      <Card>
        <CardHeader>
          <CardTitle>Training Management Workflow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <Circle className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <h3 className="font-medium">1. Before Training</h3>
              <p className="text-sm text-muted-foreground">
                Create programs and sessions, generate QR codes, send invitations
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
              <h3 className="font-medium">2. During Training</h3>
              <p className="text-sm text-muted-foreground">
                Confirm attendance, distribute materials, conduct session
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <h3 className="font-medium">3. After Training</h3>
              <p className="text-sm text-muted-foreground">
                Collect feedback, generate reports, follow up
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}