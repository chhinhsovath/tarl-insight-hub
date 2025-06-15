"use client";

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { usePermissions } from '@/hooks/use-permissions';
import { Loader2, Shield, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface PermissionProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export function PermissionProtectedRoute({ 
  children, 
  fallback,
  redirectTo = '/dashboard'
}: PermissionProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { hasPermission, isLoading: permissionLoading } = usePermissions();
  const pathname = usePathname();
  const router = useRouter();

  // Skip protection for public routes
  const publicRoutes = ['/login', '/unauthorized', '/'];
  if (publicRoutes.includes(pathname)) {
    return <>{children}</>;
  }

  // Show loading while checking authentication and permissions
  if (authLoading || permissionLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
          <p className="text-gray-600">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    router.push('/login');
    return null;
  }

  // Check if user has permission for this route
  if (!hasPermission(pathname)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-red-50 to-gray-100">
        <div className="max-w-md w-full mx-4">
          <Alert variant="destructive" className="bg-white shadow-lg">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="mt-2">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Access Denied</h3>
                  <p className="text-sm text-muted-foreground">
                    You don't have permission to access this page.
                  </p>
                </div>
                
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p><strong>Page:</strong> {pathname}</p>
                  <p><strong>Your role:</strong> {user.role}</p>
                  <p><strong>User:</strong> {user.full_name}</p>
                </div>

                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={() => router.push(redirectTo)}
                    className="flex-1"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Go to Dashboard
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => router.back()}
                    className="flex-1"
                  >
                    Go Back
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Higher-order component for easy wrapping
export function withPermissionProtection<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<PermissionProtectedRouteProps, 'children'>
) {
  return function ProtectedComponent(props: P) {
    return (
      <PermissionProtectedRoute {...options}>
        <Component {...props} />
      </PermissionProtectedRoute>
    );
  };
}