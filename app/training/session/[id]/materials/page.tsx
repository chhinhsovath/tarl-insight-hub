"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { PublicEngageMaterials } from '@/components/training/public-engage-materials';
import { SessionAgendaDisplay } from '@/components/training/session-agenda-display';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface SessionInfo {
  id: number;
  session_title: string;
  session_date: string;
  session_time: string;
  location: string;
  venue_address?: string;
  program_name: string;
  agenda?: string;
  notes?: string;
}

export default function PublicMaterialsPage() {
  const params = useParams();
  const sessionId = parseInt(params.id as string);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSessionInfo();
  }, [sessionId]);

  const fetchSessionInfo = async () => {
    try {
      const response = await fetch(`/api/training/sessions/${sessionId}`);
      if (!response.ok) {
        throw new Error('Session not found');
      }
      const data = await response.json();
      setSessionInfo(data);
    } catch (error) {
      console.error('Error fetching session info:', error);
      setError('Failed to load session information');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading training materials...</p>
        </div>
      </div>
    );
  }

  if (error || !sessionInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              {error || 'Session not found'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Training Materials</h1>
            <p className="text-muted-foreground">
              Access materials and resources for your training session
            </p>
          </div>
        </div>

        {/* Session Agenda */}
        <SessionAgendaDisplay 
          agenda={sessionInfo.agenda}
          notes={sessionInfo.notes}
          sessionInfo={{
            title: sessionInfo.session_title,
            date: formatDate(sessionInfo.session_date),
            time: formatTime(sessionInfo.session_time),
            location: sessionInfo.location
          }}
        />

        {/* Materials */}
        <PublicEngageMaterials
          sessionId={sessionId}
          sessionInfo={{
            title: sessionInfo.session_title,
            date: formatDate(sessionInfo.session_date),
            time: formatTime(sessionInfo.session_time),
            location: sessionInfo.location
          }}
        />

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>© Teaching at the Right Level (TaRL) Training Program</p>
          <p className="mt-1">
            For support, please contact your training coordinator
          </p>
        </div>
      </div>
    </div>
  );
}