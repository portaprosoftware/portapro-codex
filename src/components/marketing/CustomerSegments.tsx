import React from 'react';
import { SmartSegmentBuilder } from './SmartSegmentBuilder';

export const CustomerSegments: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Segment Builder */}
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 font-inter mb-4">Customer Segments</h2>
        <p className="text-gray-600 font-inter mb-6">Create and manage customer segments for targeted marketing campaigns</p>
        <SmartSegmentBuilder />
      </div>
    </div>
  );
};