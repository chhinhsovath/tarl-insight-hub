"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  BookOpen, 
  Users, 
  GraduationCap, 
  FileText, 
  TrendingUp, 
  Calendar,
  Plus,
  Eye,
  Edit,
  Settings,
  ClipboardList
} from "lucide-react";
import { useGlobalLanguage } from "@/lib/global-language-context";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";

interface TeacherDashboardData {
  teacherInfo: {
    id: number;
    teacher_name: string;
    teacher_id: string;
    subject_specialization: string;
    school_name: string;
    school_code: string;
    registration_status: string;
  };
  stats: {
    totalClasses: number;
    totalStudents: number;
    activeClasses: number;
    completedTranscripts: number;
  };
  recentClasses: Array<{
    id: number;
    class_name: string;
    grade_level: string;
    student_count: number;
    academic_year: string;
    room_number: string;
  }>;
  recentActivities: Array<{
    id: number;
    activity: string;
    date: string;
    type: 'class' | 'student' | 'transcript';
  }>;
}

export default function TeacherDashboardPage() {
  const { language } = useGlobalLanguage();
  const { user } = useAuth();
  const isKhmer = language === 'kh';
  
  const [dashboardData, setDashboardData] = useState<TeacherDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/teacher/dashboard');
      const result = await response.json();

      if (response.ok) {
        setDashboardData(result.data);
      } else {
        toast.error(result.error || (isKhmer ? "មិនអាចទាញយកទិន្នន័យបានទេ" : "Failed to load dashboard data"));
      }
    } catch (error) {
      console.error("Error loading dashboard:", error);
      toast.error(isKhmer ? "មានបញ្ហាក្នុងការទាក់ទងម៉ាស៊ីនមេ" : "Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          {isKhmer ? "កំពុងរង់ចាំ" : "Pending"}
        </Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          {isKhmer ? "បានអនុម័ត" : "Approved"}
        </Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          {isKhmer ? "បានបដិសេធ" : "Rejected"}
        </Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center">
          <div className="text-gray-500">{isKhmer ? "កំពុងទាញយកទិន្នន័យ..." : "Loading dashboard..."}</div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center">
          <div className="text-gray-500">{isKhmer ? "មិនមានទិន្នន័យទេ" : "No data available"}</div>
        </div>
      </div>
    );
  }

  const { teacherInfo, stats, recentClasses, recentActivities } = dashboardData;

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {isKhmer ? "ផ្ទាំងគ្រប់គ្រងគ្រូ" : "Teacher Dashboard"}
        </h1>
        <p className="text-gray-600">
          {isKhmer 
            ? `ស្វាគមន៍មកកាន់ផ្ទាំងគ្រប់គ្រងរបស់ ${user?.full_name}`
            : `Welcome to your teaching dashboard, ${user?.full_name}`
          }
        </p>
      </div>

      {/* Teacher Information Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            {isKhmer ? "ព័ត៌មានគ្រូ" : "Teacher Information"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <h3 className="font-semibold text-lg">{teacherInfo.teacher_name}</h3>
              <p className="text-gray-600">{isKhmer ? "លេខសម្គាល់:" : "ID:"} {teacherInfo.teacher_id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">{isKhmer ? "មុខវិជ្ជាឯកទេស:" : "Subject:"}</p>
              <p className="text-sm">{teacherInfo.subject_specialization || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">{isKhmer ? "សាលា:" : "School:"}</p>
              <p className="text-sm">{teacherInfo.school_name}</p>
              <p className="text-xs text-gray-500">{teacherInfo.school_code}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">{isKhmer ? "ស្ថានភាព:" : "Status:"}</p>
              {getStatusBadge(teacherInfo.registration_status)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isKhmer ? "ថ្នាក់ទាំងអស់" : "Total Classes"}
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClasses}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeClasses} {isKhmer ? "ថ្នាក់កំពុងសកម្ម" : "active classes"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isKhmer ? "សិស្សទាំងអស់" : "Total Students"}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              {isKhmer ? "នៅក្នុងថ្នាក់របស់អ្នក" : "in your classes"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isKhmer ? "ពិន្ទុបានបញ្ចូល" : "Transcripts Completed"}
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedTranscripts}</div>
            <p className="text-xs text-muted-foreground">
              {isKhmer ? "ពិន្ទុបានបញ្ចូល" : "grades entered"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isKhmer ? "ការបញ្ចប់" : "Completion Rate"}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalStudents > 0 ? Math.round((stats.completedTranscripts / stats.totalStudents) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {isKhmer ? "ពិន្ទុបានបញ្ចូល" : "grading progress"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{isKhmer ? "សកម្មភាពរហ័ស" : "Quick Actions"}</CardTitle>
          <CardDescription>
            {isKhmer ? "សកម្មភាពដែលប្រើញឹកញាប់" : "Frequently used actions"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/classes">
              <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center gap-2">
                <BookOpen className="h-5 w-5" />
                <span className="text-sm">{isKhmer ? "គ្រប់គ្រងថ្នាក់" : "Manage Classes"}</span>
              </Button>
            </Link>
            
            <Link href="/students">
              <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center gap-2">
                <Users className="h-5 w-5" />
                <span className="text-sm">{isKhmer ? "គ្រប់គ្រងសិស្ស" : "Manage Students"}</span>
              </Button>
            </Link>
            
            <Link href="/transcripts">
              <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center gap-2">
                <FileText className="h-5 w-5" />
                <span className="text-sm">{isKhmer ? "បញ្ចូលពិន្ទុ" : "Enter Grades"}</span>
              </Button>
            </Link>
            
            <Button 
              variant="outline" 
              className="w-full h-16 flex flex-col items-center justify-center gap-2"
              onClick={() => toast.info(isKhmer ? "មុខងារនេះនឹងអាចប្រើបានឆាប់ៗ" : "This feature will be available soon")}
            >
              <ClipboardList className="h-5 w-5" />
              <span className="text-sm">{isKhmer ? "របាយការណ៍" : "Reports"}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Classes */}
        <Card>
          <CardHeader>
            <CardTitle>{isKhmer ? "ថ្នាក់ថ្មីៗ" : "Recent Classes"}</CardTitle>
            <CardDescription>
              {isKhmer ? "ថ្នាក់ដែលអ្នកកំពុងបង្រៀន" : "Classes you are currently teaching"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentClasses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {isKhmer ? "មិនមានថ្នាក់ទេ" : "No classes assigned"}
              </div>
            ) : (
              <div className="space-y-4">
                {recentClasses.map((cls) => (
                  <div key={cls.id} className="flex items-center justify-between border-b pb-2">
                    <div>
                      <p className="text-sm font-medium">{cls.class_name}</p>
                      <p className="text-xs text-gray-500">
                        {cls.grade_level} • {cls.student_count} {isKhmer ? "សិស្ស" : "students"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {isKhmer ? "បន្ទប់:" : "Room:"} {cls.room_number || 'N/A'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">{cls.academic_year}</p>
                      <Button size="sm" variant="ghost">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle>{isKhmer ? "សកម្មភាពថ្មីៗ" : "Recent Activities"}</CardTitle>
            <CardDescription>
              {isKhmer ? "សកម្មភាពថ្មីបំផុតរបស់អ្នក" : "Your latest activities"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivities.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {isKhmer ? "មិនមានសកម្មភាពថ្មីទេ" : "No recent activities"}
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-3 border-b pb-2">
                    <div className="p-2 bg-blue-50 rounded-full">
                      {activity.type === 'class' && <BookOpen className="h-4 w-4 text-blue-600" />}
                      {activity.type === 'student' && <Users className="h-4 w-4 text-blue-600" />}
                      {activity.type === 'transcript' && <FileText className="h-4 w-4 text-blue-600" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.activity}</p>
                      <p className="text-xs text-gray-500">{new Date(activity.date).toLocaleDateString()}</p>
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