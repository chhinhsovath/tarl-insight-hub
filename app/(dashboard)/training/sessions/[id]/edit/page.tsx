"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, ArrowLeft, Save, Loader2, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';
import { makeAuthenticatedRequest, handleApiResponse } from '@/lib/session-utils';
import DeleteSessionDialog from '@/components/delete-session-dialog';
import { EngageProgramsManager } from '@/components/training/engage-programs-manager';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { TrainingBreadcrumb } from '@/components/training-breadcrumb';
import { BackButton } from '@/components/ui/back-button';
import { TrainingLocaleProvider } from '@/components/training-locale-provider';
import { TrainingLanguageSwitcher } from '@/components/training-language-switcher';
import { useTrainingTranslation } from '@/lib/training-i18n';

interface TrainingProgram {
  id: number;
  program_name: string;
  description: string;
  program_type: string;
  duration_hours: number;
}

interface User {
  id: number;
  full_name: string;
  role: string;
}

interface TrainingSession {
  id: number;
  program_id: number;
  session_title: string;
  session_date: string;
  session_time: string;
  location: string;
  venue_address?: string;
  max_participants: number;
  trainer_id?: number;
  coordinator_id?: number;
  registration_deadline?: string;
  session_status: string;
  program_name: string;
  agenda?: string;
  notes?: string;
}

function EditTrainingSessionPageContent() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: authLoading } = useAuth();
  const { t } = useTrainingTranslation();
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [trainers, setTrainers] = useState<User[]>([]);
  const [coordinators, setCoordinators] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [session, setSession] = useState<TrainingSession | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [formData, setFormData] = useState({
    program_id: '',
    session_title: '',
    session_date: '',
    session_time: '',
    location: '',
    venue_address: '',
    max_participants: '50',
    trainer_id: 'none',
    coordinator_id: 'none',
    registration_deadline: '',
    session_status: 'scheduled',
    agenda: '',
    notes: ''
  });

  const sessionId = params.id as string;

  useEffect(() => {
    if (user && sessionId) {
      fetchSessionData();
      fetchPrograms();
      fetchUsers();
    } else if (!authLoading) {
      router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
    }
  }, [user, authLoading, sessionId, router]);

  const fetchSessionData = async () => {
    try {
      const response = await makeAuthenticatedRequest(`/api/training/sessions?id=${sessionId}`);
      const data = await handleApiResponse<TrainingSession[]>(response);
      
      if (data && data.length > 0) {
        const sessionData = data[0];
        setSession(sessionData);
        
        // Helper function to format date for input fields
        const formatDateForInput = (dateString: string | null | undefined): string => {
          if (!dateString) return '';
          try {
            // Handle different date formats and convert to YYYY-MM-DD
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '';
            return date.toISOString().split('T')[0];
          } catch (error) {
            console.error('Date formatting error:', error);
            return '';
          }
        };

        // Helper function to format time for input fields
        const formatTimeForInput = (timeString: string | null | undefined): string => {
          if (!timeString) return '';
          try {
            // If time is already in HH:MM format, return as is
            if (timeString.match(/^\d{2}:\d{2}$/)) {
              return timeString;
            }
            // If time includes seconds, remove them
            if (timeString.match(/^\d{2}:\d{2}:\d{2}/)) {
              return timeString.substring(0, 5);
            }
            // Try to parse as a full datetime and extract time
            const date = new Date(`2000-01-01T${timeString}`);
            if (!isNaN(date.getTime())) {
              return date.toTimeString().substring(0, 5);
            }
            return '';
          } catch (error) {
            console.error('Time formatting error:', error);
            return '';
          }
        };

        // Populate form with existing data
        setFormData({
          program_id: sessionData.program_id?.toString() || '',
          session_title: sessionData.session_title || '',
          session_date: formatDateForInput(sessionData.session_date),
          session_time: formatTimeForInput(sessionData.session_time),
          location: sessionData.location || '',
          venue_address: sessionData.venue_address || '',
          max_participants: sessionData.max_participants?.toString() || '50',
          trainer_id: sessionData.trainer_id?.toString() || 'none',
          coordinator_id: sessionData.coordinator_id?.toString() || 'none',
          registration_deadline: formatDateForInput(sessionData.registration_deadline),
          session_status: sessionData.session_status || 'scheduled',
          agenda: sessionData.agenda || '',
          notes: sessionData.notes || ''
        });
      } else {
        toast.error(t.sessionNotFound || 'Training session not found');
        router.push('/training/sessions');
      }
    } catch (error) {
      console.error('Error fetching session data:', error);
      toast.error(t.failedToFetch || 'Failed to load session data');
      router.push('/training/sessions');
    } finally {
      setSessionLoading(false);
    }
  };

  const fetchPrograms = async () => {
    try {
      const response = await makeAuthenticatedRequest('/api/training/programs');
      const data = await handleApiResponse<TrainingProgram[]>(response);
      
      if (data) {
        setPrograms(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching programs:', error);
      toast.error(t.fetchProgramsError || 'Failed to load training programs');
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await makeAuthenticatedRequest('/api/data/users');
      const data = await handleApiResponse<{users: User[]}>(response);
      
      if (data && data.users) {
        const users = data.users;
        setTrainers(users.filter((user: User) => ['admin', 'director', 'partner', 'coordinator', 'teacher'].includes(user.role)));
        setCoordinators(users.filter((user: User) => ['admin', 'director', 'partner', 'coordinator'].includes(user.role)));
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error(t.failedToFetch || 'Failed to load users');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === 'registration_deadline') {
      console.log('Registration deadline changed:', value);
    }
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.program_id || !formData.session_title || !formData.session_date || 
        !formData.session_time || !formData.location) {
      toast.error(t.fillRequiredFields || 'Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        program_id: parseInt(formData.program_id),
        session_title: formData.session_title,
        session_date: formData.session_date,
        session_time: formData.session_time,
        location: formData.location,
        venue_address: formData.venue_address || null,
        max_participants: parseInt(formData.max_participants) || 50,
        trainer_id: (formData.trainer_id && formData.trainer_id !== 'none') ? parseInt(formData.trainer_id) : null,
        coordinator_id: (formData.coordinator_id && formData.coordinator_id !== 'none') ? parseInt(formData.coordinator_id) : null,
        registration_deadline: formData.registration_deadline && formData.registration_deadline.trim() !== '' ? formData.registration_deadline : null,
        session_status: formData.session_status,
        agenda: formData.agenda || null,
        notes: formData.notes || null
      };

      console.log('Submitting form data:', formData);
      console.log('Submitting payload:', payload);

      const response = await makeAuthenticatedRequest(`/api/training/sessions?id=${sessionId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      const result = await handleApiResponse(response);
      
      if (result) {
        console.log('Update result:', result);
        toast.success(t.sessionUpdatedSuccess || 'Training session updated successfully!');
        router.push('/training/sessions');
      }
    } catch (error) {
      console.error('Error updating training session:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error(t.updateSessionError || 'Failed to update training session');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/training/sessions');
  };

  const handleDeleteSession = () => {
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async (forceDelete = false) => {
    try {
      const url = forceDelete 
        ? `/api/training/sessions?id=${sessionId}&force=true`
        : `/api/training/sessions?id=${sessionId}`;

      const response = await makeAuthenticatedRequest(url, {
        method: 'DELETE'
      });

      const result = await handleApiResponse(response);
      
      if (result) {
        toast.success(result.message || t.sessionDeletedSuccess || 'Training session deleted successfully');
        router.push('/training/sessions');
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error(t.deleteSessionError || 'Failed to delete training session');
      }
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false);
  };

  if (authLoading || sessionLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t.loadingSessions || 'Loading session data...'}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">{t.pleaseLogIn} {t.editSession.toLowerCase()}.</p>
          <Button onClick={() => router.push('/login')}>
            {t.goToLogin || 'Go to Login'}
          </Button>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">{t.sessionNotFound || 'Session not found'}.</p>
          <Button onClick={() => router.push('/training/sessions')}>
            {t.backToSessions || 'Back to Sessions'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* <TrainingBreadcrumb /> */}
      {/* Header */}
      <div className="space-y-4">
        {/* Navigation Row */}
        
        
        {/* Title and Actions Row */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{t.editSession}</h1>
            <p className="text-muted-foreground mt-1">
              {t.updateSessionDescription || 'Update session details and scheduling information'}
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2 ml-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleCancel}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {t.back}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => router.push(`/training/sessions/${sessionId}/overview`)}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              {t.overview || 'Overview'}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDeleteSession}
              className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              {t.deleteSession}
            </Button>
          </div>
          <div className="h-6 w-px bg-border" />
          <div className="flex items-center gap-4"><TrainingLanguageSwitcher /></div>
        </div>
      </div>

      {/* Session Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t.currentSession || 'Current Session'}: {session.session_title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium">{t.program || 'Program'}:</span> {session.program_name}
            </div>
            <div>
              <span className="font-medium">{t.date || 'Date'}:</span> {new Date(session.session_date).toLocaleDateString()}
            </div>
            <div>
              <span className="font-medium">{t.status || 'Status'}:</span> 
              <span className={`ml-2 px-2 py-1 rounded text-xs ${
                session.session_status === 'completed' ? 'bg-green-100 text-green-800' :
                session.session_status === 'ongoing' ? 'bg-yellow-100 text-yellow-800' :
                session.session_status === 'cancelled' ? 'bg-red-100 text-red-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {session.session_status}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t.updateSessionDetails || 'Update Session Details'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Program Selection */}
            <div className="space-y-2">
              <Label htmlFor="program_id">{t.trainingProgram || 'Training Program'} *</Label>
              <Select value={formData.program_id} onValueChange={(value) => handleInputChange('program_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t.selectProgram || 'Select a training program'} />
                </SelectTrigger>
                <SelectContent>
                  {programs.filter(program => program && program.id).map((program) => (
                    <SelectItem key={program.id} value={program.id.toString()}>
                      {program.program_name} ({program.program_type || 'standard'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Session Title */}
            <div className="space-y-2">
              <Label htmlFor="session_title">{t.sessionTitle || 'Session Title'} *</Label>
              <Input
                id="session_title"
                value={formData.session_title}
                onChange={(e) => handleInputChange('session_title', e.target.value)}
                placeholder={t.enterSessionTitle || 'Enter session title'}
                required
              />
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="session_date">{t.sessionDate || 'Session Date'} *</Label>
                <Input
                  id="session_date"
                  type="date"
                  value={formData.session_date}
                  onChange={(e) => handleInputChange('session_date', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="session_time">{t.sessionTime || 'Session Time'} *</Label>
                <Input
                  id="session_time"
                  type="time"
                  value={formData.session_time}
                  onChange={(e) => handleInputChange('session_time', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">{t.location || 'Location'} *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder={t.enterLocation || 'Enter location name'}
                required
              />
            </div>

            {/* Venue Address */}
            <div className="space-y-2">
              <Label htmlFor="venue_address">{t.venueAddress || 'Venue Address'}</Label>
              <Textarea
                id="venue_address"
                value={formData.venue_address}
                onChange={(e) => handleInputChange('venue_address', e.target.value)}
                placeholder={t.enterVenueAddress || 'Enter full venue address'}
                rows={2}
              />
            </div>

            {/* Session Agenda */}
            <div className="space-y-2">
              <Label htmlFor="agenda">{t.sessionAgenda || 'Session Agenda'}</Label>
              <RichTextEditor
                content={formData.agenda}
                onChange={(content) => handleInputChange('agenda', content)}
                placeholder={t.agendaPlaceholder || 'Create your session agenda with timing, activities, and breaks...'}
                minHeight="250px"
              />
            </div>

            {/* Additional Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">{t.additionalNotes || 'Additional Notes'}</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder={t.notesPlaceholder || 'Any additional information or notes for this session'}
                rows={3}
              />
            </div>

            {/* Max Participants and Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="max_participants">{t.maxParticipants || 'Maximum Participants'}</Label>
                <Input
                  id="max_participants"
                  type="number"
                  min="1"
                  max="1000"
                  value={formData.max_participants}
                  onChange={(e) => handleInputChange('max_participants', e.target.value)}
                  placeholder="50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="session_status">{t.sessionStatus || 'Session Status'}</Label>
                <Select value={formData.session_status} onValueChange={(value) => handleInputChange('session_status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.selectStatus || 'Select status'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">{t.scheduled}</SelectItem>
                    <SelectItem value="ongoing">{t.ongoing}</SelectItem>
                    <SelectItem value="completed">{t.completed}</SelectItem>
                    <SelectItem value="cancelled">{t.cancelled}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Trainer */}
            <div className="space-y-2">
              <Label htmlFor="trainer_id">{t.assignedTrainer || 'Assigned Trainer'}</Label>
              <Select value={formData.trainer_id} onValueChange={(value) => handleInputChange('trainer_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t.selectTrainer || 'Select a trainer (optional)'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t.noTrainerAssigned || 'No trainer assigned'}</SelectItem>
                  {trainers.filter(trainer => trainer && trainer.id).map((trainer) => (
                    <SelectItem key={trainer.id} value={trainer.id.toString()}>
                      {trainer.full_name} ({trainer.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Coordinator */}
            <div className="space-y-2">
              <Label htmlFor="coordinator_id">{t.assignedCoordinator || 'Assigned Coordinator'}</Label>
              <Select value={formData.coordinator_id} onValueChange={(value) => handleInputChange('coordinator_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t.selectCoordinator || 'Select a coordinator (optional)'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t.noCoordinatorAssigned || 'No coordinator assigned'}</SelectItem>
                  {coordinators.filter(coordinator => coordinator && coordinator.id).map((coordinator) => (
                    <SelectItem key={coordinator.id} value={coordinator.id.toString()}>
                      {coordinator.full_name} ({coordinator.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Registration Deadline */}
            <div className="space-y-2">
              <Label htmlFor="registration_deadline">{t.registrationDeadline || 'Registration Deadline'}</Label>
              <Input
                id="registration_deadline"
                type="date"
                value={formData.registration_deadline}
                onChange={(e) => handleInputChange('registration_deadline', e.target.value)}
              />
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t">
              <Button type="button" variant="outline" onClick={handleCancel}>
                {t.cancel}
              </Button>
              <Button type="submit" disabled={loading} className="flex items-center gap-2">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t.updating || 'Updating...'}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {t.updateSession || 'Update Session'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Engage Programs */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{t.engageProgramsMaterials || 'Engage Programs & Materials'}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {t.manageMaterialsDescription || 'Manage materials and resources for before, during, and after training stages'}
          </p>
        </CardHeader>
        <CardContent>
          <EngageProgramsManager 
            sessionId={parseInt(params.id as string)} 
            sessionTitle={session.session_title}
            isReadOnly={!['admin', 'director', 'partner', 'coordinator'].includes(user.role)}
          />
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <DeleteSessionDialog
        isOpen={showDeleteDialog}
        sessionTitle={session?.session_title || ''}
        participantCount={0}
        onConfirm={handleDeleteConfirm}
        onClose={handleDeleteCancel}
      />
    </div>
  );
}

export default function EditTrainingSessionPage() {
  return (
    <TrainingLocaleProvider>
      <EditTrainingSessionPageContent />
    </TrainingLocaleProvider>
  );
}