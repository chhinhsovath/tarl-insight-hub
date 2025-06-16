"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';
import { makeAuthenticatedRequest, handleApiResponse } from '@/lib/session-utils';

interface TrainingProgram {
  id: number;
  program_name: string;
  description: string;
  program_type: string;
  duration_hours: number;
}

interface User {
  id: number;
  full_name: string;
  role: string;
}

export default function NewTrainingSessionPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [trainers, setTrainers] = useState<User[]>([]);
  const [coordinators, setCoordinators] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    program_id: '',
    session_title: '',
    session_date: '',
    session_time: '',
    location: '',
    venue_address: '',
    max_participants: '50',
    trainer_id: 'none',
    coordinator_id: 'none',
    registration_deadline: ''
  });

  useEffect(() => {
    if (user) {
      fetchPrograms();
      fetchUsers();
    } else if (!authLoading) {
      router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
    }
  }, [user, authLoading, router]);

  const fetchPrograms = async () => {
    try {
      const response = await makeAuthenticatedRequest('/api/training/programs');
      const data = await handleApiResponse<TrainingProgram[]>(response);
      
      if (data) {
        setPrograms(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching programs:', error);
      toast.error('Failed to load training programs');
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await makeAuthenticatedRequest('/api/data/users');
      const data = await handleApiResponse<{users: User[]}>(response);
      
      if (data && data.users) {
        const users = data.users;
        setTrainers(users.filter((user: User) => ['admin', 'director', 'partner', 'coordinator', 'teacher'].includes(user.role)));
        setCoordinators(users.filter((user: User) => ['admin', 'director', 'partner', 'coordinator'].includes(user.role)));
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
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
    
    if (!formData.program_id || !formData.session_title || !formData.session_date || 
        !formData.session_time || !formData.location) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        program_id: parseInt(formData.program_id),
        session_title: formData.session_title,
        session_date: formData.session_date,
        session_time: formData.session_time,
        location: formData.location,
        venue_address: formData.venue_address || null,
        max_participants: parseInt(formData.max_participants) || 50,
        trainer_id: (formData.trainer_id && formData.trainer_id !== 'none') ? parseInt(formData.trainer_id) : null,
        coordinator_id: (formData.coordinator_id && formData.coordinator_id !== 'none') ? parseInt(formData.coordinator_id) : null,
        registration_deadline: formData.registration_deadline || null
      };

      const response = await makeAuthenticatedRequest('/api/training/sessions', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      const result = await handleApiResponse(response);
      
      if (result) {
        toast.success('Training session created successfully!');
        router.push('/training/sessions');
      }
    } catch (error) {
      console.error('Error creating training session:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to create training session');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/training/sessions');
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Please log in to create training sessions.</p>
          <Button onClick={() => router.push('/login')}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleCancel}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Sessions
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create New Training Session</h1>
          <p className="text-muted-foreground mt-1">
            Set up a new training session with participants and scheduling
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Session Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Program Selection */}
            <div className="space-y-2">
              <Label htmlFor="program_id">Training Program *</Label>
              <Select value={formData.program_id} onValueChange={(value) => handleInputChange('program_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a training program" />
                </SelectTrigger>
                <SelectContent>
                  {programs.map((program) => (
                    <SelectItem key={program.id} value={program.id.toString()}>
                      {program.program_name} ({program.program_type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Session Title */}
            <div className="space-y-2">
              <Label htmlFor="session_title">Session Title *</Label>
              <Input
                id="session_title"
                value={formData.session_title}
                onChange={(e) => handleInputChange('session_title', e.target.value)}
                placeholder="Enter session title"
                required
              />
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="session_date">Session Date *</Label>
                <Input
                  id="session_date"
                  type="date"
                  value={formData.session_date}
                  onChange={(e) => handleInputChange('session_date', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="session_time">Session Time *</Label>
                <Input
                  id="session_time"
                  type="time"
                  value={formData.session_time}
                  onChange={(e) => handleInputChange('session_time', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="Enter location name"
                required
              />
            </div>

            {/* Venue Address */}
            <div className="space-y-2">
              <Label htmlFor="venue_address">Venue Address</Label>
              <Textarea
                id="venue_address"
                value={formData.venue_address}
                onChange={(e) => handleInputChange('venue_address', e.target.value)}
                placeholder="Enter full venue address"
                rows={2}
              />
            </div>

            {/* Max Participants */}
            <div className="space-y-2">
              <Label htmlFor="max_participants">Maximum Participants</Label>
              <Input
                id="max_participants"
                type="number"
                min="1"
                max="1000"
                value={formData.max_participants}
                onChange={(e) => handleInputChange('max_participants', e.target.value)}
                placeholder="50"
              />
            </div>

            {/* Trainer */}
            <div className="space-y-2">
              <Label htmlFor="trainer_id">Assigned Trainer</Label>
              <Select value={formData.trainer_id} onValueChange={(value) => handleInputChange('trainer_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a trainer (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No trainer assigned</SelectItem>
                  {trainers.map((trainer) => (
                    <SelectItem key={trainer.id} value={trainer.id.toString()}>
                      {trainer.full_name} ({trainer.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Coordinator */}
            <div className="space-y-2">
              <Label htmlFor="coordinator_id">Assigned Coordinator</Label>
              <Select value={formData.coordinator_id} onValueChange={(value) => handleInputChange('coordinator_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a coordinator (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No coordinator assigned</SelectItem>
                  {coordinators.map((coordinator) => (
                    <SelectItem key={coordinator.id} value={coordinator.id.toString()}>
                      {coordinator.full_name} ({coordinator.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Registration Deadline */}
            <div className="space-y-2">
              <Label htmlFor="registration_deadline">Registration Deadline</Label>
              <Input
                id="registration_deadline"
                type="date"
                value={formData.registration_deadline}
                onChange={(e) => handleInputChange('registration_deadline', e.target.value)}
              />
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="flex items-center gap-2">
                {loading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Create Session
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}