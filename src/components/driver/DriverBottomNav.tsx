
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { List, Map, User, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  {
    to: '/driver',
    icon: List,
    label: 'Jobs',
    end: true
  },
  {
    to: '/driver/map',
    icon: Map,
    label: 'Map'
  },
  {
    to: '/driver/schedule',
    icon: Calendar,
    label: 'Schedule'
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
    <nav className="bg-white border-t border-gray-200 safe-area-bottom">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = item.end 
            ? location.pathname === item.to
            : location.pathname.startsWith(item.to);

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-col items-center px-3 py-2 min-w-0 flex-1",
                "text-xs font-medium rounded-lg transition-colors",
                isActive
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              <item.icon className={cn(
                "w-6 h-6 mb-1",
                isActive ? "text-blue-600" : "text-gray-400"
              )} />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
