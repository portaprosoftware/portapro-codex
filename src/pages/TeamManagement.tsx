import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { TeamManagementLayout } from '@/components/team/TeamManagementLayout';
import { UserManagementSection } from '@/components/settings/UserManagementSection';
import { DriverWorkingHoursSection } from '@/components/settings/DriverWorkingHoursSection';
import { DriverTimeOffSection } from '@/components/settings/DriverTimeOffSection';
import { TeamSchedulingTab } from '@/components/team/TeamSchedulingTab';
import { TrainingCertificationsTab } from '@/components/team/TrainingCertificationsTab';
import { BulkTeamOperations } from '@/components/team/BulkTeamOperations';
import { ComplianceDashboard } from '@/components/team/ComplianceDashboard';
import { CustomReportBuilder } from '@/components/team/CustomReportBuilder';
import { useUserRole } from '@/hooks/useUserRole';

import { DetailedDriverProfile } from '@/components/driver/DetailedDriverProfile';

type TeamTab = 'users' | 'scheduling' | 'time-off' | 'training' | 'custom-reports' | 'bulk-operations' | 'compliance' | 'reports' | 'driver';

export default function TeamManagement() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const { isDriver, isLoaded, user } = useUserRole();
  
  // Check if we're on a driver detail page
  const isDriverDetail = location.pathname.includes('/driver/');
  // Extract tab from URL or default to 'users'
  const currentTab = isDriverDetail ? 'driver' : (location.pathname.split('/').pop() as TeamTab) || 'users';
  
  useEffect(() => {
    document.title = 'Team Management | PortaPro';
  }, []);
  
  // Only redirect drivers if we're fully loaded and confirmed as driver
  useEffect(() => {
    if (isLoaded && isDriver && user) {
      console.log('TeamManagement - Redirecting driver to /driver:', {
        userId: user.id,
        firstName: user.firstName,
        role: user.publicMetadata?.role
      });
      navigate('/driver', { replace: true });
    }
  }, [isLoaded, isDriver, user, navigate]);

  // If hitting a stale driver detail route without an ID, go back to users tab
  useEffect(() => {
    if (isDriverDetail && !(params as any).driverId) {
      navigate('/team-management/users', { replace: true });
    }
  }, [isDriverDetail, params, navigate]);
  
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
        {currentTab === 'training' && <TrainingCertificationsTab />}
        {currentTab === 'custom-reports' && <CustomReportBuilder />}
        {currentTab === 'bulk-operations' && <BulkTeamOperations />}
        {currentTab === 'compliance' && <ComplianceDashboard />}
        {currentTab === 'reports' && <CustomReportBuilder />}
        
        
        {currentTab === 'driver' && <DetailedDriverProfile />}
      </div>
    </TeamManagementLayout>
  );
}