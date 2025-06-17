"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  CalendarDays, 
  Users, 
  QrCode, 
  Settings,
  Plus,
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  Circle,
  AlertCircle,
  Search,
  Filter,
  Trash2
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import { makeAuthenticatedRequest, handleApiResponse } from '@/lib/session-utils';
import { useRouter } from 'next/navigation';
import DeleteSessionDialog from '@/components/delete-session-dialog';
import { TrainingBreadcrumb } from '@/components/training-breadcrumb';

interface TrainingSession {
  id: number;
  session_title: string;
  session_date: string;
  session_time: string;
  location: string;
  venue_address?: string;
  session_status: string;
  participant_count: number;
  confirmed_count: number;
  max_participants?: number;
  program_name: string;
  trainer_name: string;
  coordinator_name?: string;
  before_status?: string;
  during_status?: string;
  after_status?: string;
  registration_deadline?: string;
}

export default function TrainingSessionsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [trainerFilter, setTrainerFilter] = useState('all');
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    sessionId: number;
    sessionTitle: string;
    participantCount: number;
  }>({
    isOpen: false,
    sessionId: 0,
    sessionTitle: '',
    participantCount: 0
  });

  useEffect(() => {
    // Only fetch sessions if user is available
    if (user) {
      fetchSessions();
    } else if (!loading) {
      // If no user and not loading, redirect to login
      window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
    }
  }, [user, loading]);

  useEffect(() => {
    filterSessions();
  }, [sessions, searchTerm, statusFilter, trainerFilter]);

  const fetchSessions = async () => {
    try {
      const response = await makeAuthenticatedRequest('/api/training/sessions');
      const data = await handleApiResponse<TrainingSession[]>(response);
      
      if (data) {
        setSessions(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to fetch training sessions');
      }
    } finally {
      setLoading(false);
    }
  };

  const filterSessions = () => {
    let filtered = sessions;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(session =>
        session.session_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.program_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (session.trainer_name && session.trainer_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(session => session.session_status === statusFilter);
    }

    // Trainer filter (role-based)
    if (trainerFilter !== 'all' && user?.role === 'teacher') {
      filtered = filtered.filter(session => session.trainer_name === user.full_name);
    }

    setFilteredSessions(filtered);
  };

  const handleCreateSession = () => {
    router.push('/training/sessions/new');
  };

  const handleEditSession = (session: TrainingSession) => {
    router.push(`/training/sessions/${session.id}/edit`);
  };

  const handleDeleteSession = (sessionId: number, sessionTitle: string, participantCount: number) => {
    setDeleteDialog({
      isOpen: true,
      sessionId,
      sessionTitle,
      participantCount
    });
  };

  const handleDeleteConfirm = async (forceDelete = false) => {
    try {
      const { sessionId } = deleteDialog;
      const url = forceDelete 
        ? `/api/training/sessions?id=${sessionId}&force=true`
        : `/api/training/sessions?id=${sessionId}`;

      const response = await makeAuthenticatedRequest(url, {
        method: 'DELETE'
      });

      const result = await handleApiResponse(response);
      
      if (result) {
        toast.success(result.message || 'Training session deleted successfully');
        fetchSessions(); // Refresh the list
        setDeleteDialog({ isOpen: false, sessionId: 0, sessionTitle: '', participantCount: 0 });
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to delete training session');
      }
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ isOpen: false, sessionId: 0, sessionTitle: '', participantCount: 0 });
  };

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login prompt if no user
  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Please log in to access training sessions.</p>
          <Button onClick={() => window.location.href = '/login'}>
            Go to Login
          </Button>
        </div>
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
  const uniqueStatuses = [...new Set(sessions.map(s => s.session_status))];

  return (
    <div className="p-6 space-y-6">
      <TrainingBreadcrumb />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Training Sessions</h1>
          <p className="text-muted-foreground mt-1">
            Manage and monitor training sessions
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge className="bg-blue-100 text-blue-800" variant="secondary">
            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
          </Badge>
          {canCreateSessions && (
            <Button 
              className="flex items-center gap-2"
              onClick={handleCreateSession}
            >
              <Plus className="h-4 w-4" />
              New Session
            </Button>
          )}
        </div>
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
                <p className="text-sm text-muted-foreground">Scheduled</p>
                <p className="text-2xl font-bold">
                  {sessions.filter(s => s.session_status === 'scheduled').length}
                </p>
              </div>
              <Circle className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ongoing</p>
                <p className="text-2xl font-bold">
                  {sessions.filter(s => s.session_status === 'ongoing').length}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">
                  {sessions.filter(s => s.session_status === 'completed').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search sessions, programs, locations, or trainers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {uniqueStatuses.map(status => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sessions List */}
      <Card>
        <CardHeader>
          <CardTitle>Training Sessions ({filteredSessions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading sessions...</p>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="text-center py-8">
              <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {sessions.length === 0 ? 'No training sessions found.' : 'No sessions match your filters.'}
              </p>
              {canCreateSessions && sessions.length === 0 && (
                <Button 
                  className="mt-4" 
                  variant="outline"
                  onClick={handleCreateSession}
                >
                  Create your first session
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSessions.map((session) => (
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
                              <span className={`text-sm ${session.participant_count > 0 ? 'font-medium' : ''}`}>
                                <strong className={session.participant_count > 0 ? 'text-blue-600' : ''}>{session.participant_count || 0}</strong> participants
                                {session.max_participants && ` / ${session.max_participants}`}
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
                        {canCreateSessions && (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditSession(session)}
                              title="Edit Session"
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDeleteSession(session.id, session.session_title, session.participant_count || 0)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Delete Session"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          title="QR Codes"
                          onClick={() => router.push(`/training/qr-codes?session=${session.id}`)}
                        >
                          <QrCode className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          title="Participants"
                          onClick={() => router.push(`/training/participants?session=${session.id}`)}
                        >
                          <Users className="h-4 w-4" />
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

      {/* Delete Session Dialog */}
      <DeleteSessionDialog
        isOpen={deleteDialog.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        sessionTitle={deleteDialog.sessionTitle}
        participantCount={deleteDialog.participantCount}
      />
    </div>
  );
}