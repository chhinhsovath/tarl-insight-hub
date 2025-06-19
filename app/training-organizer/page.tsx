"use client";

import { useAuth } from "@/lib/auth-context";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Calendar, Users, QrCode, FileText, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TrainingOrganizerDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role?.toLowerCase() !== 'training organizer')) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user || user.role?.toLowerCase() !== 'training organizer') {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-orange-600" />
            Training Organizer Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Comprehensive training program management and coordination
          </p>
        </div>
      </div>

      {/* Welcome Card */}
      <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold text-orange-900 mb-2">
            Welcome back, {user.full_name}!
          </h2>
          <p className="text-orange-700">
            Managing training excellence and participant development programs.
          </p>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" 
              onClick={() => router.push('/training/sessions')}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-blue-600" />
              Session Planning
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-sm mb-4">
              Plan, schedule, and organize training sessions
            </p>
            <Button variant="outline" size="sm" className="w-full">
              Manage Sessions
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" 
              onClick={() => router.push('/training/participants')}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-green-600" />
              Participant Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-sm mb-4">
              Manage participant registrations and attendance
            </p>
            <Button variant="outline" size="sm" className="w-full">
              Manage Participants
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" 
              onClick={() => router.push('/training/qr-codes')}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <QrCode className="h-5 w-5 text-purple-600" />
              QR Code Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-sm mb-4">
              Generate and manage QR codes for check-ins
            </p>
            <Button variant="outline" size="sm" className="w-full">
              Manage QR Codes
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" 
              onClick={() => router.push('/training/programs')}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="h-5 w-5 text-orange-600" />
              Training Programs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-sm mb-4">
              Create and manage comprehensive training programs
            </p>
            <Button variant="outline" size="sm" className="w-full">
              Manage Programs
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" 
              onClick={() => router.push('/training/feedback')}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-indigo-600" />
              Training Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-sm mb-4">
              Generate reports and collect participant feedback
            </p>
            <Button variant="outline" size="sm" className="w-full">
              View Reports
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" 
              onClick={() => router.push('/dashboard')}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings className="h-5 w-5 text-gray-600" />
              Full Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-sm mb-4">
              Access the complete training management interface
            </p>
            <Button variant="outline" size="sm" className="w-full">
              Full Access
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}