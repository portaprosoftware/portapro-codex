import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Download, Eye, Search, Calendar, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

interface CustomerServiceReportsTabProps {
  customerId: string;
}

interface ServiceReport {
  id: string;
  report_number: string;
  completion_percentage: number;
  created_at: string;
  completed_at: string | null;
  assigned_technician: string | null;
  job_id: string;
  jobs: {
    job_number: string;
    job_type: string;
    scheduled_date: string;
  } | null;
  maintenance_report_templates: {
    name: string;
    template_type: string;
  } | null;
}

export function CustomerServiceReportsTab({ customerId }: CustomerServiceReportsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['customer-service-reports', customerId, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('maintenance_reports')
        .select(`
          *,
          jobs!inner (
            job_number,
            job_type,
            scheduled_date,
            customer_id
          ),
          maintenance_report_templates (
            name,
            template_type
          )
        `)
        .eq('jobs.customer_id', customerId)
        .order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as any;
    }
  });

  const filteredReports = reports.filter(report => {
    const matchesSearch = !searchQuery || 
      report.report_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.jobs?.job_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.maintenance_report_templates?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const status = report.completion_percentage === 100 ? 'completed' : 
                   report.completion_percentage > 0 ? 'in_progress' : 'draft';
    const matchesStatus = statusFilter === 'all' || status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (percentage: number) => {
    if (percentage === 100) {
      return (
        <Badge className="bg-green-500 text-white">
          <FileText className="w-3 h-3 mr-1" />
          Completed
        </Badge>
      );
    } else if (percentage > 0) {
      return (
        <Badge className="bg-yellow-500 text-white">
          <FileText className="w-3 h-3 mr-1" />
          In Progress ({percentage}%)
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline">
          <FileText className="w-3 h-3 mr-1" />
          Draft
        </Badge>
      );
    }
  };

  const getJobTypeBadge = (jobType: string) => {
    const types = {
      delivery: { label: 'Delivery', icon: '📦', color: 'bg-blue-500' },
      pickup: { label: 'Pickup', icon: '🚚', color: 'bg-purple-500' },
      service: { label: 'Service', icon: '🔧', color: 'bg-orange-500' },
      return: { label: 'Return', icon: '↩️', color: 'bg-teal-500' },
    };
    
    const config = types[jobType as keyof typeof types] || { label: jobType, icon: '📋', color: 'bg-gray-500' };
    
    return (
      <Badge className={`text-white ${config.color}`}>
        <span className="mr-1">{config.icon}</span>
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Service Reports</h3>
          <p className="text-sm text-muted-foreground">
            Reports completed for jobs at this customer location
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-3 py-1">
          {filteredReports.length} Report{filteredReports.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search reports, job numbers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reports Grid */}
      <div className="grid gap-4">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading service reports...
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h4 className="text-lg font-medium text-foreground mb-2">No Service Reports</h4>
            <p className="text-muted-foreground">
              {searchQuery || statusFilter !== 'all' 
                ? 'No reports match your current filters'
                : 'No service reports have been completed for this customer yet'
              }
            </p>
          </div>
        ) : (
          filteredReports.map((report) => (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-foreground">
                        {report.report_number}
                      </h4>
                      {getStatusBadge(report.completion_percentage)}
                      {report.jobs && getJobTypeBadge(report.jobs.job_type)}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {format(new Date(report.created_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                      
                      {report.jobs && (
                        <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                          Job: {report.jobs.job_number}
                        </span>
                      )}
                      
                      {report.maintenance_report_templates?.name && (
                        <span>
                          Template: {report.maintenance_report_templates.name}
                        </span>
                      )}
                    </div>

                    {report.assigned_technician && (
                      <p className="text-sm text-muted-foreground">
                        Technician: {report.assigned_technician}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      PDF
                    </Button>
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {report.completion_percentage < 100 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{report.completion_percentage}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${report.completion_percentage}%` }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}