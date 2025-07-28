
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Plus, X, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface SegmentRule {
  id: string;
  field: string;
  operator: string;
  value: string;
  logic?: 'AND' | 'OR';
}

interface SegmentData {
  name: string;
  description: string;
  rules: SegmentRule[];
}

export const SmartSegmentBuilder: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);
  const [segmentData, setSegmentData] = useState<SegmentData>({
    name: '',
    description: '',
    rules: [{ id: '1', field: '', operator: '', value: '' }]
  });
  const [estimatedCount, setEstimatedCount] = useState(0);
  const queryClient = useQueryClient();

  const availableFields = [
    { value: 'type', label: 'Customer Type' },
    { value: 'email', label: 'Has Email' },
    { value: 'phone', label: 'Has Phone' },
    { value: 'created_at', label: 'Registration Date' },
    { value: 'last_job_date', label: 'Last Job Date' },
    { value: 'total_jobs', label: 'Total Jobs' },
    { value: 'total_spent', label: 'Total Spent' }
  ];

  const operators = {
    type: [
      { value: 'equals', label: 'Equals' },
      { value: 'not_equals', label: 'Not Equals' }
    ],
    email: [
      { value: 'is_not_null', label: 'Has Email' },
      { value: 'is_null', label: 'No Email' }
    ],
    phone: [
      { value: 'is_not_null', label: 'Has Phone' },
      { value: 'is_null', label: 'No Phone' }
    ],
    created_at: [
      { value: 'after', label: 'After' },
      { value: 'before', label: 'Before' },
      { value: 'between', label: 'Between' }
    ],
    last_job_date: [
      { value: 'after', label: 'After' },
      { value: 'before', label: 'Before' },
      { value: 'between', label: 'Between' }
    ],
    total_jobs: [
      { value: 'greater_than', label: 'Greater Than' },
      { value: 'less_than', label: 'Less Than' },
      { value: 'equals', label: 'Equals' }
    ],
    total_spent: [
      { value: 'greater_than', label: 'Greater Than' },
      { value: 'less_than', label: 'Less Than' },
      { value: 'between', label: 'Between' }
    ]
  };

  const customerTypes = [
    'construction',
    'events',
    'sports',
    'residential',
    'commercial',
    'emergency'
  ];

  // Create segment mutation
  const createSegmentMutation = useMutation({
    mutationFn: async (data: SegmentData) => {
      const { error } = await supabase
        .from('customer_segments')
        .insert({
          name: data.name,
          description: data.description,
          rule_set: { rules: data.rules } as any,
          customer_count: estimatedCount,
          segment_type: 'smart'
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-segments'] });
      toast({ title: 'Smart segment created successfully!' });
      setIsOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: 'Error creating segment', variant: 'destructive' });
    }
  });

  const resetForm = () => {
    setSegmentData({
      name: '',
      description: '',
      rules: [{ id: '1', field: '', operator: '', value: '' }]
    });
    setEstimatedCount(0);
  };

  const addRule = () => {
    const newRule: SegmentRule = {
      id: Date.now().toString(),
      field: '',
      operator: '',
      value: '',
      logic: 'AND'
    };
    setSegmentData({
      ...segmentData,
      rules: [...segmentData.rules, newRule]
    });
  };

  const removeRule = (ruleId: string) => {
    setSegmentData({
      ...segmentData,
      rules: segmentData.rules.filter(rule => rule.id !== ruleId)
    });
  };

  const updateRule = (ruleId: string, updates: Partial<SegmentRule>) => {
    setSegmentData({
      ...segmentData,
      rules: segmentData.rules.map(rule =>
        rule.id === ruleId ? { ...rule, ...updates } : rule
      )
    });
  };

  const estimateSegmentSize = async () => {
    // This would implement actual segment counting logic
    // For now, we'll use a mock estimate
    setEstimatedCount(Math.floor(Math.random() * 500) + 50);
  };

  const renderValueInput = (rule: SegmentRule) => {
    if (rule.field === 'type') {
      return (
        <Select value={rule.value} onValueChange={(value) => updateRule(rule.id, { value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            {customerTypes.map(type => (
              <SelectItem key={type} value={type} className="capitalize">
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (rule.field === 'email' || rule.field === 'phone') {
      return null; // No value needed for is_null/is_not_null
    }

    if (rule.field === 'created_at' || rule.field === 'last_job_date') {
      return (
        <Input
          type="date"
          value={rule.value}
          onChange={(e) => updateRule(rule.id, { value: e.target.value })}
        />
      );
    }

    return (
      <Input
        type="number"
        value={rule.value}
        onChange={(e) => updateRule(rule.id, { value: e.target.value })}
        placeholder="Enter value"
      />
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-white">
          <Plus className="w-4 h-4 mr-2" />
          Create Smart Segment
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Smart Segment</DialogTitle>
        </DialogHeader>

        {/* Info Section */}
        <Collapsible open={isInfoExpanded} onOpenChange={setIsInfoExpanded}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <span>How to Create a Smart Segment</span>
              {isInfoExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-3">
                  Use smart segments to automatically group customers based on their behavior or profile. Just follow these simple steps:
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <h5 className="font-medium">1. Give it a Name & Description</h5>
                  <ul className="mt-1 space-y-1 text-muted-foreground ml-4">
                    <li>• <strong>Segment Name</strong>: Pick something clear (e.g. "New Customers," "Big Spenders").</li>
                    <li>• <strong>Description</strong>: Write a sentence or two about what this segment is for.</li>
                  </ul>
                </div>

                <div>
                  <h5 className="font-medium">2. Build Your Rules</h5>
                  <ul className="mt-1 space-y-1 text-muted-foreground ml-4">
                    <li>• Click <strong>Add Rule</strong>.</li>
                    <li>• <strong>Field</strong>: Choose what you're filtering on (e.g. Registration Date, Last Job Date, Total Spent).</li>
                    <li>• <strong>Operator</strong>: Pick how you want to compare (After, Before, Greater Than, Equals, etc.).</li>
                    <li>• <strong>Value</strong>: Enter the date, number, or select the category.</li>
                    <li>• Repeat <strong>Add Rule</strong> for as many filters as you need. All rules must be true for a customer to join the segment.</li>
                  </ul>
                </div>

                <div>
                  <h5 className="font-medium">3. See the Estimated Size</h5>
                  <ul className="mt-1 space-y-1 text-muted-foreground ml-4">
                    <li>• Hit <strong>Calculate</strong> to preview how many customers match your rules.</li>
                  </ul>
                </div>

                <div>
                  <h5 className="font-medium">4. Save Your Segment</h5>
                  <ul className="mt-1 space-y-1 text-muted-foreground ml-4">
                    <li>• When you're happy, click <strong>Create Segment</strong>.</li>
                    <li>• Your new group will appear in the marketing module—ready for email campaigns, text blasts, or reports.</li>
                  </ul>
                </div>
              </div>

              <div className="border-t pt-3">
                <h5 className="font-medium mb-2">Examples</h5>
                <ul className="space-y-1 text-muted-foreground text-xs">
                  <li>• <strong>New Customers</strong>: Registration Date After [30 days ago]</li>
                  <li>• <strong>Frequent Users</strong>: Total Jobs Greater Than 10</li>
                  <li>• <strong>Lapsed Accounts</strong>: Last Job Date Before [90 days ago]</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-2">
                  Feel free to mix and match rules—this tool will automatically keep your segments up to date as customer data changes.
                </p>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="segment-name">Segment Name</Label>
              <Input
                id="segment-name"
                value={segmentData.name}
                onChange={(e) => setSegmentData({...segmentData, name: e.target.value})}
                placeholder="Enter segment name"
              />
            </div>
            <div>
              <Label htmlFor="segment-description">Description</Label>
              <Textarea
                id="segment-description"
                value={segmentData.description}
                onChange={(e) => setSegmentData({...segmentData, description: e.target.value})}
                placeholder="Describe this segment"
                rows={2}
              />
            </div>
          </div>

          {/* Rules Builder */}
          <div>
            <Label className="text-base font-medium">Segment Rules</Label>
            <div className="mt-4 space-y-4">
              {segmentData.rules.map((rule, index) => (
                <Card key={rule.id} className="p-4">
                  <div className="flex items-center gap-4">
                    {index > 0 && (
                      <Select 
                        value={rule.logic} 
                        onValueChange={(value) => updateRule(rule.id, { logic: value as 'AND' | 'OR' })}
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AND">AND</SelectItem>
                          <SelectItem value="OR">OR</SelectItem>
                        </SelectContent>
                      </Select>
                    )}

                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Field Selection */}
                      <Select 
                        value={rule.field} 
                        onValueChange={(value) => updateRule(rule.id, { field: value, operator: '', value: '' })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select field" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableFields.map(field => (
                            <SelectItem key={field.value} value={field.value}>
                              {field.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Operator Selection */}
                      {rule.field && (
                        <Select 
                          value={rule.operator} 
                          onValueChange={(value) => updateRule(rule.id, { operator: value, value: '' })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select operator" />
                          </SelectTrigger>
                          <SelectContent>
                            {operators[rule.field as keyof typeof operators]?.map(op => (
                              <SelectItem key={op.value} value={op.value}>
                                {op.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}

                      {/* Value Input */}
                      {rule.field && rule.operator && (
                        <div>
                          {renderValueInput(rule)}
                        </div>
                      )}
                    </div>

                    {segmentData.rules.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRule(rule.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </Card>
              ))}

              <Button variant="outline" onClick={addRule} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Rule
              </Button>
            </div>
          </div>

          {/* Estimated Count */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <span className="font-medium">Estimated Segment Size:</span>
              <Badge variant="secondary" className="text-lg px-3 py-1">
                {estimatedCount} customers
              </Badge>
            </div>
            <Button variant="outline" onClick={estimateSegmentSize}>
              Calculate
            </Button>
          </div>

          {/* Actions */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => createSegmentMutation.mutate(segmentData)}
              disabled={!segmentData.name || segmentData.rules.some(r => !r.field || !r.operator)}
              className="bg-primary text-white"
            >
              Create Segment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
