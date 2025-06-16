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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, UserPlus, GraduationCap, Calendar, FileText, Edit, Save, X } from 'lucide-react';
import { DatabaseService } from '@/lib/database';
import { toast } from 'sonner';

interface StudentManagementProps {
  classId: number;
  className: string;
  currentUser: {
    id: number;
    role: string;
    username: string;
  };
  onStudentAdded?: () => void;
}

interface StudentFormData {
  student_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  parent_name?: string;
  parent_phone?: string;
  address?: string;
}

interface TranscriptData {
  month: string;
  year: string;
  reading_level: string;
  math_level: string;
  attendance: number;
  behavior_score: number;
  notes: string;
}

export function StudentManagement({ 
  classId,
  className,
  currentUser, 
  onStudentAdded 
}: StudentManagementProps) {
  const [formData, setFormData] = useState<StudentFormData>({
    student_id: '',
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: '',
    parent_name: '',
    parent_phone: '',
    address: ''
  });

  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [transcripts, setTranscripts] = useState([]);
  const [newTranscript, setNewTranscript] = useState<TranscriptData>({
    month: new Date().toISOString().slice(0, 7), // YYYY-MM format
    year: new Date().getFullYear().toString(),
    reading_level: '',
    math_level: '',
    attendance: 0,
    behavior_score: 0,
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [editingTranscript, setEditingTranscript] = useState<any>(null);

  useEffect(() => {
    if (classId) {
      loadStudents();
    }
  }, [classId]);

  useEffect(() => {
    if (selectedStudent) {
      loadStudentTranscripts(selectedStudent.id);
    }
  }, [selectedStudent]);

  const loadStudents = async () => {
    try {
      const studentsData = await DatabaseService.getAccessibleStudents(currentUser.id, { classId });
      setStudents(studentsData);
    } catch (error) {
      console.error('Error loading students:', error);
      toast.error('Failed to load students');
    }
  };

  const loadStudentTranscripts = async (studentId: number) => {
    try {
      const transcriptsData = await DatabaseService.getStudentTranscripts(studentId);
      setTranscripts(transcriptsData);
    } catch (error) {
      console.error('Error loading transcripts:', error);
      toast.error('Failed to load student transcripts');
    }
  };

  const generateStudentId = () => {
    const year = new Date().getFullYear().toString().slice(-2);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `STU${year}${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.student_id || !formData.first_name || !formData.last_name) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const studentData = {
        ...formData,
        class_id: classId,
        school_id: 1, // This should come from the class info
        created_by: currentUser.id
      };

      const result = await DatabaseService.createStudent(studentData);
      
      if (result) {
        toast.success('Student added successfully');
        
        // Reset form
        setFormData({
          student_id: '',
          first_name: '',
          last_name: '',
          date_of_birth: '',
          gender: '',
          parent_name: '',
          parent_phone: '',
          address: ''
        });

        onStudentAdded?.();
        loadStudents(); // Refresh the students list
      } else {
        toast.error('Failed to add student');
      }
    } catch (error) {
      console.error('Error adding student:', error);
      toast.error('Failed to add student');
    } finally {
      setLoading(false);
    }
  };

  const handleTranscriptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStudent || !newTranscript.reading_level || !newTranscript.math_level) {
      toast.error('Please fill in all required transcript fields');
      return;
    }

    setLoading(true);
    try {
      const transcriptData = {
        ...newTranscript,
        student_id: selectedStudent.id,
        created_by: currentUser.id
      };

      const result = await DatabaseService.saveStudentTranscript(selectedStudent.id, transcriptData);
      
      if (result) {
        toast.success('Transcript saved successfully');
        
        // Reset form
        setNewTranscript({
          month: new Date().toISOString().slice(0, 7),
          year: new Date().getFullYear().toString(),
          reading_level: '',
          math_level: '',
          attendance: 0,
          behavior_score: 0,
          notes: ''
        });

        loadStudentTranscripts(selectedStudent.id); // Refresh transcripts
      } else {
        toast.error('Failed to save transcript');
      }
    } catch (error) {
      console.error('Error saving transcript:', error);
      toast.error('Failed to save transcript');
    } finally {
      setLoading(false);
    }
  };

  const canManageStudents = () => {
    return ['admin', 'director', 'partner', 'teacher', 'coordinator'].includes(currentUser.role);
  };

  const getReadingLevels = () => [
    'Pre-A', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'
  ];

  const getMathLevels = () => [
    'Beginner', 'Elementary', 'Intermediate', 'Advanced', 'Expert'
  ];

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  const getMonthName = (monthString: string) => {
    if (!monthString) return '';
    const [year, month] = monthString.split('-');
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Students in {className}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="list" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="list">Student List</TabsTrigger>
              <TabsTrigger value="add" disabled={!canManageStudents()}>
                Add New Student
              </TabsTrigger>
            </TabsList>

            {/* Students List Tab */}
            <TabsContent value="list" className="space-y-4">
              <div className="grid gap-4">
                {students.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No students in this class yet.</p>
                    {canManageStudents() && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Add your first student using the "Add New Student" tab.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {students.map((student: any) => (
                      <div
                        key={student.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <GraduationCap className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <div className="font-medium">
                              {student.first_name} {student.last_name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              ID: {student.student_id}
                            </div>
                            {student.date_of_birth && (
                              <div className="text-xs text-muted-foreground">
                                Born: {formatDate(student.date_of_birth)}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize">
                            {student.gender || 'Not specified'}
                          </Badge>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedStudent(student)}
                              >
                                Manage Transcripts
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>
                                  {student.first_name} {student.last_name} - Academic Transcripts
                                </DialogTitle>
                              </DialogHeader>
                              <div className="space-y-6">
                                {/* Student Info */}
                                <div className="grid grid-cols-3 gap-4 text-sm bg-gray-50 p-4 rounded-lg">
                                  <div>
                                    <Label>Student ID</Label>
                                    <p className="font-medium">{student.student_id}</p>
                                  </div>
                                  <div>
                                    <Label>Date of Birth</Label>
                                    <p className="font-medium">{formatDate(student.date_of_birth)}</p>
                                  </div>
                                  <div>
                                    <Label>Gender</Label>
                                    <p className="font-medium capitalize">{student.gender || 'Not specified'}</p>
                                  </div>
                                </div>

                                {/* Add New Transcript */}
                                <Card>
                                  <CardHeader>
                                    <CardTitle className="text-lg">Add Monthly Transcript</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <form onSubmit={handleTranscriptSubmit} className="space-y-4">
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div>
                                          <Label htmlFor="month">Month *</Label>
                                          <Input
                                            id="month"
                                            type="month"
                                            value={newTranscript.month}
                                            onChange={(e) => setNewTranscript({ ...newTranscript, month: e.target.value })}
                                            required
                                          />
                                        </div>

                                        <div>
                                          <Label htmlFor="reading_level">Reading Level *</Label>
                                          <Select
                                            value={newTranscript.reading_level}
                                            onValueChange={(value) => setNewTranscript({ ...newTranscript, reading_level: value })}
                                          >
                                            <SelectTrigger>
                                              <SelectValue placeholder="Select level" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {getReadingLevels().map((level) => (
                                                <SelectItem key={level} value={level}>
                                                  Level {level}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>

                                        <div>
                                          <Label htmlFor="math_level">Math Level *</Label>
                                          <Select
                                            value={newTranscript.math_level}
                                            onValueChange={(value) => setNewTranscript({ ...newTranscript, math_level: value })}
                                          >
                                            <SelectTrigger>
                                              <SelectValue placeholder="Select level" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {getMathLevels().map((level) => (
                                                <SelectItem key={level} value={level}>
                                                  {level}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>

                                        <div>
                                          <Label htmlFor="attendance">Attendance (%)</Label>
                                          <Input
                                            id="attendance"
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={newTranscript.attendance}
                                            onChange={(e) => setNewTranscript({ ...newTranscript, attendance: parseInt(e.target.value) || 0 })}
                                          />
                                        </div>

                                        <div>
                                          <Label htmlFor="behavior_score">Behavior Score (1-5)</Label>
                                          <Input
                                            id="behavior_score"
                                            type="number"
                                            min="1"
                                            max="5"
                                            value={newTranscript.behavior_score}
                                            onChange={(e) => setNewTranscript({ ...newTranscript, behavior_score: parseInt(e.target.value) || 0 })}
                                          />
                                        </div>

                                        <div className="md:col-span-3">
                                          <Label htmlFor="notes">Notes</Label>
                                          <Input
                                            id="notes"
                                            type="text"
                                            value={newTranscript.notes}
                                            onChange={(e) => setNewTranscript({ ...newTranscript, notes: e.target.value })}
                                            placeholder="Additional notes about student progress"
                                          />
                                        </div>
                                      </div>

                                      <Button type="submit" disabled={loading}>
                                        <Save className="h-4 w-4 mr-2" />
                                        {loading ? 'Saving...' : 'Save Transcript'}
                                      </Button>
                                    </form>
                                  </CardContent>
                                </Card>

                                {/* Existing Transcripts */}
                                <Card>
                                  <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                      <FileText className="h-5 w-5" />
                                      Academic History
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    {transcripts.length === 0 ? (
                                      <p className="text-muted-foreground text-center py-4">
                                        No transcripts recorded yet.
                                      </p>
                                    ) : (
                                      <div className="overflow-x-auto">
                                        <Table>
                                          <TableHeader>
                                            <TableRow>
                                              <TableHead>Month</TableHead>
                                              <TableHead>Reading Level</TableHead>
                                              <TableHead>Math Level</TableHead>
                                              <TableHead>Attendance</TableHead>
                                              <TableHead>Behavior</TableHead>
                                              <TableHead>Notes</TableHead>
                                              <TableHead>Actions</TableHead>
                                            </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                            {transcripts.map((transcript: any) => (
                                              <TableRow key={transcript.id}>
                                                <TableCell>{getMonthName(transcript.month)}</TableCell>
                                                <TableCell>
                                                  <Badge variant="outline">
                                                    Level {transcript.reading_level}
                                                  </Badge>
                                                </TableCell>
                                                <TableCell>
                                                  <Badge variant="outline">
                                                    {transcript.math_level}
                                                  </Badge>
                                                </TableCell>
                                                <TableCell>{transcript.attendance}%</TableCell>
                                                <TableCell>{transcript.behavior_score}/5</TableCell>
                                                <TableCell className="max-w-xs truncate">
                                                  {transcript.notes}
                                                </TableCell>
                                                <TableCell>
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setEditingTranscript(transcript)}
                                                  >
                                                    <Edit className="h-4 w-4" />
                                                  </Button>
                                                </TableCell>
                                              </TableRow>
                                            ))}
                                          </TableBody>
                                        </Table>
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
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

            {/* Add Student Tab */}
            <TabsContent value="add" className="space-y-4">
              {!canManageStudents() ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Access Restricted</h3>
                  <p className="text-muted-foreground">
                    Only Teachers and above can add students.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="student_id">Student ID *</Label>
                      <div className="flex gap-2">
                        <Input
                          id="student_id"
                          type="text"
                          value={formData.student_id}
                          onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                          placeholder="STU24001"
                          required
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setFormData({ ...formData, student_id: generateStudentId() })}
                        >
                          Generate
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="first_name">First Name *</Label>
                      <Input
                        id="first_name"
                        type="text"
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        placeholder="John"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="last_name">Last Name *</Label>
                      <Input
                        id="last_name"
                        type="text"
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        placeholder="Doe"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="date_of_birth">Date of Birth</Label>
                      <Input
                        id="date_of_birth"
                        type="date"
                        value={formData.date_of_birth}
                        onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="gender">Gender</Label>
                      <Select
                        value={formData.gender}
                        onValueChange={(value) => setFormData({ ...formData, gender: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="parent_name">Parent/Guardian Name</Label>
                      <Input
                        id="parent_name"
                        type="text"
                        value={formData.parent_name}
                        onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                        placeholder="Jane Doe"
                      />
                    </div>

                    <div>
                      <Label htmlFor="parent_phone">Parent/Guardian Phone</Label>
                      <Input
                        id="parent_phone"
                        type="tel"
                        value={formData.parent_phone}
                        onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                        placeholder="+1234567890"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Full address"
                      />
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Student Information</h4>
                    <div className="text-sm text-blue-800 space-y-1">
                      <p>• Student will be automatically assigned to this class: <strong>{className}</strong></p>
                      <p>• You can add monthly transcripts after creating the student</p>
                      <p>• Generate a unique Student ID or create your own</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button type="submit" disabled={loading} className="flex-1">
                      <UserPlus className="h-4 w-4 mr-2" />
                      {loading ? 'Adding Student...' : 'Add Student'}
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