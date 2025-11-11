import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Mail, Megaphone, Clock, Users2, FileText, ChevronDown, BarChart3 } from 'lucide-react';
import { TabNav } from '@/components/ui/TabNav';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import TemplatesPage from '@/pages/marketing/templates';
import { CampaignManagement } from './CampaignManagement';
import { ScheduledCampaigns } from './ScheduledCampaigns';
import { CustomerSegments } from './CustomerSegments';
import { DraftManagement } from './DraftManagement';
import { CampaignAnalyticsOverview } from './CampaignAnalyticsOverview';
import { cn } from '@/lib/utils';

type MarketingTab = 'overview' | 'templates' | 'campaigns' | 'scheduled' | 'segments' | 'drafts';

export const MarketingDashboard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<MarketingTab>('overview');
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Determine active tab from URL
  React.useEffect(() => {
    const path = location.pathname;
    if (path === '/marketing' || path === '/marketing/') {
      setActiveTab('overview');
    } else if (path.includes('/campaigns')) {
      setActiveTab('campaigns');
    } else if (path.includes('/templates')) {
      setActiveTab('templates');
    } else if (path.includes('/scheduled')) {
      setActiveTab('scheduled');
    } else if (path.includes('/segments')) {
      setActiveTab('segments');
    } else if (path.includes('/drafts')) {
      setActiveTab('drafts');
    } else {
      setActiveTab('overview');
    }
  }, [location]);

  const navigateToTab = (tab: MarketingTab) => {
    setActiveTab(tab);
    setIsSheetOpen(false);
    const basePath = '/marketing';
    switch (tab) {
      case 'overview':
        navigate(basePath);
        break;
      case 'campaigns':
        navigate(`${basePath}/campaigns`);
        break;
      case 'templates':
        navigate(`${basePath}/templates`);
        break;
      case 'scheduled':
        navigate(`${basePath}/scheduled`);
        break;
      case 'segments':
        navigate(`${basePath}/segments`);
        break;
      case 'drafts':
        navigate(`${basePath}/drafts`);
        break;
    }
  };

  const getActiveTabTitle = () => {
    switch (activeTab) {
      case 'overview': return 'Overview';
      case 'campaigns': return 'Campaigns';
      case 'templates': return 'Templates';
      case 'scheduled': return 'Scheduled';
      case 'segments': return 'Smart Segments';
      case 'drafts': return 'Drafts';
      default: return 'Overview';
    }
  };

  const getActiveTabIcon = () => {
    switch (activeTab) {
      case 'overview': return BarChart3;
      case 'campaigns': return Megaphone;
      case 'templates': return Mail;
      case 'scheduled': return Clock;
      case 'segments': return Users2;
      case 'drafts': return FileText;
      default: return BarChart3;
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <CampaignAnalyticsOverview />;
      case 'templates':
        return <TemplatesPage />;
      case 'campaigns':
        return <CampaignManagement />;
      case 'scheduled':
        return <ScheduledCampaigns />;
      case 'segments':
        return <CustomerSegments />;
      case 'drafts':
        return <DraftManagement />;
      default:
        return <CampaignAnalyticsOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-none px-4 md:px-6 py-6 space-y-6">
        {/* Page Header */}
        <div className="bg-white rounded-xl border shadow-sm p-4 md:p-6">
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 font-inter">Marketing</h1>
              <p className="text-sm md:text-base text-gray-600 font-inter mt-1">
                Manage templates, campaigns, and customer communications
              </p>
            </div>
            
            {/* Desktop Pills Navigation */}
            <div className="hidden lg:flex items-center space-x-4">
              <div className="enterprise-tabs">
                <TabNav ariaLabel="Marketing sections">
                  <TabNav.Item 
                    to="/marketing" 
                    isActive={activeTab === 'overview'}
                    onClick={() => navigateToTab('overview')}
                  >
                    <BarChart3 className="w-4 h-4" />
                    Overview
                  </TabNav.Item>
                  <TabNav.Item 
                    to="/marketing/campaigns" 
                    isActive={activeTab === 'campaigns'}
                    onClick={() => navigateToTab('campaigns')}
                  >
                    <Megaphone className="w-4 h-4" />
                    Campaigns
                  </TabNav.Item>
                  <TabNav.Item 
                    to="/marketing/templates" 
                    isActive={activeTab === 'templates'}
                    onClick={() => navigateToTab('templates')}
                  >
                    <Mail className="w-4 h-4" />
                    Templates
                  </TabNav.Item>
                  <TabNav.Item 
                    to="/marketing/scheduled" 
                    isActive={activeTab === 'scheduled'}
                    onClick={() => navigateToTab('scheduled')}
                  >
                    <Clock className="w-4 h-4" />
                    Scheduled
                  </TabNav.Item>
                  <TabNav.Item 
                    to="/marketing/segments" 
                    isActive={activeTab === 'segments'}
                    onClick={() => navigateToTab('segments')}
                  >
                    <Users2 className="w-4 h-4" />
                    Smart Segments
                  </TabNav.Item>
                  <TabNav.Item 
                    to="/marketing/drafts" 
                    isActive={activeTab === 'drafts'}
                    onClick={() => navigateToTab('drafts')}
                  >
                    <FileText className="w-4 h-4" />
                    Drafts
                  </TabNav.Item>
                </TabNav>
              </div>
            </div>

            {/* Mobile Sheet Navigation */}
            <div className="lg:hidden">
              <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="w-full min-h-[44px] justify-between">
                    <span className="flex items-center gap-2">
                      {React.createElement(getActiveTabIcon(), { className: "w-4 h-4" })}
                      {getActiveTabTitle()}
                    </span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[75vh] rounded-t-2xl">
                  <SheetHeader>
                    <SheetTitle>Marketing Sections</SheetTitle>
                  </SheetHeader>
                  <div className="space-y-2 mt-6">
                    <button
                      onClick={() => navigateToTab('overview')}
                      className={cn(
                        "w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-all min-h-[56px]",
                        activeTab === 'overview'
                          ? "bg-gradient-to-r from-blue-700 to-blue-800 text-white font-bold"
                          : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <BarChart3 className="w-5 h-5" />
                        Overview
                      </span>
                    </button>

                    <button
                      onClick={() => navigateToTab('campaigns')}
                      className={cn(
                        "w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-all min-h-[56px]",
                        activeTab === 'campaigns'
                          ? "bg-gradient-to-r from-blue-700 to-blue-800 text-white font-bold"
                          : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <Megaphone className="w-5 h-5" />
                        Campaigns
                      </span>
                    </button>
                    
                    <button
                      onClick={() => navigateToTab('templates')}
                      className={cn(
                        "w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-all min-h-[56px]",
                        activeTab === 'templates'
                          ? "bg-gradient-to-r from-blue-700 to-blue-800 text-white font-bold"
                          : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <Mail className="w-5 h-5" />
                        Templates
                      </span>
                    </button>

                    <button
                      onClick={() => navigateToTab('scheduled')}
                      className={cn(
                        "w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-all min-h-[56px]",
                        activeTab === 'scheduled'
                          ? "bg-gradient-to-r from-blue-700 to-blue-800 text-white font-bold"
                          : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <Clock className="w-5 h-5" />
                        Scheduled
                      </span>
                    </button>

                    <button
                      onClick={() => navigateToTab('segments')}
                      className={cn(
                        "w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-all min-h-[56px]",
                        activeTab === 'segments'
                          ? "bg-gradient-to-r from-blue-700 to-blue-800 text-white font-bold"
                          : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <Users2 className="w-5 h-5" />
                        Smart Segments
                      </span>
                    </button>

                    <button
                      onClick={() => navigateToTab('drafts')}
                      className={cn(
                        "w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-all min-h-[56px]",
                        activeTab === 'drafts'
                          ? "bg-gradient-to-r from-blue-700 to-blue-800 text-white font-bold"
                          : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <FileText className="w-5 h-5" />
                        Drafts
                      </span>
                    </button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {renderContent()}
      </div>
    </div>
  );
};