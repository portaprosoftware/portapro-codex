import React from 'react';
import { TeamManagementNavigation } from './TeamManagementNavigation';
import { useClerkProfileSync } from '@/hooks/useClerkProfileSync';

interface TeamManagementLayoutProps {
  children: React.ReactNode;
}

export const TeamManagementLayout: React.FC<TeamManagementLayoutProps> = ({ children }) => {
  // Ensure profile sync happens when accessing team management
  useClerkProfileSync();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-none px-6 py-6 space-y-6">
        <TeamManagementNavigation />
        {children}
      </div>
    </div>
  );
};