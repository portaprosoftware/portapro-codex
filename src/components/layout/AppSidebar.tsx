
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

  const NavSection: React.FC<{ title?: string; items: NavigationItem[] }> = ({ title, items }) => (
    <div className="py-2">
      {title && (
        <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          {title}
        </div>
      )}
      <ul className="flex w-full min-w-0 flex-col gap-1">
        {items.map((item) => {
          const isActive = activeSection === item.url || location.pathname === item.url
          return (
            <li key={item.title} className="group/menu-item relative">
              <NavLink
                to={item.url}
                onClick={() => onSectionChange?.(item.url)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md p-2 text-left text-sm hover:bg-gray-100",
                  isActive && "bg-gray-100 font-medium"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="truncate">{item.title}</span>
                {item.badge && (
                  <Badge className="ml-auto border-0 font-bold bg-gray-200 text-gray-800">
                    {item.badge}
                  </Badge>
                )}
              </NavLink>
            </li>
          )
        })}
      </ul>
    </div>
  )

  return (
    <aside className="w-64 border-r bg-white flex h-screen flex-col fixed left-0 top-0 z-30">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-start">
          <Logo showText={false} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <nav className="px-2 py-3">
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
        </nav>
      </div>

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
    </aside>
  );
}
