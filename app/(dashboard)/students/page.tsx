"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  GraduationCap, 
  Users, 
  User,
  Search,
  Filter,
  RefreshCw,
  School,
  Calendar,
  MapPin
} from "lucide-react";
import { useGlobalLanguage } from "@/lib/global-language-context";
import { useAuth } from "@/lib/auth-context";
import { DemographicDropdowns } from "@/components/demographic-dropdowns";

interface Student {
  id: number;
  student_name: string;
  student_id: string;
  class_id: number;
  school_id: number;
  sex: string;
  date_of_birth: string;
  parent_name: string;
  parent_phone: string;
  address: string;
  status: 'active' | 'inactive' | 'graduated' | 'transferred';
  enrollment_date: string;
  created_at: string;
  updated_at: string;
  class_name: string;
  grade_level: string;
  school_name: string;
  province_name?: string;
  district_name?: string;
  commune_name?: string;
  village_name?: string;
}

interface Class {
  id: number;
  class_name: string;
  grade_level: string;
  school_id: number;
  school_name: string;
}

interface School {
  id: number;
  name: string;
  code: string;
}

export default function StudentsPage() {
  const { language } = useGlobalLanguage();
  const { user } = useAuth();
  const isKhmer = language === 'kh';
  
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Add stats state
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalActiveStudents, setTotalActiveStudents] = useState(0);
  const [totalSchools, setTotalSchools] = useState(0);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [schoolFilter, setSchoolFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Form data
  const [formData, setFormData] = useState({
    student_name: '',
    student_id: '',
    class_id: '',
    sex: '',
    date_of_birth: '',
    parent_name: '',
    parent_phone: '',
    address: '',
    province: '',
    district: '',
    commune: '',
    village: ''
  });

  // Demographic selection states
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedCommune, setSelectedCommune] = useState('');
  const [selectedVillage, setSelectedVillage] = useState('');

  useEffect(() => {
    if (user) {
      console.log("User authenticated, loading data for:", user.username, user.role);
      loadStudents();
      loadClasses();
      loadSchools();
      loadStats();
    }
  }, [user, statusFilter, classFilter, schoolFilter, searchTerm, currentPage]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        status: statusFilter,
        search: searchTerm
      });

      if (classFilter !== 'all') {
        params.set('classId', classFilter);
      }
      if (schoolFilter !== 'all') {
        params.set('schoolId', schoolFilter);
      }

      const response = await fetch(`/api/students?${params}`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      const result = await response.json();
      console.log("Students API response:", response.status, result);

      if (response.ok) {
        setStudents(result.data || []);
        setTotalPages(result.pagination?.totalPages || 1);
        console.log("Students loaded:", result.data?.length, "Total pages:", result.pagination?.totalPages);
      } else {
        console.error("Students API failed:", result);
        toast.error(result.error || (isKhmer ? "មិនអាចទាញយកទិន្នន័យបានទេ" : "Failed to load data"));
      }
    } catch (error) {
      console.error("Error loading students:", error);
      toast.error(isKhmer ? "មានបញ្ហាក្នុងការទាក់ទងម៉ាស៊ីនមេ" : "Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const loadClasses = async () => {
    try {
      const response = await fetch('/api/data/classes');
      const result = await response.json();
      if (response.ok) {
        setClasses(Array.isArray(result) ? result : []);
      }
    } catch (error) {
      console.error("Error loading classes:", error);
    }
  };

  const loadSchools = async () => {
    try {
      const response = await fetch('/api/data/schools');
      const result = await response.json();
      if (response.ok) {
        // Schools API returns array directly, not wrapped in data
        setSchools(Array.isArray(result) ? result : []);
      }
    } catch (error) {
      console.error("Error loading schools:", error);
    }
  };

  const loadStats = async () => {
    try {
      console.log("Loading stats from dashboard API...");
      // Get overall student stats from dashboard API
      const response = await fetch('/api/dashboard/stats', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      const result = await response.json();
      console.log("Stats API response:", response.status, result);
      
      if (response.ok && result.success) {
        console.log("Setting stats:", result.stats);
        setTotalStudents(result.stats.totalStudents || 0);
        setTotalActiveStudents(result.stats.totalStudents || 0); // Assuming all are active
        setTotalSchools(result.stats.totalSchools || 0);
      } else {
        console.error("Stats API failed:", result);
        // Set to 0 if API fails
        setTotalStudents(0);
        setTotalActiveStudents(0);
        setTotalSchools(0);
      }
    } catch (error) {
      console.error("Error loading stats:", error);
      // Set to 0 if API fails
      setTotalStudents(0);
      setTotalActiveStudents(0);
      setTotalSchools(0);
    }
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setActionLoading(true);
    
    try {
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          province_id: selectedProvince,
          district_id: selectedDistrict,
          commune_id: selectedCommune,
          village_id: selectedVillage
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(isKhmer ? "សិស្សត្រូវបានបន្ថែមរួចរាល់" : "Student added successfully");
        setShowCreateModal(false);
        resetForm();
        loadStudents();
      } else {
        toast.error(result.error || (isKhmer ? "មានបញ្ហាក្នុងការបន្ថែមសិស្ស" : "Failed to add student"));
      }
    } catch (error) {
      console.error("Create student error:", error);
      toast.error(isKhmer ? "មានបញ្ហាក្នុងការទាក់ទងម៉ាស៊ីនមេ" : "Network error occurred");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStudent || !validateForm()) return;

    setActionLoading(true);
    
    try {
      const response = await fetch(`/api/students/${selectedStudent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          province_id: selectedProvince,
          district_id: selectedDistrict,
          commune_id: selectedCommune,
          village_id: selectedVillage
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(isKhmer ? "ព័ត៌មានសិស្សត្រូវបានកែប្រែរួចរាល់" : "Student updated successfully");
        setShowEditModal(false);
        resetForm();
        loadStudents();
      } else {
        toast.error(result.error || (isKhmer ? "មានបញ្ហាក្នុងការកែប្រែ" : "Failed to update student"));
      }
    } catch (error) {
      console.error("Update student error:", error);
      toast.error(isKhmer ? "មានបញ្ហាក្នុងការទាក់ទងម៉ាស៊ីនមេ" : "Network error occurred");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteStudent = async (student: Student) => {
    if (!confirm(isKhmer ? `តើអ្នកប្រាកដថាចង់លុបសិស្ស "${student.student_name}" មែនទេ?` : `Are you sure you want to delete student "${student.student_name}"?`)) {
      return;
    }

    setActionLoading(true);
    
    try {
      const response = await fetch(`/api/students/${student.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(isKhmer ? "សិស្សត្រូវបានលុបរួចរាល់" : "Student deleted successfully");
        loadStudents();
      } else {
        toast.error(result.error || (isKhmer ? "មានបញ្ហាក្នុងការលុប" : "Failed to delete student"));
      }
    } catch (error) {
      console.error("Delete student error:", error);
      toast.error(isKhmer ? "មានបញ្ហាក្នុងការទាក់ទងម៉ាស៊ីនមេ" : "Network error occurred");
    } finally {
      setActionLoading(false);
    }
  };

  const validateForm = () => {
    const required = [
      { field: formData.student_name, name: isKhmer ? "ឈ្មោះសិស្ស" : "Student Name" },
      { field: formData.student_id, name: isKhmer ? "លេខសម្គាល់សិស្ស" : "Student ID" },
      { field: formData.class_id, name: isKhmer ? "ថ្នាក់" : "Class" },
      { field: formData.sex, name: isKhmer ? "ភេទ" : "Gender" },
      { field: formData.date_of_birth, name: isKhmer ? "ថ្ងៃកំណើត" : "Date of Birth" },
      { field: formData.parent_name, name: isKhmer ? "ឈ្មោះឪពុកម្តាយ" : "Parent Name" }
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
      student_name: '',
      student_id: '',
      class_id: '',
      sex: '',
      date_of_birth: '',
      parent_name: '',
      parent_phone: '',
      address: '',
      province: '',
      district: '',
      commune: '',
      village: ''
    });
    setSelectedStudent(null);
    setSelectedProvince('');
    setSelectedDistrict('');
    setSelectedCommune('');
    setSelectedVillage('');
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (student: Student) => {
    setSelectedStudent(student);
    setFormData({
      student_name: student.student_name,
      student_id: student.student_id,
      class_id: student.class_id?.toString() || '',
      sex: student.sex,
      date_of_birth: student.date_of_birth?.split('T')[0] || '',
      parent_name: student.parent_name || '',
      parent_phone: student.parent_phone || '',
      address: student.address || '',
      province: student.province_name || '',
      district: student.district_name || '',
      commune: student.commune_name || '',
      village: student.village_name || ''
    });
    setShowEditModal(true);
  };

  const viewDetails = (student: Student) => {
    setSelectedStudent(student);
    setShowDetailsModal(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          {isKhmer ? "កំពុងសិក្សា" : "Active"}
        </Badge>;
      case 'inactive':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
          {isKhmer ? "មិនសក្រម្ម" : "Inactive"}
        </Badge>;
      case 'graduated':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          {isKhmer ? "បានបញ្ចប់" : "Graduated"}
        </Badge>;
      case 'transferred':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
          {isKhmer ? "បានផ្ទេរ" : "Transferred"}
        </Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // Show loading state if user is not authenticated
  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
          <p className="mt-2 text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {isKhmer ? "ការគ្រប់គ្រងសិស្ស" : "Student Management"}
            </h1>
            <p className="text-gray-600">
              {isKhmer ? "គ្រប់គ្រងព័ត៌មានសិស្សនៅក្នុងសាលា" : "Manage student information in your school"}
            </p>
          </div>
          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4 mr-2" />
            {isKhmer ? "បន្ថែមសិស្ស" : "Add Student"}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <GraduationCap className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  {isKhmer ? "សិស្សសរុប" : "Total Students"}
                </p>
                <p className="text-2xl font-bold">{totalStudents.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  {isKhmer ? "កំពុងសិក្សា" : "Active Students"}
                </p>
                <p className="text-2xl font-bold">
                  {totalActiveStudents.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <School className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  {isKhmer ? "សាលា" : "Schools"}
                </p>
                <p className="text-2xl font-bold">
                  {totalSchools.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  {isKhmer ? "ថ្មីៗ" : "New This Month"}
                </p>
                <p className="text-2xl font-bold">
                  {students.filter(s => {
                    const enrollDate = new Date(s.enrollment_date);
                    const now = new Date();
                    return enrollDate.getMonth() === now.getMonth() && 
                           enrollDate.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
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
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="status-filter">
                {isKhmer ? "ស្ថានភាព" : "Status"}
              </Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isKhmer ? "ទាំងអស់" : "All"}</SelectItem>
                  <SelectItem value="active">{isKhmer ? "កំពុងសិក្សា" : "Active"}</SelectItem>
                  <SelectItem value="inactive">{isKhmer ? "មិនសក្រម្ម" : "Inactive"}</SelectItem>
                  <SelectItem value="graduated">{isKhmer ? "បានបញ្ចប់" : "Graduated"}</SelectItem>
                  <SelectItem value="transferred">{isKhmer ? "បានផ្ទេរ" : "Transferred"}</SelectItem>
                </SelectContent>
              </Select>
            </div>

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
              <Label htmlFor="class-filter">
                {isKhmer ? "ថ្នាក់" : "Class"}
              </Label>
              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isKhmer ? "ទាំងអស់" : "All Classes"}</SelectItem>
                  {classes.map(cls => (
                    <SelectItem key={cls.id} value={cls.id.toString()}>
                      {cls.class_name} ({cls.grade_level})
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
                  placeholder={isKhmer ? "ស្វែងរកសិស្ស..." : "Search students..."}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex items-end">
              <Button onClick={loadStudents} variant="outline" disabled={loading}>
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
            {isKhmer ? "បញ្ជីសិស្ស" : "Students List"}
          </CardTitle>
          <CardDescription>
            {students.length} {isKhmer ? "សិស្ស" : "students"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">{isKhmer ? "កំពុងទាញយកទិន្នន័យ..." : "Loading..."}</div>
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500">{isKhmer ? "មិនមានទិន្នន័យទេ" : "No data found"}</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isKhmer ? "ឈ្មោះសិស្ស" : "Student Name"}</TableHead>
                    <TableHead>{isKhmer ? "លេខសម្គាល់" : "Student ID"}</TableHead>
                    <TableHead>{isKhmer ? "ថ្នាក់" : "Class"}</TableHead>
                    <TableHead>{isKhmer ? "ភេទ" : "Gender"}</TableHead>
                    <TableHead>{isKhmer ? "អាយុ" : "Age"}</TableHead>
                    <TableHead>{isKhmer ? "ស្ថានភាព" : "Status"}</TableHead>
                    <TableHead>{isKhmer ? "សកម្មភាព" : "Actions"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-blue-600" />
                            {student.student_name}
                          </div>
                          <div className="text-sm text-gray-500">{student.school_name}</div>
                        </div>
                      </TableCell>
                      <TableCell>{student.student_id}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{student.class_name}</div>
                          <div className="text-sm text-gray-500">{student.grade_level}</div>
                        </div>
                      </TableCell>
                      <TableCell>{student.sex}</TableCell>
                      <TableCell>
                        {student.date_of_birth ? calculateAge(student.date_of_birth) : '-'}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(student.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => viewDetails(student)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditModal(student)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => handleDeleteStudent(student)}
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                {isKhmer ? "មុន" : "Previous"}
              </Button>
              <span className="text-sm text-gray-600">
                {isKhmer ? "ទំព័រ" : "Page"} {currentPage} {isKhmer ? "នៃ" : "of"} {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                {isKhmer ? "បន្ទាប់" : "Next"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Student Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isKhmer ? "បន្ថែមសិស្សថ្មី" : "Add New Student"}
            </DialogTitle>
            <DialogDescription>
              {isKhmer ? "បំពេញព័ត៌មានសិស្សថ្មី" : "Fill in the new student information"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateStudent} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="student_name">
                  {isKhmer ? "ឈ្មោះសិស្ស" : "Student Name"} *
                </Label>
                <Input
                  id="student_name"
                  value={formData.student_name}
                  onChange={(e) => handleInputChange("student_name", e.target.value)}
                  placeholder={isKhmer ? "បញ្ចូលឈ្មោះសិស្ស" : "Enter student name"}
                  required
                />
              </div>
              <div>
                <Label htmlFor="student_id">
                  {isKhmer ? "លេខសម្គាល់សិស្ស" : "Student ID"} *
                </Label>
                <Input
                  id="student_id"
                  value={formData.student_id}
                  onChange={(e) => handleInputChange("student_id", e.target.value)}
                  placeholder={isKhmer ? "បញ្ចូលលេខសម្គាល់" : "Enter student ID"}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="class_id">
                  {isKhmer ? "ថ្នាក់" : "Class"} *
                </Label>
                <Select value={formData.class_id} onValueChange={(value) => handleInputChange("class_id", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={isKhmer ? "ជ្រើសរើសថ្នាក់" : "Select class"} />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map(cls => (
                      <SelectItem key={cls.id} value={cls.id.toString()}>
                        {cls.class_name} ({cls.grade_level}) - {cls.school_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="sex">
                  {isKhmer ? "ភេទ" : "Gender"} *
                </Label>
                <Select value={formData.sex} onValueChange={(value) => handleInputChange("sex", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={isKhmer ? "ជ្រើសរើសភេទ" : "Select gender"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">{isKhmer ? "ប្រុស" : "Male"}</SelectItem>
                    <SelectItem value="Female">{isKhmer ? "ស្រី" : "Female"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="date_of_birth">
                  {isKhmer ? "ថ្ងៃកំណើត" : "Date of Birth"} *
                </Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => handleInputChange("date_of_birth", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="parent_name">
                  {isKhmer ? "ឈ្មោះឪពុកម្តាយ" : "Parent Name"} *
                </Label>
                <Input
                  id="parent_name"
                  value={formData.parent_name}
                  onChange={(e) => handleInputChange("parent_name", e.target.value)}
                  placeholder={isKhmer ? "បញ្ចូលឈ្មោះឪពុកម្តាយ" : "Enter parent name"}
                  required
                />
              </div>
              <div>
                <Label htmlFor="parent_phone">
                  {isKhmer ? "លេខទូរស័ព្ទឪពុកម្តាយ" : "Parent Phone"}
                </Label>
                <Input
                  id="parent_phone"
                  value={formData.parent_phone}
                  onChange={(e) => handleInputChange("parent_phone", e.target.value)}
                  placeholder={isKhmer ? "បញ្ចូលលេខទូរស័ព្ទ" : "Enter phone number"}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address">
                {isKhmer ? "អាសយដ្ឋាន" : "Address"}
              </Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder={isKhmer ? "បញ្ចូលអាសយដ្ឋាន" : "Enter address"}
                rows={2}
              />
            </div>

            {/* Location Fields with Demographic Dropdowns */}
            <div className="space-y-4">
              <Label className="flex items-center gap-2 text-base font-medium">
                <MapPin className="h-4 w-4" />
                {isKhmer ? "ទីតាំង" : "Location Information"}
              </Label>
              <DemographicDropdowns
                selectedProvince={selectedProvince}
                selectedDistrict={selectedDistrict}
                selectedCommune={selectedCommune}
                selectedVillage={selectedVillage}
                onProvinceChange={(value) => {
                  setSelectedProvince(value);
                  handleInputChange('province', value);
                }}
                onDistrictChange={(value) => {
                  setSelectedDistrict(value);
                  handleInputChange('district', value);
                }}
                onCommuneChange={(value) => {
                  setSelectedCommune(value);
                  handleInputChange('commune', value);
                }}
                onVillageChange={(value) => {
                  setSelectedVillage(value);
                  handleInputChange('village', value);
                }}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                {isKhmer ? "បោះបង់" : "Cancel"}
              </Button>
              <Button type="submit" disabled={actionLoading}>
                {actionLoading ? (
                  isKhmer ? "កំពុងបន្ថែម..." : "Adding..."
                ) : (
                  isKhmer ? "បន្ថែម" : "Add Student"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Student Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isKhmer ? "កែប្រែព័ត៌មានសិស្ស" : "Edit Student Information"}
            </DialogTitle>
            <DialogDescription>
              {isKhmer ? "កែប្រែព័ត៌មានរបស់សិស្ស" : "Update student information"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateStudent} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_student_name">
                  {isKhmer ? "ឈ្មោះសិស្ស" : "Student Name"} *
                </Label>
                <Input
                  id="edit_student_name"
                  value={formData.student_name}
                  onChange={(e) => handleInputChange("student_name", e.target.value)}
                  placeholder={isKhmer ? "បញ្ចូលឈ្មោះសិស្ស" : "Enter student name"}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit_student_id">
                  {isKhmer ? "លេខសម្គាល់សិស្ស" : "Student ID"} *
                </Label>
                <Input
                  id="edit_student_id"
                  value={formData.student_id}
                  onChange={(e) => handleInputChange("student_id", e.target.value)}
                  placeholder={isKhmer ? "បញ្ចូលលេខសម្គាល់" : "Enter student ID"}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit_class_id">
                  {isKhmer ? "ថ្នាក់" : "Class"} *
                </Label>
                <Select value={formData.class_id} onValueChange={(value) => handleInputChange("class_id", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={isKhmer ? "ជ្រើសរើសថ្នាក់" : "Select class"} />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map(cls => (
                      <SelectItem key={cls.id} value={cls.id.toString()}>
                        {cls.class_name} ({cls.grade_level}) - {cls.school_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit_sex">
                  {isKhmer ? "ភេទ" : "Gender"} *
                </Label>
                <Select value={formData.sex} onValueChange={(value) => handleInputChange("sex", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={isKhmer ? "ជ្រើសរើសភេទ" : "Select gender"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">{isKhmer ? "ប្រុស" : "Male"}</SelectItem>
                    <SelectItem value="Female">{isKhmer ? "ស្រី" : "Female"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit_date_of_birth">
                  {isKhmer ? "ថ្ងៃកំណើត" : "Date of Birth"} *
                </Label>
                <Input
                  id="edit_date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => handleInputChange("date_of_birth", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_parent_name">
                  {isKhmer ? "ឈ្មោះឪពុកម្តាយ" : "Parent Name"} *
                </Label>
                <Input
                  id="edit_parent_name"
                  value={formData.parent_name}
                  onChange={(e) => handleInputChange("parent_name", e.target.value)}
                  placeholder={isKhmer ? "បញ្ចូលឈ្មោះឪពុកម្តាយ" : "Enter parent name"}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit_parent_phone">
                  {isKhmer ? "លេខទូរស័ព្ទឪពុកម្តាយ" : "Parent Phone"}
                </Label>
                <Input
                  id="edit_parent_phone"
                  value={formData.parent_phone}
                  onChange={(e) => handleInputChange("parent_phone", e.target.value)}
                  placeholder={isKhmer ? "បញ្ចូលលេខទូរស័ព្ទ" : "Enter phone number"}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit_address">
                {isKhmer ? "អាសយដ្ឋាន" : "Address"}
              </Label>
              <Textarea
                id="edit_address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder={isKhmer ? "បញ្ចូលអាសយដ្ឋាន" : "Enter address"}
                rows={2}
              />
            </div>

            {/* Location Fields with Demographic Dropdowns */}
            <div className="space-y-4">
              <Label className="flex items-center gap-2 text-base font-medium">
                <MapPin className="h-4 w-4" />
                {isKhmer ? "ទីតាំង" : "Location Information"}
              </Label>
              <DemographicDropdowns
                selectedProvince={selectedProvince}
                selectedDistrict={selectedDistrict}
                selectedCommune={selectedCommune}
                selectedVillage={selectedVillage}
                onProvinceChange={(value) => {
                  setSelectedProvince(value);
                  handleInputChange('province', value);
                }}
                onDistrictChange={(value) => {
                  setSelectedDistrict(value);
                  handleInputChange('district', value);
                }}
                onCommuneChange={(value) => {
                  setSelectedCommune(value);
                  handleInputChange('commune', value);
                }}
                onVillageChange={(value) => {
                  setSelectedVillage(value);
                  handleInputChange('village', value);
                }}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
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
              {isKhmer ? "ព័ត៌មានលម្អិតសិស្ស" : "Student Details"}
            </DialogTitle>
            <DialogDescription>
              {isKhmer ? "ព័ត៌មានពេញលេញរបស់សិស្ស" : "Complete student information"}
            </DialogDescription>
          </DialogHeader>

          {selectedStudent && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    {isKhmer ? "ឈ្មោះសិស្ស" : "Student Name"}
                  </Label>
                  <p className="text-sm">{selectedStudent.student_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    {isKhmer ? "លេខសម្គាល់" : "Student ID"}
                  </Label>
                  <p className="text-sm">{selectedStudent.student_id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    {isKhmer ? "ថ្នាក់" : "Class"}
                  </Label>
                  <p className="text-sm">{selectedStudent.class_name} ({selectedStudent.grade_level})</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    {isKhmer ? "សាលា" : "School"}
                  </Label>
                  <p className="text-sm">{selectedStudent.school_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    {isKhmer ? "ភេទ" : "Gender"}
                  </Label>
                  <p className="text-sm">{selectedStudent.sex}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    {isKhmer ? "អាយុ" : "Age"}
                  </Label>
                  <p className="text-sm">
                    {selectedStudent.date_of_birth ? calculateAge(selectedStudent.date_of_birth) : '-'} years
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    {isKhmer ? "ថ្ងៃកំណើត" : "Date of Birth"}
                  </Label>
                  <p className="text-sm">
                    {selectedStudent.date_of_birth ? new Date(selectedStudent.date_of_birth).toLocaleDateString() : '-'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    {isKhmer ? "ស្ថានភាព" : "Status"}
                  </Label>
                  <div className="mt-1">
                    {getStatusBadge(selectedStudent.status)}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    {isKhmer ? "ឈ្មោះឪពុកម្តាយ" : "Parent Name"}
                  </Label>
                  <p className="text-sm">{selectedStudent.parent_name || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    {isKhmer ? "ទូរស័ព្ទឪពុកម្តាយ" : "Parent Phone"}
                  </Label>
                  <p className="text-sm">{selectedStudent.parent_phone || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    {isKhmer ? "ថ្ងៃចុះឈ្មោះ" : "Enrollment Date"}
                  </Label>
                  <p className="text-sm">
                    {new Date(selectedStudent.enrollment_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              {selectedStudent.address && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    {isKhmer ? "អាសយដ្ឋាន" : "Address"}
                  </Label>
                  <p className="text-sm">{selectedStudent.address}</p>
                </div>
              )}

              {/* Address Information */}
              {(selectedStudent.province_name || selectedStudent.district_name) && (
                <div className="pt-4 border-t">
                  <Label className="text-base font-medium text-gray-700 mb-3 block">
                    {isKhmer ? "ព័ត៌មានទីតាំង" : "Location Information"}
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedStudent.province_name && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600">
                          {isKhmer ? "ខេត្ត" : "Province"}
                        </Label>
                        <p className="text-sm">{selectedStudent.province_name}</p>
                      </div>
                    )}
                    {selectedStudent.district_name && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600">
                          {isKhmer ? "ស្រុក" : "District"}
                        </Label>
                        <p className="text-sm">{selectedStudent.district_name}</p>
                      </div>
                    )}
                    {selectedStudent.commune_name && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600">
                          {isKhmer ? "ឃុំ" : "Commune"}
                        </Label>
                        <p className="text-sm">{selectedStudent.commune_name}</p>
                      </div>
                    )}
                    {selectedStudent.village_name && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600">
                          {isKhmer ? "ភូមិ" : "Village"}
                        </Label>
                        <p className="text-sm">{selectedStudent.village_name}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}