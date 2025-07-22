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
    <aside className="w-64 bg-white border-r border-gray-200 h-screen sticky top-16 overflow-y-auto font-inter">
      <nav className="p-4 space-y-1">
        {filteredItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center px-3 py-2 rounded-md font-medium transition-all duration-200 cursor-pointer",
                "text-gray-700",
                isActive 
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold shadow-sm" 
                  : "hover:bg-gray-100"
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn("w-5 h-5 mr-3", isActive ? "text-white" : "text-gray-600")} />
                <span className={isActive ? "text-white" : "text-gray-700"}>{item.name}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};