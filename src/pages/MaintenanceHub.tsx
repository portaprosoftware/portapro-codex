
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from 'react-router-dom';
import { TabNav } from "@/components/ui/TabNav";
import { Button } from "@/components/ui/button";
import { MaintenanceReportsTab } from "@/components/maintenance/MaintenanceReportsTab";
import { ServicesProvidedTab } from "@/components/maintenance/ServicesProvidedTab";
import { ReportTemplatesTab } from "@/components/maintenance/ReportTemplatesTab";
import { CreateServiceRecordModal } from "@/components/maintenance/CreateServiceRecordModal";
import { ImportReportsModal } from "@/components/maintenance/ImportReportsModal";
import { FileDown, Plus } from "lucide-react";

export default function MaintenanceHub() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'reports' | 'services' | 'templates'>('reports');
  const [showCreateRecord, setShowCreateRecord] = useState(false);
  const [showImportReports, setShowImportReports] = useState(false);

  // Set the active tab based on URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tab = urlParams.get('tab');
    if (tab && ['reports', 'services', 'templates'].includes(tab)) {
      setActiveTab(tab as 'reports' | 'services' | 'templates');
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
                onClick={() => setShowImportReports(true)}
              >
                <FileDown className="w-4 h-4 mr-2" />
                Import Reports
              </Button>
              <Button 
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full px-4 py-2 w-full sm:w-auto"
                onClick={() => setShowCreateRecord(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                New Service Record
              </Button>
            </div>
          </div>
          
          {/* Services Sub-Navigation Pills */}
          <div className="flex items-center space-x-4">
            <div className="enterprise-tabs">
              <TabNav ariaLabel="Services views">
                <TabNav.Item 
                  to="/maintenance-hub?tab=reports" 
                  isActive={activeTab === 'reports'}
                  onClick={() => setActiveTab('reports')}
                >
                  Service Records
                </TabNav.Item>
                <TabNav.Item 
                  to="/maintenance-hub?tab=services" 
                  isActive={activeTab === 'services'}
                  onClick={() => setActiveTab('services')}
                >
                  Services Offered
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
        {activeTab === 'reports' && (
          <MaintenanceReportsTab />
        )}

        {activeTab === 'services' && (
          <ServicesProvidedTab />
        )}

        {activeTab === 'templates' && (
          <ReportTemplatesTab />
        )}
      </div>

      {/* Modals */}
      <CreateServiceRecordModal
        isOpen={showCreateRecord}
        onClose={() => setShowCreateRecord(false)}
      />
      
      <ImportReportsModal
        isOpen={showImportReports}
        onClose={() => setShowImportReports(false)}
      />
    </div>
  );
}
