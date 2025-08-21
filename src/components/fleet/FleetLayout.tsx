import React from 'react';
import { FleetNavigation } from './FleetNavigation';

interface FleetLayoutProps {
  children: React.ReactNode;
}

export const FleetLayout: React.FC<FleetLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-none px-6 py-6 space-y-6">
        <FleetNavigation />
        {children}
      </div>
    </div>
  );
};