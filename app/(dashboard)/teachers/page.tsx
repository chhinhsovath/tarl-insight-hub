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
import { DemographicDropdowns } from "@/components/demographic-dropdowns";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Search,
  Filter,
  RefreshCw,
  UserPlus,
  MapPin
} from "lucide-react";
import { useGlobalLanguage } from "@/lib/global-language-context";
import { useAuth } from "@/lib/auth-context";

interface Teacher {
  id: number;
  teacher_name: string;
  teacher_id: string;
  school_id: number;
  school_code: string;
  sex: string;
  age: number;
  phone: string;
  email: string;
  subject_specialization: string;
  years_experience: number;
  registration_status: 'pending' | 'approved' | 'rejected';
  user_id: number;
  created_at: string;
  updated_at: string;
  school_name: string;
  user_username: string;
  address?: string;
  province_name?: string;
  district_name?: string;
  commune_name?: string;
  village_name?: string;
}

export default function TeachersPage() {
  const { language } = useGlobalLanguage();
  const { user } = useAuth();
  const isKhmer = language === 'kh';
  
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Form data
  const [formData, setFormData] = useState({
    teacher_name: '',
    teacher_id: '',
    sex: '',
    age: '',
    phone: '',
    email: '',
    subject_specialization: '',
    years_experience: '',
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
    loadTeachers();
  }, [statusFilter, searchTerm, currentPage]);

  const loadTeachers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        status: statusFilter,
        search: searchTerm
      });

      const response = await fetch(`/api/teachers?${params}`);
      const result = await response.json();

      if (response.ok) {
        setTeachers(result.data);
        setTotalPages(result.pagination.totalPages);
      } else {
        toast.error(result.error || (isKhmer ? "មិនអាចទាញយកទិន្នន័យបានទេ" : "Failed to load data"));
      }
    } catch (error) {
      console.error("Error loading teachers:", error);
      toast.error(isKhmer ? "មានបញ្ហាក្នុងការទាក់ទងម៉ាស៊ីនមេ" : "Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setActionLoading(true);
    
    try {
      const response = await fetch('/api/teachers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(isKhmer ? "គ្រូត្រូវបានបន្ថែមរួចរាល់" : "Teacher added successfully");
        setShowCreateModal(false);
        resetForm();
        loadTeachers();
      } else {
        toast.error(result.error || (isKhmer ? "មានបញ្ហាក្នុងការបន្ថែមគ្រូ" : "Failed to add teacher"));
      }
    } catch (error) {
      console.error("Create teacher error:", error);
      toast.error(isKhmer ? "មានបញ្ហាក្នុងការទាក់ទងម៉ាស៊ីនមេ" : "Network error occurred");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTeacher || !validateForm()) return;

    setActionLoading(true);
    
    try {
      const response = await fetch(`/api/teachers/${selectedTeacher.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(isKhmer ? "ព័ត៌មានគ្រូត្រូវបានកែប្រែរួចរាល់" : "Teacher updated successfully");
        setShowEditModal(false);
        resetForm();
        loadTeachers();
      } else {
        toast.error(result.error || (isKhmer ? "មានបញ្ហាក្នុងការកែប្រែ" : "Failed to update teacher"));
      }
    } catch (error) {
      console.error("Update teacher error:", error);
      toast.error(isKhmer ? "មានបញ្ហាក្នុងការទាក់ទងម៉ាស៊ីនមេ" : "Network error occurred");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTeacher = async (teacher: Teacher) => {
    if (!confirm(isKhmer ? `តើអ្នកប្រាកដថាចង់លុបគ្រូ "${teacher.teacher_name}" មែនទេ?` : `Are you sure you want to delete teacher "${teacher.teacher_name}"?`)) {
      return;
    }

    setActionLoading(true);
    
    try {
      const response = await fetch(`/api/teachers/${teacher.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(isKhmer ? "គ្រូត្រូវបានលុបរួចរាល់" : "Teacher deleted successfully");
        loadTeachers();
      } else {
        toast.error(result.error || (isKhmer ? "មានបញ្ហាក្នុងការលុប" : "Failed to delete teacher"));
      }
    } catch (error) {
      console.error("Delete teacher error:", error);
      toast.error(isKhmer ? "មានបញ្ហាក្នុងការទាក់ទងម៉ាស៊ីនមេ" : "Network error occurred");
    } finally {
      setActionLoading(false);
    }
  };

  const validateForm = () => {
    const required = [
      { field: formData.teacher_name, name: isKhmer ? "ឈ្មោះគ្រូ" : "Teacher Name" },
      { field: formData.teacher_id, name: isKhmer ? "លេខសម្គាល់គ្រូ" : "Teacher ID" },
      { field: formData.sex, name: isKhmer ? "ភេទ" : "Gender" },
      { field: formData.phone, name: isKhmer ? "លេខទូរស័ព្ទ" : "Phone Number" }
    ];

    for (const item of required) {
      if (!item.field?.trim()) {
        toast.error(`${isKhmer ? "សូមបញ្ចូល" : "Please enter"} ${item.name}`);
        return false;
      }
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      toast.error(isKhmer ? "អ៊ីមែលមិនត្រឹមត្រូវ" : "Invalid email format");
      return false;
    }

    return true;
  };

  const resetForm = () => {
    setFormData({
      teacher_name: '',
      teacher_id: '',
      sex: '',
      age: '',
      phone: '',
      email: '',
      subject_specialization: '',
      years_experience: '',
      address: '',
      province: '',
      district: '',
      commune: '',
      village: ''
    });
    setSelectedTeacher(null);
    // Reset demographic selections
    setSelectedProvince('');
    setSelectedDistrict('');
    setSelectedCommune('');
    setSelectedVillage('');
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setFormData({
      teacher_name: teacher.teacher_name,
      teacher_id: teacher.teacher_id,
      sex: teacher.sex,
      age: teacher.age?.toString() || '',
      phone: teacher.phone,
      email: teacher.email || '',
      subject_specialization: teacher.subject_specialization || '',
      years_experience: teacher.years_experience?.toString() || '',
      address: (teacher as any).address || '',
      province: (teacher as any).province_name || '',
      district: (teacher as any).district_name || '',
      commune: (teacher as any).commune_name || '',
      village: (teacher as any).village_name || ''
    });
    setShowEditModal(true);
  };

  const viewDetails = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setShowDetailsModal(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          {isKhmer ? "កំពុងរង់ចាំ" : "Pending"}
        </Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          {isKhmer ? "បានអនុម័ត" : "Approved"}
        </Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          {isKhmer ? "បានបដិសេធ" : "Rejected"}
        </Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {isKhmer ? "ការគ្រប់គ្រងគ្រូ" : "Teacher Management"}
            </h1>
            <p className="text-gray-600">
              {isKhmer ? "គ្រប់គ្រងព័ត៌មានគ្រូបង្រៀននៅក្នុងសាលា" : "Manage teacher information in your school"}
            </p>
          </div>
          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4 mr-2" />
            {isKhmer ? "បន្ថែមគ្រូ" : "Add Teacher"}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <SelectItem value="pending">{isKhmer ? "កំពុងរង់ចាំ" : "Pending"}</SelectItem>
                  <SelectItem value="approved">{isKhmer ? "បានអនុម័ត" : "Approved"}</SelectItem>
                  <SelectItem value="rejected">{isKhmer ? "បានបដិសេធ" : "Rejected"}</SelectItem>
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
                  placeholder={isKhmer ? "ស្វែងរកគ្រូ..." : "Search teachers..."}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex items-end">
              <Button onClick={loadTeachers} variant="outline" disabled={loading}>
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
            {isKhmer ? "បញ្ជីគ្រូ" : "Teachers List"}
          </CardTitle>
          <CardDescription>
            {teachers.length} {isKhmer ? "គ្រូ" : "teachers"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">{isKhmer ? "កំពុងទាញយកទិន្នន័យ..." : "Loading..."}</div>
            </div>
          ) : teachers.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500">{isKhmer ? "មិនមានទិន្នន័យទេ" : "No data found"}</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isKhmer ? "ឈ្មោះគ្រូ" : "Teacher Name"}</TableHead>
                    <TableHead>{isKhmer ? "លេខសម្គាល់" : "Teacher ID"}</TableHead>
                    <TableHead>{isKhmer ? "ភេទ" : "Gender"}</TableHead>
                    <TableHead>{isKhmer ? "ទូរស័ព្ទ" : "Phone"}</TableHead>
                    <TableHead>{isKhmer ? "មុខវិជ្ជា" : "Subject"}</TableHead>
                    <TableHead>{isKhmer ? "ស្ថានភាព" : "Status"}</TableHead>
                    <TableHead>{isKhmer ? "សកម្មភាព" : "Actions"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teachers.map((teacher) => (
                    <TableRow key={teacher.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{teacher.teacher_name}</div>
                          <div className="text-sm text-gray-500">{teacher.school_name}</div>
                        </div>
                      </TableCell>
                      <TableCell>{teacher.teacher_id}</TableCell>
                      <TableCell>{teacher.sex}</TableCell>
                      <TableCell>{teacher.phone}</TableCell>
                      <TableCell>{teacher.subject_specialization || '-'}</TableCell>
                      <TableCell>
                        {getStatusBadge(teacher.registration_status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => viewDetails(teacher)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditModal(teacher)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => handleDeleteTeacher(teacher)}
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

      {/* Create Teacher Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isKhmer ? "បន្ថែមគ្រូថ្មី" : "Add New Teacher"}
            </DialogTitle>
            <DialogDescription>
              {isKhmer ? "បំពេញព័ត៌មានគ្រូថ្មី" : "Fill in the new teacher information"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateTeacher} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="teacher_name">
                  {isKhmer ? "ឈ្មោះគ្រូ" : "Teacher Name"} *
                </Label>
                <Input
                  id="teacher_name"
                  value={formData.teacher_name}
                  onChange={(e) => handleInputChange("teacher_name", e.target.value)}
                  placeholder={isKhmer ? "បញ្ចូលឈ្មោះគ្រូ" : "Enter teacher name"}
                  required
                />
              </div>
              <div>
                <Label htmlFor="teacher_id">
                  {isKhmer ? "លេខសម្គាល់គ្រូ" : "Teacher ID"} *
                </Label>
                <Input
                  id="teacher_id"
                  value={formData.teacher_id}
                  onChange={(e) => handleInputChange("teacher_id", e.target.value)}
                  placeholder={isKhmer ? "បញ្ចូលលេខសម្គាល់" : "Enter teacher ID"}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <Label htmlFor="age">
                  {isKhmer ? "អាយុ" : "Age"}
                </Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => handleInputChange("age", e.target.value)}
                  placeholder={isKhmer ? "បញ្ចូលអាយុ" : "Enter age"}
                />
              </div>
              <div>
                <Label htmlFor="years_experience">
                  {isKhmer ? "បទពិសោធន៍ (ឆ្នាំ)" : "Experience (Years)"}
                </Label>
                <Input
                  id="years_experience"
                  type="number"
                  value={formData.years_experience}
                  onChange={(e) => handleInputChange("years_experience", e.target.value)}
                  placeholder={isKhmer ? "ចំនួនឆ្នាំ" : "Number of years"}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">
                  {isKhmer ? "លេខទូរស័ព្ទ" : "Phone Number"} *
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder={isKhmer ? "បញ្ចូលលេខទូរស័ព្ទ" : "Enter phone number"}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">
                  {isKhmer ? "អ៊ីមែល" : "Email"}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder={isKhmer ? "បញ្ចូលអ៊ីមែល" : "Enter email"}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="subject_specialization">
                {isKhmer ? "មុខវិជ្ជាឯកទេស" : "Subject Specialization"}
              </Label>
              <Input
                id="subject_specialization"
                value={formData.subject_specialization}
                onChange={(e) => handleInputChange("subject_specialization", e.target.value)}
                placeholder={isKhmer ? "បញ្ចូលមុខវិជ្ជាឯកទេស" : "Enter subject specialization"}
              />
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

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                {isKhmer ? "បោះបង់" : "Cancel"}
              </Button>
              <Button type="submit" disabled={actionLoading}>
                {actionLoading ? (
                  isKhmer ? "កំពុងបន្ថែម..." : "Adding..."
                ) : (
                  isKhmer ? "បន្ថែម" : "Add Teacher"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Teacher Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isKhmer ? "កែប្រែព័ត៌មានគ្រូ" : "Edit Teacher Information"}
            </DialogTitle>
            <DialogDescription>
              {isKhmer ? "កែប្រែព័ត៌មានរបស់គ្រូ" : "Update teacher information"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateTeacher} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_teacher_name">
                  {isKhmer ? "ឈ្មោះគ្រូ" : "Teacher Name"} *
                </Label>
                <Input
                  id="edit_teacher_name"
                  value={formData.teacher_name}
                  onChange={(e) => handleInputChange("teacher_name", e.target.value)}
                  placeholder={isKhmer ? "បញ្ចូលឈ្មោះគ្រូ" : "Enter teacher name"}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit_teacher_id">
                  {isKhmer ? "លេខសម្គាល់គ្រូ" : "Teacher ID"} *
                </Label>
                <Input
                  id="edit_teacher_id"
                  value={formData.teacher_id}
                  onChange={(e) => handleInputChange("teacher_id", e.target.value)}
                  placeholder={isKhmer ? "បញ្ចូលលេខសម្គាល់" : "Enter teacher ID"}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <Label htmlFor="edit_age">
                  {isKhmer ? "អាយុ" : "Age"}
                </Label>
                <Input
                  id="edit_age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => handleInputChange("age", e.target.value)}
                  placeholder={isKhmer ? "បញ្ចូលអាយុ" : "Enter age"}
                />
              </div>
              <div>
                <Label htmlFor="edit_years_experience">
                  {isKhmer ? "បទពិសោធន៍ (ឆ្នាំ)" : "Experience (Years)"}
                </Label>
                <Input
                  id="edit_years_experience"
                  type="number"
                  value={formData.years_experience}
                  onChange={(e) => handleInputChange("years_experience", e.target.value)}
                  placeholder={isKhmer ? "ចំនួនឆ្នាំ" : "Number of years"}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_phone">
                  {isKhmer ? "លេខទូរស័ព្ទ" : "Phone Number"} *
                </Label>
                <Input
                  id="edit_phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder={isKhmer ? "បញ្ចូលលេខទូរស័ព្ទ" : "Enter phone number"}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit_email">
                  {isKhmer ? "អ៊ីមែល" : "Email"}
                </Label>
                <Input
                  id="edit_email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder={isKhmer ? "បញ្ចូលអ៊ីមែល" : "Enter email"}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit_subject_specialization">
                {isKhmer ? "មុខវិជ្ជាឯកទេស" : "Subject Specialization"}
              </Label>
              <Input
                id="edit_subject_specialization"
                value={formData.subject_specialization}
                onChange={(e) => handleInputChange("subject_specialization", e.target.value)}
                placeholder={isKhmer ? "បញ្ចូលមុខវិជ្ជាឯកទេស" : "Enter subject specialization"}
              />
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
              {isKhmer ? "ព័ត៌មានលម្អិតគ្រូ" : "Teacher Details"}
            </DialogTitle>
            <DialogDescription>
              {isKhmer ? "ព័ត៌មានពេញលេញរបស់គ្រូ" : "Complete teacher information"}
            </DialogDescription>
          </DialogHeader>

          {selectedTeacher && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    {isKhmer ? "ឈ្មោះគ្រូ" : "Teacher Name"}
                  </Label>
                  <p className="text-sm">{selectedTeacher.teacher_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    {isKhmer ? "លេខសម្គាល់" : "Teacher ID"}
                  </Label>
                  <p className="text-sm">{selectedTeacher.teacher_id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    {isKhmer ? "ភេទ" : "Gender"}
                  </Label>
                  <p className="text-sm">{selectedTeacher.sex}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    {isKhmer ? "អាយុ" : "Age"}
                  </Label>
                  <p className="text-sm">{selectedTeacher.age || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    {isKhmer ? "ទូរស័ព្ទ" : "Phone"}
                  </Label>
                  <p className="text-sm">{selectedTeacher.phone}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    {isKhmer ? "អ៊ីមែល" : "Email"}
                  </Label>
                  <p className="text-sm">{selectedTeacher.email || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    {isKhmer ? "មុខវិជ្ជាឯកទេស" : "Subject Specialization"}
                  </Label>
                  <p className="text-sm">{selectedTeacher.subject_specialization || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    {isKhmer ? "បទពិសោធន៍" : "Experience"}
                  </Label>
                  <p className="text-sm">
                    {selectedTeacher.years_experience ? `${selectedTeacher.years_experience} ${isKhmer ? 'ឆ្នាំ' : 'years'}` : '-'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    {isKhmer ? "ស្ថានភាព" : "Status"}
                  </Label>
                  <div className="mt-1">
                    {getStatusBadge(selectedTeacher.registration_status)}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    {isKhmer ? "សាលា" : "School"}
                  </Label>
                  <p className="text-sm">{selectedTeacher.school_name}</p>
                </div>
              </div>
              
              {/* Address Information */}
              {(selectedTeacher.address || selectedTeacher.province_name || selectedTeacher.district_name) && (
                <div className="pt-4 border-t">
                  <Label className="text-base font-medium text-gray-700 mb-3 block">
                    {isKhmer ? "ព័ត៌មានអាសយដ្ឋាន" : "Address Information"}
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedTeacher.address && (
                      <div className="md:col-span-2">
                        <Label className="text-sm font-medium text-gray-600">
                          {isKhmer ? "អាសយដ្ឋាន" : "Address"}
                        </Label>
                        <p className="text-sm">{selectedTeacher.address}</p>
                      </div>
                    )}
                    {selectedTeacher.province_name && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600">
                          {isKhmer ? "ខេត្ត" : "Province"}
                        </Label>
                        <p className="text-sm">{selectedTeacher.province_name}</p>
                      </div>
                    )}
                    {selectedTeacher.district_name && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600">
                          {isKhmer ? "ស្រុក" : "District"}
                        </Label>
                        <p className="text-sm">{selectedTeacher.district_name}</p>
                      </div>
                    )}
                    {selectedTeacher.commune_name && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600">
                          {isKhmer ? "ឃុំ" : "Commune"}
                        </Label>
                        <p className="text-sm">{selectedTeacher.commune_name}</p>
                      </div>
                    )}
                    {selectedTeacher.village_name && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600">
                          {isKhmer ? "ភូមិ" : "Village"}
                        </Label>
                        <p className="text-sm">{selectedTeacher.village_name}</p>
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