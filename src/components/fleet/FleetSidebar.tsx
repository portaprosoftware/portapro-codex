import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Truck, 
  AlertTriangle, 
  Calendar, 
  Wrench, 
  Fuel, 
  FolderOpen,
  Bell,
  Settings,
  Package,
  BarChart3,
  Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export const FleetSidebar: React.FC = () => {
  const location = useLocation();
  const isFleetManagementActive = location.pathname === "/fleet-management" || location.pathname === "/fleet";
  
  // Fetch real-time compliance notification counts
  const { data: complianceCounts } = useQuery({
    queryKey: ["compliance-notification-counts"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.rpc("get_compliance_notification_counts");
        if (error) throw error;
        return data as { total: number; overdue: number; critical: number; warning: number };
      } catch (error) {
        console.error("Error fetching compliance counts:", error);
        return { total: 0, overdue: 0, critical: 0, warning: 0 };
      }
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    initialData: { total: 0, overdue: 0, critical: 0, warning: 0 }
  });

  const navigationItems = [
    {
      title: "Fleet Overview",
      href: "/fleet-management",
      icon: Truck,
      description: "All vehicles",
      end: true
    },
    {
      title: "Truck Stock",
      href: "/fleet/truck-stock",
      icon: Package,
      description: "Per-vehicle consumables"
    },
    {
      title: "Transport & Spill Compliance",
      href: "/fleet/compliance",
      icon: AlertTriangle,
      description: "DOT, septage permits, spill readiness",
      badge: (complianceCounts?.total && complianceCounts.total > 0) ? complianceCounts.total.toString() : undefined
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
      title: "Documents & Photos",
      href: "/fleet/files",
      icon: FolderOpen,
      description: "Receipts, warranties, photos & paperwork"
    }
  ];
  
  return (
    <aside className="w-64 bg-card border-r flex flex-col">
      {/* Header */}
      <div className="p-6 border-b">
        <h2 className="text-2xl font-semibold text-gray-900 font-inter">
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