import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTodayInCompanyTimezone } from '@/hooks/useCompanyTimezone';
import { useUserRole } from '@/hooks/useUserRole';
import { UserButton, useUser } from '@clerk/clerk-react';
import { Logo } from '@/components/ui/logo';
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  coreItems,
  dayToDayItems,
  inventoryItems,
  managementItems,
  adminItems,
  type NavigationItem
} from './navConfig';

interface AppSidebarProps {
  activeSection?: string;
  onSectionChange?: (section: string) => void;
}


export function AppSidebar({ activeSection, onSectionChange }: AppSidebarProps) {
  const { hasStaffAccess, hasAdminAccess, isOwner } = useUserRole();
  const { user } = useUser();
  const location = useLocation();
  const { state } = useSidebar();
  
  // Check if we're on desktop (>= 1024px)
  const [isDesktop, setIsDesktop] = React.useState(false);
  
  React.useEffect(() => {
    const checkIsDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    
    checkIsDesktop();
    window.addEventListener('resize', checkIsDesktop);
    return () => window.removeEventListener('resize', checkIsDesktop);
  }, []);

  // Get today's date in company timezone
  const { today: todayInCompanyTZ } = useTodayInCompanyTimezone();

  // Fetch today's jobs count for badge
  const { data: todaysJobsCount } = useQuery({
    queryKey: ['todays-jobs-count', todayInCompanyTZ],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select('id', { count: 'exact' })
        .eq('scheduled_date', todayInCompanyTZ);
      
      if (error) throw error;
      return data?.length || 0;
    },
    enabled: !!todayInCompanyTZ,
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

  const NavSection: React.FC<{ title?: string; items: NavigationItem[] }> = ({ title, items }) => (
    <SidebarGroup>
      {title && <SidebarGroupLabel className="text-xs font-medium text-sidebar-foreground/70 uppercase tracking-wide">{title}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const isActive = location.pathname === item.url || 
              (item.url === '/fleet' && location.pathname.startsWith('/fleet')) ||
              (item.url === '/team-management' && location.pathname.startsWith('/team-management')) ||
              (item.url === '/inventory' && location.pathname.startsWith('/inventory')) ||
              (item.url === '/consumables' && location.pathname.startsWith('/consumables')) ||
              (item.url === '/jobs' && location.pathname.startsWith('/jobs')) ||
              (item.url === '/customers' && (location.pathname === '/customer-hub' || location.pathname.startsWith('/customers'))) ||
              (item.url === '/quotes-invoices' && location.pathname.startsWith('/quotes-invoices')) ||
              (item.url === '/analytics' && location.pathname.startsWith('/analytics')) ||
              (item.url === '/settings' && location.pathname.startsWith('/settings')) ||
              (item.url === '/maintenance-hub' && location.pathname.startsWith('/maintenance-hub')) ||
              (item.url === '/marketing' && location.pathname.startsWith('/marketing')) ||
              (item.url === '/storage-sites' && location.pathname.startsWith('/storage-sites'));
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton 
                  asChild 
                  isActive={isActive}
                  className={cn(
                    isActive && "bg-gradient-to-r from-blue-700 to-blue-800 text-white font-bold hover:bg-gradient-to-r hover:from-blue-800 hover:to-blue-900 [&_*]:text-white [&_*]:font-bold"
                  )}
                >
                  <NavLink
                    to={item.url}
                    onClick={() => onSectionChange?.(item.url)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-1 text-sm transition-colors",
                      isActive && "text-white [&_*]:text-white"
                    )}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    <span className="truncate">{item.title}</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar 
      collapsible={isDesktop ? "icon" : "offcanvas"} 
      variant={isDesktop ? "sidebar" : "floating"} 
      className="border-r bg-white"
    >
      <SidebarHeader className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-start">
          <Logo showText={state === "expanded"} />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-1">
        <NavSection items={visibleCoreItems} />
        {visibleDayToDayItems.length > 0 && (
          <NavSection title="DAY-TO-DAY" items={visibleDayToDayItems} />
        )}
        {visibleInventoryItems.length > 0 && (
          <NavSection title="INVENTORY" items={visibleInventoryItems} />
        )}
        {visibleManagementItems.length > 0 && (
          <NavSection title="MANAGEMENT" items={visibleManagementItems} />
        )}
        {visibleAdminItems.length > 0 && (
          <NavSection title="ADMIN" items={visibleAdminItems} />
        )}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-gray-200 mt-auto">
        <div className="flex items-center gap-3">
          <UserButton 
            appearance={{
              elements: {
                userButtonAvatarBox: "w-8 h-8",
                userButtonPopoverCard: "shadow-lg"
              }
            }}
          />
          {state === "expanded" && (
            <div className="text-sm text-gray-600 truncate">
              {user?.firstName || user?.emailAddresses?.[0]?.emailAddress || 'User'}
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}