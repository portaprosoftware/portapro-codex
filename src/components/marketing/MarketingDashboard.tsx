import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Mail, Megaphone, Clock, Users2, FileText } from 'lucide-react';
import { TabNav } from '@/components/ui/TabNav';
import { TemplateManagement } from './TemplateManagement';
import { CampaignManagement } from './CampaignManagement';
import { ScheduledCampaigns } from './ScheduledCampaigns';
import { CustomerSegments } from './CustomerSegments';
import { DraftManagement } from './DraftManagement';

type MarketingTab = 'templates' | 'campaigns' | 'scheduled' | 'segments' | 'drafts';

export const MarketingDashboard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<MarketingTab>('campaigns');

  // Determine active tab from URL
  React.useEffect(() => {
    const path = location.pathname;
    if (path.includes('/campaigns')) {
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
      setActiveTab('campaigns');
    }
  }, [location]);

  const navigateToTab = (tab: MarketingTab) => {
    setActiveTab(tab);
    const basePath = '/marketing';
    switch (tab) {
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

  const renderContent = () => {
    switch (activeTab) {
      case 'templates':
        return <TemplateManagement />;
      case 'campaigns':
        return <CampaignManagement />;
      case 'scheduled':
        return <ScheduledCampaigns />;
      case 'segments':
        return <CustomerSegments />;
      case 'drafts':
        return <DraftManagement />;
      default:
        return <CampaignManagement />;
    }
  };

  return (
    <div className="p-6 space-y-8">
      {/* Page Header */}
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 font-inter">Marketing</h1>
            <p className="text-base text-gray-600 font-inter mt-1">Manage templates, campaigns, and customer communications</p>
          </div>
          
          {/* Marketing Sub-Navigation Pills */}
          <div className="flex items-center space-x-4">
            <div className="enterprise-tabs">
              <TabNav ariaLabel="Marketing sections">
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
        </div>
      </div>

      {/* Content Area */}
      {renderContent()}
    </div>
  );
};