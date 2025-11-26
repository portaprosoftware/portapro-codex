import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useCompanyTimezone } from "@/hooks/useCompanyTimezone";
import { MinimalClock } from "@/components/ui/MinimalClock";
import { StatCard } from "@/components/ui/StatCard";
import { Sparkline } from "@/components/ui/Sparkline";
import { DonutChart } from "@/components/ui/DonutChart";
import { useNavigate } from "react-router-dom";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/badge";
import { VehicleDocumentsCard } from "@/components/dashboard/VehicleDocumentsCard";
import { DriverComplianceCard } from "@/components/dashboard/DriverComplianceCard";
import { StaffCertificationsCard } from "@/components/dashboard/StaffCertificationsCard";
import { CompactConsumablesCard } from "@/components/dashboard/CompactConsumablesCard";
import { SpillKitExpirationsCard } from "@/components/dashboard/SpillKitExpirationsCard";
import { useTenantId } from "@/lib/tenantQuery";
import { getRoleLabel } from "@/lib/roles";
import { DashboardKpis } from "@/types/rpc";
import {
  Package,
  Users,
  Calendar,
  DollarSign,
  Truck, 
  Fuel, 
  Wrench, 
  FileX,
  Toilet
} from "lucide-react";

const Dashboard = () => {
  const { role, user } = useUserRole();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const tenantId = useTenantId();
  
  // Redirect drivers to the Driver app dashboard
  useEffect(() => {
    if (role === 'driver') {
      navigate('/driver', { replace: true });
    }
  }, [role, navigate]);
  
  // Mock data for sparkline (jobs over the past week)
  const jobsSparklineData = [2, 3, 1, 4, 2, 5, 3];
  const { data: kpis } = useQuery({
    queryKey: ['dashboard-kpis', tenantId],
    queryFn: async (): Promise<DashboardKpis> => {
      if (!tenantId) throw new Error('Tenant ID required for KPI rollup');

      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 30);

      const { data, error } = await supabase.rpc('pp_get_dashboard_kpis', {
        p_organization_id: tenantId,
        p_start: start.toISOString(),
        p_end: end.toISOString(),
      });

      if (error) throw error;

      const payload = Array.isArray(data) ? data[0] : data;

      return (payload || {
        inventory: { totalProducts: 0, totalUnits: 0, maintenanceItems: 0 },
        jobs: { total: 0, deliveries: 0, pickups: 0, services: 0, surveys: 0 },
        customers: { total: 0, active: 0 },
        revenue: { total: 0 },
        fuel: { total: 0 },
      }) as DashboardKpis;
    },
    enabled: !!tenantId,
    staleTime: 30000,
  });


  // Get company timezone from shared hook
  const { data: timezone } = useCompanyTimezone();

  // Update time based on company timezone
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const tz = timezone || 'America/New_York';
      
      // Create time in company timezone
      const timeInTimezone = new Date(now.toLocaleString("en-US", { timeZone: tz }));
      setCurrentTime(timeInTimezone);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [timezone]);
  
  return (
    <div className="mx-auto w-full max-w-6xl px-3 sm:px-4 md:px-6 py-3 space-y-4 font-sans">
      {/* Hero Banner - Mobile Optimized */}
      <div className="bg-gradient-to-b from-[#F6F9FF] to-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 md:p-6 transition-all duration-300 hover:shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center md:justify-between gap-3 md:gap-4">
          {/* Welcome text - centered on mobile */}
          <div className="space-y-2 text-center md:text-left w-full md:w-auto">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 font-sans">
              Welcome back, {user?.firstName || 'User'}!
            </h1>
            <p className="text-base text-gray-600 font-sans">
              Here's what's happening with your rental business today.
            </p>
            {role && (
              <Badge className="bg-gradient-blue text-white font-bold text-xs">
                Role: {getRoleLabel(role)}
              </Badge>
            )}
          </div>
          
          {/* Digital Date and Time - centered on mobile */}
          <div className="text-center flex-shrink-0 order-first md:order-none">
            <div className="text-xl font-bold text-gray-900 font-sans">
              {currentTime.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
              })}
            </div>
            <div className="text-sm text-gray-600 font-sans">
              {currentTime.toLocaleDateString([], { 
                weekday: 'short',
                month: 'short', 
                day: 'numeric'
              })}
            </div>
          </div>
          
          {/* Analog Clock - smaller on mobile, hidden on very small screens */}
          <div className="hidden sm:flex flex-shrink-0">
            <MinimalClock 
              timeZone={timezone || 'America/New_York'}
              size={56}
              className="md:hidden"
            />
            <MinimalClock 
              timeZone={timezone || 'America/New_York'}
              size={80}
              className="hidden md:block"
            />
          </div>
        </div>
      </div>

      {/* Company Overview Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h2 className="text-base font-semibold text-gray-900 font-sans">Company Overview</h2>
          <p className="hidden sm:block text-sm text-gray-600 font-sans">Select any card to explore corresponding section</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
          <StatCard
            title="Total Inventory"
            value={`${kpis?.inventory.totalProducts || 0} products`}
            icon={Toilet}
            gradientFrom="#3b82f6"
            gradientTo="#2563eb"
            iconBg="#3b82f6"
            subtitle={`${kpis?.inventory.totalUnits || 0} total units, ${kpis?.inventory.maintenanceItems || 0} in maintenance`}
            subtitleColor="text-gray-600"
            delay={0}
            clickable
            onClick={() => navigate('/inventory')}
          />
          
          <StatCard
            title="Active Customers"
            value={kpis?.customers.active || 0}
            icon={Users}
            gradientFrom="#8b5cf6"
            gradientTo="#7c3aed"
            iconBg="#8b5cf6"
            subtitle={`${kpis?.customers.total || 0} total customers`}
            subtitleColor="text-gray-600"
            delay={100}
            clickable
            onClick={() => navigate('/customers')}
          />
          
          <StatCard
            title="Jobs Today"
            value={kpis?.jobs.total || 0}
            icon={Calendar}
            gradientFrom="#3b82f6"
            gradientTo="#2563eb"
            iconBg="#3b82f6"
            subtitle={
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>{kpis?.jobs.deliveries || 0} deliveries</span>
                  <span>{kpis?.jobs.pickups || 0} pickups</span>
                </div>
                <div className="flex justify-between">
                  <span>{kpis?.jobs.services || 0} services</span>
                  <span>{kpis?.jobs.surveys || 0} surveys</span>
                </div>
              </div>
            }
            subtitleColor="text-gray-600"
            delay={200}
            clickable
            onClick={() => navigate('/jobs')}
          />
          
          <StatCard
            title="Monthly Revenue"
            value={`$${(kpis?.revenue.total || 0).toLocaleString()}`}
            icon={DollarSign}
            gradientFrom="#22c55e"
            gradientTo="#16a34a"
            iconBg="#22c55e"
            subtitle="Last 30 days"
            subtitleColor="text-gray-600"
            delay={300}
            clickable
            onClick={() => navigate('/quotes-invoices')}
          />
          
          <StatCard
            title="Fleet Vehicles"
            value={kpis?.vehicles.total || 0}
            icon={Truck}
            gradientFrom="#6366f1"
            gradientTo="#4f46e5"
            iconBg="#6366f1"
            subtitle={`${kpis?.vehicles.active || 0} active, ${kpis?.vehicles.maintenance || 0} maintenance`}
            subtitleColor="text-gray-600"
            chart={<DonutChart active={kpis?.vehicles.active || 0} maintenance={kpis?.vehicles.maintenance || 0} />}
            delay={400}
            clickable
            onClick={() => navigate('/fleet')}
          />
          
          <StatCard
            title="Fuel Cost"
            value={`$${(kpis?.fuel.total || 0).toLocaleString()}`}
            icon={Fuel}
            gradientFrom="#eab308"
            gradientTo="#ca8a04"
            iconBg="#eab308"
            subtitle="Last 30 days fuel expenses"
            subtitleColor="text-gray-600"
            delay={500}
            clickable
            onClick={() => navigate('/fleet/fuel')}
          />
        </div>
      </div>

      {/* Alerts & Expiring Documents Section */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-gray-900 font-sans">Alerts & Expiring Documents</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
          <StatCard
            title="Vehicle Maintenance"
            value={kpis?.maintenance.count || 0}
            icon={Wrench}
            gradientFrom="#fb7c1f"
            gradientTo="#f97316"
            iconBg="#fb7c1f"
            subtitle="Due within 7 days"
            subtitleColor="text-red-600"
            delay={600}
            clickable
            onClick={() => navigate('/fleet/maintenance')}
          />
          
          <CompactConsumablesCard />
          
          <SpillKitExpirationsCard />
          
          {/* Document Cards */}
          <VehicleDocumentsCard />
          <DriverComplianceCard />
          <StaffCertificationsCard />
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
