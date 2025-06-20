"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { DatabaseService } from "@/lib/database";
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
  activeTraining: number;
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
  const [stats, setStats] = useState<DashboardStats>({
    totalSchools: 0,
    totalStudents: 0,
    totalUsers: 0,
    activeTraining: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async (): Promise<void> => {
    try {
      const [schools, users] = await Promise.all([
        DatabaseService.getSchools().catch(() => []),
        fetch('/api/data/users').then(res => res.json()).catch(() => []),
      ]);

      const schoolsArray = Array.isArray(schools) ? schools : [];
      const usersArray = Array.isArray(users) ? users : [];
      
      setStats({
        totalSchools: schoolsArray.length,
        totalStudents: schoolsArray.reduce((sum, school) => sum + (school.total_students || 0), 0),
        totalUsers: usersArray.length,
        activeTraining: 6,
      });
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getWelcomeMessage = (): string => {
    if (!user) return "Welcome!";
    const timeOfDay = new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening";
    const firstName = user.full_name ? user.full_name.split(" ")[0] : user.username;
    return `Good ${timeOfDay}, ${firstName}!`;
  };

  const recentActivities: ActivityItem[] = [
    {
      id: 1,
      title: "New school registered",
      time: "2 hours ago",
      icon: Building,
      colorClass: "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400",
    },
    {
      id: 2,
      title: "Training session completed",
      time: "4 hours ago",
      icon: BookOpen,
      colorClass: "bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400",
    },
    {
      id: 3,
      title: "New user created",
      time: "1 day ago",
      icon: Users,
      colorClass: "bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400",
    },
    {
      id: 4,
      title: "Report generated",
      time: "2 days ago",
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
          Welcome to your TaRL Insight Hub dashboard
        </p>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        
        {/* Left Column - Stats (3/4 width on large screens) */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Stats Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Schools"
              value={stats.totalSchools}
              icon={Building}
              color="bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400"
              change="12%"
              changeType="increase"
            />
            
            <StatCard
              title="Total Students"
              value={stats.totalStudents}
              icon={Users}
              color="bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400"
              change="8%"
              changeType="increase"
            />
            
            <StatCard
              title="Active Users"
              value={stats.totalUsers}
              icon={GraduationCap}
              color="bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400"
              change="3%"
              changeType="increase"
            />
            
            <StatCard
              title="Training Sessions"
              value={stats.activeTraining}
              icon={Activity}
              color="bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-400"
              change="15%"
              changeType="increase"
            />
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            <a href="/schools" className="block">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="text-center">
                  <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center dark:bg-blue-900/50">
                    <Building className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Schools</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Manage schools</p>
                </div>
              </div>
            </a>

            <a href="/users" className="block">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="text-center">
                  <div className="mx-auto w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center dark:bg-green-900/50">
                    <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Users</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Manage users</p>
                </div>
              </div>
            </a>

            <a href="/training" className="block">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="text-center">
                  <div className="mx-auto w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center dark:bg-purple-900/50">
                    <BookOpen className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Training</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Training sessions</p>
                </div>
              </div>
            </a>

            <a href="/reports" className="block">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="text-center">
                  <div className="mx-auto w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center dark:bg-orange-900/50">
                    <BarChart3 className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Reports</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">View analytics</p>
                </div>
              </div>
            </a>
          </div>

          {/* Chart Area */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">System Overview</h3>
            <div className="h-32 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Chart visualization area</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Recent Activity (1/4 width on large screens) */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700 h-full">
            <div className="flex items-center mb-4">
              <Activity className="w-5 h-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
            </div>
            <div className="space-y-3">
              {recentActivities.map((activity) => {
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