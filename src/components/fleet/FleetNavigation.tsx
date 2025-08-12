import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Truck, 
  AlertTriangle, 
  Calendar, 
  Wrench, 
  Fuel, 
  FolderOpen,
  Package
} from "lucide-react";
import { TabNav } from "@/components/ui/TabNav";
import { Badge } from "@/components/ui/badge";

export const FleetNavigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
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
      end: true
    },
    {
      title: "Truck Stock",
      href: "/fleet/truck-stock",
      icon: Package
    },
    {
      title: "Transport & Spill Compliance",
      href: "/fleet/compliance",
      icon: AlertTriangle,
      badge: (complianceCounts?.total && complianceCounts.total > 0) ? complianceCounts.total.toString() : undefined
    },
    {
      title: "Assignments",
      href: "/fleet/assignments",
      icon: Calendar
    },
    {
      title: "Maintenance",
      href: "/fleet/maintenance",
      icon: Wrench,
      badge: "1"
    },
    {
      title: "Fuel",
      href: "/fleet/fuel",
      icon: Fuel
    },
    {
      title: "Documents & Photos",
      href: "/fleet/files",
      icon: FolderOpen
    }
  ];

  const handleNavigation = (href: string) => {
    navigate(href);
  };

  const isActiveRoute = (href: string, end?: boolean) => {
    if (end) {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="bg-card border border-border rounded-2xl shadow-sm mx-6 mt-6 mb-6">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 font-inter">
              Fleet Management
            </h1>
            <p className="text-gray-600 mt-1">
              Manage vehicles, compliance, maintenance, and operations
            </p>
          </div>
        </div>
        
        <TabNav ariaLabel="Fleet Management Navigation">
          {navigationItems.map((item) => (
            <TabNav.Item
              key={item.href}
              to={item.href}
              isActive={isActiveRoute(item.href, item.end)}
              onClick={() => handleNavigation(item.href)}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.title}</span>
              {item.badge && (
                <Badge 
                  variant="destructive" 
                  className="text-xs ml-1"
                >
                  {item.badge}
                </Badge>
              )}
            </TabNav.Item>
          ))}
        </TabNav>
      </div>
    </div>
  );
};