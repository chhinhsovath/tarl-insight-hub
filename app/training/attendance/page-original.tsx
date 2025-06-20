"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  UserCheck, 
  Calendar, 
  Clock, 
  MapPin, 
  CheckCircle, 
  AlertCircle, 
  Users,
  UserPlus,
  Search,
  User,
  Mail,
  Phone,
  Building,
  Award,
  History,
  Loader2,
  ClipboardList,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';

interface TrainingSession {
  id: number;
  session_title: string;
  session_date: string;
  session_time: string;
  location: string;
  venue_address?: string;
  program_name: string;
  program_description?: string;
  capacity: number;
  current_registrations: number;
  current_attendance: number;
  is_registration_open: boolean;
  is_session_started: boolean;
  spots_available: number | null;
}

interface Registration {
  id: number;
  participant_name: string;
  participant_email: string;
  participant_phone?: string;
  participant_role?: string;
  school_name?: string;
  district?: string;
  province?: string;
  attendance_status: string;
  registration_method: string;
  created_at: string;
  attendance_marked_at?: string;
}

interface ParticipantProfile {
  id: number;
  email: string;
  full_name: string;
  phone?: string;
  role?: string;
  organization?: string;
  district?: string;
  province?: string;
  total_sessions_registered: number;
  total_sessions_attended: number;
  attendance_rate: number;
  last_training_date?: string;
  first_training_date?: string;
}

function AttendancePageContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session');
  const qrId = searchParams.get('qr');
  
  const [session, setSession] = useState<TrainingSession | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'attendance' | 'walkin'>('attendance');
  
  // Attendance tab states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filteredRegistrations, setFilteredRegistrations] = useState<Registration[]>([]);
  
  // Walk-in tab states
  const [searchingParticipant, setSearchingParticipant] = useState(false);
  const [participantSearchTerm, setParticipantSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<ParticipantProfile[]>([]);
  const [selectedParticipant, setSelectedParticipant] = useState<ParticipantProfile | null>(null);
  const [activeMode, setActiveMode] = useState<'new' | 'existing'>('new');
  
  // Walk-in form data
  const [formData, setFormData] = useState({
    participant_name: '',
    participant_email: '',
    participant_phone: '',
    participant_role: '',
    school_name: '',
    district: '',
    province: ''
  });

  useEffect(() => {
    if (sessionId) {
      fetchSession();
      fetchRegistrations();
    }

    // Check if redirected from registration (hash fragment)
    if (typeof window !== 'undefined' && window.location.hash === '#walkin') {
      setActiveTab('walkin');
    }
  }, [sessionId]);

  useEffect(() => {
    filterRegistrationsList();
  }, [registrations, searchTerm, filterStatus]);

  const fetchSession = async () => {
    try {
      const response = await fetch(`/api/training/sessions/public/${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setSession(data);
      } else {
        toast.error('Session not found');
      }
    } catch (error) {
      console.error('Error fetching session:', error);
      toast.error('Failed to load session details');
    }
  };

  const fetchRegistrations = async () => {
    try {
      const response = await fetch(`/api/training/sessions/${sessionId}/registrations`);
      if (response.ok) {
        const data = await response.json();
        setRegistrations(data || []);
      } else if (response.status === 401) {
        // For public access, we might not have registration data
        setRegistrations([]);
      }
    } catch (error) {
      console.error('Error fetching registrations:', error);
      setRegistrations([]);
    } finally {
      setLoading(false);
    }
  };

  const filterRegistrationsList = () => {
    let filtered = registrations;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(reg =>
        reg.participant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.participant_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (reg.school_name && reg.school_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(reg => reg.attendance_status === filterStatus);
    }

    setFilteredRegistrations(filtered);
  };

  const markAttendance = async (registrationId: number) => {
    setSubmitting(true);
    try {
      const response = await fetch(`/api/training/sessions/${sessionId}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          registration_id: registrationId,
          qr_id: qrId 
        })
      });

      if (response.ok) {
        toast.success('Attendance marked successfully');
        fetchRegistrations(); // Refresh the list
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to mark attendance');
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast.error('Failed to mark attendance');
    } finally {
      setSubmitting(false);
    }
  };

  const searchParticipants = async () => {
    if (!participantSearchTerm.trim() || participantSearchTerm.length < 2) {
      toast.error('Please enter at least 2 characters to search');
      return;
    }

    setSearchingParticipant(true);
    try {
      const response = await fetch(`/api/training/participants/search?query=${encodeURIComponent(participantSearchTerm)}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.participants || []);
        
        if (data.participants.length === 0) {
          toast.info('No existing participants found. You can register as new.');
        } else {
          toast.success(`Found ${data.participants.length} existing participant(s)`);
        }
      } else {
        toast.error('Failed to search participants');
      }
    } catch (error) {
      console.error('Error searching participants:', error);
      toast.error('Failed to search participants');
    } finally {
      setSearchingParticipant(false);
    }
  };

  const selectExistingParticipant = (participant: ParticipantProfile) => {
    setSelectedParticipant(participant);
    setFormData({
      participant_name: participant.full_name,
      participant_email: participant.email,
      participant_phone: participant.phone || '',
      participant_role: participant.role || '',
      school_name: participant.organization || '',
      district: participant.district || '',
      province: participant.province || ''
    });
    setActiveMode('existing');
    toast.success(`Selected ${participant.full_name} - information pre-filled!`);
  };

  const handleWalkInSubmit = async () => {
    if (!formData.participant_name || !formData.participant_email) {
      toast.error('Name and email are required');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/training/sessions/${sessionId}/universal-attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          qr_id: qrId,
          master_participant_id: selectedParticipant?.id,
          action: 'mark_attendance'
        })
      });

      if (response.ok) {
        toast.success('✅ Walk-in attendance marked successfully!');
        resetForm();
        fetchSession();
        fetchRegistrations();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to mark walk-in attendance');
      }
    } catch (error) {
      console.error('Error marking walk-in attendance:', error);
      toast.error('Failed to mark walk-in attendance');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      participant_name: '',
      participant_email: '',
      participant_phone: '',
      participant_role: '',
      school_name: '',
      district: '',
      province: ''
    });
    setSelectedParticipant(null);
    setParticipantSearchTerm('');
    setSearchResults([]);
    setActiveMode('new');
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading session information...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Training session not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  const attendedCount = registrations.filter(r => r.attendance_status === 'attended').length;
  const registeredCount = registrations.filter(r => r.attendance_status === 'registered').length;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="bg-green-600 rounded-full p-3 inline-flex mb-4">
            <UserCheck className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Training Attendance</h1>
          <p className="text-gray-600 mt-1">Mark attendance for training participants</p>
        </div>

        {/* Session Info */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h2 className="font-semibold text-lg text-blue-900 mb-2">{session.session_title}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2 text-blue-700">
                  <Calendar className="h-4 w-4" />
                  {new Date(session.session_date).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2 text-blue-700">
                  <Clock className="h-4 w-4" />
                  {session.session_time}
                </div>
                <div className="flex items-center gap-2 text-blue-700">
                  <MapPin className="h-4 w-4" />
                  {session.location}
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-blue-900 font-medium">{session.program_name}</span>
                <div className="flex gap-2">
                  <Badge variant="secondary">
                    {registrations.length} registered
                  </Badge>
                  <Badge variant={attendedCount >= session.capacity ? "destructive" : "default"}>
                    {attendedCount} / {session.capacity} attended
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance Management</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'attendance' | 'walkin')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="attendance">
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Mark Attendance ({registrations.length})
                </TabsTrigger>
                <TabsTrigger value="walkin">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Walk-in Registration
                </TabsTrigger>
              </TabsList>

              {/* Attendance Tab */}
              <TabsContent value="attendance" className="space-y-4">
                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search by name, email, or school..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[180px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Participants</SelectItem>
                      <SelectItem value="registered">Not Attended</SelectItem>
                      <SelectItem value="attended">Attended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-sm text-gray-600">Total Registered</p>
                      <p className="text-2xl font-bold">{registrations.length}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-sm text-gray-600">Attended</p>
                      <p className="text-2xl font-bold text-green-600">{attendedCount}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-sm text-gray-600">Not Attended</p>
                      <p className="text-2xl font-bold text-orange-600">{registeredCount}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Participants List */}
                <div className="space-y-3">
                  {filteredRegistrations.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-600">
                        {registrations.length === 0 
                          ? 'No registrations found for this session'
                          : 'No participants match your search criteria'
                        }
                      </p>
                    </div>
                  ) : (
                    filteredRegistrations.map((registration) => (
                      <Card key={registration.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${
                                  registration.attendance_status === 'attended' 
                                    ? 'bg-green-100' 
                                    : 'bg-gray-100'
                                }`}>
                                  <User className={`h-4 w-4 ${
                                    registration.attendance_status === 'attended'
                                      ? 'text-green-600'
                                      : 'text-gray-600'
                                  }`} />
                                </div>
                                <div>
                                  <h4 className="font-semibold">{registration.participant_name}</h4>
                                  <div className="flex items-center gap-4 text-sm text-gray-600">
                                    <span className="flex items-center gap-1">
                                      <Mail className="h-3 w-3" />
                                      {registration.participant_email}
                                    </span>
                                    {registration.participant_phone && (
                                      <span className="flex items-center gap-1">
                                        <Phone className="h-3 w-3" />
                                        {registration.participant_phone}
                                      </span>
                                    )}
                                  </div>
                                  {registration.school_name && (
                                    <p className="text-sm text-gray-600 mt-1">
                                      <Building className="h-3 w-3 inline mr-1" />
                                      {registration.school_name}
                                      {registration.district && ` • ${registration.district}`}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {registration.attendance_status === 'attended' ? (
                                <div className="text-right">
                                  <Badge className="bg-green-100 text-green-800" variant="secondary">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Attended
                                  </Badge>
                                  {registration.attendance_marked_at && (
                                    <p className="text-xs text-gray-500 mt-1">
                                      {new Date(registration.attendance_marked_at).toLocaleTimeString()}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <Button
                                  onClick={() => markAttendance(registration.id)}
                                  disabled={submitting}
                                  size="sm"
                                >
                                  {submitting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <CheckCircle className="h-4 w-4 mr-1" />
                                      Mark Present
                                    </>
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>

              {/* Walk-in Tab */}
              <TabsContent value="walkin" className="space-y-4">
                <Alert>
                  <UserPlus className="h-4 w-4" />
                  <AlertDescription>
                    Register walk-in participants who haven't pre-registered for this session
                  </AlertDescription>
                </Alert>

                <Tabs value={activeMode} onValueChange={(value) => setActiveMode(value as 'new' | 'existing')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="existing">Search Existing Participant</TabsTrigger>
                    <TabsTrigger value="new">New Participant</TabsTrigger>
                  </TabsList>

                  <TabsContent value="existing">
                    {/* Search Existing Participants */}
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Label htmlFor="search">Search by Name, Email, or Phone</Label>
                          <Input
                            id="search"
                            placeholder="Enter name, email, or phone number..."
                            value={participantSearchTerm}
                            onChange={(e) => setParticipantSearchTerm(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && searchParticipants()}
                          />
                        </div>
                        <div className="flex items-end">
                          <Button 
                            onClick={searchParticipants}
                            disabled={searchingParticipant || !participantSearchTerm.trim()}
                          >
                            {searchingParticipant ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Search className="h-4 w-4" />
                            )}
                            Search
                          </Button>
                        </div>
                      </div>

                      {/* Search Results */}
                      {searchResults.length > 0 && (
                        <div className="space-y-3">
                          <h3 className="font-medium">Found Participants:</h3>
                          {searchResults.map((participant) => (
                            <Card 
                              key={participant.id} 
                              className={`cursor-pointer border-2 transition-colors ${
                                selectedParticipant?.id === participant.id 
                                  ? 'border-blue-500 bg-blue-50' 
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                              onClick={() => selectExistingParticipant(participant)}
                            >
                              <CardContent className="p-4">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h4 className="font-semibold">{participant.full_name}</h4>
                                    <p className="text-sm text-gray-600">{participant.email}</p>
                                    {participant.phone && (
                                      <p className="text-sm text-gray-600">{participant.phone}</p>
                                    )}
                                    {participant.organization && (
                                      <p className="text-sm text-gray-600">{participant.organization}</p>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <Badge variant="outline" className="mb-1">
                                      <Award className="h-3 w-3 mr-1" />
                                      {participant.total_sessions_attended} sessions
                                    </Badge>
                                    <p className="text-xs text-gray-500">
                                      {participant.attendance_rate}% attendance rate
                                    </p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="new">
                    <Alert className="mb-4">
                      <User className="h-4 w-4" />
                      <AlertDescription>
                        Fill in the details below for a new participant
                      </AlertDescription>
                    </Alert>
                  </TabsContent>
                </Tabs>

                {/* Participant Form */}
                <div className="space-y-4 mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={formData.participant_name}
                        onChange={(e) => handleInputChange('participant_name', e.target.value)}
                        placeholder="Enter full name"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.participant_email}
                        onChange={(e) => handleInputChange('participant_email', e.target.value)}
                        placeholder="Enter email address"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.participant_phone}
                        onChange={(e) => handleInputChange('participant_phone', e.target.value)}
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div>
                      <Label htmlFor="role">Role</Label>
                      <Select value={formData.participant_role} onValueChange={(value) => handleInputChange('participant_role', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="teacher">Teacher</SelectItem>
                          <SelectItem value="coordinator">Coordinator</SelectItem>
                          <SelectItem value="principal">Principal</SelectItem>
                          <SelectItem value="staff">Staff</SelectItem>
                          <SelectItem value="volunteer">Volunteer</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="organization">School/Organization</Label>
                    <Input
                      id="organization"
                      value={formData.school_name}
                      onChange={(e) => handleInputChange('school_name', e.target.value)}
                      placeholder="Enter school or organization name"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="district">District</Label>
                      <Input
                        id="district"
                        value={formData.district}
                        onChange={(e) => handleInputChange('district', e.target.value)}
                        placeholder="Enter district"
                      />
                    </div>
                    <div>
                      <Label htmlFor="province">Province</Label>
                      <Input
                        id="province"
                        value={formData.province}
                        onChange={(e) => handleInputChange('province', e.target.value)}
                        placeholder="Enter province"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 mt-6 pt-6 border-t">
                  <Button 
                    onClick={handleWalkInSubmit}
                    disabled={submitting || !formData.participant_name || !formData.participant_email}
                    className="flex-1"
                    size="lg"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Marking Attendance...
                      </>
                    ) : (
                      <>
                        <UserCheck className="h-4 w-4 mr-2" />
                        Mark Walk-in Attendance
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    onClick={resetForm}
                    variant="outline"
                    disabled={submitting}
                    size="lg"
                  >
                    Reset Form
                  </Button>
                </div>

                {/* Participant History */}
                {selectedParticipant && (
                  <div className="mt-6 pt-6 border-t">
                    <h3 className="font-medium mb-3 flex items-center gap-2">
                      <History className="h-4 w-4" />
                      Training History
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="text-gray-600">Total Sessions</p>
                        <p className="font-semibold">{selectedParticipant.total_sessions_registered}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="text-gray-600">Attended</p>
                        <p className="font-semibold">{selectedParticipant.total_sessions_attended}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="text-gray-600">Attendance Rate</p>
                        <p className="font-semibold">{selectedParticipant.attendance_rate}%</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="text-gray-600">First Training</p>
                        <p className="font-semibold">
                          {selectedParticipant.first_training_date 
                            ? new Date(selectedParticipant.first_training_date).toLocaleDateString()
                            : 'N/A'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AttendanceLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Loading attendance page...</p>
      </div>
    </div>
  );
}

export default function AttendancePage() {
  return (
    <Suspense fallback={<AttendanceLoading />}>
      <AttendancePageContent />
    </Suspense>
  );
}