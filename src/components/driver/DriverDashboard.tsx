
import React, { useState, useEffect } from 'react';
import { useDriverJobs } from '@/hooks/useDriverJobs';
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
  
  const { jobs, isLoading, error, refetch } = useDriverJobs();

  // Clear cache on auth changes in development
  useEffect(() => {
    const isDevelopment = import.meta.env.DEV;
    if (isDevelopment && user?.id) {
      console.log('👤 Driver Dashboard: User authenticated, clearing stale cache');
      
      // Force fresh data on auth changes
      const queryClient = (window as any).queryClient;
      if (queryClient) {
        queryClient.invalidateQueries({ queryKey: ['driver-jobs'] });
      }
    }
  }, [user?.id]);

  // Show error state in development
  if (error) {
    console.error('❌ Driver Dashboard Error:', error);
    if (import.meta.env.DEV) {
      return (
        <div className="flex flex-col items-center justify-center h-64 px-4">
          <div className="text-red-500 mb-2">⚠️ Development Error</div>
          <div className="text-sm text-gray-600 text-center mb-4">
            {error.message}
          </div>
          <button 
            onClick={() => {
              console.log('🔄 Manual refresh triggered');
              refetch();
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Retry
          </button>
        </div>
      );
    }
  }

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
