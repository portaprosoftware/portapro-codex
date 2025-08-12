import React from 'react';
import { useRoleAccess, RolePermissions } from '@/hooks/useRoleAccess';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield } from 'lucide-react';

interface ProtectedComponentProps {
  children: React.ReactNode;
  requiredPermission: keyof RolePermissions;
  targetDriverId?: string;
  fallback?: React.ReactNode;
  showError?: boolean;
}

export function ProtectedComponent({ 
  children, 
  requiredPermission, 
  targetDriverId,
  fallback,
  showError = true 
}: ProtectedComponentProps) {
  const permissions = useRoleAccess(targetDriverId);
  const hasPermission = permissions[requiredPermission];

  if (!hasPermission) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    if (showError) {
      return (
        <Alert variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to access this feature.
          </AlertDescription>
        </Alert>
      );
    }
    
    return null;
  }

  return <>{children}</>;
}

interface ProtectedFieldProps {
  children: React.ReactNode;
  requiredPermission: keyof RolePermissions;
  targetDriverId?: string;
  placeholder?: string;
}

export function ProtectedField({ 
  children, 
  requiredPermission, 
  targetDriverId,
  placeholder = "••••••••" 
}: ProtectedFieldProps) {
  const permissions = useRoleAccess(targetDriverId);
  const hasPermission = permissions[requiredPermission];

  if (!hasPermission) {
    return <span className="text-muted-foreground">{placeholder}</span>;
  }

  return <>{children}</>;
}