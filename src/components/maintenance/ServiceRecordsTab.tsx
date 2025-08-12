import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatCard } from "@/components/ui/StatCard";
import { Search, FileText, Clock, CheckCircle, AlertTriangle, Download, Eye } from "lucide-react";
import { toast } from "sonner";

interface ServiceRecord {
  id: string;
  report_number: string;
  created_at: string;
  report_data: any;
  status: string;
  completion_percentage: number;
  assigned_technician: string;
  actual_completion: string;
  auto_generated?: boolean;
  jobs?: {
    job_number: string;
    job_type: string;
    customers: {
      name: string;
    };
  };
  maintenance_report_templates?: {
    name: string;
    template_type: string;
  };
  services?: {
    name: string;
    category: string;
  };
}

export const ServiceRecordsTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: serviceRecords, isLoading } = useQuery({
    queryKey: ['service-records'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maintenance_reports')
        .select(`
          *,
          jobs!fk_maintenance_reports_job (
            job_number,
            job_type,
            customers (
              name
            )
          ),
          maintenance_report_templates (
            name,
            template_type
          ),
          services (
            name,
            category
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ServiceRecord[];
    }
  });

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-gradient-to-r from-green-500 to-green-600 text-white font-bold border-0";
      case "in_progress":
        return "bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold border-0";
      case "open":
      case "scheduled":
        return "bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold border-0";
      case "overdue":
        return "bg-gradient-to-r from-red-500 to-red-600 text-white font-bold border-0";
      default:
        return "bg-gradient-to-r from-gray-500 to-gray-600 text-white font-bold border-0";
    }
  };

  const getSourceLabel = (record: ServiceRecord) => {
    if (record.jobs?.job_number) {
      return `Job ${record.jobs.job_number}`;
    }
    return 'Manual Entry';
  };

  const getRecordCounts = () => {
    if (!serviceRecords) return { total: 0, completed: 0, inProgress: 0, manual: 0 };
    
    return {
      total: serviceRecords.length,
      completed: serviceRecords.filter(r => r.status === "completed").length,
      inProgress: serviceRecords.filter(r => r.status === "in_progress").length,
      manual: serviceRecords.filter(r => !r.jobs?.job_number).length,
    };
  };

  const counts = getRecordCounts();

  const filteredRecords = serviceRecords?.filter(record => {
    const matchesSearch = 
      record.report_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.jobs?.customers?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.jobs?.job_number?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesService = serviceFilter === "all" || 
      record.maintenance_report_templates?.template_type === serviceFilter;

    const matchesSource = sourceFilter === "all" || 
      (sourceFilter === "job" && record.jobs?.job_number) ||
      (sourceFilter === "manual" && !record.jobs?.job_number);

    const matchesStatus = statusFilter === "all" || record.status === statusFilter;

    return matchesSearch && matchesService && matchesSource && matchesStatus;
  }) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Service Records</h2>
          <p className="text-gray-600">Service records appear after jobs or work orders are completed using a service</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Records"
          value={counts.total}
          icon={FileText}
          gradientFrom="#3366FF"
          gradientTo="#6699FF"
          iconBg="#3366FF"
          subtitleColor="text-blue-600"
        />
        
        <StatCard
          title="Completed"
          value={counts.completed}
          icon={CheckCircle}
          gradientFrom="#10B981"
          gradientTo="#34D399"
          iconBg="#10B981"
          subtitleColor="text-green-600"
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
          title="Manual Entries"
          value={counts.manual}
          icon={AlertTriangle}
          gradientFrom="#F59E0B"
          gradientTo="#FBBF24"
          iconBg="#F59E0B"
          subtitleColor="text-amber-600"
        />
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by record #, customer, or job #..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Select value={serviceFilter} onValueChange={setServiceFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by service" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              <SelectItem value="cleaning">Cleaning</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="inspection">Inspection</SelectItem>
              <SelectItem value="repair">Repair</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="job">From Jobs</SelectItem>
              <SelectItem value="manual">Manual Entry</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="open">Open</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Records Table */}
      {filteredRecords.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="max-w-md mx-auto">
            <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No service records found</h3>
            <p className="text-gray-600">
              {searchTerm || serviceFilter !== "all" || sourceFilter !== "all" || statusFilter !== "all"
                ? "Try adjusting your search or filter criteria."
                : "Service records appear after jobs or work orders are completed using a service."}
            </p>
          </div>
        </Card>
      ) : (
        <Card className="rounded-2xl shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Record #</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Service</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Customer</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Source</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRecords.map((record, index) => (
                  <tr 
                    key={record.id} 
                    className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {record.report_number || `SVC-${record.id.slice(0, 8)}`}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(record.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {record.services?.name || record.maintenance_report_templates?.template_type || 'General Service'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {record.jobs?.customers?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <span>{getSourceLabel(record)}</span>
                        {record.auto_generated && (
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                            Auto
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={`capitalize ${getStatusColor(record.status)}`}>
                        {record.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-blue-600 hover:text-blue-700"
                          onClick={async () => {
                            try {
                              const { data, error } = await supabase.functions.invoke('generate-service-pdf', {
                                body: { reportId: record.id }
                              });
                              if (error) throw error;
                              
                              const blob = new Blob([data], { type: 'application/pdf' });
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `service-report-${record.report_number || record.id}.pdf`;
                              a.click();
                              window.URL.revokeObjectURL(url);
                              toast.success("PDF downloaded successfully");
                            } catch (error) {
                              toast.error("Failed to generate PDF");
                              console.error(error);
                            }
                          }}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};