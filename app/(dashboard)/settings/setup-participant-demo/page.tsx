"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, User, Users } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';

export default function SetupParticipantDemoPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSetup = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/setup-participant-demo', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        toast.success('Participant demo accounts created successfully!');
      } else {
        toast.error(data.message || 'Failed to setup participant demo');
      }
    } catch (error) {
      console.error('Error setting up participant demo:', error);
      toast.error('Error setting up participant demo');
      setResult({
        success: false,
        message: 'Network error occurred'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Please log in to access this page.</p>
      </div>
    );
  }

  if (!['admin', 'director'].includes(user.role?.toLowerCase())) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Admin access required.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Setup Participant Demo</h1>
        <p className="text-muted-foreground">
          Create demo participant accounts for training portal testing
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Participant Demo Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">What this will create:</h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Participant role in the system</li>
              <li>• Two demo participant accounts (participant1, participant2)</li>
              <li>• Training portal page permissions</li>
              <li>• Sample training session registrations</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Demo Accounts:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4" />
                  <span className="font-medium">Participant 1</span>
                </div>
                <div className="text-sm space-y-1">
                  <p>Username: participant1</p>
                  <p>Password: participant123</p>
                  <p>Name: Ms. Sophea Demo</p>
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4" />
                  <span className="font-medium">Participant 2</span>
                </div>
                <div className="text-sm space-y-1">
                  <p>Username: participant2</p>
                  <p>Password: participant123</p>
                  <p>Name: Mr. Pisach Demo</p>
                </div>
              </div>
            </div>
          </div>

          <Button 
            onClick={handleSetup} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Setting up...' : 'Create Participant Demo Accounts'}
          </Button>

          {result && (
            <Alert className={result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <div className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription className={result.success ? 'text-green-800' : 'text-red-800'}>
                  {result.message}
                </AlertDescription>
              </div>
              
              {result.success && result.instructions && (
                <div className="mt-4 space-y-3">
                  <div>
                    <h4 className="font-semibold text-green-800">Login Credentials:</h4>
                    <div className="space-y-1 text-sm">
                      {result.instructions.accounts.map((account: any, index: number) => (
                        <p key={index}>
                          {account.username} / {account.password}
                        </p>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-green-800">Participant Access:</h4>
                    <ul className="space-y-1 text-sm">
                      {result.instructions.access.map((item: string, index: number) => (
                        <li key={index}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="pt-2">
                    <Button 
                      variant="outline" 
                      onClick={() => window.open('/login', '_blank')}
                      className="text-green-700 border-green-300 hover:bg-green-50"
                    >
                      Test Login →
                    </Button>
                  </div>
                </div>
              )}
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}