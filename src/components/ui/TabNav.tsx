
import React from 'react';
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
        "px-4 py-2 rounded-full font-medium text-sm transition-all duration-200 font-inter",
        "flex items-center gap-2",
        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
        "transform hover:-translate-y-0.5",
        isActive 
          ? "bg-gradient-to-r from-[#3366FF] to-[#6699FF] text-white shadow-sm" 
          : "bg-white text-gray-700 border border-gray-200 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:border-gray-300 hover:shadow-sm"
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
    <nav aria-label={ariaLabel} className="flex items-center space-x-1">
      {children}
    </nav>
  );
};

TabNav.Item = TabNavItem;
