"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CalendarDays, 
  Users, 
  QrCode, 
  ClipboardList, 
  Settings,
  Plus,
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  Circle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';

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

export default function TrainingManagementPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('sessions');
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
    fetchPrograms();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/training/sessions');
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      } else {
        toast.error('Failed to fetch training sessions');
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Error loading training sessions');
    } finally {
      setLoading(false);
    }
  };

  const fetchPrograms = async () => {
    try {
      const response = await fetch('/api/training/programs');
      if (response.ok) {
        const data = await response.json();
        setPrograms(data);
      } else {
        toast.error('Failed to fetch training programs');
      }
    } catch (error) {
      console.error('Error fetching programs:', error);
      toast.error('Error loading training programs');
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Please log in to access training management.</p>
      </div>
    );
  }

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

  const canCreateSessions = ['admin', 'director', 'partner', 'coordinator'].includes(user.role);
  const canCreatePrograms = ['admin', 'director', 'partner'].includes(user.role);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Training Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage training programs, sessions, and participants
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
                <p className="text-2xl font-bold">{sessions.length}</p>
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
                <p className="text-2xl font-bold">{programs.length}</p>
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
                <p className="text-2xl font-bold">
                  {sessions.reduce((sum, session) => sum + (session.participant_count || 0), 0)}
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
                <p className="text-sm text-muted-foreground">Confirmed Attendance</p>
                <p className="text-2xl font-bold">
                  {sessions.reduce((sum, session) => sum + (session.confirmed_count || 0), 0)}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl mx-auto">
          <TabsTrigger value="sessions" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Sessions
          </TabsTrigger>
          <TabsTrigger value="programs" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Programs
          </TabsTrigger>
          <TabsTrigger value="participants" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Participants
          </TabsTrigger>
          <TabsTrigger value="qr-codes" className="flex items-center gap-2">
            <QrCode className="h-4 w-4" />
            QR Codes
          </TabsTrigger>
        </TabsList>

        {/* Training Sessions Tab */}
        <TabsContent value="sessions" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Training Sessions</CardTitle>
                {canCreateSessions && (
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    New Session
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading sessions...</p>
                </div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No training sessions found.</p>
                  {canCreateSessions && (
                    <Button className="mt-4" variant="outline">
                      Create your first session
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {sessions.map((session) => (
                    <Card key={session.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-semibold text-lg">{session.session_title}</h3>
                                <p className="text-sm text-muted-foreground mb-2">{session.program_name}</p>
                                
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    {formatDate(session.session_date)}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    {formatTime(session.session_time)}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    {session.location}
                                  </div>
                                </div>

                                <div className="flex items-center gap-4 mt-2">
                                  <span className="text-sm">
                                    <strong>{session.participant_count || 0}</strong> participants
                                  </span>
                                  <span className="text-sm">
                                    <strong>{session.confirmed_count || 0}</strong> confirmed
                                  </span>
                                  {session.trainer_name && (
                                    <span className="text-sm text-muted-foreground">
                                      Trainer: {session.trainer_name}
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <Badge className={getStatusBadge(session.session_status)} variant="secondary">
                                {session.session_status}
                              </Badge>
                            </div>

                            {/* Three-Stage Flow Status */}
                            <div className="mt-4 pt-4 border-t">
                              <p className="text-sm font-medium mb-2">Training Flow Progress:</p>
                              <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                  {getStatusIcon(session.before_status || 'pending')}
                                  <span className="text-sm">Before</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {getStatusIcon(session.during_status || 'pending')}
                                  <span className="text-sm">During</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {getStatusIcon(session.after_status || 'pending')}
                                  <span className="text-sm">After</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 ml-4">
                            <Button variant="outline" size="sm">
                              <Settings className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <QrCode className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Training Programs Tab */}
        <TabsContent value="programs" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Training Programs</CardTitle>
                {canCreatePrograms && (
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    New Program
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {programs.length === 0 ? (
                <div className="text-center py-8">
                  <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No training programs found.</p>
                  {canCreatePrograms && (
                    <Button className="mt-4" variant="outline">
                      Create your first program
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {programs.map((program) => (
                    <Card key={program.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div>
                            <h3 className="font-semibold">{program.program_name}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {program.description || 'No description available'}
                            </p>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm">
                            <Badge variant="outline">{program.program_type}</Badge>
                            <span className="text-muted-foreground">{program.duration_hours}h</span>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm">
                            <span><strong>{program.session_count}</strong> sessions</span>
                            <span><strong>{program.total_participants}</strong> participants</span>
                          </div>
                          
                          <Button variant="outline" size="sm" className="w-full">
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Participants Tab */}
        <TabsContent value="participants" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Participant Management</CardTitle>
              <p className="text-sm text-muted-foreground">
                View and manage training participants across all sessions
              </p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Participant management interface coming soon.</p>
                <p className="text-sm text-muted-foreground mt-2">
                  This will include participant lists, attendance tracking, and bulk management features.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* QR Codes Tab */}
        <TabsContent value="qr-codes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>QR Code Management</CardTitle>
              <p className="text-sm text-muted-foreground">
                Generate and manage QR codes for registration, attendance, and feedback
              </p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <QrCode className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">QR code management interface coming soon.</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Generate QR codes for session registration, attendance confirmation, and feedback collection.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Help Section */}
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
                Create sessions, generate QR codes, send invitations
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