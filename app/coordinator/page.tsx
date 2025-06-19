"use client";

import { useAuth } from "@/lib/auth-context";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { School, Users, FileText, MapPin, Calendar, BarChart } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CoordinatorDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role?.toLowerCase() !== 'coordinator')) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user || user.role?.toLowerCase() !== 'coordinator') {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <School className="h-8 w-8 text-green-600" />
            Coordinator Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Regional coordination and school support
          </p>
        </div>
      </div>

      {/* Welcome Card */}
      <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold text-green-900 mb-2">
            Welcome back, {user.full_name}!
          </h2>
          <p className="text-green-700">
            Coordinating educational excellence across your region.
          </p>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" 
              onClick={() => router.push('/schools')}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <School className="h-5 w-5 text-blue-600" />
              School Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-sm mb-4">
              Monitor and support schools in your region
            </p>
            <Button variant="outline" size="sm" className="w-full">
              View Schools
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" 
              onClick={() => router.push('/users')}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-green-600" />
              Teacher Support
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-sm mb-4">
              Support and manage teachers in your area
            </p>
            <Button variant="outline" size="sm" className="w-full">
              View Teachers
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" 
              onClick={() => router.push('/training')}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-purple-600" />
              Training Coordination
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-sm mb-4">
              Organize and coordinate training programs
            </p>
            <Button variant="outline" size="sm" className="w-full">
              Manage Training
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" 
              onClick={() => router.push('/analytics')}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart className="h-5 w-5 text-orange-600" />
              Regional Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-sm mb-4">
              View regional performance and trends
            </p>
            <Button variant="outline" size="sm" className="w-full">
              View Analytics
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" 
              onClick={() => router.push('/visits')}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="h-5 w-5 text-indigo-600" />
              School Visits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-sm mb-4">
              Plan and track school visits and monitoring
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
              <FileText className="h-5 w-5 text-gray-600" />
              Full Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-sm mb-4">
              Access the complete coordination interface
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