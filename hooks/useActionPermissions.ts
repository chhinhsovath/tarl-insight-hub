"use client";

import { useState, useEffect, useCallback } from 'react';

export interface ActionPermissions {
  view: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
  export: boolean;
  bulk_update: boolean;
  [key: string]: boolean;
}

export interface UseActionPermissionsResult {
  permissions: ActionPermissions;
  loading: boolean;
  error: string | null;
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canExport: boolean;
  canBulkUpdate: boolean;
  checkPermission: (action: string) => boolean;
  refreshPermissions: () => Promise<void>;
}

/**
 * Hook to manage action-level permissions for a specific page
 * @param pageName - The name of the page to check permissions for
 * @param userRole - Optional specific role to check (defaults to current user's role)
 */
export function useActionPermissions(
  pageName: string, 
  userRole?: string
): UseActionPermissionsResult {
  const [permissions, setPermissions] = useState<ActionPermissions>({
    view: false,
    create: false,
    update: false,
    delete: false,
    export: false,
    bulk_update: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPermissions = useCallback(async () => {
    if (!pageName) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const query = new URLSearchParams({
        pageName,
        actions: 'view,create,update,delete,export,bulk_update'
      });
      
      if (userRole) {
        query.append('userRole', userRole);
      }
      
      const response = await fetch(`/api/action-permissions/check?${query.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setPermissions(data.permissions || {
        view: false,
        create: false,
        update: false,
        delete: false,
        export: false,
        bulk_update: false,
      });
    } catch (err) {
      console.error('Error fetching action permissions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch permissions');
      
      // Set default permissions on error (fail-safe)
      setPermissions({
        view: false,
        create: false,
        update: false,
        delete: false,
        export: false,
        bulk_update: false,
      });
    } finally {
      setLoading(false);
    }
  }, [pageName, userRole]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const checkPermission = useCallback((action: string): boolean => {
    return permissions[action] || false;
  }, [permissions]);

  return {
    permissions,
    loading,
    error,
    canView: permissions.view,
    canCreate: permissions.create,
    canUpdate: permissions.update,
    canDelete: permissions.delete,
    canExport: permissions.export,
    canBulkUpdate: permissions.bulk_update,
    checkPermission,
    refreshPermissions: fetchPermissions,
  };
}

/**
 * Hook to check a single action permission
 * @param pageName - The name of the page
 * @param actionName - The specific action to check
 * @param userRole - Optional specific role to check
 */
export function useActionPermission(
  pageName: string, 
  actionName: string, 
  userRole?: string
): { canPerform: boolean; loading: boolean; error: string | null } {
  const [canPerform, setCanPerform] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pageName || !actionName) {
      setLoading(false);
      return;
    }

    const checkPermission = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/action-permissions/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pageName,
            actionName,
            userRole
          })
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        setCanPerform(data.canPerform || false);
      } catch (err) {
        console.error('Error checking action permission:', err);
        setError(err instanceof Error ? err.message : 'Failed to check permission');
        setCanPerform(false); // Fail-safe
      } finally {
        setLoading(false);
      }
    };

    checkPermission();
  }, [pageName, actionName, userRole]);

  return { canPerform, loading, error };
}

/**
 * Higher-order component wrapper for permission-based rendering
 */
export interface WithActionPermissionProps {
  pageName: string;
  action: string;
  userRole?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function WithActionPermission({
  pageName,
  action,
  userRole,
  fallback = null,
  children
}: WithActionPermissionProps) {
  const { canPerform, loading } = useActionPermission(pageName, action, userRole);
  
  if (loading) {
    return fallback;
  }
  
  return canPerform ? children : fallback;
}

/**
 * Utility function to batch check multiple permissions (client-side only)
 */
export async function checkMultiplePermissions(
  pageName: string,
  actions: string[],
  userRole?: string
): Promise<Record<string, boolean>> {
  try {
    const query = new URLSearchParams({
      pageName,
      actions: actions.join(',')
    });
    
    if (userRole) {
      query.append('userRole', userRole);
    }
    
    const response = await fetch(`/api/action-permissions/check?${query.toString()}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    return data.permissions || {};
  } catch (error) {
    console.error('Error checking multiple permissions:', error);
    // Return false for all actions on error
    return actions.reduce((acc, action) => {
      acc[action] = false;
      return acc;
    }, {} as Record<string, boolean>);
  }
}