"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Shield, CheckCircle, AlertTriangle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function SetupPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runSetup = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/data/setup-permissions', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Setup failed');
      }
    } catch (err: any) {
      setError(err.message || 'Setup failed');
    } finally {
      setLoading(false);
    }
  };

  const addPageManagement = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/data/add-page-management', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: data.message,
          results: [{ step: 'Page Management', data: data.data }]
        });
      } else {
        setError(data.error || 'Failed to add Page Management');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to add Page Management');
    } finally {
      setLoading(false);
    }
  };

  const setupMenuOrdering = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/setup-menu-ordering', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: data.message,
          results: [{ step: 'Menu Ordering', data: `${data.pages?.length || 0} pages configured` }]
        });
      } else {
        setError(data.error || 'Failed to setup menu ordering');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to setup menu ordering');
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role.toLowerCase() !== 'admin') {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Access denied. Only administrators can access this setup page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Permission System Setup</h1>
        <p className="text-muted-foreground">
          Initialize the role-based permission system and grant admin access to all pages.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Setup Default Permissions
          </CardTitle>
          <CardDescription>
            This will create the permission tables and grant admin role access to all pages in the system.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-medium">What this setup will do:</h3>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>Add "Page Management" to the page_permissions table</li>
              <li>Create role_page_permissions table for role-based access control</li>
              <li>Grant admin role access to all existing pages</li>
              <li>Enable the full permission management system</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Button onClick={addPageManagement} disabled={loading} variant="outline" className="w-full">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding Page Management...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Quick Fix: Add Page Management Only
                </>
              )}
            </Button>

            <Button onClick={setupMenuOrdering} disabled={loading} variant="outline" className="w-full">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Setting up menu ordering...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Setup Menu Ordering System
                </>
              )}
            </Button>

            <Button onClick={runSetup} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Setting up permissions...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Full Setup (with Role Permissions)
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Setup Complete!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{result.message}</AlertDescription>
              </Alert>

              {result.results && (
                <div className="space-y-3">
                  <h3 className="font-medium">Setup Results:</h3>
                  {result.results.map((step: any, index: number) => (
                    <div key={index} className="bg-muted p-3 rounded-lg">
                      <div className="font-medium text-sm">{step.step}</div>
                      {step.pagesCount && (
                        <div className="text-sm text-muted-foreground">
                          {step.pagesCount} pages configured
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-4">
                <Button 
                  onClick={() => window.location.reload()} 
                  variant="outline"
                  className="w-full"
                >
                  Refresh Page to See Changes
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}