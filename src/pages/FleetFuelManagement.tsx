import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FleetLayout } from '@/components/fleet/FleetLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { FuelOverviewTab } from '@/components/fleet/fuel/FuelOverviewTab';
import { FuelAllLogsTab } from '@/components/fleet/fuel/FuelAllLogsTab';
import { FuelReportsTab } from '@/components/fleet/fuel/FuelReportsTab';
import { FuelSettingsTab } from '@/components/fleet/fuel/FuelSettingsTab';

export const FleetFuelManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  useEffect(() => {
    document.title = 'Fuel Management | PortaPro';
  }, []);

  return (
    <FleetLayout>
      <div className="space-y-6">
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <PageHeader 
            title="Fuel Management" 
            subtitle="Track fuel usage, costs, and efficiency across your fleet"
          />
          
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-full font-medium text-sm transition-all duration-200 font-inter ${
                activeTab === 'overview'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold shadow-sm'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-4 py-2 rounded-full font-medium text-sm transition-all duration-200 font-inter ${
                activeTab === 'logs'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold shadow-sm'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              All Logs
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-4 py-2 rounded-full font-medium text-sm transition-all duration-200 font-inter ${
                activeTab === 'reports'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold shadow-sm'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              Reports
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 rounded-full font-medium text-sm transition-all duration-200 font-inter ${
                activeTab === 'settings'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold shadow-sm'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              Settings
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

            <TabsContent value="overview" className="mt-6">
              <FuelOverviewTab />
            </TabsContent>

            <TabsContent value="logs" className="mt-6">
              <FuelAllLogsTab />
            </TabsContent>

            <TabsContent value="reports" className="mt-6">
              <FuelReportsTab />
            </TabsContent>

            <TabsContent value="settings" className="mt-6">
              <FuelSettingsTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </FleetLayout>
  );
};