import { 
  LayoutDashboard, 
  CalendarDays, 
  Toilet, 
  Users2, 
  Truck, 
  ClipboardCheck,
  FileText,
  BarChart4,
  Settings,
  UserCog,
  Warehouse,
  Megaphone,
  Droplets,
} from 'lucide-react';

export interface NavigationItem {
  title: string;
  url: string;
  icon: React.ElementType;
  description?: string;
  badge?: string | number;
  permission?: 'owner' | 'admin' | 'staff';
}

export const coreItems: NavigationItem[] = [
  { 
    title: 'Dashboard', 
    url: '/dashboard', 
    icon: LayoutDashboard
  },
];

export const dayToDayItems: NavigationItem[] = [
  { 
    title: 'Jobs', 
    url: '/jobs', 
    icon: CalendarDays,
    permission: 'staff'
  },
  { 
    title: 'Customers', 
    url: '/customers', 
    icon: Users2,
    permission: 'staff'
  },
  { 
    title: 'Quotes & Invoices', 
    url: '/quotes-invoices', 
    icon: FileText,
    permission: 'staff'
  },
];

export const inventoryItems: NavigationItem[] = [
  { 
    title: 'Equipment', 
    url: '/inventory', 
    icon: Toilet,
    permission: 'staff'
  },
  { 
    title: 'Consumables', 
    url: '/consumables', 
    icon: Droplets,
    permission: 'staff'
  },
  { 
    title: 'Storage', 
    url: '/storage-sites', 
    icon: Warehouse,
    permission: 'admin'
  }
];

export const managementItems: NavigationItem[] = [
  { 
    title: 'Fleet Management', 
    url: '/fleet', 
    icon: Truck,
    permission: 'staff'
  },
  { 
    title: 'Services Hub', 
    url: '/maintenance-hub', 
    icon: ClipboardCheck,
    permission: 'staff'
  },
  { 
    title: 'Team Management', 
    url: '/team-management', 
    icon: UserCog,
    permission: 'admin'
  },
];

export const adminItems: NavigationItem[] = [
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
    permission: 'admin'
  },
];
