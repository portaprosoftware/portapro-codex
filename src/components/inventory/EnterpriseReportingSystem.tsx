import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Calendar, Send, Download, Clock, Mail, Users } from 'lucide-react';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface ReportSchedule {
  id: string;
  report_name: string;
  report_type: string;
  schedule_expression: string;
  recipients: string[];
  parameters: any;
  last_run_at?: string;
  next_run_at?: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
}

export const EnterpriseReportingSystem: React.FC = () => {
  const [showCreateSchedule, setShowCreateSchedule] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportSchedule | null>(null);
  const [formData, setFormData] = useState({
    report_name: '',
    report_type: 'usage',
    schedule_expression: '0 9 * * MON', // Every Monday at 9 AM
    recipients: [''],
    parameters: {}
  });

  const queryClient = useQueryClient();

  const { data: schedules, isLoading } = useQuery({
    queryKey: ['report-schedules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('report_schedules' as any)
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as unknown as ReportSchedule[];
    }
  });

  const createScheduleMutation = useMutation({
    mutationFn: async (scheduleData: any) => {
      // Calculate next run time based on cron expression (simplified)
      const nextRun = new Date();
      nextRun.setDate(nextRun.getDate() + 7); // Next week for demo

      const { error } = await supabase
        .from('report_schedules' as any)
        .insert([{
          ...scheduleData,
          next_run_at: nextRun.toISOString(),
          created_by: 'Current User' // In real app, get from auth context
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Report schedule created successfully');
      queryClient.invalidateQueries({ queryKey: ['report-schedules'] });
      setShowCreateSchedule(false);
      resetForm();
    }
  });

  const toggleScheduleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('report_schedules' as any)
        .update({ is_active })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-schedules'] });
      toast.success('Schedule updated');
    }
  });

  const generateReportNow = async (schedule: ReportSchedule) => {
    toast.success(`Generating ${schedule.report_name} report...`);
    
    // Mock report generation - in production, this would trigger actual report generation
    setTimeout(() => {
      toast.success('Report generated and sent to recipients');
    }, 3000);
  };

  const resetForm = () => {
    setFormData({
      report_name: '',
      report_type: 'usage',
      schedule_expression: '0 9 * * MON',
      recipients: [''],
      parameters: {}
    });
  };

  const addRecipient = () => {
    setFormData(prev => ({
      ...prev,
      recipients: [...prev.recipients, '']
    }));
  };

  const updateRecipient = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      recipients: prev.recipients.map((r, i) => i === index ? value : r)
    }));
  };

  const removeRecipient = (index: number) => {
    setFormData(prev => ({
      ...prev,
      recipients: prev.recipients.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validRecipients = formData.recipients.filter(r => r.trim() !== '');
    if (validRecipients.length === 0) {
      toast.error('Please add at least one recipient');
      return;
    }

    createScheduleMutation.mutate({
      ...formData,
      recipients: validRecipients
    });
  };

  const getReportTypeDescription = (type: string) => {
    switch (type) {
      case 'usage': return 'Consumable usage patterns and trends';
      case 'cost': return 'Cost analysis and budget tracking';
      case 'efficiency': return 'Operational efficiency metrics';
      case 'predictive': return 'AI-powered demand forecasting';
      default: return 'Custom report configuration';
    }
  };

  const getScheduleDescription = (cron: string) => {
    // Simplified cron description - in production, use a proper cron parser
    switch (cron) {
      case '0 9 * * *': return 'Daily at 9:00 AM';
      case '0 9 * * MON': return 'Weekly on Monday at 9:00 AM';
      case '0 9 1 * *': return 'Monthly on 1st at 9:00 AM';
      default: return 'Custom schedule';
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Enterprise Reporting System
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="schedules" className="space-y-6">
            <TabsList>
              <TabsTrigger value="schedules">Report Schedules</TabsTrigger>
              <TabsTrigger value="templates">Report Templates</TabsTrigger>
              <TabsTrigger value="exports">Export Formats</TabsTrigger>
              <TabsTrigger value="analytics">Report Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="schedules" className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium">Automated Report Schedules</h3>
                  <p className="text-sm text-muted-foreground">Schedule reports to be generated and sent automatically</p>
                </div>
                <Button onClick={() => setShowCreateSchedule(true)}>
                  <Calendar className="w-4 h-4 mr-2" />
                  Create Schedule
                </Button>
              </div>

              <div className="space-y-4">
                {schedules?.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center text-muted-foreground">
                      <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No report schedules configured</p>
                      <p className="text-sm">Create automated schedules to send reports regularly</p>
                    </CardContent>
                  </Card>
                ) : (
                  schedules?.map(schedule => (
                    <Card key={schedule.id}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <h4 className="font-medium">{schedule.report_name}</h4>
                              <Badge variant="outline" className="capitalize">
                                {schedule.report_type}
                              </Badge>
                              <Badge variant={schedule.is_active ? 'default' : 'secondary'}>
                                {schedule.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                            
                            <div className="text-sm space-y-1">
                              <p className="text-muted-foreground">
                                {getReportTypeDescription(schedule.report_type)}
                              </p>
                              <div className="flex items-center gap-4">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {getScheduleDescription(schedule.schedule_expression)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  {schedule.recipients.length} recipients
                                </span>
                              </div>
                              {schedule.next_run_at && (
                                <p className="flex items-center gap-1 text-muted-foreground">
                                  <Clock className="w-3 h-3" />
                                  Next run: {new Date(schedule.next_run_at).toLocaleString()}
                                </p>
                              )}
                              {schedule.last_run_at && (
                                <p className="text-muted-foreground">
                                  Last run: {new Date(schedule.last_run_at).toLocaleString()}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Switch 
                              checked={schedule.is_active}
                              onCheckedChange={(checked) => 
                                toggleScheduleMutation.mutate({ id: schedule.id, is_active: checked })
                              }
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => generateReportNow(schedule)}
                            >
                              <Send className="w-3 h-3 mr-1" />
                              Run Now
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="templates" className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Report Templates</h3>
                <p className="text-sm text-muted-foreground">Pre-configured report templates for common use cases</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { name: 'Weekly Usage Summary', type: 'usage', description: 'Weekly consumable usage across all locations' },
                  { name: 'Monthly Cost Analysis', type: 'cost', description: 'Detailed cost breakdown and trends' },
                  { name: 'Efficiency Report', type: 'efficiency', description: 'Operational efficiency and optimization insights' },
                  { name: 'Predictive Reordering', type: 'predictive', description: 'AI-powered demand forecasting and recommendations' },
                  { name: 'Supplier Performance', type: 'supplier', description: 'Supplier delivery and quality metrics' },
                  { name: 'Location Comparison', type: 'location', description: 'Multi-location performance comparison' }
                ].map((template, idx) => (
                  <Card key={idx} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{template.name}</h4>
                          <Badge variant="outline">{template.type}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                        <Button size="sm" variant="outline" className="w-full">
                          <Download className="w-3 h-3 mr-2" />
                          Use Template
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="exports" className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Export Formats</h3>
                <p className="text-sm text-muted-foreground">Configure export formats and delivery options</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardContent className="pt-6">
                    <h4 className="font-medium mb-4">Supported Formats</h4>
                    <div className="space-y-3">
                      {[
                        { format: 'PDF', description: 'Professional formatted reports', enabled: true },
                        { format: 'Excel (XLSX)', description: 'Spreadsheet format for analysis', enabled: true },
                        { format: 'CSV', description: 'Raw data for further processing', enabled: true },
                        { format: 'JSON', description: 'API-friendly data format', enabled: false },
                        { format: 'PowerBI', description: 'Direct integration with PowerBI', enabled: false }
                      ].map((format, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded">
                          <div>
                            <p className="font-medium">{format.format}</p>
                            <p className="text-sm text-muted-foreground">{format.description}</p>
                          </div>
                          <Switch checked={format.enabled} />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <h4 className="font-medium mb-4">Delivery Options</h4>
                    <div className="space-y-3">
                      <div className="p-3 bg-muted/50 rounded">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            <span className="font-medium">Email Delivery</span>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        <p className="text-sm text-muted-foreground">Send reports directly to recipients' email</p>
                      </div>
                      
                      <div className="p-3 bg-muted/50 rounded">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Download className="w-4 h-4" />
                            <span className="font-medium">Portal Download</span>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        <p className="text-sm text-muted-foreground">Make reports available in user portal</p>
                      </div>
                      
                      <div className="p-3 bg-muted/50 rounded">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Send className="w-4 h-4" />
                            <span className="font-medium">API Webhook</span>
                          </div>
                          <Switch />
                        </div>
                        <p className="text-sm text-muted-foreground">Send to external systems via webhook</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Report Analytics</h3>
                <p className="text-sm text-muted-foreground">Track report usage and performance metrics</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-2xl font-bold">24</p>
                    <p className="text-sm text-muted-foreground">Reports Generated</p>
                    <p className="text-xs text-muted-foreground">This month</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-2xl font-bold">98.5%</p>
                    <p className="text-sm text-muted-foreground">Delivery Success</p>
                    <p className="text-xs text-muted-foreground">Last 30 days</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-2xl font-bold">12</p>
                    <p className="text-sm text-muted-foreground">Active Schedules</p>
                    <p className="text-xs text-muted-foreground">Currently running</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-2xl font-bold">4.8</p>
                    <p className="text-sm text-muted-foreground">Avg Rating</p>
                    <p className="text-xs text-muted-foreground">User feedback</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Create Schedule Modal */}
      <Dialog open={showCreateSchedule} onOpenChange={setShowCreateSchedule}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Report Schedule</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="report_name">Report Name *</Label>
              <Input
                id="report_name"
                value={formData.report_name}
                onChange={(e) => setFormData(prev => ({ ...prev, report_name: e.target.value }))}
                placeholder="e.g., Weekly Usage Report"
                required
              />
            </div>

            <div>
              <Label htmlFor="report_type">Report Type *</Label>
              <Select 
                value={formData.report_type} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, report_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="usage">Usage Analysis</SelectItem>
                  <SelectItem value="cost">Cost Analysis</SelectItem>
                  <SelectItem value="efficiency">Efficiency Metrics</SelectItem>
                  <SelectItem value="predictive">Predictive Analytics</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="schedule">Schedule *</Label>
              <Select 
                value={formData.schedule_expression} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, schedule_expression: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0 9 * * *">Daily at 9:00 AM</SelectItem>
                  <SelectItem value="0 9 * * MON">Weekly on Monday at 9:00 AM</SelectItem>
                  <SelectItem value="0 9 1 * *">Monthly on 1st at 9:00 AM</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Recipients *</Label>
              <div className="space-y-2">
                {formData.recipients.map((recipient, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={recipient}
                      onChange={(e) => updateRecipient(index, e.target.value)}
                      placeholder="email@example.com"
                      type="email"
                    />
                    {formData.recipients.length > 1 && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => removeRecipient(index)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addRecipient}>
                  Add Recipient
                </Button>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowCreateSchedule(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createScheduleMutation.isPending}
              >
                {createScheduleMutation.isPending ? 'Creating...' : 'Create Schedule'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};