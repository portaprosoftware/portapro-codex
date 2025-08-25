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
    <div className="w-full">
      {/* Toggle Switch for Jobs & Reports */}
      <div className="mb-6 flex justify-center">
        <div className="bg-gray-100 p-1 rounded-lg flex">
          <button
            onClick={() => setActiveSubTab('jobs')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 ${
              activeSubTab === 'jobs'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            Jobs
          </button>
          <button
            onClick={() => setActiveSubTab('reports')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 ${
              activeSubTab === 'reports'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            Service Reports
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