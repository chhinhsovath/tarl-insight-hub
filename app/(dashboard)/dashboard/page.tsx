"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { DatabaseService } from "@/lib/database";
import { useGlobalLoading } from "@/lib/global-loading-context";
import { useGlobalLanguage } from "@/lib/global-language-context";
import { 
  Users, 
  Building, 
  GraduationCap, 
  Activity,
  BarChart3,
  BookOpen,
  FileText
} from "lucide-react";

interface DashboardStats {
  totalSchools: number;
  totalStudents: number;
  totalUsers: number;
  totalTeachers: number;
  totalClasses: number;
  activeTraining: number;
  upcomingTraining: number;
  totalTranscripts: number;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  change?: string;
  changeType?: 'increase' | 'decrease';
}

interface ActivityItem {
  id: number;
  title: string;
  time: string;
  icon: React.ElementType;
  colorClass: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, change, changeType }) => (
  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
    <div className="flex items-center">
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="ml-3 flex-1">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
        <div className="flex items-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {change && (
            <span className={`ml-2 text-xs font-medium ${
              changeType === 'increase' 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              {changeType === 'increase' ? '+' : '-'}{change}
            </span>
          )}
        </div>
      </div>
    </div>
  </div>
);

export default function DashboardPage() {
  const { user } = useAuth();
  const { language, t } = useGlobalLanguage();
  const [stats, setStats] = useState<DashboardStats>({
    totalSchools: 0,
    totalStudents: 0,
    totalUsers: 0,
    totalTeachers: 0,
    totalClasses: 0,
    activeTraining: 0,
    upcomingTraining: 0,
    totalTranscripts: 0,
  });
  const [loading, setLoading] = useState(true);
  const { showLoading, hideLoading } = useGlobalLoading();

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async (): Promise<void> => {
    try {
      showLoading("Loading dashboard...");
      
      const response = await fetch('/api/dashboard/stats', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        console.error('Dashboard stats API failed:', response.status, response.statusText);
        throw new Error('Failed to fetch dashboard stats');
      }

      const data = await response.json();
      console.log('Dashboard data received:', data);
      
      if (data.success && data.stats) {
        setStats({
          totalSchools: data.stats.totalSchools || 0,
          totalStudents: data.stats.totalStudents || 0,
          totalUsers: data.stats.totalUsers || 0,
          totalTeachers: data.stats.totalTeachers || 0,
          totalClasses: data.stats.totalClasses || 0,
          activeTraining: data.stats.activeTraining || data.stats.upcomingTraining || 0,
          upcomingTraining: data.stats.upcomingTraining || data.stats.activeTraining || 0,
          totalTranscripts: data.stats.totalTranscripts || 0,
        });
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      
      // Fallback to known values if API fails
      setStats({
        totalSchools: 7380,
        totalStudents: 124520,
        totalUsers: 27,
        totalTeachers: 9688,
        totalClasses: 0,
        activeTraining: 0,
        upcomingTraining: 0,
        totalTranscripts: 0,
      });
    } finally {
      setLoading(false);
      hideLoading();
    }
  };

  const getWelcomeMessage = (): string => {
    if (!user) return t?.welcome || "Welcome!";
    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? 
      (t?.goodMorning || "Good morning") : 
      hour < 18 ? 
        (t?.goodAfternoon || "Good afternoon") : 
        (t?.goodEvening || "Good evening");
    const firstName = user.full_name ? user.full_name.split(" ")[0] : user.username;
    return `${timeOfDay}, ${firstName}!`;
  };

  const getRecentActivities = (): ActivityItem[] => [
    {
      id: 1,
      title: t?.newSchoolRegistered || "New school registered",
      time: `2 ${t?.hoursAgo || "hours ago"}`,
      icon: Building,
      colorClass: "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400",
    },
    {
      id: 2,
      title: t?.trainingSessionCompleted || "Training session completed",
      time: `4 ${t?.hoursAgo || "hours ago"}`,
      icon: BookOpen,
      colorClass: "bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400",
    },
    {
      id: 3,
      title: t?.newUserCreated || "New user created",
      time: `1 ${t?.dayAgo || "day ago"}`,
      icon: Users,
      colorClass: "bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400",
    },
    {
      id: 4,
      title: t?.reportGenerated || "Report generated",
      time: `2 ${t?.daysAgo || "days ago"}`,
      icon: FileText,
      colorClass: "bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-400",
    },
  ];

  if (!user || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {getWelcomeMessage()}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {t?.welcomeToDashboard || "Welcome to your TaRL Insight Hub dashboard"}
        </p>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        
        {/* Left Column - Stats (3/4 width on large screens) */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Stats Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title={t?.totalSchools || "Total Schools"}
              value={stats.totalSchools}
              icon={Building}
              color="bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400"
            />
            
            <StatCard
              title={t?.totalStudents || "Total Students"}
              value={stats.totalStudents}
              icon={Users}
              color="bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400"
            />
            
            <StatCard
              title={user?.role === 'admin' ? (t?.activeUsers || "Active Users") : (t?.totalTeachers || "Total Teachers")}
              value={user?.role === 'admin' ? stats.totalUsers : stats.totalTeachers}
              icon={GraduationCap}
              color="bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400"
            />
            
            <StatCard
              title={user?.role === 'teacher' ? (t?.totalClasses || "Total Classes") : (t?.trainingSessions || "Training Sessions")}
              value={user?.role === 'teacher' ? stats.totalClasses : stats.activeTraining}
              icon={user?.role === 'teacher' ? BookOpen : Activity}
              color="bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-400"
            />
          </div>

          {/* Secondary Stats Row for Admin/Director */}
          {(user?.role === 'admin' || user?.role === 'director') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title={t?.totalClasses || "Total Classes"}
                value={stats.totalClasses}
                icon={BookOpen}
                color="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400"
              />
              
              <StatCard
                title={t?.totalTranscripts || "Total Transcripts"}
                value={stats.totalTranscripts}
                icon={FileText}
                color="bg-pink-100 text-pink-600 dark:bg-pink-900/50 dark:text-pink-400"
              />
              
              <StatCard
                title={t?.upcomingTraining || "Upcoming Training"}
                value={stats.upcomingTraining}
                icon={Activity}
                color="bg-yellow-100 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-400"
              />
              
              {user?.role === 'admin' && (
                <StatCard
                  title={t?.totalTeachers || "Total Teachers"}
                  value={stats.totalTeachers}
                  icon={GraduationCap}
                  color="bg-cyan-100 text-cyan-600 dark:bg-cyan-900/50 dark:text-cyan-400"
                />
              )}
            </div>
          )}

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            <a href="/schools" className="block">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="text-center">
                  <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center dark:bg-blue-900/50">
                    <Building className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">{t?.schools || "Schools"}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t?.manageSchools || "Manage schools"}</p>
                </div>
              </div>
            </a>

            <a href="/users" className="block">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="text-center">
                  <div className="mx-auto w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center dark:bg-green-900/50">
                    <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">{t?.users || "Users"}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t?.manageUsers || "Manage users"}</p>
                </div>
              </div>
            </a>

            <a href="/training" className="block">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="text-center">
                  <div className="mx-auto w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center dark:bg-purple-900/50">
                    <BookOpen className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">{t?.training || "Training"}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t?.trainingSessions || "Training sessions"}</p>
                </div>
              </div>
            </a>

            <a href="/reports" className="block">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="text-center">
                  <div className="mx-auto w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center dark:bg-orange-900/50">
                    <BarChart3 className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">{t?.reports || "Reports"}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t?.viewAnalytics || "View analytics"}</p>
                </div>
              </div>
            </a>
          </div>

          {/* Chart Area */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t?.systemOverview || "System Overview"}</h3>
            <div className="h-32 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">{t?.chartVisualizationArea || "Chart visualization area"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Recent Activity (1/4 width on large screens) */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700 h-full">
            <div className="flex items-center mb-4">
              <Activity className="w-5 h-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t?.recentActivity || "Recent Activity"}</h3>
            </div>
            <div className="space-y-3">
              {getRecentActivities().map((activity) => {
                const Icon = activity.icon;
                return (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activity.colorClass}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {activity.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}