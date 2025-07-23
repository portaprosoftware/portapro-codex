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
    href: "/fleet",
    icon: Truck,
    description: "All vehicles",
    end: true
  },
  {
    title: "Load Management",
    href: "/fleet/loads",
    icon: Package,
    description: "Vehicle capacity & loads",
    badge: "3"
  },
  {
    title: "Analytics",
    href: "/fleet/analytics",
    icon: BarChart3,
    description: "Performance insights"
  },
  {
    title: "Capacity Config",
    href: "/fleet/capacity",
    icon: Settings,
    description: "Vehicle configurations"
  },
  {
    title: "Compliance Reports",
    href: "/fleet/compliance-reports",
    icon: Shield,
    description: "Compliance monitoring"
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
    title: "Compliance",
    href: "/fleet/compliance",
    icon: AlertTriangle,
    description: "Insurance & Registration",
    badge: "6"
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
    <div className="w-64 bg-white border-r border-gray-200 h-full">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Truck className="w-6 h-6 text-blue-600" />
          <div>
            <h2 className="font-bold text-gray-900">Fleet Management</h2>
            <p className="text-sm text-gray-600">Manage vehicles & operations</p>
          </div>
        </div>
      </div>

      <nav className="p-4 space-y-1">
        {navigationItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.end}
            className={({ isActive }) =>
              cn(
                "flex items-center justify-between w-full p-3 rounded-lg text-sm transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : "text-gray-700 hover:bg-gray-50"
              )
            }
          >
            <div className="flex items-center space-x-3">
              <item.icon className="w-5 h-5" />
              <div>
                <div className="font-medium">{item.title}</div>
                <div className="text-xs text-gray-500">{item.description}</div>
              </div>
            </div>
            {item.badge && (
              <Badge variant="destructive" className="h-5 text-xs">
                {item.badge}
              </Badge>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};