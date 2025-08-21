import React from 'react';
import { StorageSitesNavigation } from './StorageSitesNavigation';

interface StorageSitesLayoutProps {
  children: React.ReactNode;
  onAddStorage: () => void;
}

export const StorageSitesLayout: React.FC<StorageSitesLayoutProps> = ({ children, onAddStorage }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-none px-6 py-6 space-y-6">
        <StorageSitesNavigation onAddStorage={onAddStorage} />
        {children}
      </div>
    </div>
  );
};