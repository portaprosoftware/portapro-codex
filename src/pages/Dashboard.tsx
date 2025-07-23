
import React from "react";
import { Clock } from "@/components/ui/Clock";
import { StatCard } from "@/components/ui/StatCard";
import { Sparkline } from "@/components/ui/Sparkline";
import { DonutChart } from "@/components/ui/DonutChart";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/badge";
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
  // Mock data for sparkline (jobs over the past week)
  const jobsSparklineData = [2, 3, 1, 4, 2, 5, 3];
  
  return (
    <div className="space-y-8 font-sans">
      {/* Hero Banner */}
      <div className="bg-gradient-to-b from-[#F6F9FF] to-white rounded-xl shadow-sm border border-gray-200 p-8 transition-all duration-300 hover:shadow-md">
        <div className="flex items-center justify-between">
          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-gray-900 font-sans">
              Welcome back, Tyler!
            </h1>
            <p className="text-lg text-gray-600 font-sans">
              Here's what's happening with your rental business today.
            </p>
            <Badge variant="secondary" className="bg-gradient-to-r from-[#2F4F9A] to-[#1E3A8A] text-white hover:from-[#1E3A8A] hover:to-[#2F4F9A] font-sans font-medium">
              Role: Admin
            </Badge>
          </div>
          
          <div className="flex-shrink-0">
            <Clock />
          </div>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Row 1 */}
        <StatCard
          title="Total Units"
          value={10}
          icon={Package}
          gradientFrom="#3366FF"
          gradientTo="#6699FF"
          iconBg="#3366FF"
          delay={0}
        />
        
        <StatCard
          title="Active Customers"
          value={8}
          icon={Users}
          gradientFrom="#9B51E0"
          gradientTo="#BB66E0"
          iconBg="#9B51E0"
          delay={100}
        />
        
        <StatCard
          title="Jobs Today"
          value={3}
          icon={Calendar}
          gradientFrom="#3366FF"
          gradientTo="#6699FF"
          iconBg="#3366FF"
          chart={<Sparkline data={jobsSparklineData} color="#3366FF" />}
          delay={200}
        />
        
        <StatCard
          title="Monthly Revenue"
          value="$8,400"
          icon={DollarSign}
          gradientFrom="#33CC66"
          gradientTo="#66DD88"
          iconBg="#33CC66"
          delay={300}
        />
        
        {/* Row 2 */}
        <StatCard
          title="Fleet Vehicles"
          value={8}
          icon={Truck}
          gradientFrom="#6666FF"
          gradientTo="#8888FF"
          iconBg="#6666FF"
          subtitle="7 active, 1 maintenance"
          subtitleColor="text-gray-600"
          chart={<DonutChart active={7} maintenance={1} />}
          delay={400}
        />
        
        <StatCard
          title="Fuel Cost"
          value="$1,245"
          icon={Fuel}
          gradientFrom="#FFAA33"
          gradientTo="#FFCC55"
          iconBg="#FFAA33"
          delay={500}
        />
        
        <StatCard
          title="Maintenance Alerts"
          value={2}
          icon={AlertTriangle}
          gradientFrom="#FF4444"
          gradientTo="#FF6666"
          iconBg="#FF4444"
          subtitle="Due within 7 days"
          subtitleColor="text-red-600"
          delay={600}
        />
        
        <StatCard
          title="Expiring Documents"
          value={4}
          icon={FileX}
          gradientFrom="#FF8822"
          gradientTo="#FFA044"
          iconBg="#FF8822"
          chart={<ProgressBar overdue={1} expiring={3} total={4} />}
          delay={700}
        />
      </div>
    </div>
  );
};

export default Dashboard;
