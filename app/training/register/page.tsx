"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { QrCode, Calendar, Clock, MapPin, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface TrainingSession {
  id: number;
  session_title: string;
  session_date: string;
  session_time: string;
  location: string;
  program_name: string;
  max_participants?: number;
  registration_deadline?: string;
}

export default function TrainingRegistrationPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session');
  const qrId = searchParams.get('qr');
  
  const [session, setSession] = useState<TrainingSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
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
      const response = await fetch(`/api/training/sessions?id=${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          setSession(data[0]);
        } else {
          toast.error('Training session not found');
        }
      } else {
        toast.error('Failed to load session information');
      }
    } catch (error) {
      console.error('Error fetching session:', error);
      toast.error('Error loading session');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.participant_name || !formData.participant_email) {
      toast.error('Please fill in your name and email');
      return;
    }

    if (!sessionId) {
      toast.error('Invalid session');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        session_id: parseInt(sessionId),
        ...formData
      };

      const response = await fetch('/api/training/participants?public=true', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        setSubmitted(true);
        toast.success('Registration successful!');
        
        // Log QR code usage
        if (qrId) {
          await fetch(`/api/training/qr-codes?qr_id=${qrId}&session_id=${sessionId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action_type: 'registration',
              user_agent: navigator.userAgent,
              scan_data: { participant_email: formData.participant_email }
            })
          });
        }
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading session information...</p>
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
            <p className="text-gray-600">The training session you're trying to register for could not be found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Registration Successful!</h2>
            <p className="text-gray-600 mb-4">
              You have successfully registered for <strong>{session.session_title}</strong>.
            </p>
            <div className="bg-blue-50 rounded-lg p-4 text-left">
              <h3 className="font-semibold text-blue-900 mb-2">Session Details:</h3>
              <div className="space-y-2 text-sm text-blue-800">
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
            <p className="text-sm text-gray-500 mt-4">
              You will receive a confirmation email shortly with further details.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="bg-blue-600 rounded-full p-3 inline-flex mb-4">
            <QrCode className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Training Registration</h1>
          <p className="text-gray-600 mt-1">Complete your registration below</p>
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
            </div>
          </CardContent>
        </Card>

        {/* Registration Form */}
        <Card>
          <CardHeader>
            <CardTitle>Your Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="participant_name">Full Name *</Label>
                <Input
                  id="participant_name"
                  value={formData.participant_name}
                  onChange={(e) => handleInputChange('participant_name', e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="participant_email">Email Address *</Label>
                <Input
                  id="participant_email"
                  type="email"
                  value={formData.participant_email}
                  onChange={(e) => handleInputChange('participant_email', e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="participant_phone">Phone Number</Label>
                <Input
                  id="participant_phone"
                  type="tel"
                  value={formData.participant_phone}
                  onChange={(e) => handleInputChange('participant_phone', e.target.value)}
                  placeholder="Enter your phone number"
                />
              </div>

              {/* Role */}
              <div className="space-y-2">
                <Label htmlFor="participant_role">Your Role</Label>
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

              {/* School */}
              <div className="space-y-2">
                <Label htmlFor="school_name">School Name</Label>
                <Input
                  id="school_name"
                  value={formData.school_name}
                  onChange={(e) => handleInputChange('school_name', e.target.value)}
                  placeholder="Enter your school name"
                />
              </div>

              {/* District */}
              <div className="space-y-2">
                <Label htmlFor="district">District</Label>
                <Input
                  id="district"
                  value={formData.district}
                  onChange={(e) => handleInputChange('district', e.target.value)}
                  placeholder="Enter your district"
                />
              </div>

              {/* Province */}
              <div className="space-y-2">
                <Label htmlFor="province">Province</Label>
                <Input
                  id="province"
                  value={formData.province}
                  onChange={(e) => handleInputChange('province', e.target.value)}
                  placeholder="Enter your province"
                />
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full" 
                disabled={submitting}
                size="lg"
              >
                {submitting ? 'Registering...' : 'Complete Registration'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-6">
          By registering, you agree to participate in this training session.
        </p>
      </div>
    </div>
  );
}