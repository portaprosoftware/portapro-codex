
import React from "react";
import { Badge } from "@/components/ui/badge";

interface CustomerTypeCardProps {
  type: string;
  label: string;
  color: string;
  count: number;
  email: number;
  sms: number;
  both: number;
}

export const CustomerTypeCard: React.FC<CustomerTypeCardProps> = ({
  label,
  color,
  count,
  email,
  sms,
  both
}) => {
  return (
    <div className="bg-white rounded-md border shadow-sm p-4 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
      {/* Card Header */}
      <div className="flex items-center justify-between mb-4">
        <Badge 
          style={{ backgroundColor: color, color: 'white' }}
          className="rounded-md px-3 py-1 text-sm font-medium"
        >
          {label}
        </Badge>
        <span className="text-lg font-semibold text-gray-900">{count}</span>
      </div>

      {/* Channel Counts */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">✉️</span>
            <span className="text-sm text-gray-600">Email</span>
          </div>
          <span 
            className="font-medium text-sm px-2 py-1 rounded"
            style={{ backgroundColor: '#33CC66', color: 'white' }}
          >
            {email}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">💬</span>
            <span className="text-sm text-gray-600">SMS</span>
          </div>
          <span 
            className="font-medium text-sm px-2 py-1 rounded"
            style={{ backgroundColor: '#8A2BE2', color: 'white' }}
          >
            {sms}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">📈</span>
            <span className="text-sm text-gray-600">Both</span>
          </div>
          <span 
            className="font-medium text-sm px-2 py-1 rounded"
            style={{ backgroundColor: '#FF6600', color: 'white' }}
          >
            {both}
          </span>
        </div>
      </div>
    </div>
  );
};
