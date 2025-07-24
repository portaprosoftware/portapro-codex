
import React, { useState } from 'react';
import { useUserRole } from '@/hooks/useUserRole';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, ChevronDown, Filter, X, BarChart3 } from 'lucide-react';
import { GlobalFilters } from '@/components/analytics/GlobalFilters';
import { OverviewSection } from '@/components/analytics/OverviewSection';
import { RevenueSection } from '@/components/analytics/RevenueSection';
import { OperationsSection } from '@/components/analytics/OperationsSection';
import { CustomersSection } from '@/components/analytics/CustomersSection';
import { DriversSection } from '@/components/analytics/DriversSection';
import { ReportBuilder } from '@/components/analytics/ReportBuilder';

const Analytics = () => {
  const { hasAdminAccess } = useUserRole();
  const [activeTab, setActiveTab] = useState('overview');
  const [isReportBuilderOpen, setIsReportBuilderOpen] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date()
  });
  const [savedFilters, setSavedFilters] = useState<string[]>([]);

  if (!hasAdminAccess) {
    return (
      <div className="p-6">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
          <p className="text-gray-600">You don't have permission to view analytics.</p>
        </Card>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'revenue', label: 'Revenue' },
    { id: 'operations', label: 'Operations' },
    { id: 'customers', label: 'Customers' },
    { id: 'drivers', label: 'Drivers' },
    { id: 'reports', label: 'Reports' }
  ];

  const handleTabClick = (tabId: string) => {
    if (tabId === 'reports') {
      setIsReportBuilderOpen(true);
    } else {
      setActiveTab(tabId);
      setIsReportBuilderOpen(false);
    }
  };

  const renderActiveSection = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewSection dateRange={dateRange} />;
      case 'revenue':
        return <RevenueSection dateRange={dateRange} />;
      case 'operations':
        return <OperationsSection dateRange={dateRange} />;
      case 'customers':
        return <CustomersSection dateRange={dateRange} />;
      case 'drivers':
        return <DriversSection dateRange={dateRange} />;
      default:
        return <OverviewSection dateRange={dateRange} />;
    }
  };

  return (
    <div className="max-w-none px-6 py-6 min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white rounded-lg border shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 font-inter">Analytics</h1>
            <p className="text-base text-gray-600 font-inter mt-1">Executive dashboard and insights</p>
          </div>
          <Button
            onClick={() => setIsReportBuilderOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Report Builder
          </Button>
        </div>
      </div>

      {/* Global Filters */}
      <GlobalFilters
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        savedFilters={savedFilters}
        onRemoveFilter={(filter) => setSavedFilters(prev => prev.filter(f => f !== filter))}
        onResetAll={() => {
          setDateRange({
            from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            to: new Date()
          });
          setSavedFilters([]);
        }}
      />

      {/* Section Tabs */}
      <div className="bg-white border-b border-gray-200 px-6 -mx-6 mb-6 rounded-t-lg">
        <div className="flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-all duration-200 ${
                activeTab === tab.id && !isReportBuilderOpen
                  ? 'border-blue-500 text-blue-600 font-semibold'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } ${
                tab.id === 'reports' && isReportBuilderOpen
                  ? 'border-blue-500 text-blue-600 font-semibold'
                  : ''
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6 bg-white rounded-b-lg p-6 border border-t-0 shadow-sm">
        {renderActiveSection()}
      </div>

      {/* Report Builder Slide-out */}
      <ReportBuilder
        isOpen={isReportBuilderOpen}
        onClose={() => setIsReportBuilderOpen(false)}
        dateRange={dateRange}
      />
    </div>
  );
};

export default Analytics;
