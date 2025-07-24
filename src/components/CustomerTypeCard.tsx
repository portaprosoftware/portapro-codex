
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
  type,
  label,
  color,
  count,
  email,
  sms,
  both
}) => {
  const getTypeGradient = (type: string) => {
    const typeGradients = {
      'residential': 'bg-gradient-to-r from-blue-500 to-blue-600',
      'commercial': 'bg-gradient-to-r from-purple-500 to-purple-600',
      'construction': 'bg-gradient-to-r from-orange-500 to-orange-600',
      'event': 'bg-gradient-to-r from-green-500 to-green-600',
      'emergency': 'bg-gradient-to-r from-red-500 to-red-600'
    };
    return typeGradients[type as keyof typeof typeGradients] || 'bg-gradient-to-r from-gray-500 to-gray-600';
  };
  return (
    <div className="bg-white rounded-md border shadow-sm p-4 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
      {/* Card Header */}
      <div className="flex items-center justify-between mb-4">
        <Badge className={`${getTypeGradient(type)} text-white border-0 font-medium px-3 py-1 rounded-full`}>
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
