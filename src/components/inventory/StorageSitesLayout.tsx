import React from 'react';
import { StorageSitesNavigation } from './StorageSitesNavigation';

interface StorageSitesLayoutProps {
  children: React.ReactNode;
  onAddStorage: () => void;
}

export const StorageSitesLayout: React.FC<StorageSitesLayoutProps> = ({ children, onAddStorage }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 pb-6 max-w-7xl">
        <StorageSitesNavigation onAddStorage={onAddStorage} />
        {children}
      </div>
    </div>
  );
};