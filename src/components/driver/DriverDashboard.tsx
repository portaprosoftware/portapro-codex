
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@clerk/clerk-react';
import { Calendar } from 'lucide-react';
import { JobCard } from './JobCard';
import { PullToRefresh } from './PullToRefresh';
import { SearchBar } from './SearchBar';
import { StatusFilter } from './StatusFilter';
import { InstallPrompt } from './InstallPrompt';
import { JobStatus } from '@/types';
import { isJobOverdue, isJobCompletedLate, shouldShowWasOverdueBadge, shouldShowPriorityBadge } from '@/lib/jobStatusUtils';

export const DriverDashboard: React.FC = () => {
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'all' | 'priority' | 'was_overdue' | 'overdue' | 'completed_late'>('all');

  const { data: jobs, isLoading, refetch } = useQuery({
    queryKey: ['driver-jobs', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      
      // First, try to find jobs directly with Clerk user ID
      let { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          customers (
            name,
            customer_type,
            phone,
            service_street,
            service_street2,
            service_city,
            service_state,
            service_zip
          )
        `)
        .eq('driver_id', user.id)
        .gte('scheduled_date', today)
        .lte('scheduled_date', tomorrowStr)
        .order('scheduled_date', { ascending: true })
        .order('scheduled_time', { ascending: true });

      // If no jobs found, try to find jobs through profiles table
      if (!error && (!data || data.length === 0)) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('clerk_user_id', user.id)
          .maybeSingle();

        if (!profileError && profileData) {
          const result = await supabase
            .from('jobs')
            .select(`
              *,
              customers (
                name,
                customer_type,
                phone,
                service_street,
                service_street2,
                service_city,
                service_state,
                service_zip
              )
            `)
            .eq('driver_id', profileData.id)
            .gte('scheduled_date', today)
            .lte('scheduled_date', tomorrowStr)
            .order('scheduled_date', { ascending: true })
            .order('scheduled_time', { ascending: true });
          
          data = result.data;
          error = result.error;
        }
      }

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });

  const filteredJobs = jobs?.filter(job => {
    const matchesSearch = !searchQuery || 
      job.customers?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.job_number.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      job.status === statusFilter ||
      (statusFilter === 'priority' && shouldShowPriorityBadge(job)) ||
      (statusFilter === 'was_overdue' && shouldShowWasOverdueBadge(job)) ||
      (statusFilter === 'overdue' && isJobOverdue(job)) ||
      (statusFilter === 'completed_late' && isJobCompletedLate(job));
    
    return matchesSearch && matchesStatus;
  });

  const handleRefresh = async () => {
    await refetch();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <InstallPrompt />
      
      <div className="px-4 py-3 space-y-3 bg-white border-b border-gray-200">
        <SearchBar 
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search jobs, customers..."
        />
        <StatusFilter 
          value={statusFilter}
          onChange={setStatusFilter}
        />
      </div>

      <PullToRefresh onRefresh={handleRefresh}>
        <div className="flex-1 overflow-y-auto">
          {!filteredJobs?.length ? (
            <div className="flex flex-col items-center justify-center h-64 px-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Calendar className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No jobs found
              </h3>
              <p className="text-gray-500 text-center">
                {statusFilter === 'all' 
                  ? "You don't have any jobs scheduled for today"
                  : `No ${statusFilter} jobs found`
                }
              </p>
            </div>
          ) : (
            <div className="space-y-2 p-4">
              {filteredJobs.map((job) => (
                <JobCard 
                  key={job.id} 
                  job={job}
                  onStatusUpdate={refetch}
                />
              ))}
            </div>
          )}
        </div>
      </PullToRefresh>
    </div>
  );
};
