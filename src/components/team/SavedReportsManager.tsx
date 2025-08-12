import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Calendar, 
  Trash2, 
  Download, 
  Eye,
  BarChart3,
  PieChart,
  LineChart,
  Settings
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface SavedReport {
  id: string;
  name: string;
  description: string;
  data_source: string;
  chart_type: string;
  configuration: any;
  created_at: string;
  filters: any;
}

interface SavedReportsManagerProps {
  onLoadReport: (reportConfig: any) => void;
}

const chartTypeIcons = {
  bar: BarChart3,
  line: LineChart,
  pie: PieChart,
  table: Settings
};

const dataSourceLabels = {
  drivers: 'Driver Management',
  compliance: 'Compliance Records',
  training: 'Training Data',
  equipment: 'Equipment Assignments',
  incidents: 'Incident Reports',
  maintenance: 'Vehicle Maintenance'
};

export function SavedReportsManager({ onLoadReport }: SavedReportsManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: savedReports = [], isLoading } = useQuery({
    queryKey: ['saved-reports'],
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
      queryClient.invalidateQueries({ queryKey: ['saved-reports'] });
      toast({
        title: "Report Deleted",
        description: "The report has been deleted successfully."
      });
    },
    onError: () => {
      toast({
        title: "Delete Failed",
        description: "Failed to delete the report. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleLoadReport = (report: SavedReport) => {
    const reportConfig = {
      ...report.configuration,
      name: report.name,
      description: report.description,
      dataSource: report.data_source,
      chartType: report.chart_type,
      filters: Object.entries(report.filters || {}).map(([key, value]) => ({
        id: `filter_${Date.now()}_${key}`,
        type: 'select', // Default type, should be enhanced based on actual filter config
        label: key,
        value
      }))
    };
    
    onLoadReport(reportConfig);
    toast({
      title: "Report Loaded",
      description: `Loaded report: ${report.name}`
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">Loading saved reports...</div>
        </CardContent>
      </Card>
    );
  }

  if (savedReports.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Saved Reports</CardTitle>
          <CardDescription>
            Your saved custom reports will appear here
          </CardDescription>
        </CardHeader>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No saved reports yet.</p>
            <p className="text-sm">Create and save a report to see it here.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Saved Reports</CardTitle>
        <CardDescription>
          Manage and load your saved custom reports
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {savedReports.map((report) => {
            const ChartIcon = chartTypeIcons[report.chart_type as keyof typeof chartTypeIcons] || Settings;
            
            return (
              <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                <div className="flex items-start gap-3 flex-1">
                  <ChartIcon className="h-5 w-5 mt-0.5 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{report.name}</h3>
                    {report.description && (
                      <p className="text-sm text-muted-foreground truncate">{report.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        {dataSourceLabels[report.data_source as keyof typeof dataSourceLabels] || report.data_source}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {report.chart_type}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(report.created_at), 'MMM dd, yyyy')}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleLoadReport(report)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Load
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteReportMutation.mutate(report.id)}
                    disabled={deleteReportMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}