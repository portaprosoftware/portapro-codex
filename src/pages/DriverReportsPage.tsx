import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  FileText, Plus, Search, Filter, Calendar, MapPin, 
  Clock, User, Paperclip, ExternalLink, Eye
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { toast } from 'sonner';

const reportJobSchema = z.object({
  job_id: z.string().min(1, "Please select a job"),
  notes: z.string().optional(),
});

type ReportJobFormData = z.infer<typeof reportJobSchema>;

interface MaintenanceRecord {
  id: string;
  maintenance_type: string;
  description: string;
  created_at: string;
  status: string;
  vehicle_id?: string;
  technician_id?: string;
  completed_date?: string;
  notes?: string;
  vehicles?: {
    license_plate: string;
  };
  profiles?: {
    first_name: string;
    last_name: string;
  }[];
}

interface Job {
  id: string;
  job_number: string;
  job_type: string;
  scheduled_date: string;
  status: string;
  customers: {
    name: string;
  };
}

export function DriverReportsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedReport, setSelectedReport] = useState<MaintenanceRecord | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const { user } = useUserRole();
  const queryClient = useQueryClient();

  const form = useForm<ReportJobFormData>({
    resolver: zodResolver(reportJobSchema),
    defaultValues: {
      job_id: '',
      notes: '',
    },
  });

  // Fetch maintenance records
  const { data: reports = [], isLoading: reportsLoading } = useQuery({
    queryKey: ['driver-maintenance-records', searchTerm, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('maintenance_records')
        .select(`
          *,
          vehicles(license_plate),
          profiles!technician_id(first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (searchTerm) {
        query = query.or(`maintenance_type.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch available jobs for assignment
  const { data: availableJobs = [] } = useQuery({
    queryKey: ['available-jobs-for-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          id,
          job_number,
          job_type,
          scheduled_date,
          status,
          customers(name)
        `)
        .in('status', ['assigned', 'in_progress', 'on_route'])
        .order('scheduled_date', { ascending: true })
        .limit(50);

      if (error) throw error;
      return data as Job[];
    },
  });

  // Assign report to job mutation (update the maintenance record's notes)
  const assignReportToJob = useMutation({
    mutationFn: async (data: ReportJobFormData & { reportId: string }) => {
      // Update the maintenance record to add job assignment info
      const noteText = `Assigned to Job ID: ${data.job_id}. ${data.notes || ''}`;
      const { error } = await supabase
        .from('maintenance_records')
        .update({
          notes: noteText
        })
        .eq('id', data.reportId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-maintenance-records'] });
      toast.success('Report assigned to job successfully');
      setIsAssignModalOpen(false);
      setSelectedReport(null);
      form.reset();
    },
    onError: (error) => {
      toast.error('Failed to assign report to job');
      console.error('Error assigning report:', error);
    },
  });

  const handleAssignReport = (report: MaintenanceRecord) => {
    setSelectedReport(report);
    setIsAssignModalOpen(true);
  };

  const onSubmit = (data: ReportJobFormData) => {
    if (selectedReport) {
      assignReportToJob.mutate({
        ...data,
        reportId: selectedReport.id,
      });
    }
  };

  const filteredReports = reports.filter((report: any) => {
    const matchesSearch = !searchTerm || 
      report.maintenance_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-4 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center space-x-2">
            <FileText className="w-6 h-6 text-blue-600" />
            <span>Maintenance Reports</span>
          </h1>
          <p className="text-muted-foreground">View and assign maintenance reports to jobs</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            {(searchTerm || statusFilter !== 'all') && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      <div className="space-y-4">
        {reportsLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-muted rounded w-1/4"></div>
                    <div className="h-3 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredReports.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Reports Found</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all' 
                  ? 'No reports match your current filters' 
                  : 'No maintenance reports available at this time'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredReports.map((report) => (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-semibold text-lg">
                        {report.maintenance_type} - {report.id.slice(0, 8)}
                      </h3>
                      <Badge className={getStatusColor(report.status)}>
                        {report.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    
                    <p className="text-muted-foreground">{report.description}</p>
                    {report.notes && (
                      <p className="text-sm text-muted-foreground italic">{report.notes}</p>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>Created: {new Date(report.created_at).toLocaleDateString()}</span>
                      </div>
                      
                      {report.vehicles && (
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span>Vehicle: {report.vehicles.license_plate}</span>
                        </div>
                      )}
                      
                      {report.profiles && Array.isArray(report.profiles) && report.profiles.length > 0 && (
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span>
                            Technician: {report.profiles[0].first_name} {report.profiles[0].last_name}
                          </span>
                        </div>
                      )}
                      
                      {report.completed_date && (
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span>
                            Completed: {new Date(report.completed_date).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAssignReport(report)}
                    >
                      <Paperclip className="w-4 h-4 mr-2" />
                      Assign to Job
                    </Button>
                    
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Assign Report to Job Modal */}
      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Report to Job</DialogTitle>
          </DialogHeader>
          
          {selectedReport && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <h4 className="font-medium">{selectedReport.maintenance_type} - {selectedReport.id.slice(0, 8)}</h4>
                <p className="text-sm text-muted-foreground">{selectedReport.description}</p>
              </div>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="job_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Job</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a job" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableJobs.map((job) => (
                              <SelectItem key={job.id} value={job.id}>
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {job.job_number} - {job.job_type}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {job.customers.name} • {new Date(job.scheduled_date).toLocaleDateString()}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Add any notes about this assignment..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsAssignModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={assignReportToJob.isPending}
                    >
                      {assignReportToJob.isPending ? "Assigning..." : "Assign Report"}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}