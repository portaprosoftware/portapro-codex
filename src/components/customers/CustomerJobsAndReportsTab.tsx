import React, { useState } from 'react';
import { Briefcase, FileText } from 'lucide-react';
import { CustomerJobsTab } from './CustomerJobsTab';
import { CustomerServiceReportsTab } from './CustomerServiceReportsTab';

interface CustomerJobsAndReportsTabProps {
  customerId: string;
}

export function CustomerJobsAndReportsTab({ customerId }: CustomerJobsAndReportsTabProps) {
  const [activeSubTab, setActiveSubTab] = useState('jobs');

  return (
    <div className="w-full overflow-x-hidden">
      {/* Toggle Switch for Jobs & Reports - Responsive */}
      <div className="mb-6 px-4 lg:px-0">
        <div className="bg-muted/50 p-1 rounded-lg inline-flex w-full lg:w-auto">
          <button
            onClick={() => setActiveSubTab('jobs')}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 flex-1 lg:flex-initial min-h-[44px] ${
              activeSubTab === 'jobs'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm'
                : 'text-foreground hover:text-foreground/80'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Jobs</span>
          </button>
          <button
            onClick={() => setActiveSubTab('reports')}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 flex-1 lg:flex-initial min-h-[44px] ${
              activeSubTab === 'reports'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm'
                : 'text-foreground hover:text-foreground/80'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Service Reports</span>
          </button>
        </div>
      </div>

      {/* Active Sub-tab Content */}
      <div className="mt-6">
        {activeSubTab === 'jobs' ? (
          <CustomerJobsTab customerId={customerId} />
        ) : (
          <CustomerServiceReportsTab customerId={customerId} />
        )}
      </div>
    </div>
  );
}