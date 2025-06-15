"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { DatabaseService } from '@/lib/database';

interface UsePermissionsReturn {
  hasPermission: (pagePath: string) => boolean;
  isLoading: boolean;
  checkPermission: (pagePath: string) => Promise<boolean>;
  refreshPermissions: () => Promise<void>;
}

export function usePermissions(): UsePermissionsReturn {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  const loadUserPermissions = async () => {
    if (!user) {
      setPermissions(new Set());
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Get all pages that the user has access to
      const userPermissions = await fetch(`/api/data/permissions/user-pages?userId=${user.id}`, {
        cache: 'no-store'
      });
      
      if (userPermissions.ok) {
        const pages = await userPermissions.json();
        const allowedPaths = new Set(pages.map((page: any) => page.path));
        setPermissions(allowedPaths);
      } else {
        console.error('Failed to fetch user permissions');
        setPermissions(new Set());
      }
    } catch (error) {
      console.error('Error loading user permissions:', error);
      setPermissions(new Set());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUserPermissions();
  }, [user]);

  const hasPermission = (pagePath: string): boolean => {
    if (!user) return false;
    
    // Admin has access to everything - this is the key fix
    const userRole = user.role.toLowerCase();
    if (userRole === 'admin') {
      return true;
    }
    
    // Check exact path match
    if (permissions.has(pagePath)) return true;
    
    // Check for dynamic route patterns
    for (const permittedPath of permissions) {
      if (permittedPath.includes('[') && permittedPath.includes(']')) {
        const pattern = new RegExp(
          '^' + permittedPath.replace(/\[[^\]]+\]/g, '[^/]+') + '$'
        );
        if (pattern.test(pagePath)) return true;
      }
    }
    
    return false;
  };

  const checkPermission = async (pagePath: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const hasAccess = await DatabaseService.checkUserPermission(user.id, pagePath);
      return hasAccess;
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  };

  const refreshPermissions = async () => {
    await loadUserPermissions();
  };

  return {
    hasPermission,
    isLoading,
    checkPermission,
    refreshPermissions
  };
}