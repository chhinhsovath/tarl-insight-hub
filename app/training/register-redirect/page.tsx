"use client";

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

function RegisterRedirectContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const session = searchParams.get('session');
    const qr = searchParams.get('qr');
    
    // Build the new URL for the unified attendance page
    const params = new URLSearchParams();
    if (session) params.set('session', session);
    if (qr) params.set('qr', qr);
    
    // Redirect to the unified attendance page with walk-in tab
    router.replace(`/training/attendance?${params.toString()}#walkin`);
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Redirecting to attendance page...</p>
      </div>
    </div>
  );
}

export default function RegisterRedirect() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <RegisterRedirectContent />
    </Suspense>
  );
}