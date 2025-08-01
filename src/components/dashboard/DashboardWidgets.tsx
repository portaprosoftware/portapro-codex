import React from 'react';
import { OverduePadlockedUnitsWidget } from '@/components/inventory/OverduePadlockedUnitsWidget';
import { SecurityIncidentsWidget } from '@/components/inventory/SecurityIncidentsWidget';

interface DashboardWidgetsProps {
  className?: string;
}

export const DashboardWidgets: React.FC<DashboardWidgetsProps> = ({ className }) => {
  return (
    <div className={`grid gap-4 md:grid-cols-2 ${className}`}>
      <OverduePadlockedUnitsWidget />
      <SecurityIncidentsWidget />
    </div>
  );
};