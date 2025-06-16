"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, MapPin, Users, X } from 'lucide-react';
import { toast } from 'sonner';

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

interface TrainingSessionFormProps {
  editingSession?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function TrainingSessionForm({ editingSession, onSuccess, onCancel }: TrainingSessionFormProps) {
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
    trainer_id: '',
    coordinator_id: '',
    registration_deadline: ''
  });

  useEffect(() => {
    fetchPrograms();
    fetchUsers();
    
    // If editing, populate form with existing data
    if (editingSession) {
      setFormData({
        program_id: editingSession.program_id?.toString() || '',
        session_title: editingSession.session_title || '',
        session_date: editingSession.session_date || '',
        session_time: editingSession.session_time || '',
        location: editingSession.location || '',
        venue_address: editingSession.venue_address || '',
        max_participants: editingSession.max_participants?.toString() || '50',
        trainer_id: editingSession.trainer_id?.toString() || '',
        coordinator_id: editingSession.coordinator_id?.toString() || '',
        registration_deadline: editingSession.registration_deadline || ''
      });
    }
  }, [editingSession]);

  const fetchPrograms = async () => {
    try {
      const response = await fetch('/api/training/programs', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setPrograms(data || []);
      } else {
        toast.error('Failed to fetch training programs');
      }
    } catch (error) {
      console.error('Error fetching programs:', error);
      toast.error('Error loading training programs');
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/data/users', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        const users = data.users || [];
        setTrainers(users.filter((user: User) => ['admin', 'director', 'partner', 'coordinator', 'teacher'].includes(user.role)));
        setCoordinators(users.filter((user: User) => ['admin', 'director', 'partner', 'coordinator'].includes(user.role)));
      } else {
        toast.error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Error loading users');
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
        trainer_id: formData.trainer_id ? parseInt(formData.trainer_id) : null,
        coordinator_id: formData.coordinator_id ? parseInt(formData.coordinator_id) : null,
        registration_deadline: formData.registration_deadline || null
      };

      const isEditing = !!editingSession;
      const url = isEditing ? `/api/training/sessions?id=${editingSession.id}` : '/api/training/sessions';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(isEditing ? 'Training session updated successfully!' : 'Training session created successfully!');
        onSuccess();
      } else {
        const error = await response.json();
        toast.error(error.error || `Failed to ${isEditing ? 'update' : 'create'} training session`);
      }
    } catch (error) {
      console.error('Error creating training session:', error);
      toast.error('Error creating training session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {editingSession ? 'Edit Training Session' : 'Create New Training Session'}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
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
                  <SelectItem value="">No trainer assigned</SelectItem>
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
                  <SelectItem value="">No coordinator assigned</SelectItem>
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
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (editingSession ? 'Updating...' : 'Creating...') : (editingSession ? 'Update Session' : 'Create Session')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}