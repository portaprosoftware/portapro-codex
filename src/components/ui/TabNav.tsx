
import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TabNavProps {
  ariaLabel?: string;
  children: React.ReactNode;
}

interface TabNavItemProps {
  to: string;
  isActive: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

const TabNavItem: React.FC<TabNavItemProps> = ({ to, isActive, children, onClick }) => {
  return (
    <button
      className={cn(
        "px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
        "font-sans",
        isActive 
          ? "gradient-primary text-white shadow-sm" 
          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
      )}
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
    >
      {children}
    </button>
  );
};

export const TabNav: React.FC<TabNavProps> & { Item: typeof TabNavItem } = ({ 
  ariaLabel = "Navigation tabs", 
  children 
}) => {
  return (
    <nav aria-label={ariaLabel} className="flex items-center space-x-2 overflow-x-auto">
      {children}
    </nav>
  );
};

TabNav.Item = TabNavItem;
