import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/StatCard";
import { Calendar, Clock, CheckCircle, AlertTriangle, Users, Plus } from "lucide-react";

interface OverviewTabProps {
  onScheduleService: () => void;
  onLogPastService: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  onScheduleService,
  onLogPastService,
}) => {
  const { data: serviceStats, isLoading } = useQuery({
    queryKey: ['service-overview-stats'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      // Get job counts by status
      const { data: jobData } = await supabase
        .from('jobs')
        .select('scheduled_date, status, job_type')
        .gte('scheduled_date', today);

      // Get completed service records for YTD
      const { data: completedRecords } = await supabase
        .from('maintenance_reports')
        .select('created_at, status')
        .eq('status', 'completed')
        .gte('created_at', new Date().getFullYear() + '-01-01');

      const servicesToday = jobData?.filter(job => 
        job.scheduled_date === today && 
        ['service', 'cleaning'].includes(job.job_type)
      ).length || 0;

      const overdueJobs = jobData?.filter(job => 
        job.scheduled_date < today && 
        job.status !== 'completed'
      ).length || 0;

      const thisWeekJobs = jobData?.filter(job => {
        const jobDate = new Date(job.scheduled_date);
        return jobDate >= weekStart && jobDate <= weekEnd;
      }).length || 0;

      const completedYTD = completedRecords?.length || 0;

      return {
        servicesToday,
        overdueJobs,
        thisWeekJobs,
        completedYTD,
        avgDuration: 45 // Mock average duration in minutes
      };
    }
  });

  const { data: recentRecords } = useQuery({
    queryKey: ['recent-service-records'],
    queryFn: async () => {
      const { data } = await supabase
        .from('maintenance_reports')
        .select(`
          *,
          jobs!fk_maintenance_reports_job (
            job_number,
            customers (name)
          )
        `)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(5);

      return data || [];
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Due Today"
          value={serviceStats?.servicesToday || 0}
          icon={Calendar}
          gradientFrom="#3366FF"
          gradientTo="#6699FF"
          iconBg="#3366FF"
          subtitleColor="text-blue-600"
        />
        
        <StatCard
          title="Overdue"
          value={serviceStats?.overdueJobs || 0}
          icon={AlertTriangle}
          gradientFrom="#FF4444"
          gradientTo="#FF6666"
          iconBg="#FF4444"
          subtitleColor="text-red-600"
        />
        
        <StatCard
          title="This Week"
          value={serviceStats?.thisWeekJobs || 0}
          icon={Clock}
          gradientFrom="#8B5CF6"
          gradientTo="#A78BFA"
          iconBg="#8B5CF6"
          subtitleColor="text-purple-600"
        />
        
        <StatCard
          title="Completed YTD"
          value={serviceStats?.completedYTD || 0}
          icon={CheckCircle}
          gradientFrom="#10B981"
          gradientTo="#34D399"
          iconBg="#10B981"
          subtitleColor="text-green-600"
        />
        
        <StatCard
          title="Avg Duration"
          value={`${serviceStats?.avgDuration || 0}m`}
          icon={Users}
          gradientFrom="#F59E0B"
          gradientTo="#FBBF24"
          iconBg="#F59E0B"
          subtitleColor="text-amber-600"
        />
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-4">
          <Button
            onClick={onScheduleService}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Schedule Service
          </Button>
          <Button
            variant="outline"
            onClick={onLogPastService}
            className="border-blue-500 text-blue-600 hover:bg-blue-50"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Log Past Service
          </Button>
        </div>
      </Card>

      {/* Recent Service Records */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recently Completed</h3>
          <Button variant="outline" size="sm">View All Records</Button>
        </div>
        
        {recentRecords && recentRecords.length > 0 ? (
          <div className="space-y-3">
            {recentRecords.map((record) => (
              <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">
                    {record.report_number || `SVC-${record.id.slice(0, 8)}`}
                  </p>
                  <p className="text-sm text-gray-600">
                    {(record as any).jobs?.customers?.name || 'Customer'} • 
                    {new Date(record.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  View Report
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No completed service records yet</p>
            <p className="text-sm">Records will appear here when services are completed</p>
          </div>
        )}
      </Card>
    </div>
  );
};