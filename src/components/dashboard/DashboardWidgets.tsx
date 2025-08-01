import React from 'react';
import { OverduePadlockedUnitsWidget } from '@/components/inventory/OverduePadlockedUnitsWidget';

interface DashboardWidgetsProps {
  className?: string;
}

export const DashboardWidgets: React.FC<DashboardWidgetsProps> = ({ className }) => {
  return (
    <div className={`grid gap-4 ${className}`}>
      <OverduePadlockedUnitsWidget />
    </div>
  );
};