"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  Mail,
  Phone,
  School,
  Calendar,
  UserCheck,
  UserX,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import { TrainingBreadcrumb } from '@/components/training-breadcrumb';

interface TrainingParticipant {
  id: number;
  participant_name: string;
  participant_email: string;
  participant_phone?: string;
  participant_role?: string;
  school_name?: string;
  school_id?: number;
  district?: string;
  province?: string;
  registration_status: string;
  attendance_confirmed: boolean;
  attendance_time?: string;
  session_id: number;
  session_title: string;
  session_date: string;
  session_time: string;
  location: string;
  program_name: string;
  confirmed_by_name?: string;
  registration_method: string;
  created_at: string;
}

interface TrainingSession {
  id: number;
  session_title: string;
  session_date: string;
  program_name: string;
}

export default function TrainingParticipantsPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [participants, setParticipants] = useState<TrainingParticipant[]>([]);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [filteredParticipants, setFilteredParticipants] = useState<TrainingParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sessionFilter, setSessionFilter] = useState(searchParams.get('session') || 'all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchParticipants();
    fetchSessions();
  }, []);

  useEffect(() => {
    filterParticipants();
  }, [participants, searchTerm, sessionFilter, statusFilter]);

  const fetchParticipants = async () => {
    try {
      const response = await fetch('/api/training/participants', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      if (response.ok) {
        const data = await response.json();
        setParticipants(data);
      } else {
        toast.error('Failed to fetch participants');
      }
    } catch (error) {
      console.error('Error fetching participants:', error);
      toast.error('Error loading participants');
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/training/sessions', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const filterParticipants = () => {
    let filtered = participants;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(participant =>
        participant.participant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        participant.participant_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        participant.session_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        participant.program_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (participant.school_name && participant.school_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Session filter
    if (sessionFilter !== 'all') {
      filtered = filtered.filter(participant => participant.session_id.toString() === sessionFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'confirmed') {
        filtered = filtered.filter(participant => participant.attendance_confirmed);
      } else if (statusFilter === 'unconfirmed') {
        filtered = filtered.filter(participant => !participant.attendance_confirmed);
      } else {
        filtered = filtered.filter(participant => participant.registration_status === statusFilter);
      }
    }

    setFilteredParticipants(filtered);
  };

  const updateParticipantStatus = async (participantId: number, status: { attendance_confirmed?: boolean; registration_status?: string }) => {
    try {
      const response = await fetch(`/api/training/participants?id=${participantId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(status)
      });

      if (response.ok) {
        toast.success('Participant status updated successfully');
        fetchParticipants();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update participant status');
      }
    } catch (error) {
      console.error('Error updating participant:', error);
      toast.error('Error updating participant status');
    }
  };

  const handleConfirmAttendance = (participantId: number) => {
    updateParticipantStatus(participantId, { attendance_confirmed: true });
  };

  const handleUnconfirmAttendance = (participantId: number) => {
    updateParticipantStatus(participantId, { attendance_confirmed: false });
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Please log in to access participant management.</p>
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

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      'registered': 'bg-blue-100 text-blue-800',
      'confirmed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
      'pending': 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getRegistrationMethodBadge = (method: string) => {
    const colors: Record<string, string> = {
      'qr_code': 'bg-purple-100 text-purple-800',
      'manual': 'bg-orange-100 text-orange-800',
      'online': 'bg-green-100 text-green-800'
    };
    return colors[method] || 'bg-gray-100 text-gray-800';
  };

  const canManageParticipants = ['admin', 'director', 'partner', 'coordinator', 'teacher'].includes(user.role);

  const totalParticipants = participants.length;
  const confirmedParticipants = participants.filter(p => p.attendance_confirmed).length;
  const unconfirmedParticipants = totalParticipants - confirmedParticipants;
  const registeredParticipants = participants.filter(p => p.registration_status === 'registered').length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <TrainingBreadcrumb />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Training Participants</h1>
          <p className="text-muted-foreground mt-1">
            Manage participant registration and attendance
          </p>
          {searchParams.get('session') && (
            <p className="text-sm text-blue-600 mt-1">
              Showing participants for session ID: {searchParams.get('session')}
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          <Badge className="bg-blue-100 text-blue-800" variant="secondary">
            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
          </Badge>
          {searchParams.get('session') && (
            <Button 
              variant="outline"
              onClick={() => window.history.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Sessions
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
                <p className="text-sm text-muted-foreground">Total Participants</p>
                <p className="text-2xl font-bold">{totalParticipants}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Registered</p>
                <p className="text-2xl font-bold">{registeredParticipants}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Attendance Confirmed</p>
                <p className="text-2xl font-bold">{confirmedParticipants}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unconfirmed</p>
                <p className="text-2xl font-bold">{unconfirmedParticipants}</p>
              </div>
              <UserX className="h-8 w-8 text-orange-600" />
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
                  placeholder="Search participants by name, email, session, or school..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={sessionFilter} onValueChange={setSessionFilter}>
                <SelectTrigger className="w-[160px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Session" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sessions</SelectItem>
                  {sessions.map(session => (
                    <SelectItem key={session.id} value={session.id.toString()}>
                      {session.session_title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="registered">Registered</SelectItem>
                  <SelectItem value="confirmed">Attendance Confirmed</SelectItem>
                  <SelectItem value="unconfirmed">Unconfirmed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
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
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading participants...</p>
            </div>
          ) : filteredParticipants.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {participants.length === 0 ? 'No participants found.' : 'No participants match your filters.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredParticipants.map((participant) => (
                <Card key={participant.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-lg">{participant.participant_name}</h3>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Mail className="h-4 w-4" />
                                {participant.participant_email}
                              </div>
                              {participant.participant_phone && (
                                <div className="flex items-center gap-1">
                                  <Phone className="h-4 w-4" />
                                  {participant.participant_phone}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Badge 
                              className={getStatusBadge(participant.registration_status)} 
                              variant="secondary"
                            >
                              {participant.registration_status}
                            </Badge>
                            {participant.attendance_confirmed ? (
                              <Badge className="bg-green-100 text-green-800" variant="secondary">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Confirmed
                              </Badge>
                            ) : (
                              <Badge className="bg-yellow-100 text-yellow-800" variant="secondary">
                                <Clock className="h-3 w-3 mr-1" />
                                Unconfirmed
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="font-medium mb-1">Session Details:</p>
                            <div className="space-y-1 text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {participant.session_title}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {formatDate(participant.session_date)} at {formatTime(participant.session_time)}
                              </div>
                              <div>Program: {participant.program_name}</div>
                              <div>Location: {participant.location}</div>
                            </div>
                          </div>
                          
                          <div>
                            <p className="font-medium mb-1">Registration Info:</p>
                            <div className="space-y-1 text-muted-foreground">
                              {participant.school_name && (
                                <div className="flex items-center gap-1">
                                  <School className="h-4 w-4" />
                                  {participant.school_name}
                                </div>
                              )}
                              {participant.participant_role && (
                                <div>Role: {participant.participant_role}</div>
                              )}
                              <div className="flex items-center gap-2">
                                <span>Method:</span>
                                <Badge 
                                  className={getRegistrationMethodBadge(participant.registration_method)} 
                                  variant="outline"
                                  size="sm"
                                >
                                  {participant.registration_method.replace('_', ' ')}
                                </Badge>
                              </div>
                              <div>Registered: {formatDate(participant.created_at)}</div>
                              {participant.attendance_time && (
                                <div>Confirmed: {formatDate(participant.attendance_time)}</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {canManageParticipants && (
                        <div className="flex items-center gap-2 ml-4">
                          {participant.attendance_confirmed ? (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleUnconfirmAttendance(participant.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Unconfirm
                            </Button>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleConfirmAttendance(participant.id)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Confirm
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
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