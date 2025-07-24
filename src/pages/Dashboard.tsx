
import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { MinimalClock } from "@/components/ui/MinimalClock";
import { StatCard } from "@/components/ui/StatCard";
import { Sparkline } from "@/components/ui/Sparkline";
import { DonutChart } from "@/components/ui/DonutChart";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/badge";
import { LowStockWidget } from "@/components/dashboard/LowStockWidget";
import { 
  Package, 
  Users, 
  Calendar, 
  DollarSign, 
  Truck, 
  Fuel, 
  AlertTriangle, 
  FileX 
} from "lucide-react";

const Dashboard = () => {
  const { role, user } = useUserRole();
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Mock data for sparkline (jobs over the past week)
  const jobsSparklineData = [2, 3, 1, 4, 2, 5, 3];

  // Fetch inventory data for total units card
  const { data: inventoryData } = useQuery({
    queryKey: ['dashboard-inventory'],
    queryFn: async () => {
      const [productsResult, itemsResult] = await Promise.all([
        supabase.from('products').select('id, stock_total'),
        supabase.from('product_items').select('id')
      ]);
      
      if (productsResult.error) throw productsResult.error;
      if (itemsResult.error) throw itemsResult.error;
      
      const totalProducts = productsResult.data?.length || 0;
      const totalUnits = productsResult.data?.reduce((sum, product) => sum + (product.stock_total || 0), 0) || 0;
      
      return { totalProducts, totalUnits };
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
        returns: jobsByType.return || 0,
        pickups: jobsByType.pickup || 0,
        services: jobsByType.service || 0
      };
    }
  });

  // Fetch expiring documents data
  const { data: documentsData } = useQuery({
    queryKey: ['dashboard-expiring-docs'],
    queryFn: async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      
      const { data, error } = await supabase
        .from('vehicle_compliance_documents')
        .select('vehicle_id, expiration_date')
        .lte('expiration_date', futureDate.toISOString().split('T')[0]);
      
      if (error) throw error;
      
      const uniqueVehicles = new Set(data?.map(doc => doc.vehicle_id));
      
      return {
        affectedVehicles: uniqueVehicles.size,
        totalDocuments: data?.length || 0
      };
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
    <div className="p-6 space-y-8 font-sans">
      {/* Hero Banner */}
      <div className="bg-gradient-to-b from-[#F6F9FF] to-white rounded-xl shadow-sm border border-gray-200 p-8 transition-all duration-300 hover:shadow-md">
        <div className="flex items-center justify-between">
          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-gray-900 font-sans">
              Welcome back, {user?.firstName || 'User'}!
            </h1>
            <p className="text-lg text-gray-600 font-sans">
              Here's what's happening with your rental business today.
            </p>
            {role && (
              <Badge className="bg-gradient-blue text-white font-bold">
                Role: {role.charAt(0).toUpperCase() + role.slice(1)}
              </Badge>
            )}
          </div>
          
          {/* Digital Date and Time - Center */}
          <div className="text-center flex-shrink-0">
            <div className="text-2xl font-bold text-gray-900 font-sans">
              {currentTime.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
              })}
            </div>
            <div className="text-base text-gray-600 font-sans">
              {currentTime.toLocaleDateString([], { 
                weekday: 'long',
                month: 'long', 
                day: 'numeric',
                year: 'numeric'
              })}
            </div>
          </div>
          
          {/* Analog Clock - Right */}
          <div className="flex-shrink-0">
            <MinimalClock 
              timeZone={companySettings?.company_timezone || 'America/New_York'}
              size={120}
            />
          </div>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Row 1 */}
        <StatCard
          title="Total Inventory"
          value={`${inventoryData?.totalProducts || 0} products`}
          icon={Package}
          gradientFrom="#3b82f6"
          gradientTo="#2563eb"
          iconBg="#3b82f6"
          subtitle={`${inventoryData?.totalUnits || 0} total units`}
          subtitleColor="text-gray-600"
          delay={0}
        />
        
        <StatCard
          title="Active Customers"
          value={8}
          icon={Users}
          gradientFrom="#8b5cf6"
          gradientTo="#7c3aed"
          iconBg="#8b5cf6"
          delay={100}
        />
        
        <StatCard
          title="Jobs Today"
          value={jobsData?.total || 0}
          icon={Calendar}
          gradientFrom="#3b82f6"
          gradientTo="#2563eb"
          iconBg="#3b82f6"
          subtitle={`${jobsData?.deliveries || 0} deliveries, ${jobsData?.returns || 0} returns, ${jobsData?.pickups || 0} pickups, ${jobsData?.services || 0} services`}
          subtitleColor="text-gray-600"
          chart={<Sparkline data={jobsSparklineData} color="#3b82f6" />}
          delay={200}
        />
        
        <StatCard
          title="Monthly Revenue"
          value="$8,400"
          icon={DollarSign}
          gradientFrom="#22c55e"
          gradientTo="#16a34a"
          iconBg="#22c55e"
          delay={300}
        />
        
        {/* Row 2 */}
        <StatCard
          title="Fleet Vehicles"
          value={8}
          icon={Truck}
          gradientFrom="#6366f1"
          gradientTo="#4f46e5"
          iconBg="#6366f1"
          subtitle="7 active, 1 maintenance"
          subtitleColor="text-gray-600"
          chart={<DonutChart active={7} maintenance={1} />}
          delay={400}
        />
        
        <StatCard
          title="Fuel Cost"
          value="$1,245"
          icon={Fuel}
          gradientFrom="#f97316"
          gradientTo="#ea580c"
          iconBg="#f97316"
          subtitle="Month to date fuel expenses"
          subtitleColor="text-gray-600"
          delay={500}
        />
        
        <StatCard
          title="Maintenance Alerts"
          value={2}
          icon={AlertTriangle}
          gradientFrom="#ef4444"
          gradientTo="#dc2626"
          iconBg="#ef4444"
          subtitle="Due within 7 days"
          subtitleColor="text-red-600"
          delay={600}
        />
        
        <StatCard
          title="Expiring Documents"
          value={documentsData?.affectedVehicles || 0}
          icon={FileX}
          gradientFrom="#f97316"
          gradientTo="#ea580c"
          iconBg="#f97316"
          subtitle={`${documentsData?.totalDocuments || 0} documents (30 days)`}
          subtitleColor="text-orange-600"
          chart={<ProgressBar overdue={1} expiring={3} total={4} />}
          delay={700}
        />
      </div>

      {/* Additional Dashboard Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Future: Additional widgets can go here */}
        </div>
        <div>
          <LowStockWidget />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
