import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Calendar, 
  Package, 
  Users, 
  Truck, 
  Settings,
  FileText,
  BarChart3,
  Menu
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserRole } from '@/hooks/useUserRole';
import { 
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface MobileNavigationItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: string | number;
  permission?: 'owner' | 'admin' | 'staff';
}

const navigationItems: MobileNavigationItem[] = [
  { title: 'Dashboard', href: '/', icon: Home },
  { title: 'Jobs', href: '/jobs', icon: Calendar, permission: 'staff' },
  { title: 'Customers', href: '/customers', icon: Users, permission: 'staff' },
  { title: 'Inventory', href: '/inventory', icon: Package, permission: 'staff' },
  { title: 'Fleet', href: '/fleet', icon: Truck, permission: 'admin' },
  { title: 'Quotes & Invoices', href: '/quotes-invoices', icon: FileText, permission: 'admin' },
  { title: 'Analytics', href: '/analytics', icon: BarChart3, permission: 'admin' },
  { title: 'Settings', href: '/settings', icon: Settings, permission: 'owner' },
];

export const MobileTopNavigation: React.FC = () => {
  const { hasStaffAccess, hasAdminAccess, isOwner } = useUserRole();

  const getVisibleItems = () => {
    return navigationItems.filter(item => {
      if (!item.permission) return true;
      if (item.permission === 'owner') return isOwner;
      if (item.permission === 'admin') return hasAdminAccess;
      if (item.permission === 'staff') return hasStaffAccess;
      return false;
    });
  };

  const visibleItems = getVisibleItems();

  return (
    <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <h1 className="text-lg font-semibold text-gray-900">PortaPro</h1>
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Menu className="h-6 w-6 text-gray-600" />
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80">
            <SheetHeader>
              <SheetTitle>Navigation</SheetTitle>
              <SheetDescription>
                Access all your tools and features
              </SheetDescription>
            </SheetHeader>
            
            <nav className="mt-6 space-y-2">
              {visibleItems.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                      isActive
                        ? "nav-item-active text-white"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    )
                  }
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" strokeWidth={2} />
                  <span className="flex-1">{item.title}</span>
                  {item.badge && (
                    <span className="px-2 py-1 text-xs font-bold bg-blue-100 text-blue-600 rounded-full min-w-[1.25rem] h-5 flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};

export const MobileBottomNavigation: React.FC = () => {
  const { hasStaffAccess, hasAdminAccess } = useUserRole();
  
  // Show only the most important 5 items in bottom nav
  const bottomNavItems = [
    { title: 'Home', href: '/', icon: Home },
    { title: 'Jobs', href: '/jobs', icon: Calendar },
    { title: 'Customers', href: '/customers', icon: Users },
    { title: 'Inventory', href: '/inventory', icon: Package },
    { title: 'More', href: '/analytics', icon: BarChart3 }, // This could open a menu
  ].filter(item => {
    if (item.href === '/jobs' || item.href === '/customers' || item.href === '/inventory') {
      return hasStaffAccess;
    }
    if (item.href === '/analytics') {
      return hasAdminAccess;
    }
    return true;
  });

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-1 z-50">
      <div className="flex items-center justify-around">
        {bottomNavItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 min-w-0 flex-1",
                isActive
                  ? "text-primary"
                  : "text-gray-500 hover:text-gray-700"
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon 
                  className={cn(
                    "w-5 h-5 flex-shrink-0",
                    isActive ? "text-primary" : "text-gray-500"
                  )} 
                  strokeWidth={2} 
                />
                <span className="truncate text-center">{item.title}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export const MobileLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="md:hidden min-h-screen bg-gray-50">
      <MobileTopNavigation />
      <main className="pb-16"> {/* Add padding for bottom nav */}
        {children}
      </main>
      <MobileBottomNavigation />
    </div>
  );
};