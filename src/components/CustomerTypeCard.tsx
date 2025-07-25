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
      'events_festivals': 'bg-gradient-to-r from-purple-500 to-purple-600',
      'sports_recreation': 'bg-gradient-to-r from-green-500 to-green-600', 
      'municipal_government': 'bg-gradient-to-r from-blue-500 to-blue-600',
      'commercial': 'bg-gradient-to-r from-gray-600 to-gray-700',
      'construction': 'bg-gradient-to-r from-orange-500 to-orange-600',
      'emergency_disaster_relief': 'bg-gradient-to-r from-red-500 to-red-600',
      'private_events_weddings': 'bg-gradient-to-r from-pink-500 to-pink-600'
    };
    return typeGradients[type as keyof typeof typeGradients] || 'bg-gradient-to-r from-gray-500 to-gray-600';
  };

  const getChannelColors = (type: string) => {
    const channelColors = {
      'events_festivals': { email: '#8A2BE2', sms: '#8A2BE2', both: '#8A2BE2' },
      'sports_recreation': { email: '#22C55E', sms: '#22C55E', both: '#22C55E' },
      'municipal_government': { email: '#3B82F6', sms: '#3B82F6', both: '#3B82F6' },
      'commercial': { email: '#22C55E', sms: '#8A2BE2', both: '#F97316' },
      'construction': { email: '#F97316', sms: '#F97316', both: '#F97316' },
      'emergency_disaster_relief': { email: '#EF4444', sms: '#EF4444', both: '#EF4444' },
      'private_events_weddings': { email: '#22C55E', sms: '#8A2BE2', both: '#F97316' }
    };
    return channelColors[type as keyof typeof channelColors] || { email: '#6B7280', sms: '#6B7280', both: '#6B7280' };
  };

  const colors = getChannelColors(type);

  return (
    <div className="bg-white rounded-md border shadow-sm p-4 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
      {/* Card Header */}
      <div className="flex items-center justify-between mb-4">
        <Badge className={`${getTypeGradient(type)} text-white border-0 font-bold px-3 py-1 rounded-full`}>
          {label}
        </Badge>
        <div className={`${getTypeGradient(type)} text-white border-0 font-bold px-3 py-1 rounded-full text-lg`}>
          {count}
        </div>
      </div>

      {/* Channel Counts */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg emoji-icon">✉️</span>
            <span className="text-sm text-gray-600">Email</span>
          </div>
          <span className="text-sm text-gray-900 font-medium">
            {email}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg emoji-icon">💬</span>
            <span className="text-sm text-gray-600">SMS</span>
          </div>
          <span className="text-sm text-gray-900 font-medium">
            {sms}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg emoji-icon">📈</span>
            <span className="text-sm text-gray-600">Both</span>
          </div>
          <span className="text-sm text-gray-900 font-medium">
            {both}
          </span>
        </div>
      </div>
    </div>
  );
};