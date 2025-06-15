"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save, Shield, Users, FileText, History, Settings } from 'lucide-react';
import { DatabaseService } from '@/lib/database';
import { PermissionMatrix, Role, Page, PermissionAudit } from '@/lib/types';
import { cn } from '@/lib/utils';

interface PermissionManagerProps {
  className?: string;
}

export function PermissionManager({ className }: PermissionManagerProps) {
  const [matrix, setMatrix] = useState<PermissionMatrix[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [auditLog, setAuditLog] = useState<PermissionAudit[]>([]);
  const [actionPermissions, setActionPermissions] = useState<any>({});
  const [actionPermissionsLoading, setActionPermissionsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<number | null>(null);

  useEffect(() => {
    loadData();
    loadActionPermissions();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [matrixData, rolesData, pagesData, auditData] = await Promise.all([
        DatabaseService.getPermissionMatrix(),
        DatabaseService.getRoles(),
        DatabaseService.getPages(),
        DatabaseService.getPermissionAuditLog()
      ]);
      
      setMatrix(matrixData);
      setRoles(rolesData);
      setPages(pagesData);
      setAuditLog(auditData);
    } catch (err) {
      setError('Failed to load permission data');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = (roleId: number, pageId: number, canAccess: boolean) => {
    setMatrix(prev => prev.map(role => {
      if (role.roleId === roleId) {
        return {
          ...role,
          permissions: {
            ...role.permissions,
            [pageId]: {
              ...role.permissions[pageId],
              canAccess
            }
          }
        };
      }
      return role;
    }));
  };

  const handleBulkRoleUpdate = async (roleId: number) => {
    try {
      setSaving(true);
      setError(null);
      
      const roleMatrix = matrix.find(r => r.roleId === roleId);
      if (!roleMatrix) return;

      const permissions = Object.values(roleMatrix.permissions).map(p => ({
        pageId: p.pageId,
        canAccess: p.canAccess
      }));

      const success = await DatabaseService.updateRolePermissions({
        roleId,
        permissions
      });

      if (success) {
        setSuccess(`Permissions updated successfully for ${roleMatrix.roleName}`);
        await loadData(); // Reload to get latest audit trail
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError('Failed to update permissions');
      }
    } catch (err) {
      setError('Error updating permissions');
      console.error('Error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleBulkPermissionToggle = (roleId: number, grantAll: boolean) => {
    setMatrix(prev => prev.map(role => {
      if (role.roleId === roleId) {
        const updatedPermissions = { ...role.permissions };
        Object.keys(updatedPermissions).forEach(pageId => {
          updatedPermissions[pageId] = {
            ...updatedPermissions[pageId],
            canAccess: grantAll
          };
        });
        return {
          ...role,
          permissions: updatedPermissions
        };
      }
      return role;
    }));
  };

  const getRolePermissionStats = (roleMatrix: PermissionMatrix) => {
    const permissions = Object.values(roleMatrix.permissions);
    const granted = permissions.filter(p => p.canAccess).length;
    const total = permissions.length;
    return { granted, total };
  };

  const setupAuditSystem = async () => {
    try {
      setSaving(true);
      setError(null);
      
      await DatabaseService.setupAuditSystem();
      setSuccess('Audit system initialized successfully!');
      await loadData(); // Reload to show initial audit entries
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to setup audit system');
      console.error('Error setting up audit system:', err);
    } finally {
      setSaving(false);
    }
  };

  const loadActionPermissions = async () => {
    try {
      setActionPermissionsLoading(true);
      const response = await fetch('/api/action-permissions');
      if (response.ok) {
        const data = await response.json();
        setActionPermissions(data.permissions || {});
      }
    } catch (err) {
      console.error('Error loading action permissions:', err);
    } finally {
      setActionPermissionsLoading(false);
    }
  };

  const setupActionPermissions = async () => {
    try {
      setSaving(true);
      setError(null);
      
      const response = await fetch('/api/setup-action-permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        setSuccess('Action permission system initialized successfully!');
        await loadActionPermissions();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error('Failed to setup action permissions');
      }
    } catch (err) {
      setError('Failed to setup action permission system');
      console.error('Error setting up action permissions:', err);
    } finally {
      setSaving(false);
    }
  };

  const updateActionPermission = async (pageId: number, role: string, actionName: string, isAllowed: boolean) => {
    try {
      const response = await fetch('/api/action-permissions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId, role, actionName, isAllowed })
      });
      
      if (response.ok) {
        await loadActionPermissions();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error updating action permission:', err);
      return false;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading permission data...</span>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Permission Management
          </h1>
          <p className="text-muted-foreground">
            Manage role-based access permissions for all system pages
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="matrix" className="space-y-4">
        <TabsList>
          <TabsTrigger value="matrix">Permission Matrix</TabsTrigger>
          <TabsTrigger value="actions">Action Permissions</TabsTrigger>
          <TabsTrigger value="roles">Role Overview</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
        </TabsList>

        <TabsContent value="matrix" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Role-Page Permission Matrix</CardTitle>
              <CardDescription>
                Check the boxes to grant page access to each role. Changes must be saved per role.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-medium">Role</th>
                      {pages.map(page => (
                        <th key={page.id} className="text-center p-2 font-medium min-w-[100px]">
                          <div className="flex flex-col items-center">
                            <span className="text-xs">{page.name}</span>
                            <span className="text-xs text-muted-foreground">{page.path}</span>
                          </div>
                        </th>
                      ))}
                      <th className="text-center p-2 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matrix.map(role => {
                      const stats = getRolePermissionStats(role);
                      return (
                        <tr key={role.roleId} className="border-b hover:bg-muted/50">
                          <td className="p-2">
                            <div className="flex flex-col">
                              <span className="font-medium capitalize">{role.roleName}</span>
                              <span className="text-xs text-muted-foreground">
                                {stats.granted}/{stats.total} permissions
                              </span>
                            </div>
                          </td>
                          {pages.map(page => {
                            const permission = role.permissions[page.id];
                            return (
                              <td key={page.id} className="text-center p-2">
                                <Checkbox
                                  checked={permission?.canAccess || false}
                                  onCheckedChange={(checked) => 
                                    handlePermissionChange(role.roleId, page.id, checked as boolean)
                                  }
                                />
                              </td>
                            );
                          })}
                          <td className="p-2">
                            <div className="flex gap-2 justify-center">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleBulkPermissionToggle(role.roleId, true)}
                              >
                                Grant All
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleBulkPermissionToggle(role.roleId, false)}
                              >
                                Revoke All
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleBulkRoleUpdate(role.roleId)}
                                disabled={saving}
                              >
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                Save
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Action-Level Permissions
              </CardTitle>
              <CardDescription>
                Fine-grained control over what actions users can perform on each page
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.keys(actionPermissions).length === 0 ? (
                  <div className="text-center py-8 space-y-4">
                    <p className="text-muted-foreground">
                      Action permission system not initialized
                    </p>
                    <Button 
                      onClick={setupActionPermissions}
                      variant="outline"
                      disabled={saving}
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Setup Action Permissions
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Configure specific actions each role can perform on each page
                      </p>
                      <Button 
                        onClick={loadActionPermissions}
                        variant="outline"
                        size="sm"
                        disabled={actionPermissionsLoading}
                      >
                        {actionPermissionsLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Refresh
                      </Button>
                    </div>
                    
                    {Object.entries(actionPermissions).map(([pageName, pageData]: [string, any]) => (
                      <Card key={pageName} className="border-l-4 border-l-primary">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg capitalize">{pageName}</CardTitle>
                          <CardDescription>
                            Configure actions for {pageData.page_path}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="border-b">
                                  <th className="text-left p-2 font-medium">Role</th>
                                  <th className="text-center p-2 font-medium">View</th>
                                  <th className="text-center p-2 font-medium">Create</th>
                                  <th className="text-center p-2 font-medium">Update</th>
                                  <th className="text-center p-2 font-medium">Delete</th>
                                  <th className="text-center p-2 font-medium">Export</th>
                                  <th className="text-center p-2 font-medium">Bulk Update</th>
                                </tr>
                              </thead>
                              <tbody>
                                {Object.entries(pageData.roles || {}).map(([roleName, roleData]: [string, any]) => (
                                  <tr key={roleName} className="border-b hover:bg-muted/50">
                                    <td className="p-2 font-medium capitalize">{roleName}</td>
                                    {['view', 'create', 'update', 'delete', 'export', 'bulk_update'].map(action => (
                                      <td key={action} className="text-center p-2">
                                        <Checkbox
                                          checked={roleData.actions?.[action] || false}
                                          onCheckedChange={(checked) => 
                                            updateActionPermission(
                                              pageData.page_id, 
                                              roleName, 
                                              action, 
                                              checked as boolean
                                            )
                                          }
                                        />
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {matrix.map(role => {
              const stats = getRolePermissionStats(role);
              const permissionPercentage = (stats.granted / stats.total) * 100;
              
              return (
                <Card key={role.roleId}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      <span className="capitalize">{role.roleName}</span>
                    </CardTitle>
                    <CardDescription>
                      {stats.granted} of {stats.total} permissions granted
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Access Level</span>
                        <Badge variant={permissionPercentage > 75 ? "default" : permissionPercentage > 50 ? "secondary" : "outline"}>
                          {Math.round(permissionPercentage)}%
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Granted Permissions:</div>
                        <div className="flex flex-wrap gap-1">
                          {Object.values(role.permissions)
                            .filter(p => p.canAccess)
                            .map(p => (
                              <Badge key={p.pageId} variant="outline" className="text-xs">
                                {p.pageName}
                              </Badge>
                            ))
                          }
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Permission Audit Trail
              </CardTitle>
              <CardDescription>
                Recent permission changes and system activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {auditLog.length === 0 ? (
                  <div className="text-center py-8 space-y-4">
                    <p className="text-muted-foreground">
                      No audit entries found
                    </p>
                    <Button 
                      onClick={setupAuditSystem}
                      variant="outline"
                      disabled={saving}
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Setup Audit System
                    </Button>
                  </div>
                ) : (
                  auditLog.map(entry => (
                    <div key={entry.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className="flex-shrink-0">
                        <Badge variant={
                          entry.action_type?.includes('granted') ? 'default' : 
                          entry.action_type?.includes('revoked') ? 'destructive' : 
                          entry.action_type?.includes('created') ? 'default' :
                          entry.action_type?.includes('deleted') ? 'destructive' :
                          'secondary'
                        }>
                          {entry.action_type?.replace('_', ' ') || 'action'}
                        </Badge>
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="text-sm">
                          {entry.description}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Changed by {entry.changed_by_username || 'System'} ({entry.changed_by_role}) on{' '}
                          {new Date(entry.created_at).toLocaleDateString()} at{' '}
                          {new Date(entry.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}