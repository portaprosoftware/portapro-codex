
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Package, 
  Users2, 
  Truck, 
  ClipboardCheck,
  FileText,
  BarChart4,
  Building2,
  Building,
  Megaphone,
  MessageSquare,
  Droplets,
  Settings,
  UserCog,
  Mail
} from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';
import { UserButton, useUser } from '@clerk/clerk-react';
import { Logo } from '@/components/ui/logo';
import { 
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface NavigationItem {
  title: string;
  url: string;
  icon: React.ElementType;
  description?: string;
  badge?: string | number;
  permission?: 'owner' | 'admin' | 'staff';
}

interface AppSidebarProps {
  activeSection?: string;
  onSectionChange?: (section: string) => void;
}

const coreItems: NavigationItem[] = [
  { 
    title: 'Dashboard', 
    url: '/', 
    icon: LayoutDashboard
  },
];

const dayToDayItems: NavigationItem[] = [
  { 
    title: 'Jobs', 
    url: '/jobs', 
    icon: CalendarDays,
    permission: 'staff'
  },
  { 
    title: 'Customers', 
    url: '/customer-hub', 
    icon: Users2,
    permission: 'staff'
  },
  { 
    title: 'Quotes & Invoices', 
    url: '/quotes-invoices', 
    icon: FileText,
    permission: 'admin'
  },
];


const inventoryItems: NavigationItem[] = [
  { 
    title: 'Products', 
    url: '/inventory', 
    icon: Package,
    permission: 'staff'
  },
  { 
    title: 'Consumables', 
    url: '/consumables', 
    icon: Droplets,
    permission: 'staff'
  },
  { 
    title: 'Storage Sites', 
    url: '/storage-sites', 
    icon: Building,
    permission: 'admin'
  },
];

const managementItems: NavigationItem[] = [
  { 
    title: 'Team Management', 
    url: '/team-management', 
    icon: UserCog,
    permission: 'admin'
  },
  { 
    title: 'Fleet Management', 
    url: '/fleet-management', 
    icon: Truck,
    permission: 'admin'
  },
  { 
    title: 'Services Hub', 
    url: '/maintenance-hub', 
    icon: ClipboardCheck,
    permission: 'admin'
  },
];

const adminItems: NavigationItem[] = [
  { 
    title: 'Marketing', 
    url: '/marketing', 
    icon: Megaphone,
    permission: 'admin'
  },
  { 
    title: 'Analytics', 
    url: '/analytics', 
    icon: BarChart4,
    permission: 'admin'
  },
  { 
    title: 'Settings', 
    url: '/settings', 
    icon: Settings,
    permission: 'owner'
  },
];

export function AppSidebar({ activeSection, onSectionChange }: AppSidebarProps) {
  const { hasStaffAccess, hasAdminAccess, isOwner } = useUserRole();
  const { user } = useUser();
  const location = useLocation();

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

  return (
    <Sidebar className="w-64 border-r">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-start">
          <Logo showText={false} />
        </div>
      </div>
      
      <SidebarContent>
        {/* Core Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleCoreItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={activeSection === item.url || location.pathname === item.url}
                    className={activeSection === item.url || location.pathname === item.url ? 'nav-item-active' : ''}
                  >
                    <NavLink
                      to={item.url}
                      onClick={() => onSectionChange?.(item.url)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left"
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="text-sm font-medium">{item.title}</span>
                       {item.badge && (
                        <Badge 
                          className={cn(
                            "ml-auto border-0 font-bold bg-gray-200 text-gray-800",
                            (activeSection === item.url || location.pathname === item.url) 
                              ? "text-blue-600" 
                              : "text-gray-800"
                          )}
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Day-to-Day Section */}
        {visibleDayToDayItems.length > 0 && (
          <SidebarGroup>
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              DAY-TO-DAY
            </div>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleDayToDayItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={activeSection === item.url || location.pathname === item.url}
                      className={activeSection === item.url || location.pathname === item.url ? 'nav-item-active' : ''}
                    >
                      <NavLink
                        to={item.url}
                        onClick={() => onSectionChange?.(item.url)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-left"
                      >
                        <item.icon className="h-5 w-5" />
                        <span className="text-sm font-medium">{item.title}</span>
                         {item.badge && (
                          <Badge 
                            className={cn(
                              "ml-auto border-0 font-bold bg-gray-200 text-gray-800",
                              (activeSection === item.url || location.pathname === item.url) 
                                ? "text-blue-600" 
                                : "text-gray-800"
                            )}
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}


        {/* Inventory Section */}
        {visibleInventoryItems.length > 0 && (
          <SidebarGroup>
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              INVENTORY
            </div>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleInventoryItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={activeSection === item.url || location.pathname === item.url}
                      className={activeSection === item.url || location.pathname === item.url ? 'nav-item-active' : ''}
                    >
                      <NavLink
                        to={item.url}
                        onClick={() => onSectionChange?.(item.url)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-left"
                      >
                        <item.icon className="h-5 w-5" />
                        <span className="text-sm font-medium">{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Management Section */}
        {visibleManagementItems.length > 0 && (
          <SidebarGroup>
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              MANAGEMENT
            </div>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleManagementItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={activeSection === item.url || location.pathname === item.url}
                      className={activeSection === item.url || location.pathname === item.url ? 'nav-item-active' : ''}
                    >
                      <NavLink
                        to={item.url}
                        onClick={() => onSectionChange?.(item.url)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-left"
                      >
                        <item.icon className="h-5 w-5" />
                        <span className="text-sm font-medium">{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Admin Section */}
        {visibleAdminItems.length > 0 && (
          <SidebarGroup>
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              ADMIN
            </div>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleAdminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={activeSection === item.url || location.pathname === item.url}
                      className={activeSection === item.url || location.pathname === item.url ? 'nav-item-active' : ''}
                    >
                      <NavLink
                        to={item.url}
                        onClick={() => onSectionChange?.(item.url)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-left"
                      >
                        <item.icon className="h-5 w-5" />
                        <span className="text-sm font-medium">{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 mt-auto">
        <div className="flex items-center gap-3">
          <UserButton 
            appearance={{
              elements: {
                userButtonAvatarBox: "w-8 h-8",
                userButtonPopoverCard: "shadow-lg"
              }
            }}
          />
          <div className="text-sm text-gray-600">
            {user?.firstName || user?.emailAddresses?.[0]?.emailAddress || 'User'}
          </div>
        </div>
      </div>
    </Sidebar>
  );
}
