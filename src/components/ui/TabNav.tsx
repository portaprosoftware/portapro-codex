
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
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onClick) {
      onClick();
    }
  };

  return (
    <button
      type="button"
      className={cn(
        "px-4 py-3 font-medium text-sm transition-all duration-200 font-inter relative",
        "flex items-center gap-2",
        "focus:outline-none",
        isActive 
          ? "text-blue-600 font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-600" 
          : "text-gray-600 hover:text-gray-900"
      )}
      onClick={handleClick}
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
    <nav aria-label={ariaLabel} className="flex items-center space-x-6 -mb-px">
      {children}
    </nav>
  );
};

TabNav.Item = TabNavItem;
