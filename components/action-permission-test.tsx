"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, TestTube, CheckCircle, XCircle } from 'lucide-react';
import { useActionPermissions, useActionPermission } from '@/hooks/useActionPermissions';

interface TestResult {
  test: string;
  passed: boolean;
  message: string;
}

export function ActionPermissionTest() {
  const [pageName, setPageName] = useState('schools');
  const [userRole, setUserRole] = useState('admin');
  const [actionName, setActionName] = useState('view');
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [testing, setTesting] = useState(false);

  // Test the hooks
  const multiplePermissions = useActionPermissions(pageName, userRole);
  const singlePermission = useActionPermission(pageName, actionName, userRole);

  const runTests = async () => {
    setTesting(true);
    const results: TestResult[] = [];

    try {
      // Test 1: API endpoint availability
      try {
        const response = await fetch('/api/action-permissions/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pageName: 'schools',
            actionName: 'view'
          })
        });
        
        results.push({
          test: 'API Endpoint Check',
          passed: response.status === 200 || response.status === 401, // 401 is expected without auth
          message: `Status: ${response.status}`
        });
      } catch (error) {
        results.push({
          test: 'API Endpoint Check',
          passed: false,
          message: 'Failed to connect to API'
        });
      }

      // Test 2: Hook functionality
      results.push({
        test: 'useActionPermissions Hook',
        passed: !multiplePermissions.error && typeof multiplePermissions.permissions === 'object',
        message: multiplePermissions.error || 'Hook loaded successfully'
      });

      results.push({
        test: 'useActionPermission Hook',
        passed: !singlePermission.error && typeof singlePermission.canPerform === 'boolean',
        message: singlePermission.error || 'Single permission check working'
      });

      // Test 3: Permission structure
      const expectedActions = ['view', 'create', 'update', 'delete', 'export', 'bulk_update'];
      const hasAllActions = expectedActions.every(action => 
        action in multiplePermissions.permissions
      );
      
      results.push({
        test: 'Permission Structure',
        passed: hasAllActions,
        message: hasAllActions ? 'All expected actions present' : 'Missing some action permissions'
      });

      // Test 4: Batch permission check
      try {
        const batchResponse = await fetch('/api/action-permissions/check?pageName=schools&actions=view,create,update');
        results.push({
          test: 'Batch Permission Check',
          passed: batchResponse.status === 200 || batchResponse.status === 401,
          message: `Batch API status: ${batchResponse.status}`
        });
      } catch (error) {
        results.push({
          test: 'Batch Permission Check',
          passed: false,
          message: 'Batch API failed'
        });
      }

    } catch (error) {
      results.push({
        test: 'General Test Execution',
        passed: false,
        message: 'Test execution failed'
      });
    }

    setTestResults(results);
    setTesting(false);
  };

  const setupDatabase = async () => {
    try {
      setTesting(true);
      const response = await fetch('/api/setup-action-permissions', {
        method: 'POST'
      });
      
      if (response.ok) {
        const data = await response.json();
        setTestResults([{
          test: 'Database Setup',
          passed: true,
          message: data.message || 'Action permissions initialized successfully'
        }]);
      } else {
        setTestResults([{
          test: 'Database Setup',
          passed: false,
          message: `Setup failed: ${response.status}`
        }]);
      }
    } catch (error) {
      setTestResults([{
        test: 'Database Setup',
        passed: false,
        message: 'Setup request failed'
      }]);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Action Permission System Test
          </CardTitle>
          <CardDescription>
            Test and validate the action-level permission system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="pageName">Page Name</Label>
              <Input
                id="pageName"
                value={pageName}
                onChange={(e) => setPageName(e.target.value)}
                placeholder="e.g., schools"
              />
            </div>
            <div>
              <Label htmlFor="userRole">User Role</Label>
              <Input
                id="userRole"
                value={userRole}
                onChange={(e) => setUserRole(e.target.value)}
                placeholder="e.g., admin"
              />
            </div>
            <div>
              <Label htmlFor="actionName">Action</Label>
              <Input
                id="actionName"
                value={actionName}
                onChange={(e) => setActionName(e.target.value)}
                placeholder="e.g., view"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={runTests} disabled={testing}>
              {testing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Run Tests
            </Button>
            <Button onClick={setupDatabase} disabled={testing} variant="outline">
              {testing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Setup Database
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Real-time Hook Status */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Multiple Permissions</CardTitle>
            <CardDescription>useActionPermissions hook status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Loading:</span>
                <Badge variant={multiplePermissions.loading ? "default" : "outline"}>
                  {multiplePermissions.loading ? "Yes" : "No"}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Error:</span>
                <Badge variant={multiplePermissions.error ? "destructive" : "outline"}>
                  {multiplePermissions.error || "None"}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                Permissions: {JSON.stringify(multiplePermissions.permissions, null, 2)}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Single Permission</CardTitle>
            <CardDescription>useActionPermission hook status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Can Perform:</span>
                <Badge variant={singlePermission.canPerform ? "default" : "destructive"}>
                  {singlePermission.canPerform ? "Yes" : "No"}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Loading:</span>
                <Badge variant={singlePermission.loading ? "default" : "outline"}>
                  {singlePermission.loading ? "Yes" : "No"}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Error:</span>
                <Badge variant={singlePermission.error ? "destructive" : "outline"}>
                  {singlePermission.error || "None"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {testResults.map((result, index) => (
                <Alert key={index} variant={result.passed ? "default" : "destructive"}>
                  <div className="flex items-center gap-2">
                    {result.passed ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="font-medium">{result.test}</span>
                  </div>
                  <AlertDescription className="mt-1">
                    {result.message}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}