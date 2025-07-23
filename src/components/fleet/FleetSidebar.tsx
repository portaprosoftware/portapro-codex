import React from "react";
import { NavLink } from "react-router-dom";
import { 
  Truck, 
  AlertTriangle, 
  Calendar, 
  Wrench, 
  Fuel, 
  FileText,
  Bell,
  Settings,
  Package,
  BarChart3,
  Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const navigationItems = [
  {
    title: "Fleet Overview",
    href: "/fleet-management",
    icon: Truck,
    description: "All vehicles",
    end: true
  },
  {
    title: "Compliance",
    href: "/fleet/compliance",
    icon: AlertTriangle,
    description: "Insurance & Registration...",
    badge: "6"
  },
  {
    title: "Assignments",
    href: "/fleet/assignments",
    icon: Calendar,
    description: "Daily driver schedules"
  },
  {
    title: "Maintenance",
    href: "/fleet/maintenance",
    icon: Wrench,
    description: "Service & repairs",
    badge: "1"
  },
  {
    title: "Fuel",
    href: "/fleet/fuel",
    icon: Fuel,
    description: "Logs & summaries"
  },
  {
    title: "Files & Photos",
    href: "/fleet/files",
    icon: FileText,
    description: "General uploads"
  }
];

export const FleetSidebar: React.FC = () => {
  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full flex-shrink-0">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start space-x-2">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Fleet Management</h2>
            <p className="text-base font-normal text-gray-500">Manage vehicles & operations</p>
          </div>
        </div>
      </div>

      <nav className="p-4 space-y-2">
        {navigationItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.end}
            className={({ isActive }) =>
              cn(
                "flex items-center justify-between w-full p-3 rounded-lg text-sm transition-colors group",
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-50"
              )
            }
          >
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <item.icon className={cn(
                "w-4 h-4 flex-shrink-0"
              )} />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{item.title}</div>
                <div className="text-xs font-normal truncate text-gray-500 group-[.bg-blue-600]:text-blue-100">{item.description}</div>
              </div>
            </div>
            {item.badge && (
              <Badge 
                variant="destructive" 
                className="h-5 text-xs flex-shrink-0 ml-2"
              >
                {item.badge}
              </Badge>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};