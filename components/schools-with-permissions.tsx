"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Download, 
  Search, 
  Loader2,
  Eye,
  School
} from 'lucide-react';

// Import our action permission components
import { 
  ActionPermissionWrapper,
  ActionButton,
  ActionForm,
  BulkActionWrapper,
  useActionPermissions
} from '@/components/action-permission-wrapper';
import { useActionPermissions as useActionPermissionsHook } from '@/hooks/useActionPermissions';

interface School {
  id: number;
  name: string;
  code: string;
  zoneName: string;
  provinceName: string;
  districtName: string;
  status: number;
  totalStudents: number;
  totalTeachers: number;
}

export function SchoolsWithPermissions() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSchools, setSelectedSchools] = useState<number[]>([]);

  // Get action permissions for the schools page
  const permissions = useActionPermissions('schools');

  useEffect(() => {
    // Mock data loading - replace with actual API call
    setTimeout(() => {
      setSchools([
        {
          id: 1,
          name: 'Phnom Penh Primary School',
          code: 'PP001',
          zoneName: 'Central',
          provinceName: 'Phnom Penh',
          districtName: 'Chamkar Mon',
          status: 1,
          totalStudents: 450,
          totalTeachers: 15
        },
        {
          id: 2,
          name: 'Siem Reap Secondary School',
          code: 'SR002',
          zoneName: 'Northwest',
          provinceName: 'Siem Reap',
          districtName: 'Siem Reap',
          status: 1,
          totalStudents: 650,
          totalTeachers: 22
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredSchools = schools.filter(school =>
    school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExport = async () => {
    // Mock export functionality
    console.log('Exporting schools data...');
  };

  const handleBulkUpdate = async () => {
    // Mock bulk update functionality
    console.log('Bulk updating selected schools...');
  };

  const handleEdit = (schoolId: number) => {
    console.log('Editing school:', schoolId);
  };

  const handleDelete = (schoolId: number) => {
    console.log('Deleting school:', schoolId);
  };

  const toggleSchoolSelection = (schoolId: number) => {
    setSelectedSchools(prev =>
      prev.includes(schoolId)
        ? prev.filter(id => id !== schoolId)
        : [...prev, schoolId]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading schools...</span>
      </div>
    );
  }

  // Show access denied if user can't even view
  if (!permissions.canView) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          You don't have permission to view schools data.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <School className="h-6 w-6" />
            Schools Management
          </CardTitle>
          <CardDescription>
            Manage school information with role-based permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search schools..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Export button - only shows if user has export permission */}
              <BulkActionWrapper
                pageName="schools"
                action="export"
                fallback={null}
              >
                <Button 
                  variant="outline" 
                  onClick={handleExport}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </BulkActionWrapper>

              {/* Bulk update button - only shows if user has bulk_update permission */}
              <BulkActionWrapper
                pageName="schools"
                action="bulk_update"
                fallback={null}
              >
                <Button 
                  variant="outline" 
                  onClick={handleBulkUpdate}
                  disabled={selectedSchools.length === 0}
                  className="flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Bulk Update ({selectedSchools.length})
                </Button>
              </BulkActionWrapper>

              {/* Create button - only shows if user has create permission */}
              <ActionPermissionWrapper
                pageName="schools"
                action="create"
                fallback={null}
              >
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add School
                </Button>
              </ActionPermissionWrapper>
            </div>
          </div>

          {/* Permission status indicators for debugging */}
          <div className="mb-4 p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-2">Current Permissions:</p>
            <div className="flex gap-2 flex-wrap">
              <Badge variant={permissions.canView ? "default" : "outline"}>
                View: {permissions.canView ? "✓" : "✗"}
              </Badge>
              <Badge variant={permissions.canCreate ? "default" : "outline"}>
                Create: {permissions.canCreate ? "✓" : "✗"}
              </Badge>
              <Badge variant={permissions.canUpdate ? "default" : "outline"}>
                Update: {permissions.canUpdate ? "✓" : "✗"}
              </Badge>
              <Badge variant={permissions.canDelete ? "default" : "outline"}>
                Delete: {permissions.canDelete ? "✓" : "✗"}
              </Badge>
              <Badge variant={permissions.canExport ? "default" : "outline"}>
                Export: {permissions.canExport ? "✓" : "✗"}
              </Badge>
              <Badge variant={permissions.canBulkUpdate ? "default" : "outline"}>
                Bulk Update: {permissions.canBulkUpdate ? "✓" : "✗"}
              </Badge>
            </div>
          </div>

          {/* Schools table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  {/* Checkbox column - only show if user can do bulk operations */}
                  {permissions.canBulkUpdate && (
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSchools(filteredSchools.map(s => s.id));
                          } else {
                            setSelectedSchools([]);
                          }
                        }}
                        checked={selectedSchools.length === filteredSchools.length}
                      />
                    </TableHead>
                  )}
                  <TableHead>School Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Zone</TableHead>
                  <TableHead>Province</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Teachers</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSchools.map((school) => (
                  <TableRow key={school.id}>
                    {/* Checkbox cell */}
                    {permissions.canBulkUpdate && (
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedSchools.includes(school.id)}
                          onChange={() => toggleSchoolSelection(school.id)}
                        />
                      </TableCell>
                    )}
                    <TableCell className="font-medium">{school.name}</TableCell>
                    <TableCell>{school.code}</TableCell>
                    <TableCell>{school.zoneName}</TableCell>
                    <TableCell>{school.provinceName}</TableCell>
                    <TableCell>{school.totalStudents}</TableCell>
                    <TableCell>{school.totalTeachers}</TableCell>
                    <TableCell>
                      <Badge variant={school.status === 1 ? "default" : "secondary"}>
                        {school.status === 1 ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {/* View button - always available if user can view the page */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => console.log('Viewing school:', school.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        {/* Edit button - only shows if user has update permission */}
                        <ActionButton
                          pageName="schools"
                          action="update"
                          onClick={() => handleEdit(school.id)}
                          className="inline-flex items-center justify-center text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3"
                        >
                          <Edit className="h-4 w-4" />
                        </ActionButton>

                        {/* Delete button - only shows if user has delete permission */}
                        <ActionButton
                          pageName="schools"
                          action="delete"
                          onClick={() => handleDelete(school.id)}
                          className="inline-flex items-center justify-center text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </ActionButton>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredSchools.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No schools found matching your search.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}