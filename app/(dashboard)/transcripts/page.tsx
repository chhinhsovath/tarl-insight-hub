'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Plus, Search, Download, Edit, Trash2, Filter, BarChart3, FileText, Users, Calculator } from 'lucide-react';
import { ActionPermissionWrapper } from '@/components/action-permission-wrapper';

interface Transcript {
  id: number;
  student_id: number;
  student_name: string;
  student_code: string;
  class_id: number;
  class_name: string;
  academic_year: string;
  subject: string;
  assessment_period: string;
  assessment_month: string;
  score: number;
  grade: string;
  remarks: string;
  teacher_name: string;
  is_final: boolean;
  created_at: string;
  letter_grade: string;
  grade_point: number;
  grade_description: string;
}

interface TranscriptStats {
  total_entries: number;
  total_students: number;
  total_subjects: number;
  average_score: number;
  final_entries: number;
}

interface Student {
  id: number;
  student_name: string;
  student_id: string;
  class_id: number;
  school_id: number;
}

interface Class {
  id: number;
  class_name: string;
  academic_year: string;
  teacher_id: number;
  school_id: number;
}

interface Subject {
  id: number;
  subject_code: string;
  subject_name: string;
  subject_name_kh: string;
}

export default function TranscriptsPage() {
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<TranscriptStats | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  
  // Filters
  const [filters, setFilters] = useState({
    studentId: '',
    classId: '',
    academicYear: '',
    subject: '',
    assessmentPeriod: '',
    search: ''
  });

  // Pagination
  const [pagination, setPagination] = useState({
    limit: 50,
    offset: 0,
    total: 0,
    currentPage: 1,
    totalPages: 0
  });

  // Form state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTranscript, setSelectedTranscript] = useState<Transcript | null>(null);
  const [formData, setFormData] = useState({
    student_id: '',
    class_id: '',
    academic_year: '',
    subject: '',
    assessment_period: '',
    assessment_month: '',
    score: '',
    grade: '',
    remarks: '',
    teacher_id: '',
    is_final: false
  });

  const assessmentPeriods = [
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'semester', label: 'Semester' },
    { value: 'final', label: 'Final' }
  ];

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
    'Q1', 'Q2', 'Q3', 'Q4', 'Semester 1', 'Semester 2', 'Final'
  ];

  useEffect(() => {
    fetchTranscripts();
    fetchStats();
    fetchStudents();
    fetchClasses();
    fetchSubjects();
  }, [filters, pagination.offset]);

  const fetchTranscripts = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: pagination.offset.toString(),
        ...(filters.studentId && { studentId: filters.studentId }),
        ...(filters.classId && { classId: filters.classId }),
        ...(filters.academicYear && { academicYear: filters.academicYear }),
        ...(filters.subject && { subject: filters.subject }),
        ...(filters.assessmentPeriod && { assessmentPeriod: filters.assessmentPeriod })
      });

      const response = await fetch(`/api/transcripts?${query}`);
      if (!response.ok) throw new Error('Failed to fetch transcripts');
      
      const data = await response.json();
      setTranscripts(data.transcripts || []);
      setPagination(prev => ({
        ...prev,
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 0,
        currentPage: data.pagination?.currentPage || 1
      }));
    } catch (error) {
      console.error('Error fetching transcripts:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch transcripts',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const query = new URLSearchParams({
        ...(filters.academicYear && { academicYear: filters.academicYear }),
        ...(filters.classId && { classId: filters.classId })
      });

      const response = await fetch(`/api/transcripts/stats?${query}`);
      if (!response.ok) throw new Error('Failed to fetch stats');
      
      const data = await response.json();
      setStats(data.overallStats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/data/students');
      if (!response.ok) throw new Error('Failed to fetch students');
      
      const data = await response.json();
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/data/classes');
      if (!response.ok) throw new Error('Failed to fetch classes');
      
      const data = await response.json();
      setClasses(data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await fetch('/api/data/subjects');
      if (!response.ok) throw new Error('Failed to fetch subjects');
      
      const data = await response.json();
      setSubjects(data || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const handleCreateTranscript = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/transcripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          student_id: parseInt(formData.student_id),
          class_id: parseInt(formData.class_id),
          score: formData.score ? parseFloat(formData.score) : null,
          teacher_id: formData.teacher_id ? parseInt(formData.teacher_id) : null
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create transcript');
      }

      toast({
        title: 'Success',
        description: 'Transcript created successfully'
      });

      setIsCreateDialogOpen(false);
      resetForm();
      fetchTranscripts();
      fetchStats();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleUpdateTranscript = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTranscript) return;

    try {
      const response = await fetch(`/api/transcripts/${selectedTranscript.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score: formData.score ? parseFloat(formData.score) : null,
          grade: formData.grade,
          remarks: formData.remarks,
          teacher_id: formData.teacher_id ? parseInt(formData.teacher_id) : null,
          is_final: formData.is_final
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update transcript');
      }

      toast({
        title: 'Success',
        description: 'Transcript updated successfully'
      });

      setIsEditDialogOpen(false);
      setSelectedTranscript(null);
      resetForm();
      fetchTranscripts();
      fetchStats();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleDeleteTranscript = async (transcriptId: number) => {
    if (!confirm('Are you sure you want to delete this transcript?')) return;

    try {
      const response = await fetch(`/api/transcripts/${transcriptId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete transcript');
      }

      toast({
        title: 'Success',
        description: 'Transcript deleted successfully'
      });

      fetchTranscripts();
      fetchStats();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleExportReport = async (type: 'student' | 'class' | 'subject' | 'period') => {
    try {
      const query = new URLSearchParams({
        type,
        format: 'csv',
        ...(filters.studentId && { studentId: filters.studentId }),
        ...(filters.classId && { classId: filters.classId }),
        ...(filters.academicYear && { academicYear: filters.academicYear }),
        ...(filters.subject && { subject: filters.subject }),
        ...(filters.assessmentPeriod && { assessmentPeriod: filters.assessmentPeriod })
      });

      const response = await fetch(`/api/transcripts/reports?${query}`);
      if (!response.ok) throw new Error('Failed to generate report');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${type}-report-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Success',
        description: `${type} report exported successfully`
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export report',
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      student_id: '',
      class_id: '',
      academic_year: '',
      subject: '',
      assessment_period: '',
      assessment_month: '',
      score: '',
      grade: '',
      remarks: '',
      teacher_id: '',
      is_final: false
    });
  };

  const openEditDialog = (transcript: Transcript) => {
    setSelectedTranscript(transcript);
    setFormData({
      student_id: transcript.student_id.toString(),
      class_id: transcript.class_id.toString(),
      academic_year: transcript.academic_year,
      subject: transcript.subject,
      assessment_period: transcript.assessment_period,
      assessment_month: transcript.assessment_month,
      score: transcript.score?.toString() || '',
      grade: transcript.grade || '',
      remarks: transcript.remarks || '',
      teacher_id: transcript.teacher_name ? '1' : '', // You'd need to map this properly
      is_final: transcript.is_final
    });
    setIsEditDialogOpen(true);
  };

  const getGradeBadgeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'bg-green-500';
      case 'B': return 'bg-blue-500';
      case 'C': return 'bg-yellow-500';
      case 'D': return 'bg-orange-500';
      case 'F': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <ActionPermissionWrapper pageName="transcript-entry" action="view">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Transcript Management</h1>
            <p className="text-muted-foreground">
              Manage student grades and academic transcripts
            </p>
          </div>
          <ActionPermissionWrapper pageName="transcript-entry" action="create">
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Grade Entry
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Grade Entry</DialogTitle>
                  <DialogDescription>
                    Add a new grade entry for a student
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateTranscript} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="student_id">Student</Label>
                      <Select value={formData.student_id} onValueChange={(value) => setFormData(prev => ({ ...prev, student_id: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select student" />
                        </SelectTrigger>
                        <SelectContent>
                          {students.map((student) => (
                            <SelectItem key={student.id} value={student.id.toString()}>
                              {student.student_name} ({student.student_id})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="class_id">Class</Label>
                      <Select value={formData.class_id} onValueChange={(value) => setFormData(prev => ({ ...prev, class_id: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                        <SelectContent>
                          {classes.map((cls) => (
                            <SelectItem key={cls.id} value={cls.id.toString()}>
                              {cls.class_name} ({cls.academic_year})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="academic_year">Academic Year</Label>
                      <Input
                        id="academic_year"
                        value={formData.academic_year}
                        onChange={(e) => setFormData(prev => ({ ...prev, academic_year: e.target.value }))}
                        placeholder="2024-2025"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        value={formData.subject}
                        onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                        placeholder="Mathematics"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="assessment_period">Assessment Period</Label>
                      <Select value={formData.assessment_period} onValueChange={(value) => setFormData(prev => ({ ...prev, assessment_period: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                        <SelectContent>
                          {assessmentPeriods.map((period) => (
                            <SelectItem key={period.value} value={period.value}>
                              {period.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="assessment_month">Assessment Month</Label>
                      <Select value={formData.assessment_month} onValueChange={(value) => setFormData(prev => ({ ...prev, assessment_month: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select month" />
                        </SelectTrigger>
                        <SelectContent>
                          {months.map((month) => (
                            <SelectItem key={month} value={month}>
                              {month}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="score">Score</Label>
                      <Input
                        id="score"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={formData.score}
                        onChange={(e) => setFormData(prev => ({ ...prev, score: e.target.value }))}
                        placeholder="85.5"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="grade">Grade (Optional)</Label>
                      <Input
                        id="grade"
                        value={formData.grade}
                        onChange={(e) => setFormData(prev => ({ ...prev, grade: e.target.value }))}
                        placeholder="A"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="remarks">Remarks</Label>
                    <Textarea
                      id="remarks"
                      value={formData.remarks}
                      onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                      placeholder="Additional notes..."
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_final"
                      checked={formData.is_final}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_final: e.target.checked }))}
                    />
                    <Label htmlFor="is_final">Final Grade</Label>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Create Entry</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </ActionPermissionWrapper>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_entries}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_students}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Subjects</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_subjects}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                <Calculator className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.average_score?.toFixed(1) || 'N/A'}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Final Grades</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.final_entries}</div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="transcripts" className="space-y-4">
          <TabsList>
            <TabsTrigger value="transcripts">Grade Entries</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="transcripts" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Filters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div className="space-y-2">
                    <Label>Student</Label>
                    <Select value={filters.studentId} onValueChange={(value) => setFilters(prev => ({ ...prev, studentId: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="All students" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All students</SelectItem>
                        {students.map((student) => (
                          <SelectItem key={student.id} value={student.id.toString()}>
                            {student.student_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Class</Label>
                    <Select value={filters.classId} onValueChange={(value) => setFilters(prev => ({ ...prev, classId: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="All classes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All classes</SelectItem>
                        {classes.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id.toString()}>
                            {cls.class_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Academic Year</Label>
                    <Input
                      value={filters.academicYear}
                      onChange={(e) => setFilters(prev => ({ ...prev, academicYear: e.target.value }))}
                      placeholder="2024-2025"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Subject</Label>
                    <Input
                      value={filters.subject}
                      onChange={(e) => setFilters(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="Subject name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Assessment Period</Label>
                    <Select value={filters.assessmentPeriod} onValueChange={(value) => setFilters(prev => ({ ...prev, assessmentPeriod: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="All periods" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All periods</SelectItem>
                        {assessmentPeriods.map((period) => (
                          <SelectItem key={period.value} value={period.value}>
                            {period.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>&nbsp;</Label>
                    <Button
                      variant="outline"
                      onClick={() => setFilters({
                        studentId: '',
                        classId: '',
                        academicYear: '',
                        subject: '',
                        assessmentPeriod: '',
                        search: ''
                      })}
                      className="w-full"
                    >
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transcripts Table */}
            <Card>
              <CardHeader>
                <CardTitle>Grade Entries</CardTitle>
                <CardDescription>
                  Showing {transcripts.length} of {pagination.total} entries
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Final</TableHead>
                      <TableHead>Teacher</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center">Loading...</TableCell>
                      </TableRow>
                    ) : transcripts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center">No grade entries found</TableCell>
                      </TableRow>
                    ) : (
                      transcripts.map((transcript) => (
                        <TableRow key={transcript.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{transcript.student_name}</div>
                              <div className="text-sm text-muted-foreground">{transcript.student_code}</div>
                            </div>
                          </TableCell>
                          <TableCell>{transcript.class_name}</TableCell>
                          <TableCell>{transcript.subject}</TableCell>
                          <TableCell>
                            <div>
                              <div>{transcript.assessment_period}</div>
                              <div className="text-sm text-muted-foreground">{transcript.assessment_month}</div>
                            </div>
                          </TableCell>
                          <TableCell>{transcript.score?.toFixed(1) || 'N/A'}</TableCell>
                          <TableCell>
                            {transcript.letter_grade && (
                              <Badge className={`${getGradeBadgeColor(transcript.letter_grade)} text-white`}>
                                {transcript.letter_grade}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {transcript.is_final && (
                              <Badge variant="secondary">Final</Badge>
                            )}
                          </TableCell>
                          <TableCell>{transcript.teacher_name || 'N/A'}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <ActionPermissionWrapper pageName="transcript-entry" action="update">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openEditDialog(transcript)}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                              </ActionPermissionWrapper>
                              <ActionPermissionWrapper pageName="transcript-entry" action="delete">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteTranscript(transcript.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </ActionPermissionWrapper>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between space-x-2 py-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {pagination.offset + 1} to {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total} entries
                    </div>
                    <div className="space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPagination(prev => ({ ...prev, offset: Math.max(0, prev.offset - prev.limit) }))}
                        disabled={pagination.offset === 0}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPagination(prev => ({ ...prev, offset: prev.offset + prev.limit }))}
                        disabled={pagination.currentPage >= pagination.totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Student Report</CardTitle>
                  <CardDescription>Individual student performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => handleExportReport('student')}
                    disabled={!filters.studentId}
                    className="w-full"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export Student Report
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Class Report</CardTitle>
                  <CardDescription>Class performance overview</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => handleExportReport('class')}
                    disabled={!filters.classId}
                    className="w-full"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export Class Report
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Subject Report</CardTitle>
                  <CardDescription>Subject performance analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => handleExportReport('subject')}
                    disabled={!filters.subject}
                    className="w-full"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export Subject Report
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Period Report</CardTitle>
                  <CardDescription>Assessment period analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => handleExportReport('period')}
                    disabled={!filters.assessmentPeriod}
                    className="w-full"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export Period Report
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Grade Entry</DialogTitle>
              <DialogDescription>
                Update the grade entry for {selectedTranscript?.student_name}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateTranscript} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_score">Score</Label>
                  <Input
                    id="edit_score"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.score}
                    onChange={(e) => setFormData(prev => ({ ...prev, score: e.target.value }))}
                    placeholder="85.5"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_grade">Grade</Label>
                  <Input
                    id="edit_grade"
                    value={formData.grade}
                    onChange={(e) => setFormData(prev => ({ ...prev, grade: e.target.value }))}
                    placeholder="A"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_remarks">Remarks</Label>
                <Textarea
                  id="edit_remarks"
                  value={formData.remarks}
                  onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                  placeholder="Additional notes..."
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit_is_final"
                  checked={formData.is_final}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_final: e.target.checked }))}
                />
                <Label htmlFor="edit_is_final">Final Grade</Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Update Entry</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </ActionPermissionWrapper>
  );
}