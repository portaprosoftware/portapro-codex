
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from 'react-router-dom';
import { TabNav } from "@/components/ui/TabNav";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ServiceCatalogTab } from "@/components/maintenance/ServiceCatalogTab";
import { ServiceReportTemplatesTab } from "@/components/maintenance/ServiceReportTemplatesTab";
import { ServiceRecordsTab } from "@/components/maintenance/ServiceRecordsTab";
import { LogPastServiceModal } from "@/components/maintenance/LogPastServiceModal";
import { Calendar, ClipboardList, CheckCircle, FileText, ChevronDown, NotepadTextDashed } from "lucide-react";
import { cn } from "@/lib/utils";


export default function MaintenanceHub() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'catalog' | 'templates' | 'records'>('catalog');
  const [showLogPastService, setShowLogPastService] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Set the active tab based on URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tab = urlParams.get('tab');
    if (tab && ['catalog', 'templates', 'records'].includes(tab)) {
      setActiveTab(tab as 'catalog' | 'templates' | 'records');
    }
  }, [location.search]);

  const handleTabChange = (tab: 'catalog' | 'templates' | 'records') => {
    setActiveTab(tab);
    setIsSheetOpen(false);
  };

  const getActiveTabIcon = () => {
    switch (activeTab) {
      case 'catalog':
        return ClipboardList;
      case 'records':
        return CheckCircle;
      case 'templates':
        return NotepadTextDashed;
      default:
        return ClipboardList;
    }
  };

  const getActiveTabTitle = () => {
    switch (activeTab) {
      case 'catalog':
        return 'Service Catalog';
      case 'records':
        return 'Completed & Reports';
      case 'templates':
        return 'Report Templates';
      default:
        return 'Service Catalog';
    }
  };


  return (
    <div className="max-w-none px-4 md:px-6 py-6 min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Page Header with Navigation Pills */}
      <div className="bg-white rounded-lg border shadow-sm p-4 md:p-6 mb-6">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl md:text-2xl font-semibold text-gray-900 font-inter">Services Hub</h1>
              <p className="text-sm md:text-base text-gray-600 font-inter mt-1">Track completed work, manage your service offerings, and generate professional service reports</p>
            </div>
          </div>
          
          {/* Desktop Navigation Pills */}
          <div className="hidden lg:flex items-center space-x-4">
            <div className="enterprise-tabs">
              <TabNav ariaLabel="Services views">
                <TabNav.Item 
                  to="/maintenance-hub?tab=records" 
                  isActive={activeTab === 'records'}
                  onClick={() => setActiveTab('records')}
                >
                  <CheckCircle className="h-4 w-4" />
                  Completed Records & Reports
                </TabNav.Item>
                <TabNav.Item 
                  to="/maintenance-hub?tab=catalog" 
                  isActive={activeTab === 'catalog'}
                  onClick={() => setActiveTab('catalog')}
                >
                  <ClipboardList className="h-4 w-4" />
                  Service Catalog
                </TabNav.Item>
                <TabNav.Item 
                  to="/maintenance-hub?tab=templates" 
                  isActive={activeTab === 'templates'}
                  onClick={() => setActiveTab('templates')}
                >
                  <NotepadTextDashed className="h-4 w-4" />
                  Report Templates
                </TabNav.Item>
              </TabNav>
            </div>
          </div>

          {/* Mobile Navigation - Bottom Drawer */}
          <div className="lg:hidden">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <button
                  className="w-full flex items-center justify-between px-4 py-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors min-h-[44px]"
                  aria-label="Open navigation menu"
                >
                  <span className="text-sm font-medium flex items-center gap-2">
                    {React.createElement(getActiveTabIcon(), { className: "h-4 w-4" })}
                    {getActiveTabTitle()}
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>
              </SheetTrigger>
              <SheetContent 
                side="bottom" 
                className="h-[75vh] rounded-t-2xl"
              >
                <SheetHeader>
                  <SheetTitle className="text-left">Services Navigation</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-2">
                  <button
                    onClick={() => handleTabChange('records')}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-all min-h-[56px]",
                      activeTab === 'records'
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "hover:bg-muted text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5" />
                      <span className="text-base">Completed Records & Reports</span>
                    </div>
                  </button>
                  <button
                    onClick={() => handleTabChange('catalog')}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-all min-h-[56px]",
                      activeTab === 'catalog'
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "hover:bg-muted text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <ClipboardList className="h-5 w-5" />
                      <span className="text-base">Service Catalog</span>
                    </div>
                  </button>
                  <button
                    onClick={() => handleTabChange('templates')}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-all min-h-[56px]",
                      activeTab === 'templates'
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "hover:bg-muted text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <NotepadTextDashed className="h-5 w-5" />
                      <span className="text-base">Report Templates</span>
                    </div>
                  </button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="space-y-6">
        {activeTab === 'catalog' && (
          <ServiceCatalogTab />
        )}

        {activeTab === 'templates' && (
          <ServiceReportTemplatesTab />
        )}

        {activeTab === 'records' && (
          <ServiceRecordsTab onLogPastService={() => setShowLogPastService(true)} />
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
