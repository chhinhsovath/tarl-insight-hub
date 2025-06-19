"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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
  EyeOff,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import { TrainingBreadcrumb } from '@/components/training-breadcrumb';
import { TrainingLocaleProvider } from '@/components/training-locale-provider';
import { useTrainingTranslation } from '@/lib/training-i18n';
import { TrainingLanguageSwitcher } from '@/components/training-language-switcher';

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

function QRCodesPageContent() {
  const { user } = useAuth();
  const { t } = useTrainingTranslation();
  const searchParams = useSearchParams();
  const [qrCodes, setQrCodes] = useState<QRCodeData[]>([]);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [filteredQrCodes, setFilteredQrCodes] = useState<QRCodeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sessionFilter, setSessionFilter] = useState(searchParams.get('session') || 'all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [newQrCode, setNewQrCode] = useState({
    session_id: searchParams.get('session') || '',
    code_type: 'registration',
    expires_at: '',
    max_usage: ''
  });

  useEffect(() => {
    fetchQrCodes();
    fetchSessions();
  }, [searchParams]);

  useEffect(() => {
    filterQrCodes();
  }, [qrCodes, searchTerm, sessionFilter, typeFilter, statusFilter]);

  const fetchQrCodes = async () => {
    try {
      const sessionParam = searchParams.get('session');
      const url = sessionParam 
        ? `/api/training/qr-codes?session_id=${sessionParam}`
        : '/api/training/qr-codes';
      
      const response = await fetch(url, {
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
        toast.error(t.fetchQrCodesError);
      }
    } catch (error) {
      console.error('Error fetching QR codes:', error);
      toast.error(t.errorLoading + ' QR codes');
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
      toast.error(t.selectSessionAndType);
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
        toast.success(t.qrCodeGeneratedSuccess);
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
        toast.error(error.error || t.generateQrCodeError);
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error(t.generateQrCodeError);
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
        toast.error(error.error || t.updateQrCodeError);
      }
    } catch (error) {
      console.error('Error updating QR code:', error);
      toast.error(t.updateQrCodeError);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t.copiedToClipboard);
  };

  const downloadQrCode = (qrCode: QRCodeData) => {
    const link = document.createElement('a');
    link.href = qrCode.qr_code_image;
    link.download = `qr-${qrCode.code_type}-${qrCode.session_title.replace(/\s+/g, '-')}.png`;
    link.click();
  };

  const generateQuickQrCodes = async () => {
    const sessionId = searchParams.get('session');
    if (!sessionId) return;

    const qrTypes = ['registration', 'attendance', 'feedback'];
    
    try {
      toast.info('Generating QR codes for all types...');
      
      for (const type of qrTypes) {
        const payload = {
          session_id: parseInt(sessionId),
          code_type: type
        };

        await fetch('/api/training/qr-codes', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });
      }

      toast.success(t.allQrCodesGeneratedSuccess);
      fetchQrCodes();
    } catch (error) {
      console.error('Error generating QR codes:', error);
      toast.error('Failed to generate some QR codes');
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">{t.pleaseLogIn} QR {t.generateManageQrCodes.toLowerCase()}.</p>
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

  // Calculate statistics based on the loaded data (session-specific or all)
  const totalQrCodes = qrCodes.length;
  const activeQrCodes = qrCodes.filter(qr => qr.is_active).length;
  const totalUsage = qrCodes.reduce((sum, qr) => sum + qr.usage_count, 0);
  const expiredQrCodes = qrCodes.filter(qr => 
    qr.expires_at && new Date(qr.expires_at) < new Date()
  ).length;

  return (
    <div className="p-6 space-y-6">
      {/* <TrainingBreadcrumb /> */}
      {/* Header */}
      <div className="space-y-4">
        {/* Navigation Row */}
        
        
        {/* Title and Actions Row */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{t.qrCodes}</h1>
            <p className="text-muted-foreground mt-1">
              {t.generateManageQrCodes}
            </p>
            {searchParams.get('session') && (
              <p className="text-sm text-blue-600 mt-1">
                {t.showingForSession}: {searchParams.get('session')}
              </p>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2 ml-4">
            {canManageQrCodes && (
              <>
              <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.history.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {t.back}
            </Button>
                {searchParams.get('session') && (
                  <Button 
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => generateQuickQrCodes()}
                  >
                    <QrCode className="h-4 w-4" />
                    {t.generateAllQrTypes}
                  </Button>
                )}
                <Button 
                size="sm"
                  className="flex items-center gap-2"
                  onClick={() => setShowGenerateForm(!showGenerateForm)}
                >
                  <Plus className="h-4 w-4" />
                  {t.generateQrCode}
                </Button>
                
              </>
            )}
          </div>
          <div className="h-6 w-px bg-border" />
          <div className="flex items-center gap-4"><TrainingLanguageSwitcher /></div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t.totalQrCodes}</p>
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
                <p className="text-sm text-muted-foreground">{t.active}</p>
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
                <p className="text-sm text-muted-foreground">{t.totalUsage}</p>
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
                <p className="text-sm text-muted-foreground">{t.expired}</p>
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
            <CardTitle>{t.generateQrCode} {t.newSession}</CardTitle>
            {searchParams.get('session') && (
              <p className="text-sm text-muted-foreground">
                {t.generatingForSession}: {searchParams.get('session')}
              </p>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium">{t.session}</label>
                <Select 
                  value={newQrCode.session_id} 
                  onValueChange={(value) => setNewQrCode(prev => ({ ...prev, session_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t.selectSession} />
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
                <label className="text-sm font-medium">{t.codeType}</label>
                <Select 
                  value={newQrCode.code_type} 
                  onValueChange={(value) => setNewQrCode(prev => ({ ...prev, code_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="registration">{t.registration}</SelectItem>
                    <SelectItem value="attendance">{t.attendance}</SelectItem>
                    <SelectItem value="feedback">{t.feedback}</SelectItem>
                    <SelectItem value="materials">{t.materials}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">{t.expiresAt}</label>
                <Input
                  type="datetime-local"
                  value={newQrCode.expires_at}
                  onChange={(e) => setNewQrCode(prev => ({ ...prev, expires_at: e.target.value }))}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">{t.maxUsage}</label>
                <Input
                  type="number"
                  placeholder={t.unlimited}
                  value={newQrCode.max_usage}
                  onChange={(e) => setNewQrCode(prev => ({ ...prev, max_usage: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="flex gap-2 mt-4">
              <Button onClick={generateQrCode}>
                {t.generateQrCode}
              </Button>
              <Button variant="outline" onClick={() => setShowGenerateForm(false)}>
                {t.cancel}
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
                  placeholder={t.searchQrCodes}
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
                  <SelectValue placeholder={t.session} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.allSessions}</SelectItem>
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
                  <SelectValue placeholder={t.type} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.allTypes}</SelectItem>
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
                  <SelectValue placeholder={t.status} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.allStatus}</SelectItem>
                  <SelectItem value="active">{t.active}</SelectItem>
                  <SelectItem value="inactive">{t.inactive}</SelectItem>
                  <SelectItem value="expired">{t.expired}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* QR Codes Grid */}
      <Card>
        <CardHeader>
          <CardTitle>{t.qrCodes} ({filteredQrCodes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">{t.loadingQrCodes}</p>
            </div>
          ) : filteredQrCodes.length === 0 ? (
            <div className="text-center py-8">
              <QrCode className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {qrCodes.length === 0 ? t.noQrCodesFound : t.noMatchingFilters}
              </p>
              {canManageQrCodes && qrCodes.length === 0 && (
                <Button 
                  className="mt-4" 
                  variant="outline"
                  onClick={() => setShowGenerateForm(true)}
                >
                  {t.createFirstQrCode}
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
                              {t.active}
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800" variant="secondary">
                              {t.inactive}
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
                          <span>{qrCode.usage_count} {t.uses}</span>
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
                            <div>{t.expired}: {formatDateTime(qrCode.expires_at)}</div>
                          )}
                          {qrCode.max_usage && (
                            <div>{t.maxUsage}: {qrCode.max_usage}</div>
                          )}
                          {qrCode.last_used_at && (
                            <div>{t.lastUsed}: {formatDateTime(qrCode.last_used_at)}</div>
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
                          {t.download}
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

function QRCodesLoading() {
  const { t } = useTrainingTranslation();
  return (
    <div className="flex items-center justify-center h-64">
      <p className="text-muted-foreground">{t.loadingQrCodes}</p>
    </div>
  );
}

export default function QRCodesPage() {
  return (
    <TrainingLocaleProvider>
      <Suspense fallback={<QRCodesLoading />}>
        <QRCodesPageContent />
      </Suspense>
    </TrainingLocaleProvider>
  );
}