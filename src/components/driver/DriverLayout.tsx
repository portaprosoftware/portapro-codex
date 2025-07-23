
import React from 'react';
import { Outlet } from 'react-router-dom';
import { DriverHeader } from './DriverHeader';
import { DriverBottomNav } from './DriverBottomNav';

export const DriverLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DriverHeader />
      
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
      
      <DriverBottomNav />
    </div>
  );
};
