"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  Calendar, 
  Clock, 
  MapPin, 
  Download, 
  Award, 
  TrendingUp,
  BookOpen,
  CheckCircle,
  XCircle,
  LogOut,
  Loader2,
  FileText,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import { useParticipantTranslation } from '@/lib/participant-i18n';
import { ParticipantLanguageSwitcher } from '@/components/participant-language-switcher';

interface ParticipantSession {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: string;
  organization: string;
  district: string;
  province: string;
  stats: {
    total_registrations: number;
    total_attended: number;
    attendance_rate: number;
    first_training_date: string;
    last_activity_date: string;
  };
}

interface TrainingRecord {
  id: number;
  session_title: string;
  session_date: string;
  session_time: string;
  location: string;
  program_name: string;
  attendance_status: string;
  registration_method: string;
  created_at: string;
  attendance_marked_at?: string;
  materials_available: boolean;
}

export default function ParticipantDashboard() {
  const { t } = useParticipantTranslation();
  const router = useRouter();
  const [participant, setParticipant] = useState<ParticipantSession | null>(null);
  const [trainings, setTrainings] = useState<TrainingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMaterials, setLoadingMaterials] = useState<number | null>(null);

  useEffect(() => {
    // Check if participant is logged in
    const sessionData = localStorage.getItem('participant-session');
    if (!sessionData) {
      router.push('/participant');
      return;
    }

    try {
      const session = JSON.parse(sessionData);
      console.log('Session data:', session);
      
      // Ensure stats object exists with default values
      const participantWithDefaults = {
        ...session,
        stats: session.stats || {
          total_registrations: 0,
          total_attended: 0,
          attendance_rate: 0,
          first_training_date: null,
          last_activity_date: null
        }
      };
      
      setParticipant(participantWithDefaults);
      fetchTrainingHistory(session.name, session.phone);
    } catch (error) {
      console.error('Invalid session data:', error);
      router.push('/participant');
    }
  }, [router]);

  const fetchTrainingHistory = async (name: string, phone: string) => {
    try {
      const response = await fetch('/api/participant/trainings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone })
      });

      if (response.ok) {
        const data = await response.json();
        setTrainings(data.trainings || []);
      } else {
        toast.error(t.failedToFetchTrainingHistory);
      }
    } catch (error) {
      console.error('Error fetching training history:', error);
      toast.error('Failed to load training history');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadMaterials = async (sessionId: number, sessionTitle: string) => {
    setLoadingMaterials(sessionId);
    try {
      const response = await fetch(`/api/participant/materials/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          participant_name: participant?.name,
          participant_phone: participant?.phone 
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${sessionTitle.replace(/\s+/g, '-')}-materials.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success(t.materialsDownloaded);
      } else {
        const error = await response.json();
        toast.error(error.error || t.failedDownloadMaterials);
      }
    } catch (error) {
      console.error('Error downloading materials:', error);
      toast.error(t.failedDownloadMaterials);
    } finally {
      setLoadingMaterials(null);
    }
  };

  const handleLogout = async () => {
    try {
      // Clear localStorage first
      localStorage.removeItem('participant-session');
      
      // Call logout API to clear server session
      await fetch('/api/auth/logout', { method: 'POST' });
      
      // Show success message
      toast.success(t.loggedOutSuccess);
      
      // Redirect to login page
      setTimeout(() => {
        router.push('/login');
      }, 100); // Small delay to ensure state is cleared
      
    } catch (error) {
      console.error('Logout error:', error);
      // Even if API fails, clear local data and redirect
      localStorage.removeItem('participant-session');
      router.push('/login');
    }
  };

  if (!participant) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const attendedTrainings = trainings.filter(t => t.attendance_status === 'attended');
  const upcomingTrainings = trainings.filter(t => 
    new Date(t.session_date) > new Date() && t.attendance_status === 'registered'
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t.welcomeBackName}, {participant.name}!
          </h1>
          <p className="text-gray-600 mt-1">
            {t.trackProgress}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <ParticipantLanguageSwitcher />
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            {t.logout}
          </Button>
        </div>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {t.profileInformation}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">{t.contact}</p>
              <p className="font-medium">{participant.phone}</p>
              {participant.email && <p className="text-sm text-gray-500">{participant.email}</p>}
            </div>
            <div>
              <p className="text-sm text-gray-600">{t.role}</p>
              <p className="font-medium">{participant.role || t.participant}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">{t.organization}</p>
              <p className="font-medium">{participant.organization || t.na}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">{t.location}</p>
              <p className="font-medium">
                {[participant.district, participant.province].filter(Boolean).join(', ') || t.na}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t.totalTrainings}</p>
                <p className="text-3xl font-bold">{participant.stats.total_registrations}</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t.attended}</p>
                <p className="text-3xl font-bold text-green-600">{participant.stats.total_attended}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t.attendanceRate}</p>
                <p className="text-3xl font-bold text-purple-600">{participant.stats.attendance_rate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t.materialsAvailable}</p>
                <p className="text-3xl font-bold text-orange-600">
                  {trainings.filter(t => t.materials_available).length}
                </p>
              </div>
              <FileText className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Training History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {t.trainingHistory}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">{t.loadingTrainingHistory}</span>
            </div>
          ) : trainings.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">{t.noTrainingRecords}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {trainings.map((training) => (
                <Card key={training.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-lg">{training.session_title}</h3>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={training.attendance_status === 'attended' ? 'default' : 'secondary'}
                              className={training.attendance_status === 'attended' ? 'bg-green-100 text-green-800' : ''}
                            >
                              {training.attendance_status === 'attended' ? (
                                <>
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  {t.attended}
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-3 w-3 mr-1" />
                                  {t.registered}
                                </>
                              )}
                            </Badge>
                            {training.materials_available && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownloadMaterials(training.id, training.session_title)}
                                disabled={loadingMaterials === training.id}
                              >
                                {loadingMaterials === training.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <Download className="h-4 w-4 mr-1" />
                                    {t.materials}
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {new Date(training.session_date).toLocaleDateString('en-US')}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {training.session_time}
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {training.location}
                          </div>
                        </div>

                        <div className="mt-2">
                          <span className="text-sm font-medium text-blue-600">
                            {training.program_name}
                          </span>
                          {training.attendance_marked_at && (
                            <p className="text-xs text-gray-500 mt-1">
                              {t.attendedOn}: {new Date(training.attendance_marked_at).toLocaleString('en-US')}
                            </p>
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

      {/* Quick Actions */}
      {upcomingTrainings.length > 0 && (
        <Alert>
          <Calendar className="h-4 w-4" />
          <AlertDescription>
            <strong>{t.upcomingTrainings}:</strong> You have {upcomingTrainings.length} upcoming training session(s). 
            {t.checkEmail}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}