"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Users, GraduationCap, UserPlus, School, BookOpen } from 'lucide-react';
import { HierarchicalUserCreator } from '@/components/hierarchical-user-creator';
import { ClassManagement } from '@/components/class-management';
import { StudentManagement } from '@/components/student-management';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';

export default function HierarchicalManagementPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [selectedClass, setSelectedClass] = useState<any>(null);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Please log in to access this page.</p>
      </div>
    );
  }

  const getRoleDisplayName = (roleName: string) => {
    return roleName.charAt(0).toUpperCase() + roleName.slice(1);
  };

  const getRoleBadgeColor = (roleName: string) => {
    const colors: Record<string, string> = {
      'admin': 'bg-red-100 text-red-800',
      'director': 'bg-purple-100 text-purple-800',
      'partner': 'bg-blue-100 text-blue-800',
      'teacher': 'bg-green-100 text-green-800',
      'coordinator': 'bg-yellow-100 text-yellow-800',
      'collector': 'bg-orange-100 text-orange-800',
      'intern': 'bg-gray-100 text-gray-800'
    };
    return colors[roleName] || 'bg-gray-100 text-gray-800';
  };

  const getAvailableTabs = () => {
    const tabs = [];
    
    // User management - for admins, directors, partners
    if (['admin', 'director', 'partner'].includes(user.role)) {
      tabs.push({
        value: 'users',
        label: 'User Management',
        icon: <Users className="h-4 w-4" />,
        description: 'Create and manage users in your hierarchy'
      });
    }

    // Class management - for teachers, coordinators, and above
    if (['admin', 'director', 'partner', 'teacher', 'coordinator'].includes(user.role)) {
      tabs.push({
        value: 'classes',
        label: 'Class Management',
        icon: <GraduationCap className="h-4 w-4" />,
        description: 'Create and manage classes'
      });
    }

    // Student management - for teachers and above
    if (['admin', 'director', 'partner', 'teacher', 'coordinator'].includes(user.role)) {
      tabs.push({
        value: 'students',
        label: 'Student Management',
        icon: <BookOpen className="h-4 w-4" />,
        description: 'Manage students and their transcripts'
      });
    }

    return tabs;
  };

  const getWelcomeMessage = () => {
    const messages: Record<string, string> = {
      'admin': 'As an Admin, you have full system access. You can create Directors and Partners, manage all users, and oversee the entire platform.',
      'director': 'As a Director, you can create Teachers and Coordinators in your assigned regions. You can also manage classes and oversee student progress.',
      'partner': 'As a Partner, you can create Teachers and Coordinators in your assigned regions. You can also manage classes and oversee student progress.',
      'teacher': 'As a Teacher, you can create and manage your classes, add students, and maintain their monthly academic transcripts.',
      'coordinator': 'As a Coordinator, you can manage classes and students within your assigned schools.',
      'collector': 'As a Collector, you focus on data collection activities and observations.',
      'intern': 'As an Intern, you have limited access to view and learn from the system.'
    };
    return messages[user.role] || 'Welcome to the TaRL management system.';
  };

  const availableTabs = getAvailableTabs();

  if (availableTabs.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <School className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Access Restricted</h2>
          <p className="text-muted-foreground">
            Your role ({getRoleDisplayName(user.role)}) does not have access to management features.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Hierarchical Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage your team, classes, and students
          </p>
        </div>
        <Badge className={getRoleBadgeColor(user.role)} variant="secondary">
          {getRoleDisplayName(user.role)}
        </Badge>
      </div>

      {/* Welcome Message */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Welcome, {user.username}!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{getWelcomeMessage()}</p>
        </CardContent>
      </Card>

      {/* Management Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-2xl mx-auto">
          {availableTabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
              {tab.icon}
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* User Management Tab */}
        {availableTabs.some(tab => tab.value === 'users') && (
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Hierarchical User Creation</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Create users within your organizational hierarchy. You can only create users at levels below yours.
                </p>
              </CardHeader>
              <CardContent>
                <HierarchicalUserCreator
                  currentUser={{
                    id: user.id,
                    role: user.role,
                    username: user.username
                  }}
                  onUserCreated={() => {
                    toast.success('User created successfully');
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Class Management Tab */}
        {availableTabs.some(tab => tab.value === 'classes') && (
          <TabsContent value="classes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Class Management</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Create and manage classes. Teachers can create their own classes, while administrators can manage all classes.
                </p>
              </CardHeader>
              <CardContent>
                <ClassManagement
                  currentUser={{
                    id: user.id,
                    role: user.role,
                    username: user.username,
                    school_id: user.school_id
                  }}
                  onClassCreated={() => {
                    toast.success('Class created successfully');
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Student Management Tab */}
        {availableTabs.some(tab => tab.value === 'students') && (
          <TabsContent value="students" className="space-y-6">
            {user.role === 'teacher' ? (
              <Card>
                <CardHeader>
                  <CardTitle>Select a Class to Manage Students</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Choose one of your classes to add students and manage their monthly transcripts.
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Please create a class first in the "Class Management" tab, then return here to add students.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Student Management</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Manage students across your assigned schools and classes.
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Student management interface for administrators will be available here.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}
      </Tabs>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle>Management Workflow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <h3 className="font-medium">1. Create Users</h3>
              <p className="text-sm text-muted-foreground">
                Admin creates Directors, Directors create Teachers
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <GraduationCap className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <h3 className="font-medium">2. Create Classes</h3>
              <p className="text-sm text-muted-foreground">
                Teachers create and manage their classes
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <BookOpen className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <h3 className="font-medium">3. Manage Students</h3>
              <p className="text-sm text-muted-foreground">
                Add students and maintain their monthly transcripts
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}