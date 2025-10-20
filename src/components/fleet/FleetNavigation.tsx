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
import { cn } from "@/lib/utils";

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

  // Fetch past due maintenance count
  const { data: pastDueMaintenanceCount } = useQuery({
    queryKey: ["past-due-maintenance-count"],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { count, error } = await supabase
        .from('maintenance_records')
        .select('id', { count: 'exact', head: true })
        .lt('scheduled_date', today)
        .in('status', ['scheduled', 'in_progress']);
      
      if (error) {
        console.error("Error fetching past due maintenance count:", error);
        return 0;
      }
      return count || 0;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    initialData: 0
  });

  const navigationItems = [
    {
      title: "Fleet",
      href: "/fleet-management",
      icon: Truck,
      end: true
    },
    {
      title: "Stock",
      href: "/fleet/truck-stock",
      icon: Package
    },
    {
      title: "Compliance",
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
      badge: (pastDueMaintenanceCount && pastDueMaintenanceCount > 0) ? pastDueMaintenanceCount.toString() : undefined
    },
    {
      title: "Fuel",
      href: "/fleet/fuel",
      icon: Fuel
    },
    {
      title: "Uploads",
      href: "/fleet/files",
      icon: FolderOpen
    }
  ];

  const handleNavigation = (href: string) => {
    navigate(href);
  };

  const isActiveRoute = (href: string, end?: boolean) => {
    if (end) {
      // For overview, match both /fleet-management and /fleet routes
      if (href === "/fleet-management") {
        return location.pathname === "/fleet-management" || location.pathname === "/fleet";
      }
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
      <div className="p-4 lg:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl lg:text-2xl font-semibold text-gray-900 font-inter truncate">
              Fleet Management
            </h1>
            <p className="text-sm lg:text-base text-gray-600 mt-1">
              Manage vehicles, compliance, maintenance, and operations
            </p>
          </div>
        </div>
        
        {/* Desktop Navigation */}
        <div className="hidden lg:block">
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

        {/* Mobile Navigation - Horizontal Scroll */}
        <div className="lg:hidden -mx-4 px-4">
          <div 
            className="flex gap-2 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            role="tablist"
            aria-label="Fleet Management Navigation"
          >
            {navigationItems.map((item) => (
              <button
                key={item.href}
                onClick={() => handleNavigation(item.href)}
                className={cn(
                  "snap-start whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 min-h-[44px] flex-shrink-0",
                  isActiveRoute(item.href, item.end)
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
                role="tab"
                aria-selected={isActiveRoute(item.href, item.end)}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.title}</span>
                {item.badge && (
                  <Badge 
                    variant="destructive" 
                    className="text-xs"
                  >
                    {item.badge}
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Hide scrollbar globally for this component */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};