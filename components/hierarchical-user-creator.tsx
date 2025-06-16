"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserPlus, Users, School, MapPin, Eye, EyeOff } from 'lucide-react';
import { DatabaseService } from '@/lib/database';
import { HierarchyAssignmentManager } from './hierarchy-assignment-manager';
import { toast } from 'sonner';

interface HierarchicalUserCreatorProps {
  currentUser: {
    id: number;
    role: string;
    username: string;
  };
  onUserCreated?: () => void;
}

interface UserFormData {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role_id: number;
  school_id?: number;
  phone?: string;
  address?: string;
}

export function HierarchicalUserCreator({ 
  currentUser, 
  onUserCreated 
}: HierarchicalUserCreatorProps) {
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role_id: 0,
    school_id: undefined,
    phone: '',
    address: ''
  });

  const [roles, setRoles] = useState([]);
  const [schools, setSchools] = useState([]);
  const [accessibleUsers, setAccessibleUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showAssignments, setShowAssignments] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, [currentUser]);

  const loadInitialData = async () => {
    try {
      const [rolesData, schoolsData, usersData] = await Promise.all([
        DatabaseService.getRoles(),
        DatabaseService.getAccessibleSchools(currentUser.id),
        DatabaseService.getUsers({ userId: currentUser.id })
      ]);

      // Filter roles based on user's hierarchy level
      const filteredRoles = filterRolesByHierarchy(rolesData);
      
      setRoles(filteredRoles);
      setSchools(schoolsData);
      setAccessibleUsers(usersData);
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('Failed to load initial data');
    }
  };

  const filterRolesByHierarchy = (rolesData: any[]) => {
    const roleHierarchy: Record<string, string[]> = {
      'admin': ['director', 'partner', 'coordinator', 'collector', 'intern'],
      'director': ['teacher', 'coordinator', 'collector'],
      'partner': ['teacher', 'coordinator', 'collector'],
      'teacher': [], // Teachers cannot create other users
      'coordinator': [],
      'collector': [],
      'intern': []
    };

    const allowedRoles = roleHierarchy[currentUser.role] || [];
    return rolesData.filter(role => allowedRoles.includes(role.name));
  };

  const generatePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, password });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username || !formData.first_name || !formData.last_name || !formData.email || !formData.password || !formData.role_id) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const userData = {
        ...formData,
        created_by: currentUser.id,
        is_active: true
      };

      const result = await DatabaseService.createUser(userData);
      
      if (result) {
        toast.success('User created successfully');
        
        // Auto-assign to appropriate hierarchy if needed
        const selectedRole = roles.find(r => r.id === formData.role_id);
        if (selectedRole && ['director', 'partner'].includes(selectedRole.name) && formData.school_id) {
          await DatabaseService.assignUserToHierarchy({
            userId: result.id,
            assignmentType: 'school',
            assignmentId: formData.school_id,
            assignedBy: currentUser.id
          });
        }

        // Reset form
        setFormData({
          username: '',
          first_name: '',
          last_name: '',
          email: '',
          password: '',
          role_id: 0,
          school_id: undefined,
          phone: '',
          address: ''
        });

        onUserCreated?.();
        loadInitialData(); // Refresh the users list
      } else {
        toast.error('Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const canCreateUsers = () => {
    return ['admin', 'director', 'partner'].includes(currentUser.role);
  };

  const getRoleDisplayName = (roleName: string) => {
    return roleName.charAt(0).toUpperCase() + roleName.slice(1);
  };

  const getUserRoleBadgeColor = (roleName: string) => {
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Management ({getRoleDisplayName(currentUser.role)})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="list" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="list">Manage Users</TabsTrigger>
              <TabsTrigger value="create" disabled={!canCreateUsers()}>
                Create New User
              </TabsTrigger>
            </TabsList>

            {/* Users List Tab */}
            <TabsContent value="list" className="space-y-4">
              <div className="grid gap-4">
                <h3 className="text-lg font-medium">Your Team Members</h3>
                {accessibleUsers.length === 0 ? (
                  <p className="text-muted-foreground">No users in your hierarchy yet.</p>
                ) : (
                  <div className="grid gap-3">
                    {accessibleUsers.map((user: any) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="font-medium">
                              {user.first_name} {user.last_name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              @{user.username} • {user.email}
                            </div>
                            {user.school_name && (
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <School className="h-3 w-3" />
                                {user.school_name}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getUserRoleBadgeColor(user.role)}>
                            {getRoleDisplayName(user.role)}
                          </Badge>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedUser(user)}
                              >
                                Manage
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>
                                  Manage {user.first_name} {user.last_name}
                                </DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <Label>Username</Label>
                                    <p className="font-medium">{user.username}</p>
                                  </div>
                                  <div>
                                    <Label>Email</Label>
                                    <p className="font-medium">{user.email}</p>
                                  </div>
                                  <div>
                                    <Label>Role</Label>
                                    <Badge className={getUserRoleBadgeColor(user.role)}>
                                      {getRoleDisplayName(user.role)}
                                    </Badge>
                                  </div>
                                  <div>
                                    <Label>Status</Label>
                                    <p className="font-medium">
                                      {user.is_active ? 'Active' : 'Inactive'}
                                    </p>
                                  </div>
                                </div>
                                
                                {selectedUser && ['director', 'partner', 'teacher'].includes(selectedUser.role) && (
                                  <div className="border-t pt-4">
                                    <HierarchyAssignmentManager
                                      userId={selectedUser.id}
                                      userRole={selectedUser.role}
                                      onAssignmentsChange={() => loadInitialData()}
                                    />
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Create User Tab */}
            <TabsContent value="create" className="space-y-4">
              {!canCreateUsers() ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Access Restricted</h3>
                  <p className="text-muted-foreground">
                    Only Admins, Directors, and Partners can create new users.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="username">Username *</Label>
                      <Input
                        id="username"
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        placeholder="johndoe"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="john@example.com"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="first_name">First Name *</Label>
                      <Input
                        id="first_name"
                        type="text"
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        placeholder="John"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="last_name">Last Name *</Label>
                      <Input
                        id="last_name"
                        type="text"
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        placeholder="Doe"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="role">Role *</Label>
                      <Select
                        value={formData.role_id.toString()}
                        onValueChange={(value) => setFormData({ ...formData, role_id: parseInt(value) })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role: any) => (
                            <SelectItem key={role.id} value={role.id.toString()}>
                              {getRoleDisplayName(role.name)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="school">School</Label>
                      <Select
                        value={formData.school_id?.toString() || ''}
                        onValueChange={(value) => setFormData({ ...formData, school_id: value ? parseInt(value) : undefined })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select school" />
                        </SelectTrigger>
                        <SelectContent>
                          {schools.map((school: any) => (
                            <SelectItem key={school.id} value={school.id.toString()}>
                              {school.school_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+1234567890"
                      />
                    </div>

                    <div>
                      <Label htmlFor="password">Password *</Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            placeholder="Password"
                            required
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={generatePassword}
                        >
                          Generate
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Full address"
                    />
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Role Hierarchy Info</h4>
                    <div className="text-sm text-blue-800 space-y-1">
                      <p>As a <strong>{getRoleDisplayName(currentUser.role)}</strong>, you can create:</p>
                      <ul className="list-disc list-inside ml-2">
                        {roles.map((role: any) => (
                          <li key={role.id}>{getRoleDisplayName(role.name)}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button type="submit" disabled={loading} className="flex-1">
                      <UserPlus className="h-4 w-4 mr-2" />
                      {loading ? 'Creating User...' : 'Create User'}
                    </Button>
                  </div>
                </form>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}