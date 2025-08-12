import React from 'react';
import { TeamManagementNavigation } from './TeamManagementNavigation';

interface TeamManagementLayoutProps {
  children: React.ReactNode;
}

export const TeamManagementLayout: React.FC<TeamManagementLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 pb-6 max-w-7xl">
        <TeamManagementNavigation />
        {children}
      </div>
    </div>
  );
};