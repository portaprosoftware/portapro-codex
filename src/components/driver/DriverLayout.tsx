
import React from 'react';
import { Outlet } from 'react-router-dom';
import { DriverHeader } from './DriverHeader';
import { DriverBottomNav } from './DriverBottomNav';

export const DriverLayout: React.FC = () => {
  return (
    <div 
      className="min-h-screen bg-background flex flex-col relative"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)'
      }}
    >
      {/* Fixed Header - 56px spec */}
      <DriverHeader />
      
      {/* Main Content - with padding for fixed header (56px) and bottom nav (64px) */}
      <main className="flex-1 overflow-y-auto pt-14 pb-16">
        <Outlet />
      </main>
      
      {/* Fixed Bottom Nav - 64px spec */}
      <DriverBottomNav />
    </div>
  );
};
