
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
    <nav 
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 h-16"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)'
      }}
    >
      <div className="flex items-center justify-around h-full">
        {navItems.map((item) => {
          const pathname = String(location?.pathname ?? "");
          const isActive = item.end
            ? pathname === item.to
            : pathname.startsWith(item.to);

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-col items-center justify-center px-2 min-w-0 flex-1",
                "text-xs font-medium rounded-lg transition-colors min-h-[48px]",
                isActive
                  ? "text-white bg-gradient-primary"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              <item.icon className={cn(
                "w-5.5 h-5.5 mb-0.5",
                isActive ? "text-white" : "text-gray-400"
              )} />
              <span className="truncate text-[12px]">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
