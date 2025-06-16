"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList, X } from 'lucide-react';
import { toast } from 'sonner';

interface TrainingProgramFormProps {
  editingProgram?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function TrainingProgramForm({ editingProgram, onSuccess, onCancel }: TrainingProgramFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    program_name: '',
    description: '',
    program_type: 'standard',
    duration_hours: '8'
  });

  useEffect(() => {
    // If editing, populate form with existing data
    if (editingProgram) {
      setFormData({
        program_name: editingProgram.program_name || '',
        description: editingProgram.description || '',
        program_type: editingProgram.program_type || 'standard',
        duration_hours: editingProgram.duration_hours?.toString() || '8'
      });
    }
  }, [editingProgram]);

  const programTypes = [
    { value: 'standard', label: 'Standard Training' },
    { value: 'intensive', label: 'Intensive Training' },
    { value: 'refresher', label: 'Refresher Course' },
    { value: 'workshop', label: 'Workshop' },
    { value: 'seminar', label: 'Seminar' },
    { value: 'certification', label: 'Certification Program' },
    { value: 'orientation', label: 'Orientation' },
    { value: 'specialized', label: 'Specialized Training' }
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.program_name.trim()) {
      toast.error('Program name is required');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        program_name: formData.program_name.trim(),
        description: formData.description.trim() || null,
        program_type: formData.program_type,
        duration_hours: parseInt(formData.duration_hours) || 8
      };

      const isEditing = !!editingProgram;
      const url = isEditing ? `/api/training/programs?id=${editingProgram.id}` : '/api/training/programs';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(isEditing ? 'Training program updated successfully!' : 'Training program created successfully!');
        onSuccess();
      } else {
        const error = await response.json();
        toast.error(error.error || `Failed to ${isEditing ? 'update' : 'create'} training program`);
      }
    } catch (error) {
      console.error('Error creating training program:', error);
      toast.error('Error creating training program');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              {editingProgram ? 'Edit Training Program' : 'Create New Training Program'}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Program Name */}
            <div className="space-y-2">
              <Label htmlFor="program_name">Program Name *</Label>
              <Input
                id="program_name"
                value={formData.program_name}
                onChange={(e) => handleInputChange('program_name', e.target.value)}
                placeholder="Enter training program name"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter program description"
                rows={3}
              />
            </div>

            {/* Program Type */}
            <div className="space-y-2">
              <Label htmlFor="program_type">Program Type</Label>
              <Select value={formData.program_type} onValueChange={(value) => handleInputChange('program_type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select program type" />
                </SelectTrigger>
                <SelectContent>
                  {programTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Duration Hours */}
            <div className="space-y-2">
              <Label htmlFor="duration_hours">Duration (Hours)</Label>
              <Input
                id="duration_hours"
                type="number"
                min="1"
                max="1000"
                value={formData.duration_hours}
                onChange={(e) => handleInputChange('duration_hours', e.target.value)}
                placeholder="8"
              />
              <p className="text-sm text-muted-foreground">
                Total estimated duration for the entire program
              </p>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (editingProgram ? 'Updating...' : 'Creating...') : (editingProgram ? 'Update Program' : 'Create Program')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}