import React from 'react';
import { TeamManagementNavigation } from './TeamManagementNavigation';

interface TeamManagementLayoutProps {
  children: React.ReactNode;
}

export const TeamManagementLayout: React.FC<TeamManagementLayoutProps> = ({ children }) => {
  return (
    <div className="max-w-none px-4 md:px-6 py-6 min-h-screen bg-gray-50">
      <TeamManagementNavigation />
      {children}
    </div>
  );
};