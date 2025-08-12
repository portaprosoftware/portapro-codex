import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
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
import { ExpirationForecasting } from '@/components/team/ExpirationForecasting';
import { PushNotificationSupport } from '@/components/team/PushNotificationSupport';

type TeamTab = 'users' | 'scheduling' | 'time-off' | 'analytics' | 'training' | 'bulk-operations' | 'compliance' | 'reports' | 'forecasting' | 'notifications';

export default function TeamManagement() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract tab from URL or default to 'users'
  const currentTab = (location.pathname.split('/').pop() as TeamTab) || 'users';
  
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
        {currentTab === 'forecasting' && <ExpirationForecasting />}
        {currentTab === 'notifications' && <PushNotificationSupport />}
      </div>
    </TeamManagementLayout>
  );
}