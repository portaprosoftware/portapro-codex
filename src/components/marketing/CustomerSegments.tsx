import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SmartSegmentBuilder } from './SmartSegmentBuilder';
import { DefaultSmartSegments } from './DefaultSmartSegments';
import { toast } from '@/components/ui/use-toast';

interface SmartSegmentTemplate {
  id: string;
  name: string;
  description: string;
  businessGoal: string;
  icon: React.ReactNode;
  color: string;
  ruleSet: any;
}

export const CustomerSegments: React.FC = () => {
  const queryClient = useQueryClient();

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
    createFromTemplateMutation.mutate(template);
  };

  const handlePreviewTemplate = (template: SmartSegmentTemplate) => {
    toast({ 
      title: `Preview: ${template.name}`,
      description: `This segment would include customers matching: ${template.description}`
    });
  };

  return (
    <div className="space-y-8">
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
    </div>
  );
};