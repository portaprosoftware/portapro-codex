
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar, 
  Clock, 
  Mail, 
  MessageSquare, 
  FileText, 
  Download,
  Bell,
  Settings,
  Play,
  Pause,
  Edit,
  Trash2,
  Plus
} from 'lucide-react';

interface AutomatedReportingProps {
  dateRange: { from: Date; to: Date };
}

interface ReportSchedule {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  recipients: string[];
  format: 'pdf' | 'excel' | 'email';
  isActive: boolean;
  nextRun: Date;
  lastRun?: Date;
  metrics: string[];
  created_at: Date;
}

export const AutomatedReporting: React.FC<AutomatedReportingProps> = ({ dateRange }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingReport, setEditingReport] = useState<ReportSchedule | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock data for demonstration
  const mockSchedules: ReportSchedule[] = [
    {
      id: '1',
      name: 'Daily Operations Summary',
      frequency: 'daily',
      recipients: ['manager@company.com', 'operations@company.com'],
      format: 'email',
      isActive: true,
      nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000),
      lastRun: new Date(Date.now() - 24 * 60 * 60 * 1000),
      metrics: ['jobs', 'revenue', 'efficiency'],
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    },
    {
      id: '2',
      name: 'Weekly Performance Report',
      frequency: 'weekly',
      recipients: ['ceo@company.com', 'reports@company.com'],
      format: 'pdf',
      isActive: true,
      nextRun: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      lastRun: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      metrics: ['performance', 'customer_satisfaction', 'growth'],
      created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
    },
    {
      id: '3',
      name: 'Monthly Executive Dashboard',
      frequency: 'monthly',
      recipients: ['board@company.com'],
      format: 'excel',
      isActive: false,
      nextRun: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      metrics: ['financial', 'strategic', 'operational'],
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    }
  ];

  const { data: reportSchedules = mockSchedules, isLoading } = useQuery({
    queryKey: ['report-schedules'],
    queryFn: async () => {
      // In real implementation, this would fetch from Supabase
      return mockSchedules;
    }
  });

  const toggleReportMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      // In real implementation, this would update the database
      console.log('Toggling report', id, isActive);
      return { id, isActive };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-schedules'] });
      toast({
        title: "Report Updated",
        description: "Report schedule has been updated successfully.",
      });
    }
  });

  const deleteReportMutation = useMutation({
    mutationFn: async (id: string) => {
      // In real implementation, this would delete from database
      console.log('Deleting report', id);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-schedules'] });
      toast({
        title: "Report Deleted",
        description: "Report schedule has been deleted successfully.",
      });
    }
  });

  const runReportNowMutation = useMutation({
    mutationFn: async (id: string) => {
      // In real implementation, this would trigger the report generation
      console.log('Running report now', id);
      return id;
    },
    onSuccess: () => {
      toast({
        title: "Report Generated",
        description: "Report has been generated and sent successfully.",
      });
    }
  });

  const getFrequencyBadge = (frequency: string) => {
    const colors = {
      daily: 'bg-blue-100 text-blue-800',
      weekly: 'bg-green-100 text-green-800',
      monthly: 'bg-purple-100 text-purple-800'
    };
    return colors[frequency as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'pdf': return FileText;
      case 'excel': return Download;
      case 'email': return Mail;
      default: return FileText;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Automated Reporting</h2>
          <p className="text-muted-foreground">Schedule and manage automated reports</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="bg-gradient-to-r from-blue-600 to-blue-500">
          <Plus className="w-4 h-4 mr-2" />
          Create Report Schedule
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Reports</p>
                <p className="text-2xl font-bold">{reportSchedules.length}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Reports</p>
                <p className="text-2xl font-bold">{reportSchedules.filter(r => r.isActive).length}</p>
              </div>
              <Bell className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold">24</p>
              </div>
              <Calendar className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">98.5%</p>
              </div>
              <Settings className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Schedules */}
      <Card>
        <CardHeader>
          <CardTitle>Report Schedules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reportSchedules.map((report) => {
              const FormatIcon = getFormatIcon(report.format);
              return (
                <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FormatIcon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">{report.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getFrequencyBadge(report.frequency)}>
                          {report.frequency}
                        </Badge>
                        <Badge variant="outline">{report.format.toUpperCase()}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {report.recipients.length} recipients
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        Next: {report.nextRun.toLocaleDateString()}
                      </p>
                      {report.lastRun && (
                        <p className="text-xs text-muted-foreground">
                          Last: {report.lastRun.toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={report.isActive}
                        onCheckedChange={(checked) => 
                          toggleReportMutation.mutate({ id: report.id, isActive: checked })
                        }
                      />
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => runReportNowMutation.mutate(report.id)}
                        disabled={runReportNowMutation.isPending}
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingReport(report)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteReportMutation.mutate(report.id)}
                        disabled={deleteReportMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <div className="flex-1">
                <p className="text-sm font-medium">Daily Operations Summary sent successfully</p>
                <p className="text-xs text-muted-foreground">2 minutes ago • 3 recipients</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <div className="flex-1">
                <p className="text-sm font-medium">Weekly Performance Report generated</p>
                <p className="text-xs text-muted-foreground">1 hour ago • PDF format</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="w-2 h-2 bg-yellow-500 rounded-full" />
              <div className="flex-1">
                <p className="text-sm font-medium">Monthly Executive Dashboard scheduled</p>
                <p className="text-xs text-muted-foreground">3 hours ago • Next run: Tomorrow</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alert Thresholds */}
      <Card>
        <CardHeader>
          <CardTitle>Alert Thresholds</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Revenue Alert Threshold</Label>
              <Input type="number" placeholder="10000" />
              <p className="text-xs text-muted-foreground">Alert when revenue drops below this amount</p>
            </div>
            
            <div className="space-y-2">
              <Label>Efficiency Alert Threshold</Label>
              <Input type="number" placeholder="85" />
              <p className="text-xs text-muted-foreground">Alert when efficiency drops below this percentage</p>
            </div>
            
            <div className="space-y-2">
              <Label>Customer Satisfaction Threshold</Label>
              <Input type="number" placeholder="4.5" />
              <p className="text-xs text-muted-foreground">Alert when satisfaction drops below this rating</p>
            </div>
            
            <div className="space-y-2">
              <Label>Job Completion Rate Threshold</Label>
              <Input type="number" placeholder="90" />
              <p className="text-xs text-muted-foreground">Alert when completion rate drops below this percentage</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
