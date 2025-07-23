import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TabNavProps {
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
    <Button 
      variant={isActive ? 'default' : 'ghost'}
      size="sm"
      className={cn(
        "rounded-full px-5",
        isActive && "bg-gradient-to-r from-blue-500 to-blue-600"
      )}
      onClick={onClick}
    >
      {children}
    </Button>
  );
};

export const TabNav: React.FC<TabNavProps> & { Item: typeof TabNavItem } = ({ children }) => {
  return (
    <div className="flex items-center space-x-2">
      {children}
    </div>
  );
};

TabNav.Item = TabNavItem;