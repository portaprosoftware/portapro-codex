import React from 'react';
import { CampaignCreation } from './CampaignCreation';
import { CampaignAnalytics } from './CampaignAnalytics';
import { Badge } from '@/components/ui/badge';

export const CampaignManagement: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Campaign Creation */}
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 font-inter mb-4">Create Campaign</h2>
        <CampaignCreation />
      </div>

      {/* Campaign Analytics */}
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 font-inter mb-4">Campaign Performance</h2>
        <CampaignAnalytics />
      </div>

      {/* Customer Types Overview */}
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 font-inter mb-4">Customer Types</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Badge variant="purple" className="font-semibold">Events & Festivals</Badge>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Badge variant="info" className="font-semibold">Construction</Badge>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Badge variant="success" className="font-semibold">Municipal & Government</Badge>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Badge variant="gradient" className="font-semibold">Private Events & Weddings</Badge>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Badge variant="warning" className="font-semibold">Sports & Recreation</Badge>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Badge variant="destructive" className="font-semibold">Emergency & Disaster Relief</Badge>
          </div>
        </div>
      </div>
    </div>
  );
};