import React from 'react';
import { FleetSidebar } from './FleetSidebar';
import { Header } from '@/components/layout/Header';

interface FleetLayoutProps {
  children: React.ReactNode;
}

export const FleetLayout: React.FC<FleetLayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen bg-background">
      <FleetSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};