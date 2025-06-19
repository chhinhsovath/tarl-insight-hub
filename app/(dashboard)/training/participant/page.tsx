"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar,
  Clock,
  MapPin,
  Users,
  Star,
  BookOpen,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Download,
  ExternalLink,
  User
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import { TrainingLocaleProvider } from '@/components/training-locale-provider';
import { TrainingLanguageSwitcher } from '@/components/training-language-switcher';
import { useTrainingTranslation } from '@/lib/training-i18n';

interface TrainingSession {
  id: number;
  session_title: string;
  session_date: string;
  session_time: string;
  location: string;
  session_status: string;
  program_name: string;
  trainer_name: string;
  registration_status: string;
  attendance_confirmed: boolean;
}

interface TrainingMaterial {
  id: number;
  material_name: string;
  material_type: 'file' | 'link';
  file_path?: string;
  external_url?: string;
  description?: string;
  session_id: number;
  session_title: string;
}

function ParticipantPortalContent() {
  const { user } = useAuth();
  const { t } = useTrainingTranslation();
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [materials, setMaterials] = useState<TrainingMaterial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchParticipantData();
    }
  }, [user]);

  const fetchParticipantData = async () => {
    try {
      setLoading(true);
      
      // Fetch participant's training sessions
      const sessionsResponse = await fetch('/api/training/participants/sessions', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (sessionsResponse.ok) {
        const sessionsData = await sessionsResponse.json();
        setSessions(Array.isArray(sessionsData) ? sessionsData : []);
      }
      
      // Fetch accessible materials
      const materialsResponse = await fetch('/api/training/participants/materials', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (materialsResponse.ok) {
        const materialsData = await materialsResponse.json();
        setMaterials(Array.isArray(materialsData) ? materialsData : []);
      }
      
    } catch (error) {
      console.error('Error fetching participant data:', error);
      toast.error('Failed to load training data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFeedback = (sessionId: number) => {
    // Navigate to feedback form
    window.location.href = `/training/sessions/${sessionId}/feedback/public`;
  };

  const handleViewMaterial = (material: TrainingMaterial) => {
    if (material.material_type === 'link' && material.external_url) {
      window.open(material.external_url, '_blank');
    } else if (material.material_type === 'file' && material.file_path) {
      // Handle file download
      window.open(`/api/training/materials/download/${material.id}`, '_blank');
    }
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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'scheduled': 'bg-blue-100 text-blue-800',
      'ongoing': 'bg-yellow-100 text-yellow-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">{t.pleaseLogIn}</p>
      </div>
    );
  }

  if (user.role !== 'participant') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Access denied. This portal is for training participants only.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Training Participant Portal</h1>
            <p className="text-muted-foreground mt-1">
              Welcome, {user.full_name}! Access your training sessions, materials, and provide feedback.
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <TrainingLanguageSwitcher />
          </div>
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
              <Calendar className="h-8 w-8 text-blue-600" />
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
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Materials</p>
                <p className="text-2xl font-bold">{materials.length}</p>
              </div>
              <BookOpen className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Confirmed</p>
                <p className="text-2xl font-bold">
                  {sessions.filter(s => s.attendance_confirmed).length}
                </p>
              </div>
              <Users className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* My Training Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>My Training Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading your training sessions...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                You haven't been registered for any training sessions yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <Card key={session.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg">{session.session_title}</h4>
                        <p className="text-sm text-muted-foreground mb-2">{session.program_name}</p>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
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
                        
                        <div className="flex items-center gap-4">
                          <Badge className={getStatusColor(session.session_status)} variant="secondary">
                            {session.session_status}
                          </Badge>
                          {session.attendance_confirmed && (
                            <Badge className="bg-green-100 text-green-800" variant="secondary">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Attendance Confirmed
                            </Badge>
                          )}
                          {session.trainer_name && (
                            <span className="text-sm text-muted-foreground">
                              Trainer: {session.trainer_name}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        {session.session_status === 'completed' && (
                          <Button 
                            size="sm"
                            onClick={() => handleSubmitFeedback(session.id)}
                            className="flex items-center gap-2"
                          >
                            <MessageSquare className="h-4 w-4" />
                            Submit Feedback
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Training Materials */}
      <Card>
        <CardHeader>
          <CardTitle>Training Materials</CardTitle>
        </CardHeader>
        <CardContent>
          {materials.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No training materials available yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {materials.map((material) => (
                <Card key={material.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {material.material_type === 'file' ? (
                          <BookOpen className="h-5 w-5 text-blue-600" />
                        ) : (
                          <ExternalLink className="h-5 w-5 text-green-600" />
                        )}
                        <h4 className="font-medium text-sm">{material.material_name}</h4>
                      </div>
                    </div>
                    
                    <p className="text-xs text-muted-foreground mb-2">
                      Session: {material.session_title}
                    </p>
                    
                    {material.description && (
                      <p className="text-xs text-gray-600 mb-3">{material.description}</p>
                    )}
                    
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full"
                      onClick={() => handleViewMaterial(material)}
                    >
                      {material.material_type === 'file' ? (
                        <>
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </>
                      ) : (
                        <>
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Open Link
                        </>
                      )}
                    </Button>
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

export default function ParticipantPortalPage() {
  return (
    <TrainingLocaleProvider>
      <ParticipantPortalContent />
    </TrainingLocaleProvider>
  );
}