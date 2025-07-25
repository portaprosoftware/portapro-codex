
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
  Settings2,
  FileText,
  BarChart4,
  Droplets,
  Building2,
  Megaphone,
  MessageSquare,
  Scroll
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

const items: NavigationItem[] = [
  { 
    title: 'Dashboard', 
    url: '/', 
    icon: LayoutDashboard
  },
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
    title: 'Inventory', 
    url: '/inventory', 
    icon: Package,
    permission: 'staff'
  },
  { 
    title: 'Consumables', 
    url: '/consumables', 
    icon: Scroll,
    permission: 'staff'
  },
  { 
    title: 'Fleet Management', 
    url: '/fleet-management', 
    icon: Truck,
    permission: 'admin'
  },
  { 
    title: 'Maintenance', 
    url: '/maintenance-hub', 
    icon: Droplets,
    permission: 'admin'
  },
  { 
    title: 'Quotes & Invoices', 
    url: '/quotes-invoices', 
    icon: FileText,
    permission: 'admin'
  },
  { 
    title: 'Analytics', 
    url: '/analytics', 
    icon: BarChart4,
    permission: 'admin'
  },
  { 
    title: 'Marketing', 
    url: '/marketing-hub', 
    icon: Megaphone,
    permission: 'admin'
  },
  { 
    title: 'Settings', 
    url: '/settings', 
    icon: Settings2,
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

  const getVisibleItems = () => {
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

  const visibleItems = getVisibleItems();

  return (
    <Sidebar className="w-72 border-r">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-start">
          <Logo showText={false} />
        </div>
      </div>
      
      <SidebarContent>
        <SidebarGroup>
          <div className="px-4 py-2">
            <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Navigation</h2>
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={activeSection === item.url || location.pathname === item.url}
                    className={activeSection === item.url || location.pathname === item.url ? 'nav-item-active' : ''}
                  >
                    <NavLink
                      to={item.url}
                      onClick={() => onSectionChange?.(item.url)}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left"
                    >
                      <item.icon className="h-4 w-4" />
                       <span className="text-sm font-medium">{item.title}</span>
                      {item.badge && (
                        <Badge 
                          className={cn(
                            "ml-auto text-white border-0 font-bold",
                            (activeSection === item.url || location.pathname === item.url) 
                              ? "bg-gradient-to-r from-blue-600 to-blue-700" 
                              : "bg-gray-500"
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
