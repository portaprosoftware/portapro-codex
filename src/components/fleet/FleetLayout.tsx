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
        <div className="container mx-auto px-6 py-6 max-w-7xl">
          {children}
        </div>
      </div>
    </div>
  );
};