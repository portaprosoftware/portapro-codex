
import React from 'react';
import { Outlet } from 'react-router-dom';
import { DriverHeader } from './DriverHeader';
import { DriverBottomNav } from './DriverBottomNav';

export const DriverLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      {/* Fixed Header */}
      <DriverHeader />
      
      {/* Main Content - with padding for fixed header/footer */}
      <main className="flex-1 overflow-y-auto pt-[72px] pb-[80px]">
        <Outlet />
      </main>
      
      {/* Fixed Footer */}
      <DriverBottomNav />
    </div>
  );
};
