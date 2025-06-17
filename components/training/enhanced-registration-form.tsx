"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  MapPin, 
  Award,
  Calendar,
  CheckCircle,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

interface EnhancedRegistrationFormProps {
  sessionId: string;
  onSubmit: (formData: any) => void;
  initialData?: any;
}

interface ParticipantHistory {
  isReturning: boolean;
  participant?: {
    fullName: string;
    email: string;
    phone: string;
    role: string;
    organization: string;
    district: string;
    province: string;
    totalSessionsAttended: number;
    attendanceRate: number;
  };
  recentHistory?: Array<{
    session_title: string;
    session_date: string;
    status: string;
  }>;
  welcomeMessage?: string;
  stats?: {
    totalAttended: number;
    daysSinceLastTraining: number;
  };
}

export function EnhancedRegistrationForm({ sessionId, onSubmit, initialData }: EnhancedRegistrationFormProps) {
  const [formData, setFormData] = useState({
    participant_name: '',
    participant_email: '',
    participant_phone: '',
    participant_role: '',
    school_name: '',
    district: '',
    province: '',
    ...initialData
  });
  
  const [isChecking, setIsChecking] = useState(false);
  const [participantHistory, setParticipantHistory] = useState<ParticipantHistory | null>(null);
  const [emailChecked, setEmailChecked] = useState(false);

  // Check for returning participant when email is entered
  const checkReturningParticipant = async (email: string) => {
    if (!email || !email.includes('@')) return;
    
    setIsChecking(true);
    try {
      const response = await fetch(`/api/training/participants/check-returning?email=${encodeURIComponent(email)}`);
      if (response.ok) {
        const data = await response.json();
        setParticipantHistory(data);
        
        if (data.isReturning && data.participant) {
          // Pre-fill form with existing data
          setFormData(prev => ({
            ...prev,
            participant_name: data.participant.fullName || prev.participant_name,
            participant_phone: data.participant.phone || prev.participant_phone,
            participant_role: data.participant.role || prev.participant_role,
            school_name: data.participant.organization || prev.school_name,
            district: data.participant.district || prev.district,
            province: data.participant.province || prev.province
          }));
          
          toast.success(data.welcomeMessage);
        }
        
        setEmailChecked(true);
      }
    } catch (error) {
      console.error('Error checking participant:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleEmailBlur = () => {
    if (formData.participant_email && !emailChecked) {
      checkReturningParticipant(formData.participant_email);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Reset email check if email is changed
    if (field === 'participant_email') {
      setEmailChecked(false);
      setParticipantHistory(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.participant_name || !formData.participant_email) {
      toast.error('Please fill in required fields');
      return;
    }
    
    onSubmit({
      ...formData,
      session_id: parseInt(sessionId),
      is_returning: participantHistory?.isReturning || false,
      master_participant_id: participantHistory?.participant?.id
    });
  };

  const getAttendanceBadgeColor = (rate: number) => {
    if (rate >= 90) return 'bg-green-100 text-green-800';
    if (rate >= 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Welcome Back Alert for Returning Participants */}
      {participantHistory?.isReturning && (
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <div className="space-y-2">
              <p className="font-semibold">{participantHistory.welcomeMessage}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="outline" className="bg-white">
                  <Award className="h-3 w-3 mr-1" />
                  {participantHistory.stats?.totalAttended} Sessions Attended
                </Badge>
                <Badge 
                  variant="outline" 
                  className={getAttendanceBadgeColor(participantHistory.participant?.attendanceRate || 0)}
                >
                  {participantHistory.participant?.attendanceRate}% Attendance Rate
                </Badge>
                {participantHistory.stats?.daysSinceLastTraining && (
                  <Badge variant="outline" className="bg-white">
                    <Calendar className="h-3 w-3 mr-1" />
                    {participantHistory.stats.daysSinceLastTraining} days since last training
                  </Badge>
                )}
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Email Field with Check */}
      <div className="space-y-2">
        <Label htmlFor="participant_email" className="flex items-center gap-2">
          <Mail className="h-4 w-4" />
          Email Address *
        </Label>
        <div className="relative">
          <Input
            id="participant_email"
            type="email"
            value={formData.participant_email}
            onChange={(e) => handleInputChange('participant_email', e.target.value)}
            onBlur={handleEmailBlur}
            placeholder="Enter your email"
            required
            className={participantHistory?.isReturning ? 'pr-10' : ''}
          />
          {participantHistory?.isReturning && (
            <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-600" />
          )}
        </div>
        {isChecking && (
          <p className="text-sm text-muted-foreground">Checking participant history...</p>
        )}
      </div>

      {/* Name Field */}
      <div className="space-y-2">
        <Label htmlFor="participant_name" className="flex items-center gap-2">
          <User className="h-4 w-4" />
          Full Name *
        </Label>
        <Input
          id="participant_name"
          value={formData.participant_name}
          onChange={(e) => handleInputChange('participant_name', e.target.value)}
          placeholder="Enter your full name"
          required
        />
      </div>

      {/* Phone Field */}
      <div className="space-y-2">
        <Label htmlFor="participant_phone" className="flex items-center gap-2">
          <Phone className="h-4 w-4" />
          Phone Number
        </Label>
        <Input
          id="participant_phone"
          type="tel"
          value={formData.participant_phone}
          onChange={(e) => handleInputChange('participant_phone', e.target.value)}
          placeholder="Enter your phone number"
        />
      </div>

      {/* Role Field */}
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

      {/* Organization Field */}
      <div className="space-y-2">
        <Label htmlFor="school_name" className="flex items-center gap-2">
          <Building className="h-4 w-4" />
          School/Organization
        </Label>
        <Input
          id="school_name"
          value={formData.school_name}
          onChange={(e) => handleInputChange('school_name', e.target.value)}
          placeholder="Enter your school or organization name"
        />
      </div>

      {/* Location Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="district" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            District
          </Label>
          <Input
            id="district"
            value={formData.district}
            onChange={(e) => handleInputChange('district', e.target.value)}
            placeholder="Enter your district"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="province">Province</Label>
          <Input
            id="province"
            value={formData.province}
            onChange={(e) => handleInputChange('province', e.target.value)}
            placeholder="Enter your province"
          />
        </div>
      </div>

      {/* Recent Training History for Returning Participants */}
      {participantHistory?.isReturning && participantHistory.recentHistory && participantHistory.recentHistory.length > 0 && (
        <Card className="border-dashed">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Your Recent Training History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {participantHistory.recentHistory.slice(0, 3).map((session, index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <div>
                    <p className="font-medium">{session.session_title}</p>
                    <p className="text-muted-foreground">
                      {new Date(session.session_date).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge 
                    variant={session.status === 'Attended' ? 'default' : 'secondary'}
                    className={session.status === 'Attended' ? 'bg-green-600' : ''}
                  >
                    {session.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit Button */}
      <Button 
        type="submit" 
        className="w-full" 
        size="lg"
      >
        {participantHistory?.isReturning ? 'Continue Registration' : 'Complete Registration'}
      </Button>
      
      {/* Note about information update */}
      {participantHistory?.isReturning && (
        <p className="text-center text-xs text-muted-foreground">
          Your information has been pre-filled. Please update any details that have changed.
        </p>
      )}
    </form>
  );
}