import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, BarChart, LineChart, PieChart, Table, MoreVertical, Trash2, Play, Edit } from 'lucide-react';
import { ReportBuilder } from '@/components/analytics/ReportBuilder';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from 'date-fns';

const AnalyticsReports = () => {
  const [isReportBuilderOpen, setIsReportBuilderOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: savedReports = [], isLoading } = useQuery({
    queryKey: ['custom-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custom_reports')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const deleteReportMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const { error } = await supabase
        .from('custom_reports')
        .delete()
        .eq('id', reportId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-reports'] });
      toast({
        title: "Report Deleted",
        description: "The report has been successfully deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete report. Please try again.",
        variant: "destructive",
      });
    }
  });

  const getVisualizationIcon = (chartType: string) => {
    switch (chartType) {
      case 'bar':
        return <BarChart className="h-5 w-5" />;
      case 'line':
        return <LineChart className="h-5 w-5" />;
      case 'pie':
        return <PieChart className="h-5 w-5" />;
      case 'table':
      default:
        return <Table className="h-5 w-5" />;
    }
  };

  const handleCreateNew = () => {
    setEditingReport(null);
    setIsReportBuilderOpen(true);
  };

  const handleRunReport = (report: any) => {
    // TODO: Implement report execution
    toast({
      title: "Running Report",
      description: "This feature is coming soon.",
    });
  };

  return (
    <div className="max-w-none px-6 py-6 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white rounded-lg border shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 font-inter">Saved Reports</h1>
            <p className="text-base text-gray-600 font-inter mt-1">View and manage your custom analytics reports</p>
          </div>
          <Button
            onClick={handleCreateNew}
            className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New Report
          </Button>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))
        ) : savedReports.length === 0 ? (
          <div className="col-span-full">
            <Card className="p-12 text-center">
              <div className="flex flex-col items-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                  <BarChart className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">No Reports Yet</h3>
                  <p className="text-gray-600 mb-4">
                    Create your first custom report to get started with analytics
                  </p>
                  <Button
                    onClick={handleCreateNew}
                    className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Report
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        ) : (
          savedReports.map((report) => (
            <Card key={report.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      {getVisualizationIcon(report.chart_type)}
                      {report.name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {report.description || 'No description'}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleRunReport(report)}>
                        <Play className="h-4 w-4 mr-2" />
                        Run Report
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setEditingReport(report);
                          setIsReportBuilderOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this report?')) {
                            deleteReportMutation.mutate(report.id);
                          }
                        }}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="secondary" className="font-normal">
                      {report.data_source}
                    </Badge>
                    <Badge variant="outline" className="font-normal">
                      {report.chart_type}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500">
                    Created {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                  </p>
                  <Button
                    onClick={() => handleRunReport(report)}
                    className="w-full"
                    variant="outline"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Run Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Report Builder Drawer */}
      <ReportBuilder
        isOpen={isReportBuilderOpen}
        onClose={() => {
          setIsReportBuilderOpen(false);
          setEditingReport(null);
        }}
        dateRange={{
          from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          to: new Date()
        }}
      />
    </div>
  );
};

export default AnalyticsReports;
