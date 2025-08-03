import React from 'react';

interface DashboardWidgetsProps {
  className?: string;
}

export const DashboardWidgets: React.FC<DashboardWidgetsProps> = ({ className }) => {
  return (
    <div className={`grid gap-4 md:grid-cols-2 ${className}`}>
      {/* Simple lock dashboard widgets would go here if needed */}
    </div>
  );
};