
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, Edit, Filter } from 'lucide-react';
import { format } from 'date-fns';

interface CustomerJobsTabProps {
  customerId: string;
}

const JOB_STATUSES = {
  assigned: { label: 'Assigned', color: 'bg-blue-500' },
  in_progress: { label: 'In Progress', color: 'bg-yellow-500' },
  completed: { label: 'Completed', color: 'bg-green-500' },
  cancelled: { label: 'Cancelled', color: 'bg-red-500' },
} as const;

const JOB_TYPES = {
  delivery: { label: 'Delivery', icon: '📦' },
  pickup: { label: 'Pickup', icon: '🚚' },
  service: { label: 'Service', icon: '🔧' },
  return: { label: 'Partial Pickup', icon: '↩️' },
} as const;

export function CustomerJobsTab({ customerId }: CustomerJobsTabProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['customer-jobs', customerId, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('jobs')
        .select(`
          *,
          profiles:driver_id(first_name, last_name),
          vehicles(license_plate)
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

  return (
    <div className="space-y-6">
      {/* Header with Filter */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Jobs & Orders</h3>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
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
      </div>

      {/* Jobs Table */}
      <div className="bg-card rounded-2xl border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-medium text-foreground">Job ID</TableHead>
              <TableHead className="font-medium text-foreground">Type</TableHead>
              <TableHead className="font-medium text-foreground">Date</TableHead>
              <TableHead className="font-medium text-foreground">Assigned Driver</TableHead>
              <TableHead className="font-medium text-foreground">Status</TableHead>
              <TableHead className="font-medium text-foreground">Total Price</TableHead>
              <TableHead className="font-medium text-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Loading jobs...
                </TableCell>
              </TableRow>
            ) : jobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
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
                      className={`text-white ${JOB_STATUSES[job.status as keyof typeof JOB_STATUSES]?.color || 'bg-gray-500'}`}
                    >
                      {JOB_STATUSES[job.status as keyof typeof JOB_STATUSES]?.label || job.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(job.total_price)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
