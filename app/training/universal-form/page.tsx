"use client";

import React, { useState, useEffect } from 'react';
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
  Search,
  User, 
  Mail, 
  Phone, 
  Building, 
  MapPin, 
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  UserPlus,
  UserCheck,
  Award,
  History,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface TrainingSession {
  id: number;
  session_title: string;
  session_date: string;
  session_time: string;
  location: string;
  program_name: string;
  max_participants?: number;
  current_attendance: number;
  capacity: number;
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

interface RegistrationStatus {
  isRegistered: boolean;
  isAttended: boolean;
  registration_id?: number;
  registration_method?: string;
}

export default function UniversalTrainingFormPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session');
  const qrId = searchParams.get('qr');
  const purpose = searchParams.get('purpose') || 'register'; // 'register' or 'attendance'
  
  const [session, setSession] = useState<TrainingSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchingParticipant, setSearchingParticipant] = useState(false);
  const [activeMode, setActiveMode] = useState<'new' | 'existing'>('new');
  
  // Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<ParticipantProfile[]>([]);
  const [selectedParticipant, setSelectedParticipant] = useState<ParticipantProfile | null>(null);
  const [registrationStatus, setRegistrationStatus] = useState<RegistrationStatus | null>(null);
  
  // Form states
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
    }
  }, [sessionId]);

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
    } finally {
      setLoading(false);
    }
  };

  const searchParticipants = async () => {
    if (!searchTerm.trim() || searchTerm.length < 2) {
      toast.error('Please enter at least 2 characters to search');
      return;
    }

    setSearchingParticipant(true);
    try {
      const response = await fetch(`/api/training/participants/search?query=${encodeURIComponent(searchTerm)}`);
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

  const selectExistingParticipant = async (participant: ParticipantProfile) => {
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

    // Check registration status for this session
    try {
      const response = await fetch(`/api/training/sessions/${sessionId}/check-registration?email=${encodeURIComponent(participant.email)}`);
      if (response.ok) {
        const status = await response.json();
        setRegistrationStatus(status);
      }
    } catch (error) {
      console.error('Error checking registration status:', error);
    }

    setActiveMode('existing');
    toast.success(`Selected ${participant.full_name} - information pre-filled!`);
  };

  const handleSubmit = async (action: 'register' | 'mark_attendance') => {
    if (!formData.participant_name || !formData.participant_email) {
      toast.error('Name and email are required');
      return;
    }

    setSubmitting(true);
    try {
      const endpoint = action === 'register' 
        ? `/api/training/sessions/${sessionId}/universal-register`
        : `/api/training/sessions/${sessionId}/universal-attendance`;
      
      const payload = {
        ...formData,
        qr_id: qrId,
        master_participant_id: selectedParticipant?.id,
        action: action
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        
        if (action === 'register') {
          toast.success('🎉 Registration successful!');
        } else {
          toast.success('✅ Attendance marked successfully!');
        }
        
        // Reset form for next participant
        resetForm();
        
        // Refresh session data
        fetchSession();
        
      } else {
        const error = await response.json();
        toast.error(error.error || `Failed to ${action === 'register' ? 'register' : 'mark attendance'}`);
      }
    } catch (error) {
      console.error(`Error ${action}:`, error);
      toast.error(`Failed to ${action === 'register' ? 'register' : 'mark attendance'}`);
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
    setRegistrationStatus(null);
    setSearchTerm('');
    setSearchResults([]);
    setActiveMode('new');
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Training session not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto max-w-4xl px-4">
        {/* Session Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="text-center mb-4">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {purpose === 'register' ? 'Training Registration' : 'Attendance Confirmation'}
              </h1>
              <p className="text-gray-600">
                {purpose === 'register' 
                  ? 'Register for this training session' 
                  : 'Confirm your attendance at this training session'
                }
              </p>
            </div>
            
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
                <Badge variant={session.current_attendance >= session.capacity ? "destructive" : "default"}>
                  {session.current_attendance} / {session.capacity} participants
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Form */}
        <Card>
          <CardHeader>
            <CardTitle>Participant Information</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeMode} onValueChange={(value) => setActiveMode(value as 'new' | 'existing')}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
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
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && searchParticipants()}
                      />
                    </div>
                    <div className="flex items-end">
                      <Button 
                        onClick={searchParticipants}
                        disabled={searchingParticipant || !searchTerm.trim()}
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

                  {/* Registration Status Alert */}
                  {selectedParticipant && registrationStatus && (
                    <Alert className={registrationStatus.isAttended ? "border-green-200 bg-green-50" : "border-blue-200 bg-blue-50"}>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        {registrationStatus.isAttended ? (
                          <span className="text-green-800">
                            ✅ {selectedParticipant.full_name} is already registered and attended this session
                          </span>
                        ) : registrationStatus.isRegistered ? (
                          <span className="text-blue-800">
                            📝 {selectedParticipant.full_name} is registered but hasn't attended yet
                          </span>
                        ) : (
                          <span className="text-blue-800">
                            📋 {selectedParticipant.full_name} is not registered for this session
                          </span>
                        )}
                      </AlertDescription>
                    </Alert>
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
            <div className="flex gap-4 mt-8 pt-6 border-t">
              {purpose === 'register' ? (
                <Button 
                  onClick={() => handleSubmit('register')}
                  disabled={submitting || !formData.participant_name || !formData.participant_email}
                  className="flex-1"
                  size="lg"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Registering...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Complete Registration
                    </>
                  )}
                </Button>
              ) : (
                <Button 
                  onClick={() => handleSubmit('mark_attendance')}
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
                      Confirm Attendance
                    </>
                  )}
                </Button>
              )}
              
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}