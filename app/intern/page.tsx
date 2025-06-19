"use client";

import { useAuth } from "@/lib/auth-context";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, BookOpen, FileText, Users, Award, Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function InternDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role?.toLowerCase() !== 'intern')) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user || user.role?.toLowerCase() !== 'intern') {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <User className="h-8 w-8 text-gray-600" />
            Intern Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Learning and contributing to educational excellence
          </p>
        </div>
      </div>

      {/* Welcome Card */}
      <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Welcome back, {user.full_name}!
          </h2>
          <p className="text-gray-700">
            Ready to learn, grow, and make a meaningful contribution to education.
          </p>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" 
              onClick={() => router.push('/training')}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="h-5 w-5 text-blue-600" />
              Learning Resources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-sm mb-4">
              Access training materials and learning resources
            </p>
            <Button variant="outline" size="sm" className="w-full">
              Start Learning
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" 
              onClick={() => router.push('/observations')}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-green-600" />
              Data Entry Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-sm mb-4">
              Support data entry and basic observation tasks
            </p>
            <Button variant="outline" size="sm" className="w-full">
              View Tasks
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" 
              onClick={() => router.push('/reports')}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-purple-600" />
              Reports & Documentation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-sm mb-4">
              View reports and contribute to documentation
            </p>
            <Button variant="outline" size="sm" className="w-full">
              View Reports
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" 
              onClick={() => router.push('/users')}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-orange-600" />
              Team Collaboration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-sm mb-4">
              Collaborate with team members and mentors
            </p>
            <Button variant="outline" size="sm" className="w-full">
              View Team
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" 
              onClick={() => router.push('/progress')}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Award className="h-5 w-5 text-indigo-600" />
              Learning Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-sm mb-4">
              Track your learning progress and achievements
            </p>
            <Button variant="outline" size="sm" className="w-full">
              View Progress
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" 
              onClick={() => router.push('/dashboard')}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Coffee className="h-5 w-5 text-gray-600" />
              Full Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-sm mb-4">
              Access the complete internship interface
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