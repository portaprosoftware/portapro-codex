
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatCard } from "@/components/ui/StatCard";
import { ReportDetailsPanel } from "./ReportDetailsPanel";
import { Calendar, Search, FileText, Clock, CheckCircle, AlertTriangle } from "lucide-react";

interface MaintenanceReport {
  id: string;
  report_number: string;
  created_at: string;
  report_data: any;
  status: string;
  completion_percentage: number;
  assigned_technician: string;
  actual_completion: string;
}

export const MaintenanceReportsTab: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: reports, isLoading } = useQuery({
    queryKey: ["maintenance-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance_reports")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "open":
      case "scheduled":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "overdue":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getReportCounts = () => {
    if (!reports) return { total: 0, open: 0, inProgress: 0, completed: 0 };
    
    return {
      total: reports.length,
      open: reports.filter(r => r.status === "open" || r.status === "scheduled").length,
      inProgress: reports.filter(r => r.status === "in_progress").length,
      completed: reports.filter(r => r.status === "completed").length,
    };
  };

  const counts = getReportCounts();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Date Range:</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">Last 7 Days</Button>
              <Button variant="outline" size="sm">This Month</Button>
            </div>
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Reports"
          value={counts.total}
          icon={FileText}
          gradientFrom="#3366FF"
          gradientTo="#6699FF"
          iconBg="#3366FF"
          subtitleColor="text-blue-600"
        />
        
        <StatCard
          title="Open"
          value={counts.open}
          icon={AlertTriangle}
          gradientFrom="#FF9933"
          gradientTo="#FFB366"
          iconBg="#FF9933"
          subtitleColor="text-orange-600"
        />
        
        <StatCard
          title="In Progress"
          value={counts.inProgress}
          icon={Clock}
          gradientFrom="#8B5CF6"
          gradientTo="#A78BFA"
          iconBg="#8B5CF6"
          subtitleColor="text-purple-600"
        />
        
        <StatCard
          title="Completed"
          value={counts.completed}
          icon={CheckCircle}
          gradientFrom="#33CC66"
          gradientTo="#66D999"
          iconBg="#33CC66"
          subtitleColor="text-green-600"
        />
      </div>

      {/* Reports Table */}
      <Card className="rounded-2xl shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Report #</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Date</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Vehicle/Unit</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Service Type</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Status</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Progress</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reports?.map((report, index) => (
                <tr 
                  key={report.id} 
                  className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}
                >
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {report.report_number || `RPT-${report.id.slice(0, 8)}`}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(report.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {report.report_data?.vehicle_info || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {report.report_data?.service_type || 'General Maintenance'}
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={`capitalize ${getStatusColor(report.status)}`}>
                      {report.status.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-16 h-2 bg-gray-200 rounded-full mr-2">
                        <div 
                          className="h-full bg-blue-600 rounded-full" 
                          style={{ width: `${report.completion_percentage || 0}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-600">{report.completion_percentage || 0}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedReport(report.id)}
                    >
                      View/Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Report Details Panel */}
      <ReportDetailsPanel
        reportId={selectedReport}
        isOpen={!!selectedReport}
        onClose={() => setSelectedReport(null)}
      />
    </div>
  );
};
