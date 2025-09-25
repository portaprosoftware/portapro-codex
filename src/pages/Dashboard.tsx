import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { MinimalClock } from "@/components/ui/MinimalClock";
import { StatCard } from "@/components/ui/StatCard";
import { Sparkline } from "@/components/ui/Sparkline";
import { DonutChart } from "@/components/ui/DonutChart";
import { useNavigate } from "react-router-dom";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/badge";
import { VehicleDocumentsCard } from "@/components/dashboard/VehicleDocumentsCard";
import { DriverDocumentsCard } from "@/components/dashboard/DriverDocumentsCard";
import { DriverCredentialsCard } from "@/components/dashboard/DriverCredentialsCard";
import { StaffCertificationsCard } from "@/components/dashboard/StaffCertificationsCard";
import { CompactConsumablesCard } from "@/components/dashboard/CompactConsumablesCard";
import { 
  Package, 
  Users, 
  Calendar, 
  DollarSign, 
  Truck, 
  Fuel, 
  Wrench, 
  FileX 
} from "lucide-react";

const Dashboard = () => {
  const { role, user } = useUserRole();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Redirect drivers to the Driver app dashboard
  useEffect(() => {
    if (role === 'driver') {
      navigate('/driver', { replace: true });
    }
  }, [role, navigate]);
  
  // Mock data for sparkline (jobs over the past week)
  const jobsSparklineData = [2, 3, 1, 4, 2, 5, 3];

  // Fetch inventory data for total units card
  const { data: inventoryData } = useQuery({
    queryKey: ['dashboard-inventory'],
    queryFn: async () => {
      const [productsResult, itemsResult, maintenanceItemsResult] = await Promise.all([
        supabase.from('products').select('id, stock_total'),
        supabase.from('product_items').select('id'),
        supabase.from('product_items').select('id').eq('status', 'maintenance')
      ]);
      
      if (productsResult.error) throw productsResult.error;
      if (itemsResult.error) throw itemsResult.error;
      if (maintenanceItemsResult.error) throw maintenanceItemsResult.error;
      
      const totalProducts = productsResult.data?.length || 0;
      const totalUnits = productsResult.data?.reduce((sum, product) => sum + (product.stock_total || 0), 0) || 0;
      const maintenanceItems = maintenanceItemsResult.data?.length || 0;
      
      return { totalProducts, totalUnits, maintenanceItems };
    }
  });

  // Fetch jobs data for jobs today card
  const { data: jobsData } = useQuery({
    queryKey: ['dashboard-jobs-today'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('jobs')
        .select('job_type')
        .eq('scheduled_date', today);
      
      if (error) throw error;
      
      const jobsByType = data?.reduce((acc, job) => {
        acc[job.job_type] = (acc[job.job_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};
      
      return {
        total: data?.length || 0,
        deliveries: jobsByType.delivery || 0,
        pickups: jobsByType.pickup || 0,
        services: jobsByType.service || 0,
        partialPickups: jobsByType.partial_pickup || 0,
        surveys: jobsByType['on_site_survey'] || 0
      };
    }
  });

  // Fetch customers data
  const { data: customersData } = useQuery({
    queryKey: ['dashboard-customers'],
    queryFn: async () => {
      const { data, error, count } = await supabase
        .from('customers')
        .select('*', { count: 'exact' });
      
      if (error) throw error;
      
      // Calculate active customers (those with jobs in the last 60 days)
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
      
      const { data: activeCustomers, error: activeError } = await supabase
        .from('jobs')
        .select('customer_id')
        .gte('created_at', sixtyDaysAgo.toISOString());
      
      if (activeError) throw activeError;
      
      const uniqueActiveCustomers = new Set(activeCustomers?.map(job => job.customer_id));
      
      return {
        total: count || 0,
        active: uniqueActiveCustomers.size
      };
    }
  });

  // Fetch vehicles data
  const { data: vehiclesData } = useQuery({
    queryKey: ['dashboard-vehicles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, status');
      
      if (error) throw error;
      
      const total = data?.length || 0;
      const available = data?.filter(v => v.status === 'available').length || 0;
      const maintenance = data?.filter(v => v.status === 'maintenance').length || 0;
      
      return { total, available, maintenance };
    }
  });

  // Fetch revenue data (last 30 days)
  const { data: revenueData } = useQuery({
    queryKey: ['dashboard-revenue'],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data, error } = await supabase
        .from('invoices')
        .select('amount')
        .eq('status', 'paid')
        .gte('created_at', thirtyDaysAgo.toISOString());
      
      if (error) throw error;
      
      const total = data?.reduce((sum, invoice) => sum + (invoice.amount || 0), 0) || 0;
      return { total };
    }
  });

  // Fetch fuel costs (last 30 days)
  const { data: fuelData } = useQuery({
    queryKey: ['dashboard-fuel'],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data, error } = await supabase
        .from('fuel_logs')
        .select('total_cost')
        .gte('log_date', thirtyDaysAgo.toISOString().split('T')[0]);
      
      if (error) throw error;
      
      const total = data?.reduce((sum, log) => sum + (log.total_cost || 0), 0) || 0;
      return { total };
    }
  });

  // Fetch maintenance alerts
  const { data: maintenanceData } = useQuery({
    queryKey: ['dashboard-maintenance'],
    queryFn: async () => {
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      
      const { data, error } = await supabase
        .from('maintenance_records')
        .select('vehicle_id')
        .eq('status', 'scheduled')
        .lte('scheduled_date', sevenDaysFromNow.toISOString().split('T')[0]);
      
      if (error) throw error;
      
      return { count: data?.length || 0 };
    }
  });


  // Fetch company settings for timezone
  const { data: companySettings } = useQuery({
    queryKey: ['company-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_settings')
        .select('company_timezone')
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  // Update time based on company timezone
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timezone = companySettings?.company_timezone || 'America/New_York';
      
      // Create time in company timezone
      const timeInTimezone = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
      setCurrentTime(timeInTimezone);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [companySettings?.company_timezone]);
  
  return (
    <div className="p-4 space-y-4 font-sans">
      {/* Hero Banner - Compact */}
      <div className="bg-gradient-to-b from-[#F6F9FF] to-white rounded-xl shadow-sm border border-gray-200 p-4 transition-all duration-300 hover:shadow-md">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900 font-sans">
              Welcome back, {user?.firstName || 'User'}!
            </h1>
            <p className="text-base text-gray-600 font-sans">
              Here's what's happening with your rental business today.
            </p>
            {role && (
              <Badge className="bg-gradient-blue text-white font-bold text-xs">
                Role: {role === 'owner' ? 'Admin' : role.charAt(0).toUpperCase() + role.slice(1)}
              </Badge>
            )}
          </div>
          
          {/* Digital Date and Time - Center */}
          <div className="text-center flex-shrink-0">
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
          
          {/* Analog Clock - Right */}
          <div className="flex-shrink-0">
            <MinimalClock 
              timeZone={companySettings?.company_timezone || 'America/New_York'}
              size={80}
            />
          </div>
        </div>
      </div>

      {/* Company Overview Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900 font-sans">Company Overview</h2>
          <p className="text-sm text-gray-600 font-sans">Select any card to explore corresponding section</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3">
          <StatCard
            title="Total Inventory"
            value={`${inventoryData?.totalProducts || 0} products`}
            icon={Package}
            gradientFrom="#3b82f6"
            gradientTo="#2563eb"
            iconBg="#3b82f6"
            subtitle={`${inventoryData?.totalUnits || 0} total units, ${inventoryData?.maintenanceItems || 0} in maintenance`}
            subtitleColor="text-gray-600"
            delay={0}
            clickable
            onClick={() => navigate('/inventory')}
          />
          
          <StatCard
            title="Active Customers"
            value={customersData?.active || 0}
            icon={Users}
            gradientFrom="#8b5cf6"
            gradientTo="#7c3aed"
            iconBg="#8b5cf6"
            subtitle={`${customersData?.total || 0} total customers`}
            subtitleColor="text-gray-600"
            delay={100}
            clickable
            onClick={() => navigate('/customers')}
          />
          
          <StatCard
            title="Jobs Today"
            value={jobsData?.total || 0}
            icon={Calendar}
            gradientFrom="#3b82f6"
            gradientTo="#2563eb"
            iconBg="#3b82f6"
            subtitle={
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>{jobsData?.deliveries || 0} deliveries</span>
                  <span>{jobsData?.pickups || 0} pickups</span>
                </div>
                <div className="flex justify-between">
                  <span>{jobsData?.services || 0} services</span>
                  <span>{jobsData?.surveys || 0} surveys</span>
                </div>
                <div>{jobsData?.partialPickups || 0} partial pickups</div>
              </div>
            }
            subtitleColor="text-gray-600"
            delay={200}
            clickable
            onClick={() => navigate('/jobs')}
          />
          
          <StatCard
            title="Monthly Revenue"
            value={`$${(revenueData?.total || 0).toLocaleString()}`}
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
            value={vehiclesData?.total || 0}
            icon={Truck}
            gradientFrom="#6366f1"
            gradientTo="#4f46e5"
            iconBg="#6366f1"
            subtitle={`${vehiclesData?.available || 0} available, ${vehiclesData?.maintenance || 0} maintenance`}
            subtitleColor="text-gray-600"
            chart={<DonutChart active={vehiclesData?.available || 0} maintenance={vehiclesData?.maintenance || 0} />}
            delay={400}
            clickable
            onClick={() => navigate('/fleet')}
          />
          
          <StatCard
            title="Fuel Cost"
            value={`$${(fuelData?.total || 0).toLocaleString()}`}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3">
          <StatCard
            title="Maintenance Alerts"
            value={maintenanceData?.count || 0}
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
          
          {/* Document Cards */}
          <VehicleDocumentsCard />
          <DriverDocumentsCard />
          <DriverCredentialsCard />
          <StaffCertificationsCard />
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
