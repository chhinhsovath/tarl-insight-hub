"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Users, School, MapPin, Globe } from 'lucide-react';
import { DatabaseService } from '@/lib/database';
import { toast } from 'sonner';

interface HierarchyAssignment {
  id: number;
  type: 'zone' | 'province' | 'district' | 'school';
  name: string;
  level: string;
}

interface HierarchyAssignmentManagerProps {
  userId: number;
  userRole: string;
  onAssignmentsChange?: () => void;
}

export function HierarchyAssignmentManager({ 
  userId, 
  userRole, 
  onAssignmentsChange 
}: HierarchyAssignmentManagerProps) {
  const [assignments, setAssignments] = useState<HierarchyAssignment[]>([]);
  const [availableZones, setAvailableZones] = useState([]);
  const [availableProvinces, setAvailableProvinces] = useState([]);
  const [availableDistricts, setAvailableDistricts] = useState([]);
  const [availableSchools, setAvailableSchools] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [newAssignment, setNewAssignment] = useState({
    type: '' as 'zone' | 'province' | 'district' | 'school',
    id: ''
  });

  useEffect(() => {
    loadAssignments();
    loadAvailableOptions();
  }, [userId]);

  const loadAssignments = async () => {
    try {
      const data = await DatabaseService.getUserHierarchyAssignments(userId);
      setAssignments(data);
    } catch (error) {
      console.error('Error loading assignments:', error);
      toast.error('Failed to load current assignments');
    }
  };

  const loadAvailableOptions = async () => {
    try {
      const [zones, provinces, districts, schools] = await Promise.all([
        DatabaseService.getProvinces(), // Assuming zones are included
        DatabaseService.getProvinces(),
        DatabaseService.getDistricts(),
        DatabaseService.getSchools()
      ]);
      
      setAvailableZones(zones);
      setAvailableProvinces(provinces);
      setAvailableDistricts(districts);
      setAvailableSchools(schools);
    } catch (error) {
      console.error('Error loading options:', error);
    }
  };

  const handleAssign = async () => {
    if (!newAssignment.type || !newAssignment.id) {
      toast.error('Please select both assignment type and target');
      return;
    }

    setLoading(true);
    try {
      const result = await DatabaseService.assignUserToHierarchy({
        userId,
        assignmentType: newAssignment.type,
        assignmentId: parseInt(newAssignment.id),
        assignedBy: 1 // Should be current user's ID
      });

      if (result?.success) {
        toast.success('Assignment created successfully');
        loadAssignments();
        setNewAssignment({ type: '' as any, id: '' });
        onAssignmentsChange?.();
      } else {
        toast.error('Failed to create assignment');
      }
    } catch (error) {
      console.error('Error creating assignment:', error);
      toast.error('Failed to create assignment');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (assignment: HierarchyAssignment) => {
    setLoading(true);
    try {
      const result = await DatabaseService.removeUserFromHierarchy({
        userId,
        assignmentType: assignment.type,
        assignmentId: assignment.id
      });

      if (result?.success) {
        toast.success('Assignment removed successfully');
        loadAssignments();
        onAssignmentsChange?.();
      } else {
        toast.error('Failed to remove assignment');
      }
    } catch (error) {
      console.error('Error removing assignment:', error);
      toast.error('Failed to remove assignment');
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'zone': return <Globe className="h-4 w-4" />;
      case 'province': return <MapPin className="h-4 w-4" />;
      case 'district': return <Users className="h-4 w-4" />;
      case 'school': return <School className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const getColorByType = (type: string) => {
    switch (type) {
      case 'zone': return 'bg-purple-100 text-purple-800';
      case 'province': return 'bg-blue-100 text-blue-800';
      case 'district': return 'bg-green-100 text-green-800';
      case 'school': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAvailableOptions = () => {
    switch (newAssignment.type) {
      case 'zone': return availableZones;
      case 'province': return availableProvinces;
      case 'district': return availableDistricts;
      case 'school': return availableSchools;
      default: return [];
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Hierarchy Assignments
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Assignments */}
        <div>
          <h4 className="text-sm font-medium mb-3">Current Assignments</h4>
          {assignments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No assignments yet</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {assignments.map((assignment) => (
                <Badge
                  key={`${assignment.type}-${assignment.id}`}
                  variant="secondary"
                  className={`flex items-center gap-2 ${getColorByType(assignment.type)}`}
                >
                  {getIcon(assignment.type)}
                  <span>{assignment.name}</span>
                  <span className="text-xs opacity-70">({assignment.level})</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-red-100"
                    onClick={() => handleRemove(assignment)}
                    disabled={loading}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Add New Assignment */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-3">Add New Assignment</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="assignment-type">Assignment Type</Label>
              <Select
                value={newAssignment.type}
                onValueChange={(value: any) => setNewAssignment({ ...newAssignment, type: value, id: '' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="zone">Zone</SelectItem>
                  <SelectItem value="province">Province</SelectItem>
                  <SelectItem value="district">District</SelectItem>
                  <SelectItem value="school">School</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="assignment-target">Target</Label>
              <Select
                value={newAssignment.id}
                onValueChange={(value) => setNewAssignment({ ...newAssignment, id: value })}
                disabled={!newAssignment.type}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select target" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableOptions().map((option: any) => (
                    <SelectItem key={option.id} value={option.id.toString()}>
                      {option.name || option.school_name || option.province_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={handleAssign}
                disabled={loading || !newAssignment.type || !newAssignment.id}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Assign
              </Button>
            </div>
          </div>
        </div>

        {/* Role-specific Notes */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <h5 className="text-sm font-medium text-blue-900 mb-1">Assignment Guidelines</h5>
          <div className="text-xs text-blue-700 space-y-1">
            {userRole === 'Director' && (
              <>
                <p>• Directors can be assigned to zones, provinces, or districts</p>
                <p>• They can manage all schools and users within their assigned regions</p>
              </>
            )}
            {userRole === 'Partner' && (
              <>
                <p>• Partners can be assigned to zones, provinces, districts, or specific schools</p>
                <p>• They have oversight permissions for their assigned regions</p>
              </>
            )}
            {userRole === 'Teacher' && (
              <>
                <p>• Teachers are typically assigned to specific schools and classes</p>
                <p>• They can manage their students and class data</p>
              </>
            )}
            {userRole === 'Collector' && (
              <>
                <p>• Collectors are assigned to specific schools or regions</p>
                <p>• They focus on data collection activities</p>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}