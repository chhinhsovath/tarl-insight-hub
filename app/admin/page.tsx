"use client";

import { useAuth } from "@/lib/auth-context";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Users, School, Settings, BarChart, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role?.toLowerCase() !== 'admin')) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user || user.role?.toLowerCase() !== 'admin') {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Shield className="h-8 w-8 text-blue-600" />
            Admin Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Complete system oversight and management
          </p>
        </div>
      </div>

      {/* Welcome Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold text-blue-900 mb-2">
            Welcome back, {user.full_name}!
          </h2>
          <p className="text-blue-700">
            You have administrator privileges with full system access.
          </p>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" 
              onClick={() => router.push('/users')}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-blue-600" />
              User Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-sm mb-4">
              Manage system users, roles, and permissions
            </p>
            <Button variant="outline" size="sm" className="w-full">
              Manage Users
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" 
              onClick={() => router.push('/schools')}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <School className="h-5 w-5 text-green-600" />
              School Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-sm mb-4">
              Oversee schools, students, and academic data
            </p>
            <Button variant="outline" size="sm" className="w-full">
              Manage Schools
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" 
              onClick={() => router.push('/training')}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-purple-600" />
              Training Programs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-sm mb-4">
              Manage training sessions and materials
            </p>
            <Button variant="outline" size="sm" className="w-full">
              View Training
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" 
              onClick={() => router.push('/analytics')}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart className="h-5 w-5 text-orange-600" />
              Analytics & Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-sm mb-4">
              View system analytics and generate reports
            </p>
            <Button variant="outline" size="sm" className="w-full">
              View Analytics
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" 
              onClick={() => router.push('/settings')}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings className="h-5 w-5 text-gray-600" />
              System Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-sm mb-4">
              Configure system settings and permissions
            </p>
            <Button variant="outline" size="sm" className="w-full">
              Settings
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" 
              onClick={() => router.push('/dashboard')}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-blue-600" />
              Full Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-sm mb-4">
              Access the complete administrative dashboard
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