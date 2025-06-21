"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  BookOpen, 
  Users, 
  Search,
  Filter,
  RefreshCw,
  School,
  User
} from "lucide-react";
import { useGlobalLanguage } from "@/lib/global-language-context";
import { useAuth } from "@/lib/auth-context";

interface Class {
  id: number;
  class_name: string;
  academic_year: string;
  grade_level: string;
  teacher_id: number;
  school_id: number;
  student_count: number;
  room_number: string;
  schedule_info: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  school_name: string;
  school_code: string;
  teacher_first_name: string;
  teacher_last_name: string;
}

interface School {
  id: number;
  name: string;
  code: string;
}

interface Teacher {
  id: number;
  teacher_name: string;
  teacher_id: string;
  school_id: number;
}

export default function ClassesPage() {
  const { language } = useGlobalLanguage();
  const { } = useAuth();
  const isKhmer = language === 'kh';
  
  const [classes, setClasses] = useState<Class[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Filters
  const [schoolFilter, setSchoolFilter] = useState('all');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage] = useState(1);
  
  // Form data
  const [formData, setFormData] = useState({
    class_name: '',
    academic_year: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
    grade_level: '',
    teacher_id: '',
    school_id: '',
    room_number: '',
    schedule_info: ''
  });

  useEffect(() => {
    loadClasses();
    loadSchools();
    loadTeachers();
  }, [schoolFilter, gradeFilter, searchTerm, currentPage]);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        search: searchTerm
      });

      if (schoolFilter !== 'all') {
        params.set('schoolId', schoolFilter);
      }

      const response = await fetch(`/api/data/classes?${params}`);
      const result = await response.json();

      if (response.ok) {
        setClasses(Array.isArray(result) ? result : []);
      } else {
        toast.error(result.error || (isKhmer ? "មិនអាចទាញយកទិន្នន័យបានទេ" : "Failed to load data"));
      }
    } catch (error) {
      console.error("Error loading classes:", error);
      toast.error(isKhmer ? "មានបញ្ហាក្នុងការទាក់ទងម៉ាស៊ីនមេ" : "Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const loadSchools = async () => {
    try {
      const response = await fetch('/api/data/schools');
      const result = await response.json();
      if (response.ok) {
        setSchools(Array.isArray(result.data) ? result.data : []);
      }
    } catch (error) {
      console.error("Error loading schools:", error);
    }
  };

  const loadTeachers = async () => {
    try {
      const response = await fetch('/api/teachers?status=approved');
      const result = await response.json();
      if (response.ok) {
        setTeachers(Array.isArray(result.data) ? result.data : []);
      }
    } catch (error) {
      console.error("Error loading teachers:", error);
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setActionLoading(true);
    
    try {
      const response = await fetch('/api/data/classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(isKhmer ? "ថ្នាក់ត្រូវបានបន្ថែមរួចរាល់" : "Class added successfully");
        setShowCreateModal(false);
        resetForm();
        loadClasses();
      } else {
        toast.error(result.error || (isKhmer ? "មានបញ្ហាក្នុងការបន្ថែមថ្នាក់" : "Failed to add class"));
      }
    } catch (error) {
      console.error("Create class error:", error);
      toast.error(isKhmer ? "មានបញ្ហាក្នុងការទាក់ទងម៉ាស៊ីនមេ" : "Network error occurred");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedClass || !validateForm()) return;

    setActionLoading(true);
    
    try {
      const response = await fetch(`/api/data/classes/${selectedClass.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(isKhmer ? "ព័ត៌មានថ្នាក់ត្រូវបានកែប្រែរួចរាល់" : "Class updated successfully");
        setShowEditModal(false);
        resetForm();
        loadClasses();
      } else {
        toast.error(result.error || (isKhmer ? "មានបញ្ហាក្នុងការកែប្រែ" : "Failed to update class"));
      }
    } catch (error) {
      console.error("Update class error:", error);
      toast.error(isKhmer ? "មានបញ្ហាក្នុងការទាក់ទងម៉ាស៊ីនមេ" : "Network error occurred");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteClass = async (classItem: Class) => {
    if (!confirm(isKhmer ? `តើអ្នកប្រាកដថាចង់លុបថ្នាក់ "${classItem.class_name}" មែនទេ?` : `Are you sure you want to delete class "${classItem.class_name}"?`)) {
      return;
    }

    setActionLoading(true);
    
    try {
      const response = await fetch(`/api/data/classes/${classItem.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(isKhmer ? "ថ្នាក់ត្រូវបានលុបរួចរាល់" : "Class deleted successfully");
        loadClasses();
      } else {
        toast.error(result.error || (isKhmer ? "មានបញ្ហាក្នុងការលុប" : "Failed to delete class"));
      }
    } catch (error) {
      console.error("Delete class error:", error);
      toast.error(isKhmer ? "មានបញ្ហាក្នុងការទាក់ទងម៉ាស៊ីនមេ" : "Network error occurred");
    } finally {
      setActionLoading(false);
    }
  };

  const validateForm = () => {
    const required = [
      { field: formData.class_name, name: isKhmer ? "ឈ្មោះថ្នាក់" : "Class Name" },
      { field: formData.grade_level, name: isKhmer ? "ថ្នាក់ទី" : "Grade Level" },
      { field: formData.school_id, name: isKhmer ? "សាលា" : "School" },
      { field: formData.academic_year, name: isKhmer ? "ឆ្នាំសិក្សា" : "Academic Year" }
    ];

    for (const item of required) {
      if (!item.field?.trim()) {
        toast.error(`${isKhmer ? "សូមបញ្ចូល" : "Please enter"} ${item.name}`);
        return false;
      }
    }

    return true;
  };

  const resetForm = () => {
    setFormData({
      class_name: '',
      academic_year: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
      grade_level: '',
      teacher_id: '',
      school_id: '',
      room_number: '',
      schedule_info: ''
    });
    setSelectedClass(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (classItem: Class) => {
    setSelectedClass(classItem);
    setFormData({
      class_name: classItem.class_name,
      academic_year: classItem.academic_year,
      grade_level: classItem.grade_level,
      teacher_id: classItem.teacher_id?.toString() || '',
      school_id: classItem.school_id?.toString() || '',
      room_number: classItem.room_number || '',
      schedule_info: classItem.schedule_info || ''
    });
    setShowEditModal(true);
  };

  const viewDetails = (classItem: Class) => {
    setSelectedClass(classItem);
    setShowDetailsModal(true);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getGradeLevels = () => [
    'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6',
    'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'
  ];

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {isKhmer ? "ការគ្រប់គ្រងថ្នាក់" : "Class Management"}
            </h1>
            <p className="text-gray-600">
              {isKhmer ? "គ្រប់គ្រងថ្នាក់រៀននៅក្នុងសាលា" : "Manage classes in your school"}
            </p>
          </div>
          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4 mr-2" />
            {isKhmer ? "បន្ថែមថ្នាក់" : "Add Class"}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {isKhmer ? "តម្រង" : "Filters"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="school-filter">
                {isKhmer ? "សាលា" : "School"}
              </Label>
              <Select value={schoolFilter} onValueChange={setSchoolFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isKhmer ? "ទាំងអស់" : "All Schools"}</SelectItem>
                  {schools.map(school => (
                    <SelectItem key={school.id} value={school.id.toString()}>
                      {school.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="grade-filter">
                {isKhmer ? "ថ្នាក់ទី" : "Grade Level"}
              </Label>
              <Select value={gradeFilter} onValueChange={setGradeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isKhmer ? "ទាំងអស់" : "All Grades"}</SelectItem>
                  {getGradeLevels().map(grade => (
                    <SelectItem key={grade} value={grade}>
                      {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="search">
                {isKhmer ? "ស្វែងរក" : "Search"}
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={isKhmer ? "ស្វែងរកថ្នាក់..." : "Search classes..."}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex items-end">
              <Button onClick={loadClasses} variant="outline" disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {isKhmer ? "ផ្ទុកឡើងវិញ" : "Refresh"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isKhmer ? "បញ្ជីថ្នាក់" : "Classes List"}
          </CardTitle>
          <CardDescription>
            {classes.length} {isKhmer ? "ថ្នាក់" : "classes"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">{isKhmer ? "កំពុងទាញយកទិន្នន័យ..." : "Loading..."}</div>
            </div>
          ) : classes.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500">{isKhmer ? "មិនមានទិន្នន័យទេ" : "No data found"}</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isKhmer ? "ឈ្មោះថ្នាក់" : "Class Name"}</TableHead>
                    <TableHead>{isKhmer ? "ថ្នាក់ទី" : "Grade"}</TableHead>
                    <TableHead>{isKhmer ? "សាលា" : "School"}</TableHead>
                    <TableHead>{isKhmer ? "គ្រូបង្រៀន" : "Teacher"}</TableHead>
                    <TableHead>{isKhmer ? "សិស្ស" : "Students"}</TableHead>
                    <TableHead>{isKhmer ? "ឆ្នាំសិក្សា" : "Academic Year"}</TableHead>
                    <TableHead>{isKhmer ? "សកម្មភាព" : "Actions"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classes.map((classItem) => (
                    <TableRow key={classItem.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-blue-600" />
                          {classItem.class_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{classItem.grade_level}</Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{classItem.school_name}</div>
                          <div className="text-sm text-gray-500">{classItem.school_code}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {classItem.teacher_first_name ? (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {classItem.teacher_first_name} {classItem.teacher_last_name}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {classItem.student_count || 0}
                        </div>
                      </TableCell>
                      <TableCell>{classItem.academic_year}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => viewDetails(classItem)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditModal(classItem)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => handleDeleteClass(classItem)}
                            disabled={actionLoading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Class Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isKhmer ? "បន្ថែមថ្នាក់ថ្មី" : "Add New Class"}
            </DialogTitle>
            <DialogDescription>
              {isKhmer ? "បំពេញព័ត៌មានថ្នាក់ថ្មី" : "Fill in the new class information"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateClass} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="class_name">
                  {isKhmer ? "ឈ្មោះថ្នាក់" : "Class Name"} *
                </Label>
                <Input
                  id="class_name"
                  value={formData.class_name}
                  onChange={(e) => handleInputChange("class_name", e.target.value)}
                  placeholder={isKhmer ? "បញ្ចូលឈ្មោះថ្នាក់" : "Enter class name"}
                  required
                />
              </div>
              <div>
                <Label htmlFor="grade_level">
                  {isKhmer ? "ថ្នាក់ទី" : "Grade Level"} *
                </Label>
                <Select value={formData.grade_level} onValueChange={(value) => handleInputChange("grade_level", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={isKhmer ? "ជ្រើសរើសថ្នាក់ទី" : "Select grade level"} />
                  </SelectTrigger>
                  <SelectContent>
                    {getGradeLevels().map(grade => (
                      <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="school_id">
                  {isKhmer ? "សាលា" : "School"} *
                </Label>
                <Select value={formData.school_id} onValueChange={(value) => handleInputChange("school_id", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={isKhmer ? "ជ្រើសរើសសាលា" : "Select school"} />
                  </SelectTrigger>
                  <SelectContent>
                    {schools.map(school => (
                      <SelectItem key={school.id} value={school.id.toString()}>
                        {school.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="teacher_id">
                  {isKhmer ? "គ្រូបង្រៀន" : "Teacher"}
                </Label>
                <Select value={formData.teacher_id} onValueChange={(value) => handleInputChange("teacher_id", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={isKhmer ? "ជ្រើសរើសគ្រូបង្រៀន" : "Select teacher"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{isKhmer ? "គ្មានគ្រូបង្រៀន" : "No teacher assigned"}</SelectItem>
                    {teachers.map(teacher => (
                      <SelectItem key={teacher.id} value={teacher.id.toString()}>
                        {teacher.teacher_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="academic_year">
                  {isKhmer ? "ឆ្នាំសិក្សា" : "Academic Year"} *
                </Label>
                <Input
                  id="academic_year"
                  value={formData.academic_year}
                  onChange={(e) => handleInputChange("academic_year", e.target.value)}
                  placeholder="2024-2025"
                  required
                />
              </div>
              <div>
                <Label htmlFor="room_number">
                  {isKhmer ? "លេខបន្ទប់" : "Room Number"}
                </Label>
                <Input
                  id="room_number"
                  value={formData.room_number}
                  onChange={(e) => handleInputChange("room_number", e.target.value)}
                  placeholder={isKhmer ? "បញ្ចូលលេខបន្ទប់" : "Enter room number"}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="schedule_info">
                {isKhmer ? "កាលវិភាគ" : "Schedule Information"}
              </Label>
              <Input
                id="schedule_info"
                value={formData.schedule_info}
                onChange={(e) => handleInputChange("schedule_info", e.target.value)}
                placeholder={isKhmer ? "បញ្ចូលកាលវិភាគ" : "Enter schedule information"}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                {isKhmer ? "បោះបង់" : "Cancel"}
              </Button>
              <Button type="submit" disabled={actionLoading}>
                {actionLoading ? (
                  isKhmer ? "កំពុងបន្ថែម..." : "Adding..."
                ) : (
                  isKhmer ? "បន្ថែម" : "Add Class"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Class Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isKhmer ? "កែប្រែព័ត៌មានថ្នាក់" : "Edit Class Information"}
            </DialogTitle>
            <DialogDescription>
              {isKhmer ? "កែប្រែព័ត៌មានរបស់ថ្នាក់" : "Update class information"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateClass} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_class_name">
                  {isKhmer ? "ឈ្មោះថ្នាក់" : "Class Name"} *
                </Label>
                <Input
                  id="edit_class_name"
                  value={formData.class_name}
                  onChange={(e) => handleInputChange("class_name", e.target.value)}
                  placeholder={isKhmer ? "បញ្ចូលឈ្មោះថ្នាក់" : "Enter class name"}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit_grade_level">
                  {isKhmer ? "ថ្នាក់ទី" : "Grade Level"} *
                </Label>
                <Select value={formData.grade_level} onValueChange={(value) => handleInputChange("grade_level", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={isKhmer ? "ជ្រើសរើសថ្នាក់ទី" : "Select grade level"} />
                  </SelectTrigger>
                  <SelectContent>
                    {getGradeLevels().map(grade => (
                      <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_school_id">
                  {isKhmer ? "សាលា" : "School"} *
                </Label>
                <Select value={formData.school_id} onValueChange={(value) => handleInputChange("school_id", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={isKhmer ? "ជ្រើសរើសសាលា" : "Select school"} />
                  </SelectTrigger>
                  <SelectContent>
                    {schools.map(school => (
                      <SelectItem key={school.id} value={school.id.toString()}>
                        {school.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit_teacher_id">
                  {isKhmer ? "គ្រូបង្រៀន" : "Teacher"}
                </Label>
                <Select value={formData.teacher_id} onValueChange={(value) => handleInputChange("teacher_id", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={isKhmer ? "ជ្រើសរើសគ្រូបង្រៀន" : "Select teacher"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{isKhmer ? "គ្មានគ្រូបង្រៀន" : "No teacher assigned"}</SelectItem>
                    {teachers.map(teacher => (
                      <SelectItem key={teacher.id} value={teacher.id.toString()}>
                        {teacher.teacher_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_academic_year">
                  {isKhmer ? "ឆ្នាំសិក្សា" : "Academic Year"} *
                </Label>
                <Input
                  id="edit_academic_year"
                  value={formData.academic_year}
                  onChange={(e) => handleInputChange("academic_year", e.target.value)}
                  placeholder="2024-2025"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit_room_number">
                  {isKhmer ? "លេខបន្ទប់" : "Room Number"}
                </Label>
                <Input
                  id="edit_room_number"
                  value={formData.room_number}
                  onChange={(e) => handleInputChange("room_number", e.target.value)}
                  placeholder={isKhmer ? "បញ្ចូលលេខបន្ទប់" : "Enter room number"}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit_schedule_info">
                {isKhmer ? "កាលវិភាគ" : "Schedule Information"}
              </Label>
              <Input
                id="edit_schedule_info"
                value={formData.schedule_info}
                onChange={(e) => handleInputChange("schedule_info", e.target.value)}
                placeholder={isKhmer ? "បញ្ចូលកាលវិភាគ" : "Enter schedule information"}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>
                {isKhmer ? "បោះបង់" : "Cancel"}
              </Button>
              <Button type="submit" disabled={actionLoading}>
                {actionLoading ? (
                  isKhmer ? "កំពុងកែប្រែ..." : "Updating..."
                ) : (
                  isKhmer ? "កែប្រែ" : "Update"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isKhmer ? "ព័ត៌មានលម្អិតថ្នាក់" : "Class Details"}
            </DialogTitle>
            <DialogDescription>
              {isKhmer ? "ព័ត៌មានពេញលេញរបស់ថ្នាក់" : "Complete class information"}
            </DialogDescription>
          </DialogHeader>

          {selectedClass && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    {isKhmer ? "ឈ្មោះថ្នាក់" : "Class Name"}
                  </Label>
                  <p className="text-sm">{selectedClass.class_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    {isKhmer ? "ថ្នាក់ទី" : "Grade Level"}
                  </Label>
                  <p className="text-sm">{selectedClass.grade_level}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    {isKhmer ? "ឆ្នាំសិក្សា" : "Academic Year"}
                  </Label>
                  <p className="text-sm">{selectedClass.academic_year}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    {isKhmer ? "លេខបន្ទប់" : "Room Number"}
                  </Label>
                  <p className="text-sm">{selectedClass.room_number || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    {isKhmer ? "សាលា" : "School"}
                  </Label>
                  <p className="text-sm">{selectedClass.school_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    {isKhmer ? "គ្រូបង្រៀន" : "Teacher"}
                  </Label>
                  <p className="text-sm">
                    {selectedClass.teacher_first_name 
                      ? `${selectedClass.teacher_first_name} ${selectedClass.teacher_last_name}`
                      : '-'
                    }
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    {isKhmer ? "ចំនួនសិស្ស" : "Number of Students"}
                  </Label>
                  <p className="text-sm">{selectedClass.student_count || 0}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    {isKhmer ? "កាលវិភាគ" : "Schedule"}
                  </Label>
                  <p className="text-sm">{selectedClass.schedule_info || '-'}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}