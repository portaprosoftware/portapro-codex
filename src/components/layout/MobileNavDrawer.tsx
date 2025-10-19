import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Menu } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  coreItems,
  dayToDayItems,
  inventoryItems,
  managementItems,
  adminItems,
  type NavigationItem
} from './navConfig';

export function MobileNavDrawer() {
  const { hasStaffAccess, hasAdminAccess, isOwner } = useUserRole();
  const location = useLocation();
  const [open, setOpen] = React.useState(false);

  // Fetch today's jobs count for badge
  const { data: todaysJobsCount } = useQuery({
    queryKey: ['todays-jobs-count'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('jobs')
        .select('id', { count: 'exact' })
        .eq('scheduled_date', today);
      
      if (error) throw error;
      return data?.length || 0;
    }
  });

  const getVisibleItems = (items: NavigationItem[]) => {
    return items.filter(item => {
      if (!item.permission) return true;
      if (item.permission === 'owner') return isOwner;
      if (item.permission === 'admin') return hasAdminAccess;
      if (item.permission === 'staff') return hasStaffAccess;
      return false;
    }).map(item => {
      // Add dynamic badge for Jobs
      if (item.title === 'Jobs' && todaysJobsCount !== undefined && todaysJobsCount > 0) {
        return { ...item, badge: todaysJobsCount.toString() };
      }
      return item;
    });
  };

  const visibleCoreItems = getVisibleItems(coreItems);
  const visibleDayToDayItems = getVisibleItems(dayToDayItems);
  const visibleInventoryItems = getVisibleItems(inventoryItems);
  const visibleManagementItems = getVisibleItems(managementItems);
  const visibleAdminItems = getVisibleItems(adminItems);

  const isActive = (url: string) => {
    return location.pathname === url || 
      (url === '/fleet' && location.pathname.startsWith('/fleet')) ||
      (url === '/team-management' && location.pathname.startsWith('/team-management')) ||
      (url === '/inventory' && location.pathname.startsWith('/inventory')) ||
      (url === '/consumables' && location.pathname.startsWith('/consumables')) ||
      (url === '/jobs' && location.pathname.startsWith('/jobs')) ||
      (url === '/customers' && (location.pathname === '/customer-hub' || location.pathname.startsWith('/customers'))) ||
      (url === '/quotes-invoices' && location.pathname.startsWith('/quotes-invoices')) ||
      (url === '/analytics' && location.pathname.startsWith('/analytics')) ||
      (url === '/settings' && location.pathname.startsWith('/settings')) ||
      (url === '/maintenance-hub' && location.pathname.startsWith('/maintenance-hub')) ||
      (url === '/marketing' && location.pathname.startsWith('/marketing')) ||
      (url === '/storage-sites' && location.pathname.startsWith('/storage-sites'));
  };

  const NavSection: React.FC<{ title?: string; items: NavigationItem[] }> = ({ title, items }) => (
    <div className="mb-6">
      {title && <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">{title}</h3>}
      <div className="space-y-1">
        {items.map((item) => {
          const active = isActive(item.url);
          return (
            <NavLink
              key={item.title}
              to={item.url}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all",
                active 
                  ? "bg-gradient-to-r from-blue-700 to-blue-800 text-white shadow-md" 
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <item.icon className={cn("h-5 w-5 flex-shrink-0", active && "text-white")} />
              <span className="flex-1">{item.title}</span>
              {item.badge && (
                <span className={cn(
                  "px-2 py-0.5 text-xs font-bold rounded-full bg-gradient-to-r from-blue-600 to-blue-700 text-white"
                )}>
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>
    </div>
  );

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <Menu className="h-6 w-6 text-gray-700" />
        </button>
      </DrawerTrigger>
      <DrawerContent className="h-[85vh] max-h-[85vh] flex flex-col z-[60] rounded-t-2xl shadow-2xl">
        <DrawerHeader className="border-b pb-2 pt-2">
          <DrawerTitle className="sr-only">Navigation Menu</DrawerTitle>
        </DrawerHeader>
        
        <nav className="flex-1 overflow-y-auto px-4 pt-4 pb-[max(16px,env(safe-area-inset-bottom))]">
          {visibleCoreItems.length > 0 && <NavSection items={visibleCoreItems} />}
          {visibleDayToDayItems.length > 0 && <NavSection title="DAY-TO-DAY" items={visibleDayToDayItems} />}
          {visibleInventoryItems.length > 0 && <NavSection title="INVENTORY" items={visibleInventoryItems} />}
          {visibleManagementItems.length > 0 && <NavSection title="MANAGEMENT" items={visibleManagementItems} />}
          {visibleAdminItems.length > 0 && <NavSection title="ADMIN" items={visibleAdminItems} />}
        </nav>
      </DrawerContent>
    </Drawer>
  );
}
