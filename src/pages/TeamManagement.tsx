import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { TeamManagementLayout } from '@/components/team/TeamManagementLayout';
import { UserManagementSection } from '@/components/settings/UserManagementSection';
import { DriverWorkingHoursSection } from '@/components/settings/DriverWorkingHoursSection';
import { DriverTimeOffSection } from '@/components/settings/DriverTimeOffSection';
import { TeamSchedulingTab } from '@/components/team/TeamSchedulingTab';
import { TeamAnalyticsTab } from '@/components/team/TeamAnalyticsTab';
import { TrainingCertificationsTab } from '@/components/team/TrainingCertificationsTab';
import { BulkDriverOperations } from '@/components/team/BulkDriverOperations';
import { ComplianceDashboard } from '@/components/team/ComplianceDashboard';
import { CustomReportBuilder } from '@/components/team/CustomReportBuilder';


import { DetailedDriverProfile } from '@/components/driver/DetailedDriverProfile';

type TeamTab = 'users' | 'scheduling' | 'time-off' | 'analytics' | 'training' | 'bulk-operations' | 'compliance' | 'reports' | 'driver';

export default function TeamManagement() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  
  // Check if we're on a driver detail page
  const isDriverDetail = location.pathname.includes('/driver/');
  // Extract tab from URL or default to 'users'
  const currentTab = isDriverDetail ? 'driver' : (location.pathname.split('/').pop() as TeamTab) || 'users';
  
  useEffect(() => {
    document.title = 'Team Management | PortaPro';
  }, []);
  
  // Redirect to users tab if on base route
  useEffect(() => {
    if (location.pathname === '/team-management') {
      navigate('/team-management/users', { replace: true });
    }
  }, [location.pathname, navigate]);

  return (
    <TeamManagementLayout>
      <div className="space-y-6">
        {currentTab === 'users' && <UserManagementSection />}
        {currentTab === 'scheduling' && <TeamSchedulingTab />}
        {currentTab === 'time-off' && <DriverTimeOffSection onBack={() => navigate('/team-management/users')} />}
        {currentTab === 'analytics' && <TeamAnalyticsTab />}
        {currentTab === 'training' && <TrainingCertificationsTab />}
        {currentTab === 'bulk-operations' && <BulkDriverOperations />}
        {currentTab === 'compliance' && <ComplianceDashboard />}
        {currentTab === 'reports' && <CustomReportBuilder />}
        
        
        {currentTab === 'driver' && <DetailedDriverProfile />}
      </div>
    </TeamManagementLayout>
  );
}