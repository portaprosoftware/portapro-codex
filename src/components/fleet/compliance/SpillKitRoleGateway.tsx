import React from 'react';
import { AdminSpillKitDashboard } from './AdminSpillKitDashboard';
import { DriverSpillKitCheck } from './DriverSpillKitCheck';
import { useUserRole } from '@/hooks/useUserRole';

export function SpillKitRoleGateway() {
  const { isDriver } = useUserRole();

  // Grant access to everyone; drivers get the simplified view
  if (isDriver) {
    return <DriverSpillKitCheck />;
  }

  return <AdminSpillKitDashboard />;
}