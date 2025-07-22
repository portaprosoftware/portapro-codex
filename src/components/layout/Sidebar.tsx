import React from "react";
import { NavLink } from "react-router-dom";
import { 
  Home, 
  Calendar, 
  Truck, 
  Users, 
  Package, 
  FileText, 
  BarChart3, 
  Settings,
  ClipboardList,
  MessageSquare
} from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { cn } from "@/lib/utils";

interface SidebarItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
}

const sidebarItems: SidebarItem[] = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: Home,
    roles: ["owner", "dispatch", "driver", "customer"]
  },
  {
    name: "Jobs",
    path: "/jobs",
    icon: ClipboardList,
    roles: ["owner", "dispatch", "driver"]
  },
  {
    name: "Calendar",
    path: "/calendar",
    icon: Calendar,
    roles: ["owner", "dispatch"]
  },
  {
    name: "Fleet Management",
    path: "/fleet",
    icon: Truck,
    roles: ["owner", "dispatch"]
  },
  {
    name: "Customers",
    path: "/customers",
    icon: Users,
    roles: ["owner", "dispatch"]
  },
  {
    name: "Inventory",
    path: "/inventory",
    icon: Package,
    roles: ["owner", "dispatch"]
  },
  {
    name: "Quotes & Invoices",
    path: "/quotes",
    icon: FileText,
    roles: ["owner", "dispatch"]
  },
  {
    name: "Marketing",
    path: "/marketing",
    icon: MessageSquare,
    roles: ["owner", "dispatch"]
  },
  {
    name: "Analytics",
    path: "/analytics",
    icon: BarChart3,
    roles: ["owner", "dispatch"]
  },
  {
    name: "Settings",
    path: "/settings",
    icon: Settings,
    roles: ["owner"]
  }
];

export const Sidebar: React.FC = () => {
  const { role } = useUserRole();

  const filteredItems = sidebarItems.filter(item => 
    role && item.roles.includes(role)
  );

  return (
    <aside className="w-64 bg-card border-r border-border h-screen sticky top-16 overflow-y-auto">
      <nav className="p-4 space-y-2">
        {filteredItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "text-muted-foreground"
              )
            }
          >
            <item.icon className="w-5 h-5" />
            {item.name}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};