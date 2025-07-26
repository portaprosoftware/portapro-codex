import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/ui/PageHeader';
import { Users, Calendar, Clock, BarChart3, GraduationCap, Home } from 'lucide-react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { UserManagementSection } from '@/components/settings/UserManagementSection';
import { DriverWorkingHoursSection } from '@/components/settings/DriverWorkingHoursSection';
import { DriverTimeOffSection } from '@/components/settings/DriverTimeOffSection';
import { TeamSchedulingTab } from '@/components/team/TeamSchedulingTab';
import { TeamAnalyticsTab } from '@/components/team/TeamAnalyticsTab';
import { TrainingCertificationsTab } from '@/components/team/TrainingCertificationsTab';

type TeamTab = 'users' | 'scheduling' | 'time-off' | 'analytics' | 'training';

export default function TeamManagement() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract tab from URL or default to 'users'
  const currentTab = (location.pathname.split('/').pop() as TeamTab) || 'users';
  
  const handleTabChange = (tab: TeamTab) => {
    navigate(`/team-management/${tab}`);
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/dashboard">
                  <Home className="h-4 w-4" />
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Team Management</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <h1 className="text-2xl sm:text-3xl font-bold">Team Management</h1>
        <p className="text-muted-foreground mt-2 text-sm sm:text-base">Manage your team members, schedules, time off, and performance</p>
      </div>

      <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-5 h-auto">
          <TabsTrigger value="users" className="flex items-center gap-1 px-2 py-2 text-xs sm:text-sm">
            <Users className="h-4 w-4 flex-shrink-0" />
            <span className="hidden sm:inline">Users</span>
            <span className="sm:hidden">U</span>
          </TabsTrigger>
          <TabsTrigger value="scheduling" className="flex items-center gap-1 px-2 py-2 text-xs sm:text-sm">
            <Calendar className="h-4 w-4 flex-shrink-0" />
            <span className="hidden sm:inline">Scheduling</span>
            <span className="sm:hidden">S</span>
          </TabsTrigger>
          <TabsTrigger value="time-off" className="flex items-center gap-1 px-2 py-2 text-xs sm:text-sm">
            <Clock className="h-4 w-4 flex-shrink-0" />
            <span className="hidden sm:inline">Time Off</span>
            <span className="sm:hidden">T</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-1 px-2 py-2 text-xs sm:text-sm">
            <BarChart3 className="h-4 w-4 flex-shrink-0" />
            <span className="hidden sm:inline">Analytics</span>
            <span className="sm:hidden">A</span>
          </TabsTrigger>
          <TabsTrigger value="training" className="flex items-center gap-1 px-2 py-2 text-xs sm:text-sm">
            <GraduationCap className="h-4 w-4 flex-shrink-0" />
            <span className="hidden sm:inline">Training</span>
            <span className="sm:hidden">T</span>
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="users" className="space-y-6">
            <UserManagementSection />
          </TabsContent>

          <TabsContent value="scheduling" className="space-y-6">
            <TeamSchedulingTab />
          </TabsContent>

          <TabsContent value="time-off" className="space-y-6">
            <DriverTimeOffSection onBack={() => handleTabChange('users')} />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <TeamAnalyticsTab />
          </TabsContent>

          <TabsContent value="training" className="space-y-6">
            <TrainingCertificationsTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}