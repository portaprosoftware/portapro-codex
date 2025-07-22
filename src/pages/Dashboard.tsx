import React from "react";
import { useUserRole } from "@/hooks/useUserRole";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Truck, 
  Users, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle,
  Plus,
  Eye
} from "lucide-react";

// Mock data - replace with actual data from Supabase
const mockStats = {
  totalJobs: 156,
  activeJobs: 23,
  totalRevenue: 58469,
  pendingInvoices: 12,
  availableVehicles: 7,
  maintenanceVehicles: 2,
  totalCustomers: 89,
  newCustomers: 5
};

const recentJobs = [
  {
    id: "SVC-942",
    customer: "BlueWave Festival",
    date: "Jul 18, 2025",
    status: "completed",
    driver: "Grady Green"
  },
  {
    id: "SVC-946",
    customer: "Hickory Hollow Farm",
    date: "Jul 18, 2025", 
    status: "assigned",
    driver: "Jason Wells"
  }
];

export const Dashboard: React.FC = () => {
  const { role, hasAdminAccess, user } = useUserRole();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {getGreeting()}, {user?.firstName || "there"}!
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your {role === "customer" ? "account" : "business"} today.
          </p>
        </div>
        {hasAdminAccess && (
          <Button className="btn-hero">
            <Plus className="w-4 h-4 mr-2" />
            Schedule Job
          </Button>
        )}
      </div>

      {/* Stats Grid */}
      {hasAdminAccess && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="card-elevated p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Jobs</p>
                <p className="text-2xl font-bold text-foreground">{mockStats.activeJobs}</p>
              </div>
              <div className="w-12 h-12 bg-primary-light rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <TrendingUp className="w-4 h-4 text-success mr-1" />
              <span className="text-success">+12%</span>
              <span className="text-muted-foreground ml-1">from last week</span>
            </div>
          </Card>

          <Card className="card-elevated p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Revenue</p>
                <p className="text-2xl font-bold text-foreground">${mockStats.totalRevenue.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-success-light rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-success" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <TrendingUp className="w-4 h-4 text-success mr-1" />
              <span className="text-success">+8%</span>
              <span className="text-muted-foreground ml-1">from last month</span>
            </div>
          </Card>

          <Card className="card-elevated p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Available Fleet</p>
                <p className="text-2xl font-bold text-foreground">{mockStats.availableVehicles}</p>
              </div>
              <div className="w-12 h-12 bg-warning-light rounded-lg flex items-center justify-center">
                <Truck className="w-6 h-6 text-warning" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <AlertTriangle className="w-4 h-4 text-warning mr-1" />
              <span className="text-warning">{mockStats.maintenanceVehicles} in maintenance</span>
            </div>
          </Card>

          <Card className="card-elevated p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Customers</p>
                <p className="text-2xl font-bold text-foreground">{mockStats.totalCustomers}</p>
              </div>
              <div className="w-12 h-12 bg-primary-light rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <TrendingUp className="w-4 h-4 text-success mr-1" />
              <span className="text-success">+{mockStats.newCustomers} new</span>
              <span className="text-muted-foreground ml-1">this week</span>
            </div>
          </Card>
        </div>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="card-elevated">
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Recent Jobs</h3>
              <Button variant="outline" size="sm">
                <Eye className="w-4 h-4 mr-2" />
                View All
              </Button>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {recentJobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between py-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{job.id}</span>
                    <Badge 
                      className={job.status === "completed" ? "badge-success" : "badge-primary"}
                    >
                      {job.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{job.customer}</p>
                  <p className="text-sm text-muted-foreground">Driver: {job.driver}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">{job.date}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="card-elevated">
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-semibold text-foreground">Quick Actions</h3>
          </div>
          <div className="p-6 space-y-3">
            {hasAdminAccess && (
              <>
                <Button className="w-full justify-start" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Job
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Users className="w-4 h-4 mr-2" />
                  Add Customer
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Truck className="w-4 h-4 mr-2" />
                  Add Vehicle
                </Button>
              </>
            )}
            {role === "customer" && (
              <>
                <Button className="w-full justify-start" variant="outline">
                  <Calendar className="w-4 h-4 mr-2" />
                  Request Service
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Eye className="w-4 h-4 mr-2" />
                  View My Jobs
                </Button>
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};