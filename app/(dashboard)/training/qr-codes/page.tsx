"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  QrCode, 
  Plus,
  Search,
  Filter,
  Download,
  Copy,
  ExternalLink,
  Calendar,
  Users,
  Activity,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';

interface QRCodeData {
  id: number;
  code_type: string;
  session_id: number;
  qr_data: string;
  qr_code_image: string;
  expires_at?: string;
  max_usage?: number;
  usage_count: number;
  last_used_at?: string;
  is_active: boolean;
  created_at: string;
  session_title: string;
  session_date: string;
  created_by_name?: string;
}

interface TrainingSession {
  id: number;
  session_title: string;
  session_date: string;
  program_name: string;
}

export default function QRCodesPage() {
  const { user } = useAuth();
  const [qrCodes, setQrCodes] = useState<QRCodeData[]>([]);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [filteredQrCodes, setFilteredQrCodes] = useState<QRCodeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sessionFilter, setSessionFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [newQrCode, setNewQrCode] = useState({
    session_id: '',
    code_type: 'registration',
    expires_at: '',
    max_usage: ''
  });

  useEffect(() => {
    fetchQrCodes();
    fetchSessions();
  }, []);

  useEffect(() => {
    filterQrCodes();
  }, [qrCodes, searchTerm, sessionFilter, typeFilter, statusFilter]);

  const fetchQrCodes = async () => {
    try {
      const response = await fetch('/api/training/qr-codes', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      if (response.ok) {
        const data = await response.json();
        setQrCodes(data);
      } else {
        toast.error('Failed to fetch QR codes');
      }
    } catch (error) {
      console.error('Error fetching QR codes:', error);
      toast.error('Error loading QR codes');
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/training/sessions', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const filterQrCodes = () => {
    let filtered = qrCodes;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(qr =>
        qr.session_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        qr.code_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (qr.created_by_name && qr.created_by_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Session filter
    if (sessionFilter !== 'all') {
      filtered = filtered.filter(qr => qr.session_id.toString() === sessionFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(qr => qr.code_type === typeFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        filtered = filtered.filter(qr => qr.is_active);
      } else if (statusFilter === 'inactive') {
        filtered = filtered.filter(qr => !qr.is_active);
      } else if (statusFilter === 'expired') {
        filtered = filtered.filter(qr => 
          qr.expires_at && new Date(qr.expires_at) < new Date()
        );
      }
    }

    setFilteredQrCodes(filtered);
  };

  const generateQrCode = async () => {
    if (!newQrCode.session_id || !newQrCode.code_type) {
      toast.error('Please select a session and code type');
      return;
    }

    try {
      const payload: any = {
        session_id: parseInt(newQrCode.session_id),
        code_type: newQrCode.code_type
      };

      if (newQrCode.expires_at) {
        payload.expires_at = newQrCode.expires_at;
      }

      if (newQrCode.max_usage) {
        payload.max_usage = parseInt(newQrCode.max_usage);
      }

      const response = await fetch('/api/training/qr-codes', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast.success('QR code generated successfully');
        setShowGenerateForm(false);
        setNewQrCode({
          session_id: '',
          code_type: 'registration',
          expires_at: '',
          max_usage: ''
        });
        fetchQrCodes();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to generate QR code');
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error('Error generating QR code');
    }
  };

  const toggleQrCodeStatus = async (qrId: number, isActive: boolean) => {
    try {
      const response = await fetch(`/api/training/qr-codes?id=${qrId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: !isActive })
      });

      if (response.ok) {
        toast.success(`QR code ${!isActive ? 'activated' : 'deactivated'} successfully`);
        fetchQrCodes();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update QR code status');
      }
    } catch (error) {
      console.error('Error updating QR code:', error);
      toast.error('Error updating QR code status');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const downloadQrCode = (qrCode: QRCodeData) => {
    const link = document.createElement('a');
    link.href = qrCode.qr_code_image;
    link.download = `qr-${qrCode.code_type}-${qrCode.session_title.replace(/\s+/g, '-')}.png`;
    link.click();
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Please log in to access QR code management.</p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getTypeBadgeColor = (type: string) => {
    const colors: Record<string, string> = {
      'registration': 'bg-blue-100 text-blue-800',
      'attendance': 'bg-green-100 text-green-800',
      'feedback': 'bg-purple-100 text-purple-800',
      'materials': 'bg-orange-100 text-orange-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const canManageQrCodes = ['admin', 'director', 'partner', 'coordinator'].includes(user.role);
  const uniqueTypes = [...new Set(qrCodes.map(qr => qr.code_type))];

  const totalQrCodes = qrCodes.length;
  const activeQrCodes = qrCodes.filter(qr => qr.is_active).length;
  const totalUsage = qrCodes.reduce((sum, qr) => sum + qr.usage_count, 0);
  const expiredQrCodes = qrCodes.filter(qr => 
    qr.expires_at && new Date(qr.expires_at) < new Date()
  ).length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">QR Code Management</h1>
          <p className="text-muted-foreground mt-1">
            Generate and manage QR codes for training sessions
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge className="bg-blue-100 text-blue-800" variant="secondary">
            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
          </Badge>
          {canManageQrCodes && (
            <Button 
              className="flex items-center gap-2"
              onClick={() => setShowGenerateForm(!showGenerateForm)}
            >
              <Plus className="h-4 w-4" />
              Generate QR Code
            </Button>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total QR Codes</p>
                <p className="text-2xl font-bold">{totalQrCodes}</p>
              </div>
              <QrCode className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{activeQrCodes}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Usage</p>
                <p className="text-2xl font-bold">{totalUsage}</p>
              </div>
              <Activity className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Expired</p>
                <p className="text-2xl font-bold">{expiredQrCodes}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Generate QR Code Form */}
      {showGenerateForm && canManageQrCodes && (
        <Card>
          <CardHeader>
            <CardTitle>Generate New QR Code</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium">Session</label>
                <Select 
                  value={newQrCode.session_id} 
                  onValueChange={(value) => setNewQrCode(prev => ({ ...prev, session_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select session" />
                  </SelectTrigger>
                  <SelectContent>
                    {sessions.map(session => (
                      <SelectItem key={session.id} value={session.id.toString()}>
                        {session.session_title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Code Type</label>
                <Select 
                  value={newQrCode.code_type} 
                  onValueChange={(value) => setNewQrCode(prev => ({ ...prev, code_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="registration">Registration</SelectItem>
                    <SelectItem value="attendance">Attendance</SelectItem>
                    <SelectItem value="feedback">Feedback</SelectItem>
                    <SelectItem value="materials">Materials</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Expires At (Optional)</label>
                <Input
                  type="datetime-local"
                  value={newQrCode.expires_at}
                  onChange={(e) => setNewQrCode(prev => ({ ...prev, expires_at: e.target.value }))}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Max Usage (Optional)</label>
                <Input
                  type="number"
                  placeholder="Unlimited"
                  value={newQrCode.max_usage}
                  onChange={(e) => setNewQrCode(prev => ({ ...prev, max_usage: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="flex gap-2 mt-4">
              <Button onClick={generateQrCode}>
                Generate QR Code
              </Button>
              <Button variant="outline" onClick={() => setShowGenerateForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search QR codes by session, type, or creator..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={sessionFilter} onValueChange={setSessionFilter}>
                <SelectTrigger className="w-[160px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Session" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sessions</SelectItem>
                  {sessions.map(session => (
                    <SelectItem key={session.id} value={session.id.toString()}>
                      {session.session_title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[120px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {uniqueTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[120px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* QR Codes Grid */}
      <Card>
        <CardHeader>
          <CardTitle>QR Codes ({filteredQrCodes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading QR codes...</p>
            </div>
          ) : filteredQrCodes.length === 0 ? (
            <div className="text-center py-8">
              <QrCode className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {qrCodes.length === 0 ? 'No QR codes found.' : 'No QR codes match your filters.'}
              </p>
              {canManageQrCodes && qrCodes.length === 0 && (
                <Button 
                  className="mt-4" 
                  variant="outline"
                  onClick={() => setShowGenerateForm(true)}
                >
                  Generate your first QR code
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredQrCodes.map((qrCode) => (
                <Card key={qrCode.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{qrCode.session_title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(qrCode.session_date)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            className={getTypeBadgeColor(qrCode.code_type)} 
                            variant="secondary"
                          >
                            {qrCode.code_type}
                          </Badge>
                          {qrCode.is_active ? (
                            <Badge className="bg-green-100 text-green-800" variant="secondary">
                              Active
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800" variant="secondary">
                              Inactive
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* QR Code Image */}
                      <div className="flex justify-center">
                        <div className="p-4 bg-white border rounded-lg">
                          <img 
                            src={qrCode.qr_code_image} 
                            alt={`QR Code for ${qrCode.code_type}`}
                            className="w-32 h-32"
                          />
                        </div>
                      </div>

                      {/* Usage Stats */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-muted-foreground" />
                          <span>{qrCode.usage_count} uses</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{formatDate(qrCode.created_at)}</span>
                        </div>
                      </div>

                      {/* Expiration & Limits */}
                      {(qrCode.expires_at || qrCode.max_usage) && (
                        <div className="text-xs text-muted-foreground space-y-1">
                          {qrCode.expires_at && (
                            <div>Expires: {formatDateTime(qrCode.expires_at)}</div>
                          )}
                          {qrCode.max_usage && (
                            <div>Max usage: {qrCode.max_usage}</div>
                          )}
                          {qrCode.last_used_at && (
                            <div>Last used: {formatDateTime(qrCode.last_used_at)}</div>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => downloadQrCode(qrCode)}
                          className="flex-1"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => copyToClipboard(qrCode.qr_data)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(qrCode.qr_data, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        {canManageQrCodes && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => toggleQrCodeStatus(qrCode.id, qrCode.is_active)}
                          >
                            {qrCode.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}