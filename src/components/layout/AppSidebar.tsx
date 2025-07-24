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
  Wrench,
  Building2,
  TrendingUp,
  MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserRole } from '@/hooks/useUserRole';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";

interface NavigationItem {
  title: string;
  href: string;
  icon: React.ElementType;
  description?: string;
  badge?: string | number;
  permission?: 'owner' | 'admin' | 'staff';
}

const navigationItems: NavigationItem[] = [
  { 
    title: 'Dashboard', 
    href: '/', 
    icon: Home,
    description: 'Overview and quick actions'
  },
  { 
    title: 'Jobs', 
    href: '/jobs', 
    icon: Calendar,
    description: 'Schedule and manage jobs',
    permission: 'staff',
    badge: '12'
  },
  { 
    title: 'Customers', 
    href: '/customers', 
    icon: Users,
    description: 'Customer management',
    permission: 'staff'
  },
  { 
    title: 'Inventory', 
    href: '/inventory', 
    icon: Package,
    description: 'Track units and supplies',
    permission: 'staff'
  },
  { 
    title: 'Fleet Management', 
    href: '/fleet', 
    icon: Truck,
    description: 'Vehicles and maintenance',
    permission: 'admin'
  },
  { 
    title: 'Maintenance', 
    href: '/maintenance', 
    icon: Wrench,
    description: 'Service and repairs',
    permission: 'admin'
  },
  { 
    title: 'Quotes & Invoices', 
    href: '/quotes-invoices', 
    icon: FileText,
    description: 'Billing and estimates',
    permission: 'admin'
  },
  { 
    title: 'Analytics', 
    href: '/analytics', 
    icon: BarChart3,
    description: 'Reports and insights',
    permission: 'admin'
  },
  { 
    title: 'Marketing', 
    href: '/marketing', 
    icon: TrendingUp,
    description: 'Campaigns and outreach',
    permission: 'admin'
  },
  { 
    title: 'Communications', 
    href: '/communications', 
    icon: MessageSquare,
    description: 'Customer portal and chat',
    permission: 'admin'
  },
  { 
    title: 'Settings', 
    href: '/settings', 
    icon: Settings,
    description: 'System configuration',
    permission: 'owner'
  },
];

export const AppSidebar: React.FC = () => {
  const { state } = useSidebar();
  const { hasStaffAccess, hasAdminAccess, isOwner } = useUserRole();
  const collapsed = state === "collapsed";

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
    <Sidebar className="border-r border-gray-200 bg-white">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-lg font-semibold text-gray-900">PortaPro</h1>
              <p className="text-xs text-gray-500">Portable Toilet Management</p>
            </div>
          )}
        </div>
      </div>

      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <NavLink to={item.href} className="block">
                    {({ isActive }) => (
                      <SidebarMenuButton
                        isActive={isActive}
                        className={cn(
                          "w-full justify-start gap-3 h-11 px-3",
                          isActive
                            ? "nav-item-active text-white"
                            : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                        )}
                      >
                        <item.icon className="w-5 h-5 flex-shrink-0" strokeWidth={2} />
                        {!collapsed && (
                          <>
                            <div className="flex-1 text-left">
                              <div className="font-medium">{item.title}</div>
                              {item.description && (
                                <div className="text-xs text-gray-500">{item.description}</div>
                              )}
                            </div>
                            {item.badge && (
                              <Badge 
                                variant={isActive ? "secondary" : "info"} 
                                className="ml-auto"
                              >
                                {item.badge}
                              </Badge>
                            )}
                          </>
                        )}
                        {collapsed && item.badge && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
                        )}
                      </SidebarMenuButton>
                    )}
                  </NavLink>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};