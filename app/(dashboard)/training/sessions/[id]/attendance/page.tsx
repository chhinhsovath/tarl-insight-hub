"use client";

import { useState, useEffect } from "react";
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
  Filter
} from "lucide-react";
import { toast } from "sonner";

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

export default function BulkAttendancePage() {
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
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
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
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button 
            variant="outline" 
            onClick={() => router.back()}
            size="sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Bulk Attendance</h1>
            <p className="text-muted-foreground">Mark attendance for multiple participants</p>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="font-semibold text-lg mb-2">{session.session_title}</h2>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {new Date(session.session_date).toLocaleDateString()} at {session.start_time}
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {session.location}
            </div>
            <Badge variant={session.current_attendance >= session.capacity ? "destructive" : "default"}>
              {session.current_attendance} / {session.capacity} Attendees
            </Badge>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search participants by name, email, or school..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("all")}
              >
                All ({registrations.length})
              </Button>
              <Button
                variant={statusFilter === "registered" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("registered")}
              >
                Registered ({registrations.filter(r => r.attendance_status === 'registered').length})
              </Button>
              <Button
                variant={statusFilter === "attended" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("attended")}
              >
                Attended ({registrations.filter(r => r.attendance_status === 'attended').length})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedParticipants.size > 0 && (
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-green-600" />
                <span className="font-medium">
                  {selectedParticipants.size} participant(s) selected
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedParticipants(new Set())}
                >
                  Clear Selection
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
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Mark Attendance
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Participants List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Registered Participants ({filteredRegistrations.length})</span>
            {filteredRegistrations.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
              >
                {selectedParticipants.size === filteredRegistrations.length ? "Deselect All" : "Select All"}
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRegistrations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No participants found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRegistrations.map((registration) => (
                <div
                  key={registration.id}
                  className={`p-4 border rounded-lg ${
                    selectedParticipants.has(registration.id) 
                      ? 'border-green-300 bg-green-50' 
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedParticipants.has(registration.id)}
                        onCheckedChange={() => handleSelectParticipant(registration.id)}
                      />
                      <div>
                        <h3 className="font-medium">{registration.participant_name}</h3>
                        <p className="text-sm text-muted-foreground">{registration.participant_email}</p>
                        {registration.school_name && (
                          <p className="text-sm text-muted-foreground">{registration.school_name}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusBadge(registration.attendance_status)} variant="secondary">
                        {registration.attendance_status}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
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
  );
}