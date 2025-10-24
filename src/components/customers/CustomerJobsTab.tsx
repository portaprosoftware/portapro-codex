
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Eye, Filter, FileText, CheckCircle, Clock, Briefcase, MoreVertical, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { JobCard } from './JobCard';
import { JobDetailModal } from '@/components/jobs/JobDetailModal';
import { DeleteJobModal } from './job-modals/DeleteJobModal';

interface CustomerJobsTabProps {
  customerId: string;
}

const JOB_STATUSES = {
  assigned: { label: 'Assigned', gradient: 'bg-gradient-to-r from-blue-500 to-blue-600' },
  unassigned: { label: 'Unassigned', gradient: 'bg-gradient-to-r from-gray-500 to-gray-600' },
  in_progress: { label: 'In Progress', gradient: 'bg-gradient-to-r from-yellow-500 to-yellow-600' },
  completed: { label: 'Completed', gradient: 'bg-gradient-to-r from-green-500 to-green-600' },
  cancelled: { label: 'Cancelled', gradient: 'bg-gradient-to-r from-red-500 to-red-600' },
} as const;

const JOB_TYPES = {
  delivery: { label: 'Delivery', icon: '📦' },
  pickup: { label: 'Pickup', icon: '🚚' },
  service: { label: 'Service', icon: '🪣' },
  return: { label: 'Partial Pickup', icon: '↩️' },
} as const;

export function CustomerJobsTab({ customerId }: CustomerJobsTabProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['customer-jobs', customerId, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('jobs')
        .select(`
          *,
          profiles:driver_id(first_name, last_name),
          vehicles(license_plate),
          maintenance_reports(id, report_number, completion_percentage, created_at)
        `)
        .eq('customer_id', customerId)
        .order('scheduled_date', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handleViewJob = (job: any) => {
    setSelectedJobId(job.id);
  };

  const handleDeleteJob = (job: any) => {
    setSelectedJob(job);
    setDeleteModalOpen(true);
  };

  return (
    <div className="space-y-6 overflow-x-hidden px-4 lg:px-0">
      {/* Header with Filter */}
      <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-foreground">Jobs & Orders</h3>
        <div className="flex items-center gap-2 w-full xs:w-auto">
          <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="min-h-[44px] w-full xs:w-[180px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.entries(JOB_STATUSES).map(([status, config]) => (
                <SelectItem key={status} value={status}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Mobile/Tablet Card View (<1024px) */}
      <div className="lg:hidden">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading jobs...
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-2xl border shadow-sm">
            <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h4 className="text-lg font-medium text-foreground mb-2">No Jobs Found</h4>
            <p className="text-muted-foreground mb-4">
              {statusFilter !== 'all' 
                ? 'No jobs match your current filter'
                : 'No jobs have been created for this customer yet'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job as any} />
            ))}
          </div>
        )}
      </div>

      {/* Desktop Table View (≥1024px) */}
      <div className="hidden lg:block bg-card rounded-2xl border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-medium text-foreground">Job ID</TableHead>
              <TableHead className="font-medium text-foreground">Type</TableHead>
              <TableHead className="font-medium text-foreground">Date</TableHead>
              <TableHead className="font-medium text-foreground">Assigned Driver</TableHead>
              <TableHead className="font-medium text-foreground">Status</TableHead>
              <TableHead className="font-medium text-foreground">Reports</TableHead>
              <TableHead className="font-medium text-foreground">Total Price</TableHead>
              <TableHead className="font-medium text-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Loading jobs...
                </TableCell>
              </TableRow>
            ) : jobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No jobs found for this customer
                </TableCell>
              </TableRow>
            ) : (
              jobs.map((job) => (
                <TableRow key={job.id} className="hover:bg-muted/50">
                  <TableCell className="font-mono text-sm">{job.job_number}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{JOB_TYPES[job.job_type as keyof typeof JOB_TYPES]?.icon || '📋'}</span>
                      <span className="capitalize">
                        {JOB_TYPES[job.job_type as keyof typeof JOB_TYPES]?.label || job.job_type}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {format(new Date(job.scheduled_date), 'MMM d, yyyy')}
                      </span>
                      {job.scheduled_time && (
                        <span className="text-sm text-muted-foreground">{job.scheduled_time}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {job.profiles ? (
                      <span>{job.profiles.first_name} {job.profiles.last_name}</span>
                    ) : (
                      <span className="text-muted-foreground">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      className={`text-white font-medium ${JOB_STATUSES[job.status as keyof typeof JOB_STATUSES]?.gradient || 'bg-gradient-to-r from-gray-500 to-gray-600'}`}
                    >
                      {JOB_STATUSES[job.status as keyof typeof JOB_STATUSES]?.label || job.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {job.maintenance_reports && job.maintenance_reports.length > 0 ? (
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            {job.maintenance_reports.length} Report{job.maintenance_reports.length > 1 ? 's' : ''}
                          </Badge>
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-gray-500 border-gray-200">
                          <Clock className="w-3 h-3 mr-1" />
                          No Reports
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(job.total_price)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 bg-white z-50">
                        <DropdownMenuItem 
                          onClick={() => handleViewJob(job)}
                          className="cursor-pointer"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          <span>View</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteJob(job)}
                          className="cursor-pointer text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modals */}
      <JobDetailModal 
        jobId={selectedJobId}
        open={!!selectedJobId}
        onOpenChange={(open) => {
          if (!open) setSelectedJobId(null);
        }}
      />
      <DeleteJobModal 
        open={deleteModalOpen} 
        onOpenChange={setDeleteModalOpen} 
        job={selectedJob}
        customerId={customerId}
      />
    </div>
  );
}
