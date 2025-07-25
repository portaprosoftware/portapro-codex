import React from "react";
import { NavLink, useLocation } from "react-router-dom";
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
  const location = useLocation();
  const isFleetManagementActive = location.pathname === "/fleet-management" || location.pathname === "/fleet";
  
  return (
    <aside className="w-64 bg-card border-r flex flex-col">
      {/* Header */}
      <div className="p-6 border-b">
        <h2 className={cn(
          "text-lg font-semibold transition-colors",
          isFleetManagementActive 
            ? "text-white font-bold bg-gradient-to-r from-blue-500 to-blue-600 px-3 py-2 rounded-lg" 
            : "text-foreground"
        )}>
          Fleet Management
        </h2>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigationItems.map((item) => (
            <li key={item.href}>
              <NavLink
                to={item.href}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center justify-between p-3 rounded-lg transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center space-x-3">
                      <item.icon className="h-4 w-4" />
                      <div>
                        <div className="text-sm font-medium">{item.title}</div>
                        <div className={cn(
                          "text-xs",
                          isActive 
                            ? "text-white font-bold" 
                            : "text-muted-foreground"
                        )}>
                          {item.description}
                        </div>
                      </div>
                    </div>
                    {item.badge && (
                      <Badge 
                        variant="destructive" 
                        className="text-xs"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};