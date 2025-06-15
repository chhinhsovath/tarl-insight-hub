"use client";

import React from 'react';
import { useActionPermission, WithActionPermission } from '@/hooks/useActionPermissions';
import { Loader2 } from 'lucide-react';

interface ActionPermissionWrapperProps {
  pageName: string;
  action: string;
  userRole?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loadingComponent?: React.ReactNode;
  showLoading?: boolean;
}

/**
 * Wraps children with action permission checking
 * Only renders children if user has permission for the specific action
 */
export function ActionPermissionWrapper({
  pageName,
  action,
  userRole,
  children,
  fallback = null,
  loadingComponent,
  showLoading = true
}: ActionPermissionWrapperProps) {
  const { canPerform, loading, error } = useActionPermission(pageName, action, userRole);

  if (loading && showLoading) {
    return loadingComponent || (
      <div className="flex items-center justify-center p-2">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  if (error) {
    console.warn(`Action permission check failed for ${action} on ${pageName}:`, error);
    return <>{fallback}</>;
  }

  return canPerform ? <>{children}</> : <>{fallback}</>;
}

/**
 * Button wrapper that automatically handles action permissions
 */
interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  pageName: string;
  action: string;
  userRole?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

export function ActionButton({
  pageName,
  action,
  userRole,
  children,
  fallback = null,
  className,
  ...buttonProps
}: ActionButtonProps) {
  return (
    <ActionPermissionWrapper
      pageName={pageName}
      action={action}
      userRole={userRole}
      fallback={fallback}
    >
      <button className={className} {...buttonProps}>
        {children}
      </button>
    </ActionPermissionWrapper>
  );
}

/**
 * Link wrapper that automatically handles action permissions
 */
interface ActionLinkProps {
  pageName: string;
  action: string;
  userRole?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  href: string;
  className?: string;
}

export function ActionLink({
  pageName,
  action,
  userRole,
  children,
  fallback = null,
  href,
  className
}: ActionLinkProps) {
  return (
    <ActionPermissionWrapper
      pageName={pageName}
      action={action}
      userRole={userRole}
      fallback={fallback}
    >
      <a href={href} className={className}>
        {children}
      </a>
    </ActionPermissionWrapper>
  );
}

/**
 * Form wrapper that handles create/update action permissions
 */
interface ActionFormProps {
  pageName: string;
  isEditing?: boolean;
  userRole?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

export function ActionForm({
  pageName,
  isEditing = false,
  userRole,
  children,
  fallback = <div className="text-center p-4 text-muted-foreground">You don't have permission to {isEditing ? 'edit' : 'create'} this resource.</div>,
  className
}: ActionFormProps) {
  const action = isEditing ? 'update' : 'create';
  
  return (
    <ActionPermissionWrapper
      pageName={pageName}
      action={action}
      userRole={userRole}
      fallback={fallback}
    >
      <form className={className}>
        {children}
      </form>
    </ActionPermissionWrapper>
  );
}

/**
 * Table row wrapper for delete actions
 */
interface ActionTableRowProps {
  pageName: string;
  userRole?: string;
  children: React.ReactNode;
  showViewOnly?: boolean;
  className?: string;
}

export function ActionTableRow({
  pageName,
  userRole,
  children,
  showViewOnly = true,
  className
}: ActionTableRowProps) {
  const { canPerform: canUpdate } = useActionPermission(pageName, 'update', userRole);
  const { canPerform: canDelete } = useActionPermission(pageName, 'delete', userRole);

  // Clone children and add action permissions as props
  const childrenWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, {
        ...child.props,
        canUpdate,
        canDelete,
        viewOnly: !canUpdate && !canDelete && showViewOnly
      });
    }
    return child;
  });

  return <tr className={className}>{childrenWithProps}</tr>;
}

/**
 * Bulk action wrapper for export, bulk update operations
 */
interface BulkActionWrapperProps {
  pageName: string;
  action: 'export' | 'bulk_update';
  userRole?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function BulkActionWrapper({
  pageName,
  action,
  userRole,
  children,
  fallback = null
}: BulkActionWrapperProps) {
  return (
    <ActionPermissionWrapper
      pageName={pageName}
      action={action}
      userRole={userRole}
      fallback={fallback}
    >
      {children}
    </ActionPermissionWrapper>
  );
}

/**
 * HOC for wrapping entire components with permission checks
 */
export function withActionPermission<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  pageName: string,
  action: string,
  fallback?: React.ReactNode
) {
  return function PermissionWrappedComponent(props: P & { userRole?: string }) {
    const { userRole, ...restProps } = props;
    
    return (
      <WithActionPermission
        pageName={pageName}
        action={action}
        userRole={userRole}
        fallback={fallback}
      >
        <WrappedComponent {...(restProps as P)} />
      </WithActionPermission>
    );
  };
}

/**
 * Hook for conditional rendering based on multiple actions
 */
export function useActionPermissions(pageName: string, userRole?: string) {
  const { canView } = useActionPermission(pageName, 'view', userRole);
  const { canPerform: canCreate } = useActionPermission(pageName, 'create', userRole);
  const { canPerform: canUpdate } = useActionPermission(pageName, 'update', userRole);
  const { canPerform: canDelete } = useActionPermission(pageName, 'delete', userRole);
  const { canPerform: canExport } = useActionPermission(pageName, 'export', userRole);
  const { canPerform: canBulkUpdate } = useActionPermission(pageName, 'bulk_update', userRole);

  return {
    canView,
    canCreate,
    canUpdate,
    canDelete,
    canExport,
    canBulkUpdate,
    hasAnyPermission: canView || canCreate || canUpdate || canDelete || canExport || canBulkUpdate,
    hasWritePermission: canCreate || canUpdate || canDelete || canBulkUpdate
  };
}