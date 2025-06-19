"use client";

import { useAuth } from "@/lib/auth-context";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCheck, Database, Upload, FileText, Map, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CollectorDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role?.toLowerCase() !== 'collector')) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user || user.role?.toLowerCase() !== 'collector') {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <UserCheck className="h-8 w-8 text-teal-600" />
            Data Collector Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Field data collection and observation management
          </p>
        </div>
      </div>

      {/* Welcome Card */}
      <Card className="bg-gradient-to-r from-teal-50 to-teal-100 border-teal-200">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold text-teal-900 mb-2">
            Welcome back, {user.full_name}!
          </h2>
          <p className="text-teal-700">
            Ready to collect valuable field data and observations.
          </p>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" 
              onClick={() => router.push('/observations/new')}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-blue-600" />
              New Observation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-sm mb-4">
              Record new student observations and assessments
            </p>
            <Button variant="outline" size="sm" className="w-full">
              Start Recording
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" 
              onClick={() => router.push('/observations')}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Database className="h-5 w-5 text-green-600" />
              My Observations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-sm mb-4">
              View and manage your collected observations
            </p>
            <Button variant="outline" size="sm" className="w-full">
              View Data
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" 
              onClick={() => router.push('/collection')}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Upload className="h-5 w-5 text-purple-600" />
              Data Sync
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-sm mb-4">
              Sync collected data with the central system
            </p>
            <Button variant="outline" size="sm" className="w-full">
              Sync Data
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" 
              onClick={() => router.push('/students')}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserCheck className="h-5 w-5 text-orange-600" />
              Student Tracking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-sm mb-4">
              Track student progress and performance data
            </p>
            <Button variant="outline" size="sm" className="w-full">
              View Students
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" 
              onClick={() => router.push('/visits')}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Map className="h-5 w-5 text-indigo-600" />
              Field Visits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-sm mb-4">
              Plan and track your field visit schedule
            </p>
            <Button variant="outline" size="sm" className="w-full">
              Plan Visits
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" 
              onClick={() => router.push('/dashboard')}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Wifi className="h-5 w-5 text-gray-600" />
              Full Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-sm mb-4">
              Access the complete data collection interface
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