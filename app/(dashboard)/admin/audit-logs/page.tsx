'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Download, Filter, User, Database, Activity, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface AuditActivity {
  id: number;
  user_id: number;
  username: string;
  user_full_name: string;
  user_role: string;
  action_type: string;
  table_name: string;
  record_id: number;
  old_data: any;
  new_data: any;
  changes_summary: string;
  ip_address: string;
  user_agent: string;
  is_soft_delete: boolean;
  created_at: string;
}

interface AuditStatistics {
  total_activities: number;
  unique_users: number;
  creates: number;
  updates: number;
  deletes: number;
  reads: number;
  soft_deletes: number;
}

export default function AuditLogsPage() {
  const [activities, setActivities] = useState<AuditActivity[]>([]);
  const [statistics, setStatistics] = useState<AuditStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    userId: '',
    tableName: '',
    actionType: '',
    startDate: '',
    endDate: '',
    isSoftDelete: '',
    limit: 50
  });

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });

      const response = await fetch(`/api/admin/audit-logs?${params}`);
      const data = await response.json();

      if (response.ok) {
        setActivities(data.activities);
        setStatistics(data.statistics);
      } else {
        console.error('Error fetching audit logs:', data.error);
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    fetchAuditLogs();
  };

  const clearFilters = () => {
    setFilters({
      userId: '',
      tableName: '',
      actionType: '',
      startDate: '',
      endDate: '',
      isSoftDelete: '',
      limit: 50
    });
  };

  const getActionBadge = (actionType: string, isSoftDelete: boolean) => {
    if (actionType === 'DELETE' && isSoftDelete) {
      return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Soft Delete</Badge>;
    }
    
    switch (actionType) {
      case 'CREATE':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Create</Badge>;
      case 'UPDATE':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Update</Badge>;
      case 'DELETE':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Delete</Badge>;
      case 'READ':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Read</Badge>;
      case 'RESTORE':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Restore</Badge>;
      default:
        return <Badge variant="outline">{actionType}</Badge>;
    }
  };

  const formatTableName = (tableName: string) => {
    return tableName.replace('tbl_tarl_', '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Audit Logs</h1>
          <p className="text-muted-foreground">Monitor all system activities and user actions</p>
        </div>
        <Button onClick={fetchAuditLogs} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total_activities}</div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.unique_users}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Creates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{statistics.creates}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Updates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{statistics.updates}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Deletes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{statistics.deletes}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Soft Deletes</CardTitle>
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{statistics.soft_deletes}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{statistics.reads}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <label className="text-sm font-medium">User ID</label>
              <Input
                placeholder="User ID"
                value={filters.userId}
                onChange={(e) => handleFilterChange('userId', e.target.value)}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Table</label>
              <Select value={filters.tableName} onValueChange={(value) => handleFilterChange('tableName', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All tables" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All tables</SelectItem>
                  <SelectItem value="tbl_tarl_training_programs">Training Programs</SelectItem>
                  <SelectItem value="tbl_tarl_training_sessions">Training Sessions</SelectItem>
                  <SelectItem value="tbl_tarl_training_participants">Participants</SelectItem>
                  <SelectItem value="tbl_tarl_training_materials">Materials</SelectItem>
                  <SelectItem value="tbl_tarl_training_feedback">Feedback</SelectItem>
                  <SelectItem value="tbl_tarl_qr_codes">QR Codes</SelectItem>
                  <SelectItem value="tbl_tarl_users">Users</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Action</label>
              <Select value={filters.actionType} onValueChange={(value) => handleFilterChange('actionType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All actions</SelectItem>
                  <SelectItem value="CREATE">Create</SelectItem>
                  <SelectItem value="UPDATE">Update</SelectItem>
                  <SelectItem value="DELETE">Delete</SelectItem>
                  <SelectItem value="READ">Read</SelectItem>
                  <SelectItem value="RESTORE">Restore</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Start Date</label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium">End Date</label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Soft Deletes</label>
              <Select value={filters.isSoftDelete} onValueChange={(value) => handleFilterChange('isSoftDelete', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  <SelectItem value="true">Soft deletes only</SelectItem>
                  <SelectItem value="false">Exclude soft deletes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <Button onClick={applyFilters} className="gap-2">
              <Filter className="h-4 w-4" />
              Apply Filters
            </Button>
            <Button variant="outline" onClick={clearFilters}>
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Activities List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
          <CardDescription>
            Showing {activities.length} activities {filters.userId && `for user ${filters.userId}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p>Loading audit logs...</p>
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No audit activities found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getActionBadge(activity.action_type, activity.is_soft_delete)}
                      <span className="font-medium">{formatTableName(activity.table_name)}</span>
                      {activity.record_id && (
                        <span className="text-sm text-muted-foreground">ID: {activity.record_id}</span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(activity.created_at), 'MMM dd, yyyy HH:mm')}
                    </div>
                  </div>
                  
                  <p className="text-sm">{activity.changes_summary}</p>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <span>
                        User: {activity.user_full_name || activity.username || 'System'} 
                        {activity.user_role && `(${activity.user_role})`}
                      </span>
                      {activity.ip_address && (
                        <span>IP: {activity.ip_address}</span>
                      )}
                    </div>
                    {activity.old_data && activity.new_data && (
                      <Badge variant="outline" className="text-xs">
                        Has change data
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}