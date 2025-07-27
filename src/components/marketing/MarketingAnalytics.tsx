import React from 'react';
import { CampaignAnalytics } from './CampaignAnalytics';

export const MarketingAnalytics: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Analytics Dashboard */}
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 font-inter mb-4">Marketing Analytics</h2>
        <p className="text-gray-600 font-inter mb-6">Track campaign performance and customer engagement metrics</p>
        <CampaignAnalytics />
      </div>
    </div>
  );
};