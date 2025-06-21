'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { RefreshCw, Trash2, RotateCcw, AlertTriangle, Clock, Database } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { toast } from 'sonner';

interface DeletedRecord {
  id: number;
  table_name: string;
  record_id: number;
  original_data: any;
  deleted_by: number;
  deleted_by_username: string;
  deleted_by_full_name: string;
  delete_reason: string;
  deleted_at: string;
  restored_at: string;
  restored_by: number;
  restored_by_username: string;
  is_restored: boolean;
  can_be_restored: boolean;
  retention_period_days: number;
  is_still_restorable: boolean;
  expires_at: string;
}

interface DeletedRecordsStatistics {
  total_deleted: number;
  pending_restore: number;
  already_restored: number;
  expired: number;
  affected_tables: number;
}

interface TableBreakdown {
  table_name: string;
  count: number;
  pending_restore: number;
}

export default function DeletedRecordsPage() {
  const [deletedRecords, setDeletedRecords] = useState<DeletedRecord[]>([]);
  const [statistics, setStatistics] = useState<DeletedRecordsStatistics | null>(null);
  const [tableBreakdown, setTableBreakdown] = useState<TableBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoreDialog, setRestoreDialog] = useState<{ open: boolean; record: DeletedRecord | null }>({
    open: false,
    record: null
  });
  const [restoreReason, setRestoreReason] = useState('');
  const [restoring, setRestoring] = useState(false);

  const [filters, setFilters] = useState({
    tableName: '',
    limit: 50,
    showExpired: false
  });

  const fetchDeletedRecords = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });

      const response = await fetch(`/api/admin/deleted-records?${params}`);
      const data = await response.json();

      if (response.ok) {
        setDeletedRecords(data.deletedRecords);
        setStatistics(data.statistics);
        setTableBreakdown(data.tableBreakdown);
      } else {
        console.error('Error fetching deleted records:', data.error);
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching deleted records:', error);
      toast({
        title: "Error",
        description: "Failed to fetch deleted records",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeletedRecords();
  }, []);

  const handleFilterChange = (key: string, value: string | boolean) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    fetchDeletedRecords();
  };

  const openRestoreDialog = (record: DeletedRecord) => {
    setRestoreDialog({ open: true, record });
    setRestoreReason('');
  };

  const closeRestoreDialog = () => {
    setRestoreDialog({ open: false, record: null });
    setRestoreReason('');
  };

  const handleRestore = async () => {
    if (!restoreDialog.record) return;

    setRestoring(true);
    try {
      const response = await fetch('/api/admin/deleted-records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tableName: restoreDialog.record.table_name,
          recordId: restoreDialog.record.record_id,
          reason: restoreReason
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: data.message,
        });
        fetchDeletedRecords();
        closeRestoreDialog();
      } else {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error restoring record:', error);
      toast({
        title: "Error",
        description: "Failed to restore record",
        variant: "destructive"
      });
    } finally {
      setRestoring(false);
    }
  };

  const formatTableName = (tableName: string) => {
    return tableName.replace('tbl_tarl_', '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getDaysUntilExpiry = (expiresAt: string) => {
    return differenceInDays(new Date(expiresAt), new Date());
  };

  const getExpiryBadge = (record: DeletedRecord) => {
    const daysLeft = getDaysUntilExpiry(record.expires_at);
    
    if (!record.is_still_restorable) {
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Expired</Badge>;
    } else if (daysLeft <= 7) {
      return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Expires Soon</Badge>;
    } else {
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">{daysLeft} days left</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Deleted Records</h1>
          <p className="text-muted-foreground">Manage and restore soft-deleted records</p>
        </div>
        <Button onClick={fetchDeletedRecords} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Deleted</CardTitle>
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total_deleted}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Restore</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{statistics.pending_restore}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Already Restored</CardTitle>
              <RotateCcw className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{statistics.already_restored}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expired</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{statistics.expired}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Affected Tables</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.affected_tables}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Table Breakdown */}
      {tableBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Table Breakdown</CardTitle>
            <CardDescription>Deleted records by table</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tableBreakdown.map((table) => (
                <div key={table.table_name} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium">{formatTableName(table.table_name)}</h3>
                    <Badge variant="outline">{table.count} total</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {table.pending_restore} pending restore
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <label className="text-sm font-medium">Show Expired</label>
              <Select 
                value={filters.showExpired.toString()} 
                onValueChange={(value) => handleFilterChange('showExpired', value === 'true')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">Hide expired</SelectItem>
                  <SelectItem value="true">Show expired</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Limit</label>
              <Input
                type="number"
                value={filters.limit}
                onChange={(e) => handleFilterChange('limit', parseInt(e.target.value) || 50)}
                min="10"
                max="500"
              />
            </div>
          </div>
          
          <Button onClick={applyFilters} className="mt-4">
            Apply Filters
          </Button>
        </CardContent>
      </Card>

      {/* Deleted Records List */}
      <Card>
        <CardHeader>
          <CardTitle>Deleted Records</CardTitle>
          <CardDescription>
            Showing {deletedRecords.length} deleted records
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p>Loading deleted records...</p>
            </div>
          ) : deletedRecords.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Trash2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No deleted records found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {deletedRecords.map((record) => (
                <div key={record.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{formatTableName(record.table_name)}</span>
                      <span className="text-sm text-muted-foreground">ID: {record.record_id}</span>
                      {getExpiryBadge(record)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(record.deleted_at), 'MMM dd, yyyy HH:mm')}
                    </div>
                  </div>
                  
                  <div className="text-sm">
                    <p><strong>Deleted by:</strong> {record.deleted_by_full_name || record.deleted_by_username}</p>
                    {record.delete_reason && (
                      <p><strong>Reason:</strong> {record.delete_reason}</p>
                    )}
                    <p><strong>Expires:</strong> {format(new Date(record.expires_at), 'MMM dd, yyyy')}</p>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-muted-foreground">
                      Retention: {record.retention_period_days} days
                    </div>
                    {record.is_still_restorable && (
                      <Button
                        size="sm"
                        onClick={() => openRestoreDialog(record)}
                        className="gap-2"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Restore
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Restore Dialog */}
      <Dialog open={restoreDialog.open} onOpenChange={closeRestoreDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore Record</DialogTitle>
            <DialogDescription>
              Are you sure you want to restore this {restoreDialog.record && formatTableName(restoreDialog.record.table_name)} record (ID: {restoreDialog.record?.record_id})?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Restore Reason (Optional)</label>
              <Textarea
                placeholder="Enter reason for restoring this record..."
                value={restoreReason}
                onChange={(e) => setRestoreReason(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={closeRestoreDialog}>
              Cancel
            </Button>
            <Button onClick={handleRestore} disabled={restoring} className="gap-2">
              {restoring ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4" />
              )}
              Restore Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}