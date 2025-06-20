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
  Loader2,
  ArrowLeft
} from "lucide-react";
import { toast } from "sonner";
import { useTrainingTranslation } from "@/lib/training-i18n";
import { TrainingLocaleProvider } from "@/components/training-locale-provider";
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

function QuickRegisterPageContent() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  const { t } = useTrainingTranslation();
  
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
      toast.error(t.failedToLoadSession);
    } finally {
      setLoading(false);
    }
  };

  const searchParticipant = async () => {
    if (!searchEmail || !searchEmail.includes('@')) {
      toast.error(t.pleaseEnterValidEmail);
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
          toast.success(t.participantFoundPreFilled);
        } else {
          // New participant, just set email
          setFormData(prev => ({
            ...prev,
            participant_email: searchEmail
          }));
          toast.info(t.newParticipantFillDetails);
        }
      }
    } catch (error) {
      console.error("Error searching participant:", error);
      toast.error(t.failedToSearchParticipant);
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickRegister = async () => {
    if (!formData.participant_email || !formData.participant_name) {
      toast.error(t.emailNameRequired);
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
        toast.success(result.message || t.registrationAttendanceSuccess);
        
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
        toast.error(error.error || t.failedToRegisterParticipant);
      }
    } catch (error) {
      console.error("Error registering participant:", error);
      toast.error(t.failedToRegisterParticipant);
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
          <AlertDescription>{t.sessionNotFound}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header Section - Full Width */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="mb-4">
                <h1 className="text-4xl font-bold text-gray-900">{t.quickRegistration}</h1>
                <p className="text-xl text-gray-600 mt-1">{session.session_title}</p>
              </div>
              
              <div className="flex flex-wrap gap-6 text-base">
                <div className="flex items-center gap-2 text-gray-700">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">
                    {new Date(session.session_date).toLocaleDateString('en-US')} {t.at} {session.start_time}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <MapPin className="h-5 w-5 text-green-600" />
                  <span className="font-medium">{session.location}</span>
                </div>
                <Badge 
                  variant={session.current_attendance >= session.capacity ? "destructive" : "default"}
                  className="text-sm px-3 py-1"
                >
                  {session.current_attendance} / {session.capacity} {t.attendees}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.back()}
                className="flex items-center gap-2 hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                {t.back}
              </Button>
              
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Full Width Container */}
      <div className="max-w-7xl mx-auto px-6 py-8">

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-8 bg-gray-100">
            <TabsTrigger value="quick" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              {t.quickCheckin}
            </TabsTrigger>
            <TabsTrigger value="bulk" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              {t.bulkOperations}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quick" className="space-y-8">
            {/* Search Section */}
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader className="pb-6">
                <CardTitle className="text-2xl text-gray-900">{t.quickRegistrationAndAttendance}</CardTitle>
                <CardDescription className="text-base text-gray-600">
                  {t.registerWalkInParticipants}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Email Search */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Label htmlFor="search-email" className="text-base font-medium text-gray-700">
                        {t.searchByEmail}
                      </Label>
                      <Input
                        id="search-email"
                        type="email"
                        placeholder={t.emailPlaceholder}
                        value={searchEmail}
                        onChange={(e) => setSearchEmail(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && searchParticipant()}
                        className="mt-2 h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button 
                        onClick={searchParticipant} 
                        disabled={submitting || !searchEmail}
                        size="lg"
                        className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {submitting ? (
                          <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        ) : (
                          <Search className="h-5 w-5 mr-2" />
                        )}
                        {t.search}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Search Result */}
                {searchResult && (
                  <Alert className={`${searchResult.isReturning ? "border-blue-200 bg-blue-50" : "border-green-200 bg-green-50"} border-l-4`}>
                    <UserCheck className="h-5 w-5" />
                    <AlertDescription className="text-base">
                      {searchResult.isReturning ? (
                        <div className="space-y-3">
                          <p className="font-semibold text-blue-800">
                            {t.welcomeBack.replace('{name}', searchResult.participant.fullName)}
                          </p>
                          <div className="flex gap-3">
                            <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                              {searchResult.participant.totalSessionsAttended} {t.sessionsAttended}
                            </Badge>
                            <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                              {searchResult.participant.attendanceRate}% {t.attendanceRate}
                            </Badge>
                          </div>
                        </div>
                      ) : (
                        <p className="text-green-800 font-medium">{t.newParticipantFillInfo}</p>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Registration Form */}
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader className="pb-6">
                <CardTitle className="text-2xl text-gray-900 flex items-center gap-3">
                  <User className="h-6 w-6 text-blue-600" />
                  {t.participantInformation}
                </CardTitle>
                <CardDescription className="text-base text-gray-600">
                  {t.fillRequiredFields}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Essential Information */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                    {t.essentialInformation}
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="email" className="text-base font-medium text-gray-700 flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        {t.email} *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.participant_email}
                        onChange={(e) => setFormData({...formData, participant_email: e.target.value})}
                        className="mt-2 h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="name" className="text-base font-medium text-gray-700 flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        {t.fullName} *
                      </Label>
                      <Input
                        id="name"
                        value={formData.participant_name}
                        onChange={(e) => setFormData({...formData, participant_name: e.target.value})}
                        className="mt-2 h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Contact & Role Information */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                    {t.contactRoleInformation}
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="phone" className="text-base font-medium text-gray-700 flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        {t.phone}
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.participant_phone}
                        onChange={(e) => setFormData({...formData, participant_phone: e.target.value})}
                        className="mt-2 h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <Label htmlFor="role" className="text-base font-medium text-gray-700">
                        {t.role}
                      </Label>
                      <Input
                        id="role"
                        value={formData.participant_role}
                        onChange={(e) => setFormData({...formData, participant_role: e.target.value})}
                        placeholder={t.rolePlaceholder}
                        className="mt-2 h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Organization & Location */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                    {t.organizationLocation}
                  </h3>
                  <div>
                    <Label htmlFor="organization" className="text-base font-medium text-gray-700 flex items-center gap-2">
                      <Building className="h-4 w-4 text-gray-500" />
                      {t.schoolOrganization}
                    </Label>
                    <Input
                      id="organization"
                      value={formData.school_name}
                      onChange={(e) => setFormData({...formData, school_name: e.target.value})}
                      className="mt-2 h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="district" className="text-base font-medium text-gray-700 flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        {t.district}
                      </Label>
                      <Input
                        id="district"
                        value={formData.district}
                        onChange={(e) => setFormData({...formData, district: e.target.value})}
                        className="mt-2 h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <Label htmlFor="province" className="text-base font-medium text-gray-700">
                        {t.province}
                      </Label>
                      <Input
                        id="province"
                        value={formData.province}
                        onChange={(e) => setFormData({...formData, province: e.target.value})}
                        className="mt-2 h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-8 border-t border-gray-200">
                  <Button 
                    onClick={handleQuickRegister}
                    disabled={submitting || !formData.participant_email || !formData.participant_name}
                    className="flex-1 h-14 text-lg bg-green-600 hover:bg-green-700 text-white"
                    size="lg"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin mr-3" />
                        {t.processing}
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-5 w-5 mr-3" />
                        {t.registerAndMarkAttendance}
                      </>
                    )}
                  </Button>
                </div>
            </CardContent>
          </Card>
        </TabsContent>

          <TabsContent value="bulk" className="space-y-8">
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader className="pb-6">
                <CardTitle className="text-2xl text-gray-900">{t.bulkOperations}</CardTitle>
                <CardDescription className="text-base text-gray-600">
                  {t.manageAttendanceMultiple}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6">
                  <Button 
                    onClick={handleBulkCheckIn}
                    variant="outline"
                    className="w-full justify-start h-20 text-left border-2 hover:border-blue-300 hover:bg-blue-50 transition-all"
                    size="lg"
                  >
                    <UserCheck className="h-8 w-8 mr-4 text-blue-600" />
                    <div>
                      <p className="font-semibold text-lg text-gray-900">{t.bulkAttendanceCheckin}</p>
                      <p className="text-sm text-gray-600 mt-1">{t.markAttendancePreRegistered}</p>
                    </div>
                  </Button>

                  <Button 
                    onClick={() => router.push(`/training/sessions/${sessionId}/qr-checkin`)}
                    variant="outline"
                    className="w-full justify-start h-20 text-left border-2 hover:border-purple-300 hover:bg-purple-50 transition-all"
                    size="lg"
                  >
                    <QrCode className="h-8 w-8 mr-4 text-purple-600" />
                    <div>
                      <p className="font-semibold text-lg text-gray-900">{t.qrCodeCheckin}</p>
                      <p className="text-sm text-gray-600 mt-1">{t.scanQrCodesQuickAttendance}</p>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function QuickRegisterPage() {
  return (
    <TrainingLocaleProvider>
      <QuickRegisterPageContent />
    </TrainingLocaleProvider>
  );
}