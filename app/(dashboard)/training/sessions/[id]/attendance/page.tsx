"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Search, 
  Users, 
  CheckCircle2, 
  Clock,
  MapPin,
  UserCheck,
  AlertCircle,
  ArrowLeft,
  Loader2,
  Filter,
  Calendar,
  Globe
} from "lucide-react";
import { toast } from "sonner";
import { TrainingLocaleProvider } from '@/components/training-locale-provider';
import { useTrainingTranslation } from '@/lib/training-i18n';
interface Session {
  id: string;
  session_title: string;
  session_date: string;
  start_time: string;
  location: string;
  current_attendance: number;
  capacity: number;
}

interface Registration {
  id: number;
  participant_name: string;
  participant_email: string;
  participant_phone?: string;
  participant_role?: string;
  school_name?: string;
  attendance_status: string;
  registration_method: string;
  created_at: string;
}

function BulkAttendancePageContent() {
  const { t } = useTrainingTranslation();
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  
  const [session, setSession] = useState<Session | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [filteredRegistrations, setFilteredRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState<Set<number>>(new Set());
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchSession();
    fetchRegistrations();
  }, [sessionId]);

  useEffect(() => {
    filterRegistrations();
  }, [registrations, searchTerm, statusFilter]);

  const handleGoBack = () => {
    // Try to go back in history first
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      // Fallback to training sessions list
      router.push('/training/sessions');
    }
  };

  const fetchSession = async () => {
    try {
      const response = await fetch(`/api/training/sessions/${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setSession(data);
      }
    } catch (error) {
      console.error("Error fetching session:", error);
      toast.error("Failed to load session details");
    }
  };

  const fetchRegistrations = async () => {
    try {
      const response = await fetch(`/api/training/sessions/${sessionId}/registrations`);
      if (response.ok) {
        const data = await response.json();
        setRegistrations(data);
      } else {
        toast.error("Failed to load registrations");
      }
    } catch (error) {
      console.error("Error fetching registrations:", error);
      toast.error("Failed to load registrations");
    } finally {
      setLoading(false);
    }
  };

  const filterRegistrations = () => {
    let filtered = registrations;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(reg => 
        reg.participant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.participant_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (reg.school_name && reg.school_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(reg => reg.attendance_status === statusFilter);
    }

    setFilteredRegistrations(filtered);
  };

  const handleSelectAll = () => {
    if (selectedParticipants.size === filteredRegistrations.length) {
      setSelectedParticipants(new Set());
    } else {
      setSelectedParticipants(new Set(filteredRegistrations.map(reg => reg.id)));
    }
  };

  const handleSelectParticipant = (participantId: number) => {
    const newSelected = new Set(selectedParticipants);
    if (newSelected.has(participantId)) {
      newSelected.delete(participantId);
    } else {
      newSelected.add(participantId);
    }
    setSelectedParticipants(newSelected);
  };

  const handleBulkMarkAttendance = async () => {
    if (selectedParticipants.size === 0) {
      toast.error("Please select participants to mark attendance");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/training/sessions/${sessionId}/bulk-attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registration_ids: Array.from(selectedParticipants),
          attendance_status: "attended"
        })
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Marked attendance for ${selectedParticipants.size} participants`);
        setSelectedParticipants(new Set());
        fetchRegistrations();
        fetchSession();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to mark attendance");
      }
    } catch (error) {
      console.error("Error marking bulk attendance:", error);
      toast.error("Failed to mark attendance");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      'registered': 'bg-blue-100 text-blue-800',
      'attended': 'bg-green-100 text-green-800',
      'absent': 'bg-red-100 text-red-800',
      'cancelled': 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="bg-white rounded-full p-4 w-16 h-16 mx-auto mb-4 shadow-lg">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
          <p className="text-gray-600 text-lg">{t.loading || 'Loading attendance...'}</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Session not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Enhanced Header with Back Button and Language Switch */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="container mx-auto max-w-6xl px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Back button and title */}
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleGoBack}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4" />
                {t.back || 'Back'}
              </Button>
              <div className="hidden sm:block h-6 w-px bg-gray-300" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">{t.bulkAttendance || 'Bulk Attendance'}</h1>
                <p className="text-sm text-gray-600">{session.session_title}</p>
              </div>
            </div>
            
            {/* Right: Language switcher */}
            <div className="flex items-center gap-2">
              
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 py-6">
        {/* Session Info Card */}
        <Card className="mb-6 border-0 shadow-md bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold mb-2">{session.session_title}</h2>
                <p className="text-blue-100 text-sm">{t.markAttendanceDescription || 'Mark attendance for multiple participants'}</p>
              </div>
              <div className="bg-white/20 rounded-full p-3">
                <UserCheck className="h-6 w-6" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="flex items-center gap-2 text-blue-100">
                <Calendar className="h-4 w-4" />
                {new Date(session.session_date).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-2 text-blue-100">
                <Clock className="h-4 w-4" />
                {session.start_time}
              </div>
              <div className="flex items-center gap-2 text-blue-100">
                <MapPin className="h-4 w-4" />
                {session.location}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                <Users className="h-3 w-3 mr-1" />
                {registrations.length} {t.registered || 'Registered'}
              </Badge>
              <Badge 
                variant="secondary" 
                className={`${session.current_attendance >= session.capacity ? 'bg-red-500' : 'bg-green-500'} text-white border-0`}
              >
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {session.current_attendance} / {session.capacity} {t.attended || 'Attended'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="mb-6 shadow-md border-0">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder={t.searchByNameEmailSchool || "Search participants by name, email, or school..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("all")}
                  className={statusFilter === "all" ? "bg-blue-600 hover:bg-blue-700" : "border-gray-300"}
                >
                  {t.all || 'All'} ({registrations.length})
                </Button>
                <Button
                  variant={statusFilter === "registered" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("registered")}
                  className={statusFilter === "registered" ? "bg-blue-600 hover:bg-blue-700" : "border-gray-300"}
                >
                  {t.registered || 'Registered'} ({registrations.filter(r => r.attendance_status === 'registered').length})
                </Button>
                <Button
                  variant={statusFilter === "attended" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("attended")}
                  className={statusFilter === "attended" ? "bg-blue-600 hover:bg-blue-700" : "border-gray-300"}
                >
                  {t.attended || 'Attended'} ({registrations.filter(r => r.attendance_status === 'attended').length})
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        {selectedParticipants.size > 0 && (
          <Card className="mb-6 border-green-200 bg-green-50 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-green-600 rounded-full p-2">
                    <UserCheck className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-medium text-green-800">
                    {selectedParticipants.size} {t.participantsSelected || 'participant(s) selected'}
                  </span>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedParticipants(new Set())}
                    className="border-green-300 text-green-700 hover:bg-green-100"
                  >
                    {t.clearSelection || 'Clear Selection'}
                  </Button>
                  <Button
                    onClick={handleBulkMarkAttendance}
                    disabled={submitting}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        {t.processing || 'Processing...'}
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        {t.markAttendance || 'Mark Attendance'}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Participants List */}
        <Card className="shadow-md border-0">
          <CardHeader className="bg-gray-50/50">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {t.registeredParticipants || 'Registered Participants'} ({filteredRegistrations.length})
              </span>
              {filteredRegistrations.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  className="border-gray-300"
                >
                  {selectedParticipants.size === filteredRegistrations.length ? (t.deselectAll || "Deselect All") : (t.selectAll || "Select All")}
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {filteredRegistrations.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                  <Users className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-600 text-lg">{t.noParticipantsFound || 'No participants found'}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRegistrations.map((registration) => (
                  <div
                    key={registration.id}
                    className={`p-5 border-2 rounded-lg transition-all duration-200 ${
                      selectedParticipants.has(registration.id) 
                        ? 'border-green-300 bg-green-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Checkbox
                          checked={selectedParticipants.has(registration.id)}
                          onCheckedChange={() => handleSelectParticipant(registration.id)}
                          className="w-5 h-5"
                        />
                        <div>
                          <h3 className="font-semibold text-lg">{registration.participant_name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{registration.participant_email}</p>
                          {registration.school_name && (
                            <p className="text-sm text-gray-600 mt-1">
                              <MapPin className="h-3 w-3 inline mr-1" />
                              {registration.school_name}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={getStatusBadge(registration.attendance_status)} variant="secondary">
                          {registration.attendance_status}
                        </Badge>
                        <Badge variant="outline" className="text-xs border-gray-300">
                          {registration.registration_method}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AttendanceLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="bg-white rounded-full p-4 w-16 h-16 mx-auto mb-4 shadow-lg">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
        <p className="text-gray-600 text-lg">Loading attendance...</p>
      </div>
    </div>
  );
}

export default function BulkAttendancePage() {
  return (
    <TrainingLocaleProvider>
      <Suspense fallback={<AttendanceLoading />}>
        <BulkAttendancePageContent />
      </Suspense>
    </TrainingLocaleProvider>
  );
}