"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, GraduationCap, Plus, School, Calendar, BookOpen } from 'lucide-react';
import { DatabaseService } from '@/lib/database';
import { toast } from 'sonner';

interface ClassManagementProps {
  currentUser: {
    id: number;
    role: string;
    username: string;
    school_id?: number;
  };
  onClassCreated?: () => void;
}

interface ClassFormData {
  class_name: string;
  class_level: number;
  school_id: number;
  academic_year: string;
  subject?: string;
}

export function ClassManagement({ 
  currentUser, 
  onClassCreated 
}: ClassManagementProps) {
  const [formData, setFormData] = useState<ClassFormData>({
    class_name: '',
    class_level: 1,
    school_id: currentUser.school_id || 0,
    academic_year: new Date().getFullYear().toString(),
    subject: ''
  });

  const [classes, setClasses] = useState([]);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedClass, setSelectedClass] = useState<any>(null);

  useEffect(() => {
    loadInitialData();
  }, [currentUser]);

  const loadInitialData = async () => {
    try {
      const [classesData, schoolsData] = await Promise.all([
        currentUser.role === 'teacher' 
          ? DatabaseService.getTeacherClasses(currentUser.id)
          : DatabaseService.getAccessibleSchools(currentUser.id).then(schools => 
              schools.length > 0 ? getClassesForSchools(schools.map(s => s.id)) : []
            ),
        DatabaseService.getAccessibleSchools(currentUser.id)
      ]);

      setClasses(classesData);
      setSchools(schoolsData);
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('Failed to load class data');
    }
  };

  const getClassesForSchools = async (schoolIds: number[]) => {
    // This would need an API endpoint to get classes for multiple schools
    // For now, return empty array
    return [];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.class_name || !formData.school_id || !formData.academic_year) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const classData = {
        ...formData,
        teacher_id: currentUser.role === 'teacher' ? currentUser.id : undefined,
        created_by: currentUser.id
      };

      const result = await DatabaseService.createClass(classData);
      
      if (result) {
        toast.success('Class created successfully');
        
        // If teacher, auto-assign to this class
        if (currentUser.role === 'teacher') {
          await DatabaseService.assignUserToHierarchy({
            userId: currentUser.id,
            assignmentType: 'class',
            assignmentId: result.id,
            assignedBy: currentUser.id
          });
        }

        // Reset form
        setFormData({
          class_name: '',
          class_level: 1,
          school_id: currentUser.school_id || 0,
          academic_year: new Date().getFullYear().toString(),
          subject: ''
        });

        onClassCreated?.();
        loadInitialData(); // Refresh the classes list
      } else {
        toast.error('Failed to create class');
      }
    } catch (error) {
      console.error('Error creating class:', error);
      toast.error('Failed to create class');
    } finally {
      setLoading(false);
    }
  };

  const canCreateClasses = () => {
    return ['admin', 'director', 'partner', 'teacher', 'coordinator'].includes(currentUser.role);
  };

  const getClassLevelName = (level: number) => {
    const levels = {
      1: 'Grade 1',
      2: 'Grade 2', 
      3: 'Grade 3',
      4: 'Grade 4',
      5: 'Grade 5',
      6: 'Grade 6',
      7: 'Grade 7',
      8: 'Grade 8',
      9: 'Grade 9',
      10: 'Grade 10',
      11: 'Grade 11',
      12: 'Grade 12'
    };
    return levels[level as keyof typeof levels] || `Grade ${level}`;
  };

  const getAcademicYears = () => {
    const currentYear = new Date().getFullYear();
    return [
      `${currentYear}`,
      `${currentYear + 1}`,
      `${currentYear - 1}`,
      `${currentYear}/${currentYear + 1}`,
      `${currentYear - 1}/${currentYear}`
    ];
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Class Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="list" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="list">My Classes</TabsTrigger>
              <TabsTrigger value="create" disabled={!canCreateClasses()}>
                Create New Class
              </TabsTrigger>
            </TabsList>

            {/* Classes List Tab */}
            <TabsContent value="list" className="space-y-4">
              <div className="grid gap-4">
                <h3 className="text-lg font-medium">Your Classes</h3>
                {classes.length === 0 ? (
                  <div className="text-center py-8">
                    <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No classes assigned yet.</p>
                    {canCreateClasses() && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Create your first class using the "Create New Class" tab.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {classes.map((classItem: any) => (
                      <div
                        key={classItem.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <GraduationCap className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium">{classItem.class_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {getClassLevelName(classItem.class_level)} • {classItem.academic_year}
                            </div>
                            {classItem.school_name && (
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <School className="h-3 w-3" />
                                {classItem.school_name}
                              </div>
                            )}
                            {classItem.student_count !== undefined && (
                              <div className="text-xs text-blue-600 flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {classItem.student_count} students
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {getClassLevelName(classItem.class_level)}
                          </Badge>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedClass(classItem)}
                              >
                                Manage Students
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl">
                              <DialogHeader>
                                <DialogTitle>
                                  {classItem.class_name} - Student Management
                                </DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <Label>Class Level</Label>
                                    <p className="font-medium">{getClassLevelName(classItem.class_level)}</p>
                                  </div>
                                  <div>
                                    <Label>Academic Year</Label>
                                    <p className="font-medium">{classItem.academic_year}</p>
                                  </div>
                                  <div>
                                    <Label>Students</Label>
                                    <p className="font-medium">{classItem.student_count || 0} students</p>
                                  </div>
                                </div>
                                
                                {/* Student management will be handled by StudentManagement component */}
                                <div className="border-t pt-4">
                                  <p className="text-muted-foreground">
                                    Student management component will be loaded here.
                                  </p>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Create Class Tab */}
            <TabsContent value="create" className="space-y-4">
              {!canCreateClasses() ? (
                <div className="text-center py-8">
                  <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Access Restricted</h3>
                  <p className="text-muted-foreground">
                    Only Teachers and above can create classes.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="class_name">Class Name *</Label>
                      <Input
                        id="class_name"
                        type="text"
                        value={formData.class_name}
                        onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                        placeholder="e.g., Mathematics A, English 1A"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="class_level">Grade Level *</Label>
                      <Select
                        value={formData.class_level.toString()}
                        onValueChange={(value) => setFormData({ ...formData, class_level: parseInt(value) })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select grade level" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => i + 1).map((level) => (
                            <SelectItem key={level} value={level.toString()}>
                              {getClassLevelName(level)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="school">School *</Label>
                      <Select
                        value={formData.school_id.toString()}
                        onValueChange={(value) => setFormData({ ...formData, school_id: parseInt(value) })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select school" />
                        </SelectTrigger>
                        <SelectContent>
                          {schools.map((school: any) => (
                            <SelectItem key={school.id} value={school.id.toString()}>
                              {school.school_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="academic_year">Academic Year *</Label>
                      <Select
                        value={formData.academic_year}
                        onValueChange={(value) => setFormData({ ...formData, academic_year: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select academic year" />
                        </SelectTrigger>
                        <SelectContent>
                          {getAcademicYears().map((year) => (
                            <SelectItem key={year} value={year}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="subject">Subject (Optional)</Label>
                      <Input
                        id="subject"
                        type="text"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        placeholder="e.g., Mathematics, English, Science"
                      />
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-medium text-green-900 mb-2 flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Class Creation Guidelines
                    </h4>
                    <div className="text-sm text-green-800 space-y-1">
                      <p>• Choose a descriptive class name that includes subject and section</p>
                      <p>• Select the appropriate grade level for your students</p>
                      <p>• After creating, you can add students and manage their transcripts</p>
                      <p>• Academic year helps organize classes by term</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button type="submit" disabled={loading} className="flex-1">
                      <Plus className="h-4 w-4 mr-2" />
                      {loading ? 'Creating Class...' : 'Create Class'}
                    </Button>
                  </div>
                </form>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}