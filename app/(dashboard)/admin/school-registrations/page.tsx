"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  School, 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar,
  Building,
  Users,
  BookOpen,
  Wifi,
  Zap,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  FileText,
  Filter,
  Download,
  MoreHorizontal
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface SchoolRegistration {
  id: number;
  school_id: number;
  school_type: string;
  school_level: string;
  established_year: number;
  total_classes: number;
  total_students: number;
  total_teachers: number;
  building_condition: string;
  classroom_count: number;
  toilet_count: number;
  library_available: boolean;
  computer_lab_available: boolean;
  internet_available: boolean;
  electricity_available: boolean;
  water_source_available: boolean;
  director_name: string;
  director_gender: string;
  director_age: number;
  director_phone: string;
  director_email: string;
  director_education: string;
  director_experience: number;
  school_phone: string;
  school_email: string;
  latitude: number;
  longitude: number;
  challenges: string;
  achievements: string;
  support_needed: string;
  notes: string;
  registration_date: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_by: number;
  approved_date: string;
  school_name?: string;
  school_code?: string;
  school_location?: string;
}

export default function SchoolRegistrationsPage() {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<SchoolRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegistration, setSelectedRegistration] = useState<SchoolRegistration | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [submittingApproval, setSubmittingApproval] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user) {
      fetchRegistrations();
    }
  }, [user]);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/school-registrations', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        setRegistrations(data.registrations || []);
      } else {
        toast.error('Failed to fetch school registrations');
      }
    } catch (error) {
      console.error('Error fetching registrations:', error);
      toast.error('Failed to fetch school registrations');
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async () => {
    if (!selectedRegistration) return;

    try {
      setSubmittingApproval(true);
      const response = await fetch(`/api/admin/school-registrations/${selectedRegistration.id}/approve`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: approvalAction,
          notes: approvalNotes.trim() || undefined
        })
      });

      if (response.ok) {
        toast.success(`Registration ${approvalAction}d successfully`);
        setShowApprovalDialog(false);
        setSelectedRegistration(null);
        setApprovalNotes('');
        fetchRegistrations(); // Refresh list
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || `Failed to ${approvalAction} registration`);
      }
    } catch (error) {
      console.error('Error processing approval:', error);
      toast.error(`Failed to ${approvalAction} registration`);
    } finally {
      setSubmittingApproval(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    const icons = {
      pending: <Clock className="w-4 h-4" />,
      approved: <CheckCircle className="w-4 h-4" />,
      rejected: <XCircle className="w-4 h-4" />
    };
    return (
      <Badge className={`flex items-center gap-1 ${colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`} variant="secondary">
        {icons[status as keyof typeof icons]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const filteredRegistrations = registrations.filter(reg => {
    const matchesStatus = statusFilter === 'all' || reg.status === statusFilter;
    const matchesSearch = !searchTerm || 
      reg.director_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.school_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.school_code?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (!user || !['admin', 'director'].includes(user.role)) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
              <p className="text-muted-foreground">You don't have permission to access this page.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">School Registrations</h1>
          <p className="text-muted-foreground mt-1">
            Review and approve school registration requests
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by director name, school name, or code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Registrations</p>
                <p className="text-2xl font-bold">{registrations.length}</p>
              </div>
              <School className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {registrations.filter(r => r.status === 'pending').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold text-green-600">
                  {registrations.filter(r => r.status === 'approved').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold text-red-600">
                  {registrations.filter(r => r.status === 'rejected').length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Registrations List */}
      <Card>
        <CardHeader>
          <CardTitle>Registration Requests</CardTitle>
          <CardDescription>
            {filteredRegistrations.length} registration{filteredRegistrations.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading registrations...</p>
            </div>
          ) : filteredRegistrations.length === 0 ? (
            <div className="text-center py-8">
              <School className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-muted-foreground">No registrations found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRegistrations.map((registration) => (
                <div key={registration.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{registration.school_name || 'School Name Not Available'}</h3>
                        {getStatusBadge(registration.status)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-blue-600" />
                          <span className="font-medium">Director:</span>
                          <span>{registration.director_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-green-600" />
                          <span>{registration.director_phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-purple-600" />
                          <span>{new Date(registration.registration_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-orange-600" />
                          <span>{registration.school_type} • {registration.school_level}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-indigo-600" />
                          <span>{registration.total_students} students • {registration.total_teachers} teachers</span>
                        </div>
                        {registration.director_email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-red-600" />
                            <span>{registration.director_email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Dialog open={showDetailsDialog && selectedRegistration?.id === registration.id} 
                             onOpenChange={(open) => {
                               setShowDetailsDialog(open);
                               if (!open) setSelectedRegistration(null);
                             }}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedRegistration(registration)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>School Registration Details</DialogTitle>
                            <DialogDescription>
                              Complete information for {registration.school_name || 'School Registration'}
                            </DialogDescription>
                          </DialogHeader>
                          
                          {selectedRegistration && (
                            <div className="space-y-6">
                              {/* Basic Information */}
                              <div>
                                <h4 className="text-lg font-semibold mb-3">Basic Information</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="font-medium">School Type:</span>
                                    <span className="ml-2">{selectedRegistration.school_type}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium">School Level:</span>
                                    <span className="ml-2">{selectedRegistration.school_level}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium">Established:</span>
                                    <span className="ml-2">{selectedRegistration.established_year || 'Not specified'}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium">Total Classes:</span>
                                    <span className="ml-2">{selectedRegistration.total_classes || 'Not specified'}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium">Total Students:</span>
                                    <span className="ml-2">{selectedRegistration.total_students || 'Not specified'}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium">Total Teachers:</span>
                                    <span className="ml-2">{selectedRegistration.total_teachers || 'Not specified'}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Director Information */}
                              <div>
                                <h4 className="text-lg font-semibold mb-3">Director Information</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="font-medium">Name:</span>
                                    <span className="ml-2">{selectedRegistration.director_name}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium">Gender:</span>
                                    <span className="ml-2">{selectedRegistration.director_gender || 'Not specified'}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium">Age:</span>
                                    <span className="ml-2">{selectedRegistration.director_age || 'Not specified'}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium">Phone:</span>
                                    <span className="ml-2">{selectedRegistration.director_phone}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium">Email:</span>
                                    <span className="ml-2">{selectedRegistration.director_email || 'Not provided'}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium">Education:</span>
                                    <span className="ml-2">{selectedRegistration.director_education || 'Not specified'}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Infrastructure */}
                              <div>
                                <h4 className="text-lg font-semibold mb-3">Infrastructure & Facilities</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="font-medium">Building Condition:</span>
                                    <span className="ml-2">{selectedRegistration.building_condition || 'Not specified'}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium">Classrooms:</span>
                                    <span className="ml-2">{selectedRegistration.classroom_count || 'Not specified'}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <BookOpen className="w-4 h-4" />
                                    <span className="font-medium">Library:</span>
                                    <span className="ml-2">{selectedRegistration.library_available ? 'Available' : 'Not Available'}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Wifi className="w-4 h-4" />
                                    <span className="font-medium">Internet:</span>
                                    <span className="ml-2">{selectedRegistration.internet_available ? 'Available' : 'Not Available'}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Zap className="w-4 h-4" />
                                    <span className="font-medium">Electricity:</span>
                                    <span className="ml-2">{selectedRegistration.electricity_available ? 'Available' : 'Not Available'}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium">Computer Lab:</span>
                                    <span className="ml-2">{selectedRegistration.computer_lab_available ? 'Available' : 'Not Available'}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Additional Information */}
                              {(selectedRegistration.challenges || selectedRegistration.achievements || selectedRegistration.support_needed || selectedRegistration.notes) && (
                                <div>
                                  <h4 className="text-lg font-semibold mb-3">Additional Information</h4>
                                  <div className="space-y-4 text-sm">
                                    {selectedRegistration.challenges && (
                                      <div>
                                        <span className="font-medium">Challenges:</span>
                                        <p className="mt-1 text-gray-700">{selectedRegistration.challenges}</p>
                                      </div>
                                    )}
                                    {selectedRegistration.achievements && (
                                      <div>
                                        <span className="font-medium">Achievements:</span>
                                        <p className="mt-1 text-gray-700">{selectedRegistration.achievements}</p>
                                      </div>
                                    )}
                                    {selectedRegistration.support_needed && (
                                      <div>
                                        <span className="font-medium">Support Needed:</span>
                                        <p className="mt-1 text-gray-700">{selectedRegistration.support_needed}</p>
                                      </div>
                                    )}
                                    {selectedRegistration.notes && (
                                      <div>
                                        <span className="font-medium">Notes:</span>
                                        <p className="mt-1 text-gray-700">{selectedRegistration.notes}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Location */}
                              {(selectedRegistration.latitude && selectedRegistration.longitude) && (
                                <div>
                                  <h4 className="text-lg font-semibold mb-3">Location</h4>
                                  <div className="flex items-center gap-2 text-sm">
                                    <MapPin className="w-4 h-4 text-red-600" />
                                    <span>GPS: {selectedRegistration.latitude}, {selectedRegistration.longitude}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>

                      {registration.status === 'pending' && (
                        <Dialog open={showApprovalDialog && selectedRegistration?.id === registration.id} 
                               onOpenChange={(open) => {
                                 setShowApprovalDialog(open);
                                 if (!open) {
                                   setSelectedRegistration(null);
                                   setApprovalNotes('');
                                 }
                               }}>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedRegistration(registration);
                                setApprovalAction('approve');
                              }}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Review
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Review Registration</DialogTitle>
                              <DialogDescription>
                                Approve or reject this school registration request
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="space-y-4">
                              <div>
                                <Label className="text-base font-medium">Action</Label>
                                <Select value={approvalAction} onValueChange={(value: 'approve' | 'reject') => setApprovalAction(value)}>
                                  <SelectTrigger className="mt-1">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="approve">
                                      <div className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                        Approve Registration
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="reject">
                                      <div className="flex items-center gap-2">
                                        <XCircle className="w-4 h-4 text-red-600" />
                                        Reject Registration
                                      </div>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div>
                                <Label htmlFor="approval-notes" className="text-base font-medium">
                                  Notes {approvalAction === 'reject' ? '(Required)' : '(Optional)'}
                                </Label>
                                <Textarea
                                  id="approval-notes"
                                  value={approvalNotes}
                                  onChange={(e) => setApprovalNotes(e.target.value)}
                                  placeholder={
                                    approvalAction === 'approve' 
                                      ? "Add any notes for the approval..."
                                      : "Please explain the reason for rejection..."
                                  }
                                  rows={3}
                                  className="mt-1"
                                />
                              </div>
                            </div>

                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setShowApprovalDialog(false);
                                  setApprovalNotes('');
                                }}
                                disabled={submittingApproval}
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={handleApproval}
                                disabled={submittingApproval || (approvalAction === 'reject' && !approvalNotes.trim())}
                                className={approvalAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                              >
                                {submittingApproval ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Processing...
                                  </>
                                ) : (
                                  <>
                                    {approvalAction === 'approve' ? <CheckCircle className="w-4 h-4 mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
                                    {approvalAction === 'approve' ? 'Approve' : 'Reject'}
                                  </>
                                )}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}