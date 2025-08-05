import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SmartSegmentBuilder } from './SmartSegmentBuilder';
import { DefaultSmartSegments } from './DefaultSmartSegments';
import { SegmentPreviewModal } from './SegmentPreviewModal';
import { toast } from '@/components/ui/use-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Target, Calendar, DollarSign, RefreshCw, Mail, Phone, Crown, Trash2 } from 'lucide-react';

interface SmartSegmentTemplate {
  id: string;
  name: string;
  description: string;
  businessGoal: string;
  icon: React.ReactNode;
  color: string;
  ruleSet: any;
}

// Default segments templates for auto-creation
const defaultSegmentTemplates = [
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

export const CustomerSegments: React.FC = () => {
  const [previewSegment, setPreviewSegment] = useState<SmartSegmentTemplate | null>(null);
  const queryClient = useQueryClient();

  // Fetch existing segments
  const { data: existingSegments = [], isLoading } = useQuery({
    queryKey: ['customer-segments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_segments')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  // Auto-create missing default segments
  useEffect(() => {
    const autoCreateMissingSegments = async () => {
      if (isLoading) return; // Wait for loading to complete

      const existingNames = existingSegments.map(seg => seg.name);
      const missingSegments = defaultSegmentTemplates.filter(
        template => !existingNames.includes(template.name)
      );

      if (missingSegments.length > 0) {
        console.log(`Auto-creating ${missingSegments.length} missing default segments`);
        
        for (const template of missingSegments) {
          try {
            const { error } = await supabase
              .from('customer_segments')
              .insert({
                name: template.name,
                description: template.description,
                rule_set: template.ruleSet,
                customer_count: 0,
                segment_type: 'smart'
              });
            
            if (error) {
              console.error(`Error creating ${template.name}:`, error);
            }
          } catch (error) {
            console.error(`Error creating ${template.name}:`, error);
          }
        }

        // Refresh the segments list
        queryClient.invalidateQueries({ queryKey: ['customer-segments'] });
        
        if (missingSegments.length > 0) {
          toast({
            title: 'Default segments created',
            description: `Created ${missingSegments.length} missing default segments.`
          });
        }
      }
    };

    autoCreateMissingSegments();
  }, [existingSegments, queryClient, isLoading]);

  // Delete segment mutation
  const deleteSegmentMutation = useMutation({
    mutationFn: async (segmentId: string) => {
      const { error } = await supabase
        .from('customer_segments')
        .delete()
        .eq('id', segmentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-segments'] });
      toast({ title: 'Segment deleted successfully' });
    },
    onError: () => {
      toast({ title: 'Error deleting segment', variant: 'destructive' });
    }
  });

  // Create segment from template mutation
  const createFromTemplateMutation = useMutation({
    mutationFn: async (template: SmartSegmentTemplate) => {
      const { error } = await supabase
        .from('customer_segments')
        .insert({
          name: template.name,
          description: template.description,
          rule_set: template.ruleSet,
          customer_count: 0,
          segment_type: 'smart'
        });
      
      if (error) throw error;
    },
    onSuccess: (_, template) => {
      queryClient.invalidateQueries({ queryKey: ['customer-segments'] });
      toast({ 
        title: 'Smart segment created successfully!',
        description: `"${template.name}" segment is now ready for campaigns.`
      });
    },
    onError: () => {
      toast({ title: 'Error creating segment', variant: 'destructive' });
    }
  });

  const handleCreateFromTemplate = (template: SmartSegmentTemplate) => {
    console.log('Creating segment from template:', template.name);
    createFromTemplateMutation.mutate(template);
  };

  const handlePreviewTemplate = (template: SmartSegmentTemplate) => {
    setPreviewSegment(template);
  };

  return (
    <div className="space-y-8">
      {/* Existing Segments List */}
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 font-inter">Your Smart Segments</h2>
            <p className="text-gray-600 font-inter">Manage your created customer segments</p>
          </div>
          <Badge variant="outline" className="font-inter">
            {existingSegments.length} segments
          </Badge>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-gray-400" />
            <p className="text-gray-500 font-inter mt-2">Loading segments...</p>
          </div>
        ) : existingSegments.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-inter">No segments created yet</p>
            <p className="text-sm text-gray-400 font-inter">Create your first segment using the tools below</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {existingSegments.map((segment) => (
              <Card key={segment.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 font-inter">{segment.name}</h4>
                    <p className="text-sm text-gray-600 font-inter mt-1">{segment.description}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteSegmentMutation.mutate(segment.id)}
                    className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs font-inter">
                    {segment.customer_count || 0} customers
                  </Badge>
                  <Badge variant="outline" className="text-xs font-inter">
                    {segment.segment_type}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Custom Segment Builder */}
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 font-inter mb-4">Custom Smart Segments</h2>
        <p className="text-gray-600 font-inter mb-6">Build your own customer segments with custom rules and criteria</p>
        <SmartSegmentBuilder />
      </div>

      {/* Default Smart Segments */}
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <DefaultSmartSegments 
          onCreateFromTemplate={handleCreateFromTemplate}
          onPreviewTemplate={handlePreviewTemplate}
        />
      </div>

      {/* Segment Preview Modal */}
      <SegmentPreviewModal 
        isOpen={!!previewSegment}
        onClose={() => setPreviewSegment(null)}
        segment={previewSegment}
      />
    </div>
  );
};