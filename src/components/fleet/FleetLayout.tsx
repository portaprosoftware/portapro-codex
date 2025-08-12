import React from 'react';
import { FleetNavigation } from './FleetNavigation';

interface FleetLayoutProps {
  children: React.ReactNode;
}

export const FleetLayout: React.FC<FleetLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-background">
      <FleetNavigation />
      <div className="container mx-auto px-6 pb-6 max-w-7xl">
        {children}
      </div>
    </div>
  );
};