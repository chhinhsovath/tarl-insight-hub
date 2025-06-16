"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  QrCode, 
  Download, 
  Eye, 
  Plus,
  Calendar,
  Users,
  MessageSquare,
  FileText,
  ExternalLink,
  Copy
} from 'lucide-react';
import { toast } from 'sonner';

interface TrainingSession {
  id: number;
  session_title: string;
  session_date: string;
  session_time: string;
  location: string;
  program_name: string;
}

interface QRCode {
  id: number;
  code_type: string;
  session_id: number;
  qr_data: string;
  qr_code_image?: string;
  usage_count: number;
  max_usage?: number;
  expires_at?: string;
  is_active: boolean;
  created_at: string;
  last_used_at?: string;
  session_title?: string;
  session_date?: string;
}

interface QRCodeManagementProps {
  sessions: TrainingSession[];
}

export default function QRCodeManagement({ sessions }: QRCodeManagementProps) {
  const [qrCodes, setQrCodes] = useState<QRCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchQRCodes();
  }, [selectedSession]);

  const fetchQRCodes = async () => {
    try {
      setLoading(true);
      let url = '/api/training/qr-codes';
      
      if (selectedSession && selectedSession !== 'all') {
        url += `?session_id=${selectedSession}`;
      }

      const response = await fetch(url, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setQrCodes(data || []);
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

  const generateQRCode = async (sessionId: number, codeType: string) => {
    try {
      const response = await fetch('/api/training/qr-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          code_type: codeType
        }),
        credentials: 'include'
      });

      if (response.ok) {
        toast.success(`QR code for ${codeType} generated successfully`);
        fetchQRCodes(); // Refresh the list
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to generate QR code');
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error('Error generating QR code');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const downloadQRCode = (qrCode: QRCode) => {
    if (qrCode.qr_code_image) {
      const link = document.createElement('a');
      link.href = qrCode.qr_code_image;
      link.download = `qr-${qrCode.code_type}-${qrCode.id}.png`;
      link.click();
    } else {
      toast.error('QR code image not available');
    }
  };

  const filteredQRCodes = qrCodes.filter(qr => {
    if (activeTab === 'all') return true;
    return qr.code_type === activeTab;
  });

  const getCodeTypeIcon = (type: string) => {
    switch (type) {
      case 'registration':
        return <Users className="h-4 w-4" />;
      case 'attendance':
        return <Calendar className="h-4 w-4" />;
      case 'feedback':
        return <MessageSquare className="h-4 w-4" />;
      case 'materials':
        return <FileText className="h-4 w-4" />;
      default:
        return <QrCode className="h-4 w-4" />;
    }
  };

  const getCodeTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      'registration': 'bg-blue-100 text-blue-800',
      'attendance': 'bg-green-100 text-green-800',
      'feedback': 'bg-purple-100 text-purple-800',
      'materials': 'bg-orange-100 text-orange-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const stats = {
    total: qrCodes.length,
    registration: qrCodes.filter(qr => qr.code_type === 'registration').length,
    attendance: qrCodes.filter(qr => qr.code_type === 'attendance').length,
    feedback: qrCodes.filter(qr => qr.code_type === 'feedback').length,
    materials: qrCodes.filter(qr => qr.code_type === 'materials').length
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total QR Codes</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <QrCode className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Registration</p>
                <p className="text-2xl font-bold">{stats.registration}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Attendance</p>
                <p className="text-2xl font-bold">{stats.attendance}</p>
              </div>
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Feedback</p>
                <p className="text-2xl font-bold">{stats.feedback}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Materials</p>
                <p className="text-2xl font-bold">{stats.materials}</p>
              </div>
              <FileText className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Session Filter */}
      <div className="flex items-center justify-between">
        <Select value={selectedSession} onValueChange={setSelectedSession}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Filter by session" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sessions</SelectItem>
            {sessions.map((session) => (
              <SelectItem key={session.id} value={session.id.toString()}>
                {session.session_title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedSession !== 'all' && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Generate QR codes:</span>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => generateQRCode(parseInt(selectedSession), 'registration')}
            >
              <Users className="h-4 w-4 mr-1" />
              Registration
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => generateQRCode(parseInt(selectedSession), 'attendance')}
            >
              <Calendar className="h-4 w-4 mr-1" />
              Attendance
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => generateQRCode(parseInt(selectedSession), 'feedback')}
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              Feedback
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => generateQRCode(parseInt(selectedSession), 'materials')}
            >
              <FileText className="h-4 w-4 mr-1" />
              Materials
            </Button>
          </div>
        )}
      </div>

      {/* QR Code Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
          <TabsTrigger value="registration">Registration ({stats.registration})</TabsTrigger>
          <TabsTrigger value="attendance">Attendance ({stats.attendance})</TabsTrigger>
          <TabsTrigger value="feedback">Feedback ({stats.feedback})</TabsTrigger>
          <TabsTrigger value="materials">Materials ({stats.materials})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading QR codes...</p>
            </div>
          ) : filteredQRCodes.length === 0 ? (
            <div className="text-center py-8">
              <QrCode className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No QR codes found.</p>
              {selectedSession !== 'all' && (
                <p className="text-sm text-muted-foreground mt-2">
                  Use the generate buttons above to create QR codes for the selected session.
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredQRCodes.map((qrCode) => (
                <Card key={qrCode.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getCodeTypeIcon(qrCode.code_type)}
                          <Badge className={getCodeTypeBadge(qrCode.code_type)} variant="secondary">
                            {qrCode.code_type}
                          </Badge>
                        </div>
                        <Badge variant={qrCode.is_active ? "default" : "secondary"}>
                          {qrCode.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>

                      <div>
                        <h3 className="font-medium">{qrCode.session_title}</h3>
                        <p className="text-sm text-muted-foreground">
                          Created: {formatDate(qrCode.created_at)}
                        </p>
                        {qrCode.last_used_at && (
                          <p className="text-sm text-muted-foreground">
                            Last used: {formatDate(qrCode.last_used_at)}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span>Usage: {qrCode.usage_count}{qrCode.max_usage && ` / ${qrCode.max_usage}`}</span>
                        {qrCode.expires_at && (
                          <span className="text-muted-foreground">
                            Expires: {formatDate(qrCode.expires_at)}
                          </span>
                        )}
                      </div>

                      {qrCode.qr_code_image && (
                        <div className="flex justify-center">
                          <img 
                            src={qrCode.qr_code_image} 
                            alt={`QR Code for ${qrCode.code_type}`}
                            className="w-32 h-32 border rounded"
                          />
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => copyToClipboard(qrCode.qr_data)}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Copy URL
                        </Button>
                        {qrCode.qr_code_image && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => downloadQRCode(qrCode)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => window.open(qrCode.qr_data, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle>QR Code Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <h3 className="font-medium">Registration</h3>
              <p className="text-sm text-muted-foreground">
                Allow participants to register for training sessions
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <h3 className="font-medium">Attendance</h3>
              <p className="text-sm text-muted-foreground">
                Quick attendance confirmation during sessions
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <h3 className="font-medium">Feedback</h3>
              <p className="text-sm text-muted-foreground">
                Collect post-training feedback from participants
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <FileText className="h-8 w-8 mx-auto mb-2 text-orange-600" />
              <h3 className="font-medium">Materials</h3>
              <p className="text-sm text-muted-foreground">
                Provide access to training materials and resources
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}