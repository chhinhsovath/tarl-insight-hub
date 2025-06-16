"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Mail, 
  Phone,
  School,
  QrCode,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface TrainingSession {
  id: number;
  session_title: string;
  session_date: string;
  session_time: string;
  location: string;
  venue_address: string;
  program_name: string;
  trainer_name: string;
  max_participants: number;
  registration_deadline: string;
}

interface RegistrationForm {
  participant_name: string;
  participant_email: string;
  participant_phone: string;
  participant_role: string;
  school_name: string;
  district: string;
  province: string;
  years_experience: string;
  subjects_taught: string;
  grade_levels: string;
  previous_tarl_training: boolean;
  expectations: string;
}

export default function TrainingRegistrationPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session');
  const qrId = searchParams.get('qr');

  const [session, setSession] = useState<TrainingSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [registered, setRegistered] = useState(false);
  
  const [formData, setFormData] = useState<RegistrationForm>({
    participant_name: '',
    participant_email: '',
    participant_phone: '',
    participant_role: '',
    school_name: '',
    district: '',
    province: '',
    years_experience: '',
    subjects_taught: '',
    grade_levels: '',
    previous_tarl_training: false,
    expectations: ''
  });

  useEffect(() => {
    if (sessionId) {
      fetchSessionDetails();
    }
    
    // Log QR code usage if accessed via QR
    if (qrId && sessionId) {
      logQrUsage();
    }
  }, [sessionId, qrId]);

  const fetchSessionDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/training/sessions?id=${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          setSession(data[0]);
        } else {
          toast.error('Training session not found');
        }
      } else {
        toast.error('Failed to load session details');
      }
    } catch (error) {
      console.error('Error fetching session:', error);
      toast.error('Error loading session details');
    } finally {
      setLoading(false);
    }
  };

  const logQrUsage = async () => {
    try {
      await fetch(`/api/training/qr-codes?qr_id=${qrId}&session_id=${sessionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action_type: 'registration',
          user_agent: navigator.userAgent,
          scan_data: { page: 'registration', timestamp: new Date().toISOString() }
        }),
      });
    } catch (error) {
      console.error('Error logging QR usage:', error);
    }
  };

  const handleInputChange = (field: keyof RegistrationForm, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session) return;

    // Basic validation
    if (!formData.participant_name.trim() || !formData.participant_email.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.participant_email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/training/participants?public=true', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: session.id,
          ...formData,
          registration_data: {
            source: qrId ? 'qr_code' : 'direct_link',
            qr_id: qrId,
            timestamp: new Date().toISOString(),
            user_agent: navigator.userAgent
          }
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setRegistered(true);
        toast.success('Registration successful!');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Error submitting registration:', error);
      toast.error('Error submitting registration');
    } finally {
      setSubmitting(false);
    }
  };

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading training session...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Session Not Found</h2>
            <p className="text-muted-foreground">
              The training session you're looking for could not be found or may no longer be available for registration.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (registered) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Registration Successful!</h2>
            <p className="text-muted-foreground mb-4">
              You have been successfully registered for the training session. 
              You should receive a confirmation email shortly.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h3 className="font-medium text-blue-900">{session.session_title}</h3>
              <div className="text-sm text-blue-700 mt-2 space-y-1">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {formatDate(session.session_date)}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {formatTime(session.session_time)}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {session.location}
                </div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Please save this information and arrive 15 minutes early on the training day.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if registration deadline has passed
  const isRegistrationClosed = session.registration_deadline && 
    new Date() > new Date(session.registration_deadline);

  if (isRegistrationClosed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Registration Closed</h2>
            <p className="text-muted-foreground mb-4">
              Registration for this training session has closed.
            </p>
            <Badge variant="outline" className="text-red-600 border-red-600">
              Deadline: {new Date(session.registration_deadline).toLocaleDateString()}
            </Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            {qrId && <QrCode className="h-6 w-6 text-blue-600" />}
            <h1 className="text-3xl font-bold">Training Registration</h1>
          </div>
          <p className="text-muted-foreground">
            Register for the upcoming training session
          </p>
        </div>

        {/* Session Details */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {session.session_title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Program</Label>
                <p className="text-sm text-muted-foreground">{session.program_name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Trainer</Label>
                <p className="text-sm text-muted-foreground">{session.trainer_name || 'TBD'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Date & Time</Label>
                <div className="text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(session.session_date)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTime(session.session_time)}
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Location</Label>
                <div className="text-sm text-muted-foreground">
                  <div className="flex items-start gap-1">
                    <MapPin className="h-3 w-3 mt-0.5" />
                    <div>
                      <p>{session.location}</p>
                      {session.venue_address && (
                        <p className="text-xs">{session.venue_address}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {session.registration_deadline && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-800">
                  <strong>Registration Deadline:</strong> {' '}
                  {new Date(session.registration_deadline).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Registration Form */}
        <Card>
          <CardHeader>
            <CardTitle>Registration Form</CardTitle>
            <p className="text-sm text-muted-foreground">
              Please fill out the form below to register for this training session.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Personal Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        placeholder="Enter your full name"
                        value={formData.participant_name}
                        onChange={(e) => handleInputChange('participant_name', e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="your.email@example.com"
                        value={formData.participant_email}
                        onChange={(e) => handleInputChange('participant_email', e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        placeholder="+1 (555) 123-4567"
                        value={formData.participant_phone}
                        onChange={(e) => handleInputChange('participant_phone', e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="role">Your Role</Label>
                    <Select value={formData.participant_role} onValueChange={(value) => handleInputChange('participant_role', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="teacher">Teacher</SelectItem>
                        <SelectItem value="coordinator">Coordinator</SelectItem>
                        <SelectItem value="principal">Principal</SelectItem>
                        <SelectItem value="administrator">Administrator</SelectItem>
                        <SelectItem value="trainer">Trainer</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* School Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">School Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="school">School Name</Label>
                    <div className="relative">
                      <School className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="school"
                        placeholder="Your school name"
                        value={formData.school_name}
                        onChange={(e) => handleInputChange('school_name', e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="district">District</Label>
                    <Input
                      id="district"
                      placeholder="Your district"
                      value={formData.district}
                      onChange={(e) => handleInputChange('district', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="province">Province/State</Label>
                    <Input
                      id="province"
                      placeholder="Your province or state"
                      value={formData.province}
                      onChange={(e) => handleInputChange('province', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="experience">Years of Experience</Label>
                    <Select value={formData.years_experience} onValueChange={(value) => handleInputChange('years_experience', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select experience" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0-1">0-1 years</SelectItem>
                        <SelectItem value="2-5">2-5 years</SelectItem>
                        <SelectItem value="6-10">6-10 years</SelectItem>
                        <SelectItem value="11-15">11-15 years</SelectItem>
                        <SelectItem value="16+">16+ years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Teaching Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Teaching Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="subjects">Subjects Taught</Label>
                    <Input
                      id="subjects"
                      placeholder="e.g., Mathematics, English, Science"
                      value={formData.subjects_taught}
                      onChange={(e) => handleInputChange('subjects_taught', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="grades">Grade Levels</Label>
                    <Input
                      id="grades"
                      placeholder="e.g., Grades 3-5, Grade 8"
                      value={formData.grade_levels}
                      onChange={(e) => handleInputChange('grade_levels', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.previous_tarl_training}
                      onChange={(e) => handleInputChange('previous_tarl_training', e.target.checked)}
                      className="rounded"
                    />
                    I have attended TaRL training before
                  </Label>
                </div>

                <div>
                  <Label htmlFor="expectations">What do you hope to gain from this training?</Label>
                  <Textarea
                    id="expectations"
                    placeholder="Share your expectations and goals for this training session..."
                    value={formData.expectations}
                    onChange={(e) => handleInputChange('expectations', e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t">
                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Registering...
                    </>
                  ) : (
                    'Complete Registration'
                  )}
                </Button>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  By submitting this form, you confirm that the information provided is accurate 
                  and you agree to participate in the training session.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}