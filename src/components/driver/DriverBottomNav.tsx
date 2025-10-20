
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { List, Map, User, Calendar, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  {
    to: '/driver',
    icon: List,
    label: 'Jobs',
    end: true
  },
  {
    to: '/driver/vehicles',
    icon: Map,
    label: 'Vehicles'
  },
  {
    to: '/driver/schedule',
    icon: Calendar,
    label: 'Schedule'
  },
  {
    to: '/driver/reports',
    icon: FileText,
    label: 'Reports'
  },
  {
    to: '/driver/profile',
    icon: User,
    label: 'Profile'
  }
];

export const DriverBottomNav: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div 
        className="flex items-center justify-around py-2"
        style={{ 
          paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)'
        }}
      >
        {navItems.map((item) => {
          const isActive = item.end 
            ? location.pathname === item.to
            : location.pathname.startsWith(item.to);

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-col items-center px-2 py-2 min-w-0 flex-1",
                "text-xs font-medium rounded-lg transition-colors min-h-[48px]",
                isActive
                  ? "text-white bg-gradient-primary"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5 sm:w-6 sm:h-6 mb-1",
                isActive ? "text-white" : "text-gray-400"
              )} />
              <span className="truncate text-[10px] sm:text-xs">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
