"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserCheck, Calendar, Clock, MapPin, CheckCircle, AlertCircle, Users } from 'lucide-react';
import { toast } from 'sonner';

interface TrainingSession {
  id: number;
  session_title: string;
  session_date: string;
  session_time: string;
  location: string;
  program_name: string;
  trainer_name?: string;
}

interface Participant {
  id: number;
  participant_name: string;
  participant_email: string;
  participant_role?: string;
  school_name?: string;
  attendance_confirmed: boolean;
}

export default function AttendanceConfirmationPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session');
  const qrId = searchParams.get('qr');
  
  const [session, setSession] = useState<TrainingSession | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    if (sessionId) {
      fetchSessionAndParticipants();
    }
  }, [sessionId]);

  const fetchSessionAndParticipants = async () => {
    try {
      const [sessionResponse, participantsResponse] = await Promise.all([
        fetch(`/api/training/sessions?id=${sessionId}`),
        fetch(`/api/training/participants?session_id=${sessionId}`)
      ]);

      if (sessionResponse.ok) {
        const sessionData = await sessionResponse.json();
        if (sessionData.length > 0) {
          setSession(sessionData[0]);
        }
      }

      if (participantsResponse.ok) {
        const participantsData = await participantsResponse.json();
        setParticipants(participantsData || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error loading session information');
    } finally {
      setLoading(false);
    }
  };

  const toggleAttendance = async (participantId: number, currentStatus: boolean) => {
    setSubmitting(true);
    try {
      const response = await fetch(`/api/training/participants?id=${participantId}&public=true`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attendance_confirmed: !currentStatus
        })
      });

      if (response.ok) {
        // Update local state
        setParticipants(prev => prev.map(p => 
          p.id === participantId 
            ? { ...p, attendance_confirmed: !currentStatus }
            : p
        ));
        
        toast.success(`Attendance ${!currentStatus ? 'confirmed' : 'removed'}`);
        
        // Log QR code usage
        if (qrId) {
          await fetch(`/api/training/qr-codes?qr_id=${qrId}&session_id=${sessionId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              participant_id: participantId,
              action_type: 'attendance_update',
              user_agent: navigator.userAgent,
              scan_data: { attendance_confirmed: !currentStatus }
            })
          });
        }
      } else {
        toast.error('Failed to update attendance');
      }
    } catch (error) {
      console.error('Error updating attendance:', error);
      toast.error('Error updating attendance');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredParticipants = participants.filter(participant => {
    const matchesSearch = participant.participant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         participant.participant_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (participant.school_name && participant.school_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = filterStatus === 'all' ||
                         (filterStatus === 'confirmed' && participant.attendance_confirmed) ||
                         (filterStatus === 'unconfirmed' && !participant.attendance_confirmed);
    
    return matchesSearch && matchesFilter;
  });

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading attendance information...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Session Not Found</h2>
            <p className="text-gray-600">The training session could not be found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const confirmedCount = participants.filter(p => p.attendance_confirmed).length;
  const totalCount = participants.length;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="bg-green-600 rounded-full p-3 inline-flex mb-4">
            <UserCheck className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Confirmation</h1>
          <p className="text-gray-600 mt-1">Mark participant attendance</p>
        </div>

        {/* Session Info */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{session.session_title}</CardTitle>
            <p className="text-sm text-gray-600">{session.program_name}</p>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="h-4 w-4" />
                {formatDate(session.session_date)}
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="h-4 w-4" />
                {formatTime(session.session_time)}
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="h-4 w-4" />
                {session.location}
              </div>
              {session.trainer_name && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Users className="h-4 w-4" />
                  Trainer: {session.trainer_name}
                </div>
              )}
            </div>
            
            {/* Stats */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex justify-between items-center text-sm">
                <span className="text-blue-800">Attendance Status:</span>
                <span className="font-semibold text-blue-900">
                  {confirmedCount} of {totalCount} confirmed
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${totalCount > 0 ? (confirmedCount / totalCount) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search and Filter */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="search">Search Participants</Label>
                <Input
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, email, or school..."
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="filter">Filter by Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Participants</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="unconfirmed">Unconfirmed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Participants List */}
        <Card>
          <CardHeader>
            <CardTitle>Participants ({filteredParticipants.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredParticipants.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>No participants found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredParticipants.map((participant) => (
                  <div 
                    key={participant.id} 
                    className={`border rounded-lg p-4 transition-all ${
                      participant.attendance_confirmed 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {participant.participant_name}
                        </h3>
                        <p className="text-sm text-gray-600">{participant.participant_email}</p>
                        {participant.participant_role && (
                          <p className="text-xs text-gray-500 mt-1">
                            {participant.participant_role}
                            {participant.school_name && ` • ${participant.school_name}`}
                          </p>
                        )}
                      </div>
                      
                      <Button
                        onClick={() => toggleAttendance(participant.id, participant.attendance_confirmed)}
                        disabled={submitting}
                        variant={participant.attendance_confirmed ? "default" : "outline"}
                        size="sm"
                        className={
                          participant.attendance_confirmed 
                            ? "bg-green-600 hover:bg-green-700" 
                            : "border-green-600 text-green-600 hover:bg-green-50"
                        }
                      >
                        {participant.attendance_confirmed ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Present
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-4 w-4 mr-1" />
                            Mark Present
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-6">
          Tap on participants to confirm their attendance
        </p>
      </div>
    </div>
  );
}