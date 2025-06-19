"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  Phone, 
  LogIn, 
  BookOpen, 
  Award, 
  Download,
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { useParticipantTranslation } from '@/lib/participant-i18n';
import { ParticipantLanguageSwitcher } from '@/components/participant-language-switcher';

export default function ParticipantPortalLogin() {
  const { t } = useParticipantTranslation();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Only check localStorage session to avoid auth API conflicts
    const checkExistingSession = () => {
      const existingSession = localStorage.getItem('participant-session');
      if (existingSession) {
        try {
          const sessionData = JSON.parse(existingSession);
          // Validate session has required fields
          if (sessionData.name && sessionData.phone) {
            router.push('/participant/dashboard');
            return;
          }
        } catch (error) {
          // Invalid session data, clear it
          localStorage.removeItem('participant-session');
        }
      }
    };

    checkExistingSession();
  }, [router]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.phone.trim()) {
      setError(t.namePhoneRequired);
      return;
    }

    if (formData.phone.length < 8) {
      setError(t.validPhoneNumber);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/participant/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          phone: formData.phone.trim()
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Store complete participant session data
        localStorage.setItem('participant-session', JSON.stringify({
          ...data.participant,
          loginTime: new Date().toISOString()
        }));
        
        toast.success(`${t.welcomeBack}, ${data.participant.name}!`);
        router.push('/participant/dashboard');
      } else {
        setError(data.error || t.loginFailed);
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(t.connectionError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="bg-blue-600 rounded-full p-4 inline-flex mb-6">
          <BookOpen className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {t.participantPortal}
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          {t.accessTrainingHistory}
        </p>
        <div className="flex justify-center mt-6">
          <ParticipantLanguageSwitcher />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Login Card */}
        <Card className="w-full max-w-md mx-auto lg:mx-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5" />
              {t.participantLogin}
            </CardTitle>
            <p className="text-sm text-gray-600">
              {t.enterNamePhone}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="name">{t.fullName}</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="name"
                    type="text"
                    placeholder={t.enterFullName}
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phone">{t.phoneNumber}</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder={t.enterPhoneNumber}
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {t.signingIn}
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4 mr-2" />
                    {t.accessPortal}
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t">
              <p className="text-xs text-gray-500 text-center">
                {t.onlyAttendedSessions} {t.contactCoordinator}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Features Overview */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900">{t.whatYouCanDo}</h2>
          
          <div className="grid gap-4">
            <Card className="p-4">
              <div className="flex items-start gap-3">
                <div className="bg-green-100 rounded-full p-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{t.viewTrainingSessions}</h3>
                  <p className="text-sm text-gray-600">
                    {t.viewTrainingDesc}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 rounded-full p-2">
                  <Download className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{t.downloadTrainingMaterials}</h3>
                  <p className="text-sm text-gray-600">
                    {t.downloadMaterialsDesc}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-start gap-3">
                <div className="bg-purple-100 rounded-full p-2">
                  <Award className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{t.certificatesProgress}</h3>
                  <p className="text-sm text-gray-600">
                    {t.certificatesProgressDesc}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-start gap-3">
                <div className="bg-orange-100 rounded-full p-2">
                  <BookOpen className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{t.personalDashboard}</h3>
                  <p className="text-sm text-gray-600">
                    {t.personalDashboardDesc}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>{t.secureAccess}:</strong> {t.secureAccessDesc}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}