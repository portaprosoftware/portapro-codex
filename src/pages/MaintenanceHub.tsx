
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from 'react-router-dom';
import { TabNav } from "@/components/ui/TabNav";
import { Button } from "@/components/ui/button";
import { ServiceCatalogTab } from "@/components/maintenance/ServiceCatalogTab";
import { ReportTemplatesTab } from "@/components/maintenance/ReportTemplatesTab";
import { ServiceRecordsTab } from "@/components/maintenance/ServiceRecordsTab";
import { LogPastServiceModal } from "@/components/maintenance/LogPastServiceModal";
import { Calendar } from "lucide-react";

export default function MaintenanceHub() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'catalog' | 'templates' | 'records'>('catalog');
  const [showLogPastService, setShowLogPastService] = useState(false);

  // Set the active tab based on URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tab = urlParams.get('tab');
    if (tab && ['catalog', 'templates', 'records'].includes(tab)) {
      setActiveTab(tab as 'catalog' | 'templates' | 'records');
    }
  }, [location.search]);

  return (
    <div className="max-w-none px-4 md:px-6 py-6 min-h-screen bg-gray-50">
      {/* Page Header with Navigation Pills */}
      <div className="bg-white rounded-lg border shadow-sm p-4 md:p-6 mb-6">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-semibold text-gray-900 font-inter">Services Hub</h1>
              <p className="text-sm md:text-base text-gray-600 font-inter mt-1">Track completed work, manage your service offerings, and generate professional service reports</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Button 
                variant="outline" 
                className="border-blue-500 text-blue-600 hover:bg-blue-50 w-full sm:w-auto"
                onClick={() => setShowLogPastService(true)}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Log Past Service
              </Button>
            </div>
          </div>
          
          {/* Services Sub-Navigation Pills */}
          <div className="flex items-center space-x-4">
            <div className="enterprise-tabs">
              <TabNav ariaLabel="Services views">
                <TabNav.Item 
                  to="/maintenance-hub?tab=catalog" 
                  isActive={activeTab === 'catalog'}
                  onClick={() => setActiveTab('catalog')}
                >
                  Service Catalog
                </TabNav.Item>
                <TabNav.Item 
                  to="/maintenance-hub?tab=records" 
                  isActive={activeTab === 'records'}
                  onClick={() => setActiveTab('records')}
                >
                  Completed Records & Reports
                </TabNav.Item>
                <TabNav.Item 
                  to="/maintenance-hub?tab=templates" 
                  isActive={activeTab === 'templates'}
                  onClick={() => setActiveTab('templates')}
                >
                  Report Templates
                </TabNav.Item>
              </TabNav>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="space-y-6">
        {activeTab === 'catalog' && (
          <ServiceCatalogTab />
        )}

        {activeTab === 'templates' && (
          <ReportTemplatesTab />
        )}

        {activeTab === 'records' && (
          <ServiceRecordsTab />
        )}
      </div>

      {/* Modals */}
      <LogPastServiceModal
        isOpen={showLogPastService}
        onClose={() => setShowLogPastService(false)}
      />
    </div>
  );
}
