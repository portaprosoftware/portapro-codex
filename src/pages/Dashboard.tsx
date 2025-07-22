import React from "react";
import { useUserRole } from "@/hooks/useUserRole";
import { Card } from "@/components/ui/card";
import { 
  Calendar, 
  Truck, 
  Users, 
  DollarSign, 
  Fuel,
  AlertTriangle,
  FileText,
  Archive
} from "lucide-react";

// Type definition for dashboard card data
interface DashboardCard {
  value: string;
  icon: React.ComponentType<any>;
  color: string;
  subtitle?: string;
  details?: string;
}

// Mock data for the 8 dashboard cards
const dashboardData: Record<string, DashboardCard> = {
  totalUnits: { value: "10", icon: Archive, color: "blue" },
  activeCustomers: { value: "42", icon: Users, color: "purple" },
  jobsToday: { value: "3", subtitle: "0 deliveries, 0 pickups", icon: Calendar, color: "blue" },
  monthlyRevenue: { value: "$12,258", icon: DollarSign, color: "green" },
  fleetVehicles: { 
    value: "9", 
    subtitle: "9 vehicles total", 
    details: "7 active, 1 maintenance", 
    icon: Truck, 
    color: "blue" 
  },
  fuelCost: { 
    value: "$1,034.66", 
    subtitle: "This month's fuel expenses", 
    icon: Fuel, 
    color: "orange" 
  },
  maintenanceAlerts: { 
    value: "5", 
    subtitle: "Due within 7 days", 
    icon: AlertTriangle, 
    color: "red" 
  },
  expiringDocuments: { 
    value: "3 vehicles", 
    subtitle: "4 overdue, 2 expiring soon", 
    details: "Expiring (30 days): 33%", 
    icon: FileText, 
    color: "yellow" 
  }
};

const getCardStyles = (color: string) => {
  const styles = {
    blue: "border-l-4 border-l-blue-500",
    purple: "border-l-4 border-l-purple-500", 
    green: "border-l-4 border-l-green-500",
    orange: "border-l-4 border-l-orange-500",
    red: "border-l-4 border-l-red-500",
    yellow: "border-l-4 border-l-yellow-500"
  };
  return styles[color as keyof typeof styles] || styles.blue;
};

const getIconStyles = (color: string) => {
  const styles = {
    blue: "bg-blue-100 text-blue-600",
    purple: "bg-purple-100 text-purple-600",
    green: "bg-green-100 text-green-600", 
    orange: "bg-orange-100 text-orange-600",
    red: "bg-red-100 text-red-600",
    yellow: "bg-yellow-100 text-yellow-600"
  };
  return styles[color as keyof typeof styles] || styles.blue;
};

export const Dashboard: React.FC = () => {
  const { user } = useUserRole();

  const currentTime = new Date().toLocaleString('en-US', {
    weekday: 'short',
    month: 'short', 
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {user?.firstName || "Tyler"}!
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your rental business today.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Role: Admin
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">{currentTime}</p>
        </div>
      </div>

      {/* Dashboard Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(dashboardData).map(([key, data]) => {
          const Icon = data.icon;
          return (
            <Card key={key} className={`card-elevated p-6 ${getCardStyles(data.color)}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-muted-foreground capitalize mb-2">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </h3>
                  <p className="text-2xl font-bold text-foreground mb-1">
                    {data.value}
                  </p>
                  {data.subtitle && (
                    <p className="text-sm text-muted-foreground">
                      {data.subtitle}
                    </p>
                  )}
                  {data.details && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-muted-foreground">{data.details}</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getIconStyles(data.color)}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};