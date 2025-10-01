import React from 'react';
import { AdminSpillKitDashboard } from './AdminSpillKitDashboard';
import { DriverSpillKitCheck } from './DriverSpillKitCheck';
import { useUserRole } from '@/hooks/useUserRole';

interface SpillKitRoleGatewayProps {
  inspectionDrawerOpen?: boolean;
  setInspectionDrawerOpen?: (open: boolean) => void;
}

export function SpillKitRoleGateway({ 
  inspectionDrawerOpen, 
  setInspectionDrawerOpen 
}: SpillKitRoleGatewayProps) {
  const { isDriver } = useUserRole();

  // Grant access to everyone; drivers get the simplified view
  if (isDriver) {
    return <DriverSpillKitCheck />;
  }

  return (
    <AdminSpillKitDashboard 
      inspectionDrawerOpen={inspectionDrawerOpen}
      setInspectionDrawerOpen={setInspectionDrawerOpen}
    />
  );
}