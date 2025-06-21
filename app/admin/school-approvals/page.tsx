"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { 
  CheckCircle, 
  XCircle, 
  Eye, 
  MapPin, 
  School, 
  User, 
  Phone, 
  Mail, 
  Calendar,
  Search,
  Filter,
  RefreshCw
} from "lucide-react";
import { useGlobalLanguage } from "@/lib/global-language-context";

interface SchoolRegistration {
  id: number;
  school_name: string;
  school_code: string;
  director_name: string;
  director_sex: string;
  director_age: number;
  director_phone: string;
  director_email: string;
  village: string;
  commune: string;
  district: string;
  province: string;
  note: string;
  gps_latitude: number;
  gps_longitude: number;
  registration_status: 'pending' | 'approved' | 'rejected';
  approved_by: number;
  approved_at: string;
  created_at: string;
  updated_at: string;
  approved_by_name: string;
}

export default function SchoolApprovalsPage() {
  const { language } = useGlobalLanguage();
  const isKhmer = language === 'kh';
  
  const [registrations, setRegistrations] = useState<SchoolRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegistration, setSelectedRegistration] = useState<SchoolRegistration | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Approval/Rejection
  const [approvalNote, setApprovalNote] = useState('');
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');

  useEffect(() => {
    loadRegistrations();
  }, [statusFilter, searchTerm, currentPage]);

  const loadRegistrations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        status: statusFilter,
        search: searchTerm
      });

      const response = await fetch(`/api/school-registration?${params}`);
      const result = await response.json();

      if (response.ok) {
        setRegistrations(result.data);
        setTotalPages(result.pagination.totalPages);
      } else {
        toast.error(result.error || (isKhmer ? "មិនអាចទាញយកទិន្នន័យបានទេ" : "Failed to load data"));
      }
    } catch (error) {
      console.error("Error loading registrations:", error);
      toast.error(isKhmer ? "មានបញ្ហាក្នុងការទាក់ទងម៉ាស៊ីនមេ" : "Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (registration: SchoolRegistration, action: 'approve' | 'reject') => {
    setSelectedRegistration(registration);
    setApprovalAction(action);
    setApprovalNote('');
    setShowApprovalDialog(true);
  };

  const submitApproval = async () => {
    if (!selectedRegistration) return;

    setActionLoading(true);
    
    try {
      const response = await fetch('/api/admin/school-approvals', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          schoolId: selectedRegistration.id,
          action: approvalAction,
          note: approvalNote
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(
          approvalAction === 'approve'
            ? (isKhmer ? "សាលាត្រូវបានអនុម័តរួចរាល់" : "School approved successfully")
            : (isKhmer ? "សាលាត្រូវបានបដិសេធរួចរាល់" : "School rejected successfully")
        );
        setShowApprovalDialog(false);
        loadRegistrations();
      } else {
        toast.error(result.error || (isKhmer ? "មានបញ្ហាក្នុងការដំណើរការ" : "Processing failed"));
      }
    } catch (error) {
      console.error("Approval error:", error);
      toast.error(isKhmer ? "មានបញ្ហាក្នុងការទាក់ទងម៉ាស៊ីនមេ" : "Network error occurred");
    } finally {
      setActionLoading(false);
    }
  };

  const viewDetails = (registration: SchoolRegistration) => {
    setSelectedRegistration(registration);
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

  const openGoogleMaps = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps?q=${lat},${lng}`;
    window.open(url, '_blank');
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {isKhmer ? "ការអនុម័តសាលារៀន" : "School Approvals"}
        </h1>
        <p className="text-gray-600">
          {isKhmer ? "គ្រប់គ្រងការស្នើសុំចុះឈ្មោះសាលារៀនថ្មី" : "Manage new school registration requests"}
        </p>
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
                  placeholder={isKhmer ? "ស្វែងរកសាលា, នាយក, ឬទីតាំង..." : "Search school, director, or location..."}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex items-end">
              <Button onClick={loadRegistrations} variant="outline" disabled={loading}>
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
            {isKhmer ? "ការស្នើសុំចុះឈ្មោះ" : "Registration Requests"}
          </CardTitle>
          <CardDescription>
            {registrations.length} {isKhmer ? "ការស្នើសុំ" : "requests"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">{isKhmer ? "កំពុងទាញយកទិន្នន័យ..." : "Loading..."}</div>
            </div>
          ) : registrations.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500">{isKhmer ? "មិនមានទិន្នន័យទេ" : "No data found"}</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isKhmer ? "ឈ្មោះសាលា" : "School Name"}</TableHead>
                    <TableHead>{isKhmer ? "លេខកូដ" : "Code"}</TableHead>
                    <TableHead>{isKhmer ? "នាយកសាលា" : "Director"}</TableHead>
                    <TableHead>{isKhmer ? "ទីតាំង" : "Location"}</TableHead>
                    <TableHead>{isKhmer ? "ស្ថានភាព" : "Status"}</TableHead>
                    <TableHead>{isKhmer ? "កាលបរិច្ឆេទ" : "Date"}</TableHead>
                    <TableHead>{isKhmer ? "សកម្មភាព" : "Actions"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registrations.map((registration) => (
                    <TableRow key={registration.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{registration.school_name}</div>
                          <div className="text-sm text-gray-500">{registration.school_code}</div>
                        </div>
                      </TableCell>
                      <TableCell>{registration.school_code}</TableCell>
                      <TableCell>
                        <div>
                          <div>{registration.director_name}</div>
                          <div className="text-sm text-gray-500">{registration.director_phone}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{registration.village}, {registration.commune}</div>
                          <div className="text-gray-500">{registration.district}, {registration.province}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(registration.registration_status)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(registration.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => viewDetails(registration)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {registration.registration_status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 border-green-200 hover:bg-green-50"
                                onClick={() => handleApproval(registration, 'approve')}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => handleApproval(registration, 'reject')}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
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

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isKhmer ? "ព័ត៌មានលម្អិតសាលា" : "School Details"}
            </DialogTitle>
            <DialogDescription>
              {isKhmer ? "ព័ត៌មានពេញលេញនៃការស្នើសុំចុះឈ្មោះ" : "Complete information about the registration request"}
            </DialogDescription>
          </DialogHeader>

          {selectedRegistration && (
            <div className="space-y-6">
              {/* School Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <School className="h-5 w-5" />
                  {isKhmer ? "ព័ត៌មានសាលា" : "School Information"}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      {isKhmer ? "ឈ្មោះសាលា" : "School Name"}
                    </Label>
                    <p className="text-sm">{selectedRegistration.school_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      {isKhmer ? "លេខកូដសាលា" : "School Code"}
                    </Label>
                    <p className="text-sm">{selectedRegistration.school_code}</p>
                  </div>
                </div>
              </div>

              {/* Director Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {isKhmer ? "ព័ត៌មាននាយកសាលា" : "Director Information"}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      {isKhmer ? "ឈ្មោះ" : "Name"}
                    </Label>
                    <p className="text-sm">{selectedRegistration.director_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      {isKhmer ? "ភេទ" : "Gender"}
                    </Label>
                    <p className="text-sm">{selectedRegistration.director_sex}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      {isKhmer ? "អាយុ" : "Age"}
                    </Label>
                    <p className="text-sm">{selectedRegistration.director_age || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      {isKhmer ? "លេខទូរស័ព្ទ" : "Phone"}
                    </Label>
                    <p className="text-sm flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {selectedRegistration.director_phone}
                    </p>
                  </div>
                  {selectedRegistration.director_email && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">
                        {isKhmer ? "អ៊ីមែល" : "Email"}
                      </Label>
                      <p className="text-sm flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {selectedRegistration.director_email}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Location Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  {isKhmer ? "ព័ត៌មានទីតាំង" : "Location Information"}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      {isKhmer ? "ភូមិ" : "Village"}
                    </Label>
                    <p className="text-sm">{selectedRegistration.village}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      {isKhmer ? "ឃុំ/សង្កាត់" : "Commune"}
                    </Label>
                    <p className="text-sm">{selectedRegistration.commune}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      {isKhmer ? "ស្រុក/ខណ្ឌ" : "District"}
                    </Label>
                    <p className="text-sm">{selectedRegistration.district}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      {isKhmer ? "ខេត្ត/រាជធានី" : "Province"}
                    </Label>
                    <p className="text-sm">{selectedRegistration.province}</p>
                  </div>
                </div>

                {/* GPS Location */}
                {selectedRegistration.gps_latitude && selectedRegistration.gps_longitude && (
                  <div className="mt-4">
                    <Label className="text-sm font-medium text-gray-600">
                      {isKhmer ? "ទីតាំង GPS" : "GPS Location"}
                    </Label>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm">
                        {selectedRegistration.gps_latitude.toFixed(6)}, {selectedRegistration.gps_longitude.toFixed(6)}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openGoogleMaps(selectedRegistration.gps_latitude, selectedRegistration.gps_longitude)}
                      >
                        <MapPin className="h-4 w-4 mr-1" />
                        {isKhmer ? "មើលផែនទី" : "View Map"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Information */}
              {selectedRegistration.note && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    {isKhmer ? "កំណត់ចំណាំ" : "Notes"}
                  </Label>
                  <p className="text-sm mt-1 p-3 bg-gray-50 rounded">{selectedRegistration.note}</p>
                </div>
              )}

              {/* Status Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {isKhmer ? "ព័ត៌មានស្ថានភាព" : "Status Information"}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      {isKhmer ? "ស្ថានភាព" : "Status"}
                    </Label>
                    <div className="mt-1">
                      {getStatusBadge(selectedRegistration.registration_status)}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      {isKhmer ? "កាលបរិច្ឆេទដាក់ស្នើ" : "Submission Date"}
                    </Label>
                    <p className="text-sm">{new Date(selectedRegistration.created_at).toLocaleString()}</p>
                  </div>
                  {selectedRegistration.approved_by_name && (
                    <>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">
                          {isKhmer ? "អនុម័តដោយ" : "Approved By"}
                        </Label>
                        <p className="text-sm">{selectedRegistration.approved_by_name}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">
                          {isKhmer ? "កាលបរិច្ឆេទអនុម័ត" : "Approval Date"}
                        </Label>
                        <p className="text-sm">{new Date(selectedRegistration.approved_at).toLocaleString()}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approval/Rejection Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {approvalAction === 'approve' 
                ? (isKhmer ? "អនុម័តសាលា" : "Approve School")
                : (isKhmer ? "បដិសេធសាលា" : "Reject School")
              }
            </DialogTitle>
            <DialogDescription>
              {selectedRegistration && (
                <>
                  {approvalAction === 'approve' 
                    ? (isKhmer ? `តើអ្នកប្រាកដថាចង់អនុម័តសាលា "${selectedRegistration.school_name}" មែនទេ?` : `Are you sure you want to approve "${selectedRegistration.school_name}"?`)
                    : (isKhmer ? `តើអ្នកប្រាកដថាចង់បដិសេធសាលា "${selectedRegistration.school_name}" មែនទេ?` : `Are you sure you want to reject "${selectedRegistration.school_name}"?`)
                  }
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="approval-note">
                {isKhmer ? "កំណត់ចំណាំ" : "Notes"} {approvalAction === 'reject' ? '*' : ''}
              </Label>
              <Textarea
                id="approval-note"
                value={approvalNote}
                onChange={(e) => setApprovalNote(e.target.value)}
                placeholder={
                  approvalAction === 'approve'
                    ? (isKhmer ? "កំណត់ចំណាំសម្រាប់ការអនុម័ត..." : "Notes for approval...")
                    : (isKhmer ? "មូលហេតុនៃការបដិសេធ..." : "Reason for rejection...")
                }
                rows={4}
                required={approvalAction === 'reject'}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
                {isKhmer ? "បោះបង់" : "Cancel"}
              </Button>
              <Button
                onClick={submitApproval}
                disabled={actionLoading || (approvalAction === 'reject' && !approvalNote.trim())}
                className={approvalAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
              >
                {actionLoading ? (
                  isKhmer ? "កំពុងដំណើរការ..." : "Processing..."
                ) : (
                  approvalAction === 'approve' 
                    ? (isKhmer ? "អនុម័ត" : "Approve")
                    : (isKhmer ? "បដិសេធ" : "Reject")
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}