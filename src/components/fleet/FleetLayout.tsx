import React from 'react';
import { FleetSidebar } from './FleetSidebar';

interface FleetLayoutProps {
  children: React.ReactNode;
}

export const FleetLayout: React.FC<FleetLayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen bg-background">
      <FleetSidebar />
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
};