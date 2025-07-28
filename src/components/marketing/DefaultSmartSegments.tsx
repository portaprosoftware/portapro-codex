import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Target, Calendar, DollarSign, RefreshCw, Mail, Phone, Crown } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface SmartSegmentTemplate {
  id: string;
  name: string;
  description: string;
  businessGoal: string;
  icon: React.ReactNode;
  color: string;
  ruleSet: any;
  estimatedCount?: number;
}

const defaultSegments: SmartSegmentTemplate[] = [
  {
    id: 'new_customers',
    name: 'New Customers',
    description: 'Customers who registered in the last 30 days',
    businessGoal: 'On-board & welcome any account created recently',
    icon: <Users className="w-5 h-5" />,
    color: 'success',
    ruleSet: {
      rules: [{
        id: '1',
        field: 'created_at',
        operator: 'after',
        value: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        logic: 'AND'
      }]
    }
  },
  {
    id: 'active_customers',
    name: 'Active Customers',
    description: 'Customers with jobs in the last 60 days',
    businessGoal: 'Reward customers who are actively using your services',
    icon: <Target className="w-5 h-5" />,
    color: 'info',
    ruleSet: {
      rules: [{
        id: '1',
        field: 'last_job_date',
        operator: 'after',
        value: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        logic: 'AND'
      }]
    }
  },
  {
    id: 'lapsed_customers',
    name: 'Lapsed Customers',
    description: 'Customers with no jobs in the last 90 days',
    businessGoal: 'Re-engage accounts that have gone idle',
    icon: <Calendar className="w-5 h-5" />,
    color: 'warning',
    ruleSet: {
      rules: [{
        id: '1',
        field: 'last_job_date',
        operator: 'before',
        value: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        logic: 'AND'
      }]
    }
  },
  {
    id: 'big_spenders',
    name: 'Big Spenders',
    description: 'Customers who have spent $5,000 or more',
    businessGoal: 'Upsell or provide VIP perks for high-value accounts',
    icon: <DollarSign className="w-5 h-5" />,
    color: 'purple',
    ruleSet: {
      rules: [{
        id: '1',
        field: 'total_spent',
        operator: 'greater_than',
        value: '5000',
        logic: 'AND'
      }]
    }
  },
  {
    id: 'frequent_users',
    name: 'Frequent Users',
    description: 'Customers with 10 or more total jobs',
    businessGoal: 'Promote bulk-order discounts to heavy users',
    icon: <RefreshCw className="w-5 h-5" />,
    color: 'gradient',
    ruleSet: {
      rules: [{
        id: '1',
        field: 'total_jobs',
        operator: 'greater_than',
        value: '10',
        logic: 'AND'
      }]
    }
  },
  {
    id: 'email_only_contacts',
    name: 'Email-Only Contacts',
    description: 'Customers with email but no phone number',
    businessGoal: 'Send email-centric offers (no SMS compliance worries)',
    icon: <Mail className="w-5 h-5" />,
    color: 'info',
    ruleSet: {
      rules: [
        {
          id: '1',
          field: 'email',
          operator: 'is_not_null',
          value: '',
          logic: 'AND'
        },
        {
          id: '2',
          field: 'phone',
          operator: 'is_null',
          value: '',
          logic: 'AND'
        }
      ]
    }
  },
  {
    id: 'sms_ready',
    name: 'SMS-Ready',
    description: 'Customers with phone numbers available',
    businessGoal: 'Target reminders or flash deals via text',
    icon: <Phone className="w-5 h-5" />,
    color: 'success',
    ruleSet: {
      rules: [{
        id: '1',
        field: 'phone',
        operator: 'is_not_null',
        value: '',
        logic: 'AND'
      }]
    }
  },
  {
    id: 'high_priority_accounts',
    name: 'High-Priority Accounts',
    description: 'Top 10% of customers by total spending',
    businessGoal: 'Give your top customers premier service & check-ins',
    icon: <Crown className="w-5 h-5" />,
    color: 'purple',
    ruleSet: {
      rules: [{
        id: '1',
        field: 'total_spent',
        operator: 'top_percent',
        value: '10',
        logic: 'AND'
      }]
    }
  }
];

interface DefaultSmartSegmentsProps {
  onCreateFromTemplate: (template: SmartSegmentTemplate) => void;
  onPreviewTemplate: (template: SmartSegmentTemplate) => void;
}

export const DefaultSmartSegments: React.FC<DefaultSmartSegmentsProps> = ({ onCreateFromTemplate, onPreviewTemplate }) => {
  const [refreshingCounts, setRefreshingCounts] = useState<string[]>([]);

  // Fetch segment counts
  const { data: segmentCounts, refetch: refetchCounts } = useQuery({
    queryKey: ['smart-segment-counts'],
    queryFn: async () => {
      const counts: Record<string, number> = {};
      
      for (const segment of defaultSegments) {
        try {
          const { data, error } = await supabase.rpc('calculate_smart_segment_size', { 
            segment_type: segment.id 
          });
          
          if (!error && data !== null) {
            counts[segment.id] = data;
          } else {
            counts[segment.id] = 0;
          }
        } catch (error) {
          console.error(`Error calculating size for ${segment.id}:`, error);
          counts[segment.id] = 0;
        }
      }
      
      return counts;
    }
  });

  const refreshSegmentCount = async (segmentId: string) => {
    setRefreshingCounts(prev => [...prev, segmentId]);
    try {
      await refetchCounts();
      toast({ title: 'Segment counts refreshed' });
    } catch (error) {
      toast({ title: 'Error refreshing counts', variant: 'destructive' });
    } finally {
      setRefreshingCounts(prev => prev.filter(id => id !== segmentId));
    }
  };

  const getUsageTips = (segmentId: string) => {
    const tips: Record<string, string> = {
      'new_customers': 'Trigger a "Welcome" drip campaign, coupon for first service, plus setup tips.',
      'active_customers': 'Offer a loyalty bonus ("Thank you for your business—get 10% off your next refill").',
      'lapsed_customers': 'Send a "We Miss You" note with a limited-time discount to bring them back.',
      'big_spenders': 'Roll out VIP service add-ons, quarterly business reviews, or a referral bonus.',
      'frequent_users': 'Promote special "volume" pricing on long-term or high-volume rentals.',
      'email_only_contacts': 'Exclusive email newsletters, product announcements, no SMS links.',
      'sms_ready': 'Flash deals ("24-hour portable restroom service special!") sent via text.',
      'high_priority_accounts': 'Assign dedicated account manager, send premium service alerts.'
    };
    return tips[segmentId] || '';
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 font-inter">Ready-to-Use Smart Segments</h3>
        <p className="text-gray-600 font-inter">Quick-start templates for common marketing scenarios</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {defaultSegments.map((segment) => (
          <Card key={segment.id} className="p-6 hover:shadow-md transition-shadow">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-gradient-${segment.color} text-white`}>
                    {segment.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 font-inter">{segment.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={segment.color as any} className="text-xs">
                        {segmentCounts?.[segment.id] ?? 0} customers
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => refreshSegmentCount(segment.id)}
                        disabled={refreshingCounts.includes(segment.id)}
                        className="h-5 w-5 p-0"
                      >
                        <RefreshCw className={`w-3 h-3 ${refreshingCounts.includes(segment.id) ? 'animate-spin' : ''}`} />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <p className="text-sm text-gray-600 font-inter">{segment.description}</p>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs font-medium text-gray-700 font-inter mb-1">Business Goal:</p>
                  <p className="text-xs text-gray-600 font-inter">{segment.businessGoal}</p>
                </div>
              </div>

              {/* Usage Tips */}
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs font-medium text-blue-800 font-inter mb-1">Usage Tips:</p>
                <p className="text-xs text-blue-700 font-inter">{getUsageTips(segment.id)}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    console.log('Create from template clicked:', segment.name);
                    onCreateFromTemplate(segment);
                  }}
                  className="flex-1 bg-primary text-white"
                >
                  Create from Template
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="px-3"
                  onClick={() => {
                    console.log('Preview clicked:', segment.name);
                    onPreviewTemplate(segment);
                  }}
                >
                  Preview
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};