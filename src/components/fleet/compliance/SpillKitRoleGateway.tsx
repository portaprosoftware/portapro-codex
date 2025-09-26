import React from 'react';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { AdminSpillKitDashboard } from './AdminSpillKitDashboard';
import { DriverSpillKitCheck } from './DriverSpillKitCheck';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield } from 'lucide-react';

export function SpillKitRoleGateway() {
  const permissions = useRoleAccess();

  // Check if user can perform spill kit checks at all
  if (!permissions.canPerformSpillKitChecks) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Spill Kit Compliance</CardTitle>
          <CardDescription>Access restricted</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              You don't have permission to access spill kit compliance features.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Show admin dashboard if user can manage templates or has full access
  if (permissions.canManageSpillKitTemplates || permissions.canViewAllSpillKitChecks) {
    return <AdminSpillKitDashboard />;
  }

  // Show driver interface for basic users
  return <DriverSpillKitCheck />;
}