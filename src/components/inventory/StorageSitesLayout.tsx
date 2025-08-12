import React from 'react';

interface StorageSitesLayoutProps {
  children: React.ReactNode;
}

export const StorageSitesLayout: React.FC<StorageSitesLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 pb-6 max-w-7xl">
        {children}
      </div>
    </div>
  );
};