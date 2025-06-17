"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  MapPin, 
  Clock,
  CheckCircle2,
  UserCheck,
  AlertCircle,
  QrCode,
  Search,
  Loader2
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

interface ParticipantData {
  participant_email: string;
  participant_name: string;
  participant_phone?: string;
  participant_role?: string;
  school_name?: string;
  district?: string;
  province?: string;
}

export default function QuickRegisterPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResult, setSearchResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("quick");
  
  const [formData, setFormData] = useState<ParticipantData>({
    participant_email: "",
    participant_name: "",
    participant_phone: "",
    participant_role: "",
    school_name: "",
    district: "",
    province: ""
  });

  useEffect(() => {
    fetchSession();
  }, [sessionId]);

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
    } finally {
      setLoading(false);
    }
  };

  const searchParticipant = async () => {
    if (!searchEmail || !searchEmail.includes('@')) {
      toast.error("Please enter a valid email address");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/training/participants/check-returning?email=${encodeURIComponent(searchEmail)}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResult(data);
        
        if (data.isReturning && data.participant) {
          // Pre-fill form with participant data
          setFormData({
            participant_email: data.participant.email,
            participant_name: data.participant.fullName,
            participant_phone: data.participant.phone || "",
            participant_role: data.participant.role || "",
            school_name: data.participant.organization || "",
            district: data.participant.district || "",
            province: data.participant.province || ""
          });
          toast.success("Participant found! Information pre-filled.");
        } else {
          // New participant, just set email
          setFormData(prev => ({
            ...prev,
            participant_email: searchEmail
          }));
          toast.info("New participant - please fill in their details");
        }
      }
    } catch (error) {
      console.error("Error searching participant:", error);
      toast.error("Failed to search participant");
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickRegister = async () => {
    if (!formData.participant_email || !formData.participant_name) {
      toast.error("Email and name are required");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/training/sessions/${sessionId}/quick-register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          mark_attendance: true // Always mark attendance for quick registration
        })
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(result.message || "Registration and attendance marked successfully!");
        
        // Clear form for next participant
        setFormData({
          participant_email: "",
          participant_name: "",
          participant_phone: "",
          participant_role: "",
          school_name: "",
          district: "",
          province: ""
        });
        setSearchEmail("");
        setSearchResult(null);
        
        // Refresh session data
        fetchSession();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to register participant");
      }
    } catch (error) {
      console.error("Error registering participant:", error);
      toast.error("Failed to register participant");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkCheckIn = async () => {
    // Navigate to attendance page for bulk check-in
    router.push(`/training/sessions/${sessionId}/attendance`);
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
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Session Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">{session.session_title}</h1>
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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="quick">Quick Check-in</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Operations</TabsTrigger>
        </TabsList>

        <TabsContent value="quick" className="space-y-6">
          {/* Search Section */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Registration & Attendance</CardTitle>
              <CardDescription>
                Register walk-in participants and mark their attendance in one step
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Email Search */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor="search-email">Search by Email</Label>
                  <Input
                    id="search-email"
                    type="email"
                    placeholder="participant@email.com"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchParticipant()}
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={searchParticipant} 
                    disabled={submitting || !searchEmail}
                    size="default"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    Search
                  </Button>
                </div>
              </div>

              {/* Search Result */}
              {searchResult && (
                <Alert className={searchResult.isReturning ? "border-blue-200 bg-blue-50" : ""}>
                  <UserCheck className="h-4 w-4" />
                  <AlertDescription>
                    {searchResult.isReturning ? (
                      <div className="space-y-2">
                        <p className="font-semibold">Welcome back, {searchResult.participant.fullName}!</p>
                        <div className="flex gap-2">
                          <Badge variant="outline">{searchResult.participant.totalSessionsAttended} sessions attended</Badge>
                          <Badge variant="outline">{searchResult.participant.attendanceRate}% attendance rate</Badge>
                        </div>
                      </div>
                    ) : (
                      <p>New participant - please fill in their information below</p>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {/* Registration Form */}
              <div className="space-y-4 pt-4 border-t">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.participant_email}
                      onChange={(e) => setFormData({...formData, participant_email: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.participant_name}
                      onChange={(e) => setFormData({...formData, participant_name: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.participant_phone}
                      onChange={(e) => setFormData({...formData, participant_phone: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Input
                      id="role"
                      value={formData.participant_role}
                      onChange={(e) => setFormData({...formData, participant_role: e.target.value})}
                      placeholder="Teacher, Coordinator, etc."
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="organization">School/Organization</Label>
                  <Input
                    id="organization"
                    value={formData.school_name}
                    onChange={(e) => setFormData({...formData, school_name: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="district">District</Label>
                    <Input
                      id="district"
                      value={formData.district}
                      onChange={(e) => setFormData({...formData, district: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="province">Province</Label>
                    <Input
                      id="province"
                      value={formData.province}
                      onChange={(e) => setFormData({...formData, province: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleQuickRegister}
                  disabled={submitting || !formData.participant_email || !formData.participant_name}
                  className="flex-1"
                  size="lg"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Register & Mark Attendance
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Operations</CardTitle>
              <CardDescription>
                Manage attendance for multiple participants
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <Button 
                  onClick={handleBulkCheckIn}
                  variant="outline"
                  className="w-full justify-start"
                  size="lg"
                >
                  <UserCheck className="h-5 w-5 mr-2" />
                  <div className="text-left">
                    <p className="font-semibold">Bulk Attendance Check-in</p>
                    <p className="text-sm text-muted-foreground">Mark attendance for pre-registered participants</p>
                  </div>
                </Button>

                <Button 
                  onClick={() => router.push(`/training/sessions/${sessionId}/qr-checkin`)}
                  variant="outline"
                  className="w-full justify-start"
                  size="lg"
                >
                  <QrCode className="h-5 w-5 mr-2" />
                  <div className="text-left">
                    <p className="font-semibold">QR Code Check-in</p>
                    <p className="text-sm text-muted-foreground">Scan QR codes for quick attendance</p>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}