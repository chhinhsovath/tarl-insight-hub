import React from 'react';
import type { Metadata } from 'next';
import { ParticipantLocaleProvider } from '@/components/participant-locale-provider';

export const metadata: Metadata = {
  title: 'Participant Portal | TaRL Training Hub',
  description: 'Access your training history, materials, and certificates',
};

interface ParticipantLayoutProps {
  children: React.ReactNode;
}

export default function ParticipantLayout({ children }: ParticipantLayoutProps) {
  return (
    <ParticipantLocaleProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          {children}
        </div>
      </div>
    </ParticipantLocaleProvider>
  );
}