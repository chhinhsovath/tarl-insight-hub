"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft,
  Clock,
  Calendar,
  Users,
  Paperclip,
  Settings,
  Trash2,
  Plus,
  CalendarDays,
  MapPin,
  CheckCircle,
  Circle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import { TrainingBreadcrumb } from '@/components/training-breadcrumb';
import { TrainingLocaleProvider } from '@/components/training-locale-provider';
import { TrainingLanguageSwitcher } from '@/components/training-language-switcher';
import { useTrainingTranslation } from '@/lib/training-i18n';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import TrainingProgramForm from '@/components/training-program-form';

interface TrainingProgram {
  id: number;
  program_name: string;
  description: string;
  program_type: string;
  duration_hours: number;
  session_count: number;
  total_participants: number;
  materials_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by_name?: string;
}

interface TrainingSession {
  id: number;
  session_title: string;
  session_date: string;
  session_time: string;
  location: string;
  session_status: string;
  participant_count: number;
  confirmed_count: number;
  trainer_name: string;
}

function ProgramDetailPageContent() {
  const { user } = useAuth();
  const { t } = useTrainingTranslation();
  const params = useParams();
  const router = useRouter();
  const programId = params.id as string;

  const [program, setProgram] = useState<TrainingProgram | null>(null);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    programId: number;
    programName: string;
  }>({
    isOpen: false,
    programId: 0,
    programName: ''
  });

  useEffect(() => {
    fetchProgramDetails();
    fetchProgramSessions();
  }, [programId]);

  const fetchProgramDetails = async () => {
    try {
      const response = await fetch(`/api/training/programs?id=${programId}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProgram(data);
      } else if (response.status === 404) {
        toast.error(t.programNotFound || 'Program not found');
        router.push('/training/programs');
      } else {
        toast.error(t.failedToFetch || 'Failed to fetch program details');
      }
    } catch (error) {
      console.error('Error fetching program details:', error);
      toast.error(t.errorLoading || 'Error loading program');
    } finally {
      setLoading(false);
    }
  };

  const fetchProgramSessions = async () => {
    try {
      const response = await fetch(`/api/training/sessions?program_id=${programId}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSessions(Array.isArray(data) ? data : []);
      } else {
        console.warn('Failed to fetch program sessions');
        setSessions([]);
      }
    } catch (error) {
      console.error('Error fetching program sessions:', error);
      setSessions([]);
    }
  };

  const handleEditProgram = () => {
    setShowEditForm(true);
  };

  const handleEditSuccess = () => {
    setShowEditForm(false);
    fetchProgramDetails();
  };

  const handleEditCancel = () => {
    setShowEditForm(false);
  };

  const handleDeleteProgram = () => {
    if (program) {
      setDeleteDialog({
        isOpen: true,
        programId: program.id,
        programName: program.program_name
      });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({
      isOpen: false,
      programId: 0,
      programName: ''
    });
  };

  const handleDeleteConfirm = async () => {
    const { programId } = deleteDialog;

    try {
      const response = await fetch(`/api/training/programs?id=${programId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        toast.success(t.deleteSuccess || 'Program deleted successfully');
        router.push('/training/programs');
      } else {
        const error = await response.json();
        toast.error(error.error || t.deleteFailed || 'Failed to delete program');
      }
    } catch (error) {
      console.error('Error deleting program:', error);
      toast.error(t.deleteError || 'Error deleting program');
    }
  };

  const handleCreateSession = () => {
    router.push(`/training/sessions/new?program_id=${programId}`);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">{t.pleaseLogIn} {t.trainingPrograms.toLowerCase()}.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">{t.programNotFound || 'Program not found'}</p>
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

  const getProgramTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'standard': 'bg-blue-100 text-blue-800',
      'intensive': 'bg-red-100 text-red-800',
      'refresher': 'bg-green-100 text-green-800',
      'workshop': 'bg-purple-100 text-purple-800',
      'seminar': 'bg-yellow-100 text-yellow-800',
      'certification': 'bg-orange-100 text-orange-800',
      'orientation': 'bg-teal-100 text-teal-800',
      'specialized': 'bg-pink-100 text-pink-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
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

  const canManagePrograms = ['admin', 'director', 'partner'].includes(user.role);
  const canCreateSessions = ['admin', 'director', 'partner', 'coordinator'].includes(user.role);

  return (
    <div className="p-6 space-y-6">
      {/* <TrainingBreadcrumb /> */}
      {/* Header */}
      <div className="space-y-4">
        {/* Navigation Row */}
        
        
        {/* Title and Actions Row */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-2">
              <h1 className="text-3xl font-bold">{program.program_name}</h1>
              <Badge 
                className={getProgramTypeColor(program.program_type)} 
                variant="secondary"
              >
                {program.program_type}
              </Badge>
              {!program.is_active && (
                <Badge variant="secondary" className="bg-red-100 text-red-800">
                  {t.inactive}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              {program.description || t.noDescriptionAvailable}
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2 ml-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {t.back}
            </Button>
            
            {canManagePrograms && (
              <>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleEditProgram}
                  title={t.editProgram}
                >
                  <Settings className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleDeleteProgram}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  title={t.delete}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
          <div className="h-6 w-px bg-border" />
          <div className="flex items-center gap-4"><TrainingLanguageSwitcher /></div>
        </div>
      </div>

      {/* Program Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t.duration}</p>
                <p className="text-2xl font-bold">{program.duration_hours}{t.hour}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t.totalSessions}</p>
                <p className="text-2xl font-bold">{sessions.length}</p>
              </div>
              <CalendarDays className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t.totalParticipants}</p>
                <p className="text-2xl font-bold">{program.total_participants}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t.materials}</p>
                <p className="text-2xl font-bold">{program.materials_count || 0}</p>
              </div>
              <Paperclip className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Program Details */}
      <Card>
        <CardHeader>
          <CardTitle>{t.programDetails}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">{t.programType}</label>
                <p className="text-sm">{program.program_type}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">{t.totalDuration}</label>
                <p className="text-sm">{program.duration_hours} {t.hour}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">{t.status}</label>
                <p className="text-sm">{program.is_active ? t.active : t.inactive}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">{t.created}</label>
                <p className="text-sm">{formatDate(program.created_at)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">{t.updated}</label>
                <p className="text-sm">{formatDate(program.updated_at)}</p>
              </div>
              {program.created_by_name && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t.createdBy}</label>
                  <p className="text-sm">{program.created_by_name}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Training Sessions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t.trainingSessions} ({sessions.length})</CardTitle>
            {canCreateSessions && (
              <Button 
                size="sm"
                onClick={handleCreateSession}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                {t.createSession}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="text-center py-8">
              <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{t.noSessionsFound}</p>
              {canCreateSessions && (
                <Button 
                  className="mt-4" 
                  variant="outline"
                  onClick={handleCreateSession}
                >
                  {t.createFirstSession}
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
                        <h4 className="font-semibold text-lg">{session.session_title}</h4>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
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
                            <strong>{session.participant_count || 0}</strong> {t.participants}
                          </span>
                          <span className="text-sm">
                            <strong>{session.confirmed_count || 0}</strong> {t.confirmed}
                          </span>
                          {session.trainer_name && (
                            <span className="text-sm text-muted-foreground">
                              {t.trainer}: {session.trainer_name}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusBadge(session.session_status)} variant="secondary">
                          {session.session_status}
                        </Badge>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => router.push(`/training/sessions/${session.id}`)}
                        >
                          {t.viewDetails}
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

      {/* Edit Program Form Modal */}
      {showEditForm && (
        <TrainingProgramForm
          editingProgram={program}
          onSuccess={handleEditSuccess}
          onCancel={handleEditCancel}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.isOpen} onOpenChange={handleDeleteCancel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.deleteConfirmation}</DialogTitle>
            <DialogDescription>
              {t.deleteConfirmationText?.replace('{name}', deleteDialog.programName) || 
               `Are you sure you want to delete "${deleteDialog.programName}"? This action cannot be undone.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleDeleteCancel}>
              {t.cancel}
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              <Trash2 className="h-4 w-4 mr-1" />
              {t.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ProgramDetailPage() {
  return (
    <TrainingLocaleProvider>
      <ProgramDetailPageContent />
    </TrainingLocaleProvider>
  );
}