
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
    <div className="max-w-none px-6 py-6 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white rounded-lg border shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
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

        {/* Navigation Pills */}
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id && !isReportBuilderOpen
                  ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md'
                  : tab.id === 'reports' && isReportBuilderOpen
                  ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gradient-to-r hover:from-blue-100 hover:to-blue-50 hover:text-blue-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
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


      {/* Main Content */}
      <div className="space-y-6 bg-white rounded-lg p-6 border shadow-sm">
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
