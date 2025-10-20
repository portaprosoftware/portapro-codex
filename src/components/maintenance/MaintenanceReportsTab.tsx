
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
import { BulkActionsModal } from "./BulkActionsModal";
import { AdvancedAnalyticsWidget } from "./AdvancedAnalyticsWidget";
import { CustomDateRangeModal } from "./CustomDateRangeModal";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Calendar, Search, FileText, Clock, CheckCircle, AlertTriangle, Grid, List, Download, ChevronDown, MoreHorizontal, Filter, X, Share2, Eye, Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

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
  const [viewMode, setViewMode] = useState<"table" | "cards">(
    typeof window !== 'undefined' && window.innerWidth < 1024 ? "cards" : "table"
  );
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showCustomDateRange, setShowCustomDateRange] = useState(false);
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [jobTypeFilter, setJobTypeFilter] = useState<string>("all");
  const [templateFilter, setTemplateFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date_desc");

  const { data: maintenanceReports, isLoading, refetch } = useQuery({
    queryKey: ['maintenance-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maintenance_reports')
        .select(`
          *,
          jobs!fk_maintenance_reports_job (
            job_number,
            job_type,
            scheduled_date,
            customers (
              name
            )
          ),
          maintenance_report_templates (
            name,
            template_type
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as MaintenanceReport[];
    }
  });

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "open":
      case "scheduled":
        return "bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold border-0";
      case "in_progress":
        return "bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold border-0";
      case "completed":
        return "bg-gradient-to-r from-green-500 to-green-600 text-white font-bold border-0";
      case "overdue":
        return "bg-gradient-to-r from-red-500 to-red-600 text-white font-bold border-0";
      case "draft":
        return "bg-gradient-to-r from-gray-500 to-gray-600 text-white font-bold border-0";
      default:
        return "bg-gradient-to-r from-gray-500 to-gray-600 text-white font-bold border-0";
    }
  };

  const getReportCounts = () => {
    if (!maintenanceReports) return { total: 0, open: 0, inProgress: 0, completed: 0 };
    
    return {
      total: maintenanceReports.length,
      open: maintenanceReports.filter(r => r.status === "open" || r.status === "scheduled").length,
      inProgress: maintenanceReports.filter(r => r.status === "in_progress").length,
      completed: maintenanceReports.filter(r => r.status === "completed").length,
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
    <div className="space-y-4 px-4 md:px-0 overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Service Records</h2>
          <p className="text-sm text-gray-600">View and manage all service activity reports</p>
        </div>
        
        {/* Mobile: View Toggle + Bulk Select */}
        <div className="lg:hidden flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="flex bg-gray-100 rounded-lg p-1 flex-1">
              <Button
                variant={viewMode === "table" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("table")}
                className="flex-1 min-h-[44px]"
              >
                <List className="w-4 h-4 mr-2" />
                List
              </Button>
              <Button
                variant={viewMode === "cards" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("cards")}
                className="flex-1 min-h-[44px]"
              >
                <Grid className="w-4 h-4 mr-2" />
                Grid
              </Button>
            </div>
            
            {selectedRecords.length > 0 && (
              <Button
                onClick={() => setShowBulkActions(true)}
                className="bg-gradient-to-r from-orange-600 to-orange-700 text-white font-bold min-h-[44px]"
              >
                Actions ({selectedRecords.length})
              </Button>
            )}
          </div>
          
          <Button
            variant="outline"
            onClick={() => setShowAnalytics(!showAnalytics)}
            className="w-full min-h-[44px] border-purple-500 text-purple-600 hover:bg-purple-50"
          >
            {showAnalytics ? 'Hide' : 'Show'} Analytics
          </Button>
        </div>

        {/* Desktop: View Toggle + Actions */}
        <div className="hidden lg:flex justify-between items-center">
          <div className="flex items-center gap-2">
            {selectedRecords.length > 0 && (
              <Button
                onClick={() => setShowBulkActions(true)}
                className="bg-gradient-to-r from-orange-600 to-orange-700 text-white font-bold"
              >
                Bulk Actions ({selectedRecords.length})
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="border-purple-500 text-purple-600 hover:bg-purple-50"
            >
              {showAnalytics ? 'Hide' : 'Show'} Analytics
            </Button>
          </div>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
              className="px-3"
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "cards" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("cards")}
              className="px-3"
            >
              <Grid className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Advanced Analytics */}
      {showAnalytics && (
        <div className="bg-white border rounded-lg p-6">
          <AdvancedAnalyticsWidget />
        </div>
      )}

      {/* Mobile Filter Sheet */}
      <div className="lg:hidden">
        <Sheet open={showFilters} onOpenChange={setShowFilters}>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full min-h-[44px] justify-between">
              <span className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filters
                {(searchTerm || statusFilter !== "all" || jobTypeFilter !== "all" || templateFilter !== "all") && (
                  <Badge className="bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold border-0">
                    Active
                  </Badge>
                )}
              </span>
              <ChevronDown className="w-4 h-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[95vh] rounded-t-2xl">
            <SheetHeader>
              <SheetTitle>Filters & Sort</SheetTitle>
            </SheetHeader>
            <div className="space-y-4 mt-6 overflow-y-auto max-h-[calc(95vh-120px)]">
              {/* Search */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search records..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-10 min-h-[44px]"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  )}
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="min-h-[44px]">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Job Type Filter */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Job Type</label>
                <Select value={jobTypeFilter} onValueChange={setJobTypeFilter}>
                  <SelectTrigger className="min-h-[44px]">
                    <SelectValue placeholder="All Job Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Job Types</SelectItem>
                    <SelectItem value="delivery">Delivery</SelectItem>
                    <SelectItem value="pickup">Pickup</SelectItem>
                    <SelectItem value="service">Service</SelectItem>
                    <SelectItem value="return">Return</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Template Type Filter */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Template Type</label>
                <Select value={templateFilter} onValueChange={setTemplateFilter}>
                  <SelectTrigger className="min-h-[44px]">
                    <SelectValue placeholder="All Templates" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Templates</SelectItem>
                    <SelectItem value="cleaning">Cleaning</SelectItem>
                    <SelectItem value="inspection">Inspection</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="repair">Repair</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Sort By</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="min-h-[44px]">
                    <SelectValue placeholder="Sort by..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date_desc">Date (Newest First)</SelectItem>
                    <SelectItem value="date_asc">Date (Oldest First)</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                    <SelectItem value="customer">Customer A-Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Date Range</label>
                <div className="flex flex-col gap-2">
                  <Button variant="outline" className="min-h-[44px] justify-start">Last 7 Days</Button>
                  <Button variant="outline" className="min-h-[44px] justify-start">This Month</Button>
                  <Button 
                    variant="outline" 
                    className="min-h-[44px] justify-start"
                    onClick={() => {
                      setShowCustomDateRange(true);
                      setShowFilters(false);
                    }}
                  >
                    Custom Range
                    {dateRange && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {format(dateRange.start, "MMM d")} - {format(dateRange.end, "MMM d")}
                      </span>
                    )}
                  </Button>
                </div>
              </div>

              {/* Clear Filters */}
              <Button
                variant="outline"
                className="w-full min-h-[44px] border-red-500 text-red-600 hover:bg-red-50"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setJobTypeFilter("all");
                  setTemplateFilter("all");
                  setSortBy("date_desc");
                  setDateRange(null);
                }}
              >
                Clear All Filters
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Filter Bar */}
      <Card className="p-4 hidden lg:block">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Date Range:</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">Last 7 Days</Button>
              <Button variant="outline" size="sm">This Month</Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowCustomDateRange(true)}
              >
                Custom
                {dateRange && (
                  <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    {format(dateRange.start, "MMM d")} - {format(dateRange.end, "MMM d")}
                  </span>
                )}
              </Button>
            </div>
          </div>
          
          <Select value={jobTypeFilter} onValueChange={setJobTypeFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by job type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Job Types</SelectItem>
              <SelectItem value="delivery">Delivery</SelectItem>
              <SelectItem value="pickup">Pickup</SelectItem>
              <SelectItem value="service">Service</SelectItem>
              <SelectItem value="return">Return</SelectItem>
            </SelectContent>
          </Select>

          <Select value={templateFilter} onValueChange={setTemplateFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by template" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Templates</SelectItem>
              <SelectItem value="cleaning">Cleaning</SelectItem>
              <SelectItem value="inspection">Inspection</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="repair">Repair</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by report #, customer, job #, or template..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => toast.success('CSV export started')}>
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.success('PDF export started')}>
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.success('Excel export started')}>
                Export as Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Card>

      {/* KPI Cards - Mobile 2-col, Desktop 4-col */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
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

      {/* Records Display */}
      {viewMode === "table" ? (
        <Card className="rounded-2xl shadow-md hidden lg:block">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                    <Checkbox
                      checked={selectedRecords.length === (maintenanceReports?.length || 0) && maintenanceReports?.length > 0}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedRecords(maintenanceReports?.map(r => r.id) || []);
                        } else {
                          setSelectedRecords([]);
                        }
                      }}
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Service Record #</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Job #</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Customer</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Template Type</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Progress</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {maintenanceReports?.map((report, index) => {
                  const reportData = report.report_data as Record<string, any> || {};
                  return (
                    <tr 
                      key={report.id} 
                      className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'} ${
                        selectedRecords.includes(report.id) ? 'bg-blue-50' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <Checkbox
                          checked={selectedRecords.includes(report.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedRecords(prev => [...prev, report.id]);
                            } else {
                              setSelectedRecords(prev => prev.filter(id => id !== report.id));
                            }
                          }}
                        />
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {report.report_number || `SVC-${report.id.slice(0, 8)}`}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(report.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {(report as any).jobs?.job_number || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {(report as any).jobs?.customers?.name || reportData.customer_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {(report as any).maintenance_report_templates?.template_type || reportData.service_type || 'General Service'}
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
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedReport(report.id)}
                          >
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-blue-600 hover:text-blue-700"
                            onClick={async () => {
                              try {
                                const { data, error } = await supabase.functions.invoke('generate-service-pdf', {
                                  body: { reportId: report.id }
                                });
                                if (error) throw error;
                                
                                const blob = new Blob([data], { type: 'application/pdf' });
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `service-report-${report.report_number || report.id}.pdf`;
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
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}

      {/* Mobile Card View - Always show on mobile */}
      <div className={cn(
        "grid gap-4",
        viewMode === "cards" ? "grid-cols-1 sm:grid-cols-2" : "lg:hidden"
      )}>
        {maintenanceReports?.map((report) => {
            const reportData = report.report_data as Record<string, any> || {};
            const [actionSheetOpen, setActionSheetOpen] = useState(false);
            
            return (
              <Card key={report.id} className="rounded-2xl shadow-md hover:shadow-lg transition-shadow min-h-[88px]">
                {/* Mobile Checkbox */}
                <div className="p-4 lg:hidden">
                  <div className="flex items-start gap-3 mb-4">
                    <Checkbox
                      checked={selectedRecords.includes(report.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedRecords(prev => [...prev, report.id]);
                        } else {
                          setSelectedRecords(prev => prev.filter(id => id !== report.id));
                        }
                      }}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 truncate">
                            {report.report_number || `SVC-${report.id.slice(0, 8)}`}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {(report as any).jobs?.customers?.name || reportData.customer_name || 'N/A'}
                          </p>
                        </div>
                        <Badge className={`capitalize ${getStatusColor(report.status)} shrink-0`}>
                          {report.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1 mb-3">
                        <p className="text-sm text-gray-600">
                          Completed {new Date(report.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-600">
                          By {report.assigned_technician || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {(report as any).maintenance_report_templates?.template_type || reportData.service_type || 'General Service'}
                        </p>
                      </div>

                      {/* Progress Bar */}
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-600 to-blue-700 rounded-full" 
                            style={{ width: `${report.completion_percentage || 0}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-medium text-gray-600">{report.completion_percentage || 0}%</span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 min-h-[44px]"
                          onClick={() => setSelectedReport(report.id)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Preview
                        </Button>
                        
                        <Sheet open={actionSheetOpen} onOpenChange={setActionSheetOpen}>
                          <SheetTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="min-h-[44px] px-3"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </SheetTrigger>
                          <SheetContent side="bottom" className="h-auto rounded-t-2xl">
                            <SheetHeader>
                              <SheetTitle>Actions</SheetTitle>
                            </SheetHeader>
                            <div className="space-y-2 mt-6 pb-6">
                              <Button
                                variant="outline"
                                className="w-full justify-start h-14 text-base"
                                onClick={() => {
                                  setSelectedReport(report.id);
                                  setActionSheetOpen(false);
                                }}
                              >
                                <Eye className="w-5 h-5 mr-3" />
                                View Details
                              </Button>
                              
                              <Button
                                variant="outline"
                                className="w-full justify-start h-14 text-base"
                                onClick={async () => {
                                  setActionSheetOpen(false);
                                  try {
                                    const { data, error } = await supabase.functions.invoke('generate-service-pdf', {
                                      body: { reportId: report.id }
                                    });
                                    if (error) throw error;
                                    
                                    const blob = new Blob([data], { type: 'application/pdf' });
                                    const url = window.URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `service-report-${report.report_number || report.id}.pdf`;
                                    a.click();
                                    window.URL.revokeObjectURL(url);
                                    toast.success("PDF downloaded successfully");
                                  } catch (error) {
                                    toast.error("Failed to generate PDF");
                                    console.error(error);
                                  }
                                }}
                              >
                                <Download className="w-5 h-5 mr-3" />
                                Export PDF
                              </Button>
                              
                              <Button
                                variant="outline"
                                className="w-full justify-start h-14 text-base"
                                onClick={() => {
                                  navigator.share?.({
                                    title: `Service Report ${report.report_number}`,
                                    text: `Service report for ${reportData.customer_name || 'customer'}`,
                                  }).catch(() => {
                                    toast.info("Sharing not supported");
                                  });
                                  setActionSheetOpen(false);
                                }}
                              >
                                <Share2 className="w-5 h-5 mr-3" />
                                Share
                              </Button>
                              
                              <Button
                                variant="outline"
                                className="w-full justify-start h-14 text-base"
                                onClick={() => {
                                  toast.success("Report duplicated");
                                  setActionSheetOpen(false);
                                }}
                              >
                                <Copy className="w-5 h-5 mr-3" />
                                Duplicate
                              </Button>
                              
                              <Button
                                variant="outline"
                                className="w-full justify-start h-14 text-base text-red-600 hover:text-red-700 border-red-300"
                                onClick={() => {
                                  if (confirm("Delete this report?")) {
                                    toast.success("Report deleted");
                                  }
                                  setActionSheetOpen(false);
                                }}
                              >
                                <Trash2 className="w-5 h-5 mr-3" />
                                Delete
                              </Button>
                            </div>
                          </SheetContent>
                        </Sheet>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Desktop view (hidden on mobile) */}
                <div className="hidden lg:block p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {report.report_number || `SVC-${report.id.slice(0, 8)}`}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {new Date(report.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge className={`capitalize ${getStatusColor(report.status)}`}>
                      {report.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Customer:</span> {reportData.customer_name || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Service:</span> {reportData.service_type || 'General Service'}
                    </p>
                  </div>

                  <div className="flex items-center mb-4">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full mr-2">
                      <div 
                        className="h-full bg-blue-600 rounded-full" 
                        style={{ width: `${report.completion_percentage || 0}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-600">{report.completion_percentage || 0}%</span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setSelectedReport(report.id)}
                    >
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-blue-600 hover:text-blue-700"
                      onClick={async () => {
                        try {
                          const { data, error } = await supabase.functions.invoke('generate-service-pdf', {
                            body: { reportId: report.id }
                          });
                          if (error) throw error;
                          
                          const blob = new Blob([data], { type: 'application/pdf' });
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `service-report-${report.report_number || report.id}.pdf`;
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
                </div>
              </Card>
            );
          })}
        </div>

      {/* Report Details Panel */}
      <ReportDetailsPanel
        reportId={selectedReport}
        isOpen={!!selectedReport}
        onClose={() => setSelectedReport(null)}
      />

      {/* Bulk Actions Modal */}
      <BulkActionsModal
        isOpen={showBulkActions}
        onClose={() => setShowBulkActions(false)}
        selectedRecords={selectedRecords}
        onSuccess={() => {
          setSelectedRecords([]);
          setShowBulkActions(false);
        }}
      />

      {/* Custom Date Range Modal */}
      <CustomDateRangeModal
        isOpen={showCustomDateRange}
        onClose={() => setShowCustomDateRange(false)}
        onApply={(start, end) => {
          setDateRange({ start, end });
          toast.success(`Date filter applied: ${format(start, "MMM d")} - ${format(end, "MMM d")}`);
        }}
      />
    </div>
  );
};
