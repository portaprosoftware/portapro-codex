import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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
import { useUserRole } from '@/hooks/useUserRole';
import { UserButton } from '@clerk/clerk-react';
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
    icon: Home
  },
  { 
    title: 'Jobs', 
    url: '/jobs', 
    icon: Calendar,
    permission: 'staff',
    badge: '12'
  },
  { 
    title: 'Customers', 
    url: '/customer-hub', 
    icon: Users,
    permission: 'staff'
  },
  { 
    title: 'Inventory', 
    url: '/inventory', 
    icon: Package,
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
    icon: Wrench,
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
    icon: BarChart3,
    permission: 'admin'
  },
  { 
    title: 'Marketing', 
    url: '/marketing-hub', 
    icon: TrendingUp,
    permission: 'admin'
  },
  { 
    title: 'Communications', 
    url: '/communications', 
    icon: MessageSquare,
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
  const location = useLocation();

  const getVisibleItems = () => {
    return items.filter(item => {
      if (!item.permission) return true;
      if (item.permission === 'owner') return isOwner;
      if (item.permission === 'admin') return hasAdminAccess;
      if (item.permission === 'staff') return hasStaffAccess;
      return false;
    });
  };

  const visibleItems = getVisibleItems();

  return (
    <Sidebar className="w-64 border-r">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">PortaPro</h1>
            <p className="text-xs text-gray-500">Portable Toilet Management</p>
          </div>
        </div>
      </div>
      
      <SidebarContent>
        <SidebarGroup>
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
                          variant="outline" 
                          className="ml-auto"
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
            User Menu
          </div>
        </div>
      </div>
    </Sidebar>
  );
}