import React, { useState } from 'react';
import { Briefcase, FileText } from 'lucide-react';
import { TabNav } from '@/components/ui/TabNav';
import { CustomerJobsTab } from './CustomerJobsTab';
import { CustomerServiceReportsTab } from './CustomerServiceReportsTab';

interface CustomerJobsAndReportsTabProps {
  customerId: string;
}

export function CustomerJobsAndReportsTab({ customerId }: CustomerJobsAndReportsTabProps) {
  const [activeSubTab, setActiveSubTab] = useState('jobs');

  return (
    <div className="w-full">
      {/* Sub-navigation for Jobs & Reports */}
      <div className="mb-6">
        <TabNav ariaLabel="Jobs and Reports sections">
          <TabNav.Item 
            to="#jobs" 
            isActive={activeSubTab === 'jobs'}
            onClick={() => setActiveSubTab('jobs')}
          >
            <Briefcase className="w-4 h-4" />
            Jobs
          </TabNav.Item>
          <TabNav.Item 
            to="#reports" 
            isActive={activeSubTab === 'reports'}
            onClick={() => setActiveSubTab('reports')}
          >
            <FileText className="w-4 h-4" />
            Service Reports
          </TabNav.Item>
        </TabNav>
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