"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Search, 
  Filter, 
  UserCheck, 
  UserX, 
  Clock,
  Mail,
  Phone,
  GraduationCap,
  Building
} from 'lucide-react';
import { toast } from 'sonner';

interface TrainingSession {
  id: number;
  session_title: string;
  session_date: string;
  session_time: string;
  location: string;
  program_name: string;
}

interface Participant {
  id: number;
  session_id: number;
  participant_name: string;
  participant_email: string;
  participant_phone?: string;
  participant_role?: string;
  school_name?: string;
  district?: string;
  province?: string;
  registration_status: string;
  attendance_confirmed: boolean;
  attendance_time?: string;
  created_at: string;
  session_title?: string;
  session_date?: string;
  program_name?: string;
}

interface ParticipantManagementProps {
  sessions: TrainingSession[];
}

export default function ParticipantManagement({ sessions }: ParticipantManagementProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSession, setSelectedSession] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchParticipants();
  }, [selectedSession, statusFilter]);

  const fetchParticipants = async () => {
    try {
      setLoading(true);
      let url = '/api/training/participants';
      const params = new URLSearchParams();
      
      if (selectedSession && selectedSession !== 'all') {
        params.append('session_id', selectedSession);
      }
      
      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setParticipants(data || []);
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

  const updateParticipantStatus = async (participantId: number, updates: any) => {
    try {
      const response = await fetch(`/api/training/participants?id=${participantId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
        credentials: 'include'
      });

      if (response.ok) {
        toast.success('Participant status updated successfully');
        fetchParticipants(); // Refresh the list
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update participant status');
      }
    } catch (error) {
      console.error('Error updating participant:', error);
      toast.error('Error updating participant status');
    }
  };

  const confirmAttendance = (participantId: number) => {
    updateParticipantStatus(participantId, { attendance_confirmed: true });
  };

  const unconfirmAttendance = (participantId: number) => {
    updateParticipantStatus(participantId, { attendance_confirmed: false });
  };

  const updateRegistrationStatus = (participantId: number, status: string) => {
    updateParticipantStatus(participantId, { registration_status: status });
  };

  const filteredParticipants = participants.filter(participant => {
    const matchesSearch = participant.participant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         participant.participant_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (participant.school_name && participant.school_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'confirmed') return matchesSearch && participant.attendance_confirmed;
    if (activeTab === 'unconfirmed') return matchesSearch && !participant.attendance_confirmed;
    if (activeTab === 'registered') return matchesSearch && participant.registration_status === 'registered';
    
    return matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      'registered': 'bg-blue-100 text-blue-800',
      'confirmed': 'bg-green-100 text-green-800',
      'attended': 'bg-purple-100 text-purple-800',
      'no_show': 'bg-red-100 text-red-800',
      'cancelled': 'bg-gray-100 text-gray-800'
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

  const stats = {
    total: participants.length,
    confirmed: participants.filter(p => p.attendance_confirmed).length,
    unconfirmed: participants.filter(p => !p.attendance_confirmed).length,
    registered: participants.filter(p => p.registration_status === 'registered').length
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Participants</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Confirmed</p>
                <p className="text-2xl font-bold">{stats.confirmed}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unconfirmed</p>
                <p className="text-2xl font-bold">{stats.unconfirmed}</p>
              </div>
              <UserX className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Registered</p>
                <p className="text-2xl font-bold">{stats.registered}</p>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search participants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Select value={selectedSession} onValueChange={setSelectedSession}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by session" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sessions</SelectItem>
              {sessions.map((session) => (
                <SelectItem key={session.id} value={session.id.toString()}>
                  {session.session_title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="registered">Registered</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="attended">Attended</SelectItem>
              <SelectItem value="no_show">No Show</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Participant Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
          <TabsTrigger value="confirmed">Confirmed ({stats.confirmed})</TabsTrigger>
          <TabsTrigger value="unconfirmed">Unconfirmed ({stats.unconfirmed})</TabsTrigger>
          <TabsTrigger value="registered">Registered ({stats.registered})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading participants...</p>
            </div>
          ) : filteredParticipants.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No participants found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredParticipants.map((participant) => (
                <Card key={participant.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-lg">{participant.participant_name}</h3>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
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
                            <Badge className={getStatusBadge(participant.registration_status)} variant="secondary">
                              {participant.registration_status}
                            </Badge>
                            {participant.attendance_confirmed && (
                              <Badge className="bg-green-100 text-green-800" variant="secondary">
                                Confirmed
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="font-medium mb-1">Session Details:</p>
                            <p>{participant.session_title}</p>
                            <p className="text-muted-foreground">{participant.program_name}</p>
                            {participant.session_date && (
                              <p className="text-muted-foreground">
                                {formatDate(participant.session_date)}
                              </p>
                            )}
                          </div>
                          
                          <div>
                            <p className="font-medium mb-1">Additional Info:</p>
                            {participant.participant_role && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <GraduationCap className="h-4 w-4" />
                                {participant.participant_role}
                              </div>
                            )}
                            {participant.school_name && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Building className="h-4 w-4" />
                                {participant.school_name}
                              </div>
                            )}
                            {participant.district && (
                              <p className="text-muted-foreground">
                                {participant.district}, {participant.province}
                              </p>
                            )}
                          </div>
                        </div>

                        {participant.attendance_time && (
                          <div className="mt-3 p-2 bg-green-50 rounded">
                            <p className="text-sm text-green-800">
                              <Clock className="h-4 w-4 inline mr-1" />
                              Attendance confirmed at {new Date(participant.attendance_time).toLocaleString()}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
                        {participant.attendance_confirmed ? (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => unconfirmAttendance(participant.id)}
                          >
                            <UserX className="h-4 w-4 mr-1" />
                            Unconfirm
                          </Button>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => confirmAttendance(participant.id)}
                          >
                            <UserCheck className="h-4 w-4 mr-1" />
                            Confirm
                          </Button>
                        )}
                        
                        <Select 
                          value={participant.registration_status}
                          onValueChange={(value) => updateRegistrationStatus(participant.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="registered">Registered</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="attended">Attended</SelectItem>
                            <SelectItem value="no_show">No Show</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}