import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

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

interface SegmentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  segment: SmartSegmentTemplate | null;
}

export const SegmentPreviewModal: React.FC<SegmentPreviewModalProps> = ({ isOpen, onClose, segment }) => {
  if (!segment) return null;

  const formatRuleValue = (field: string, operator: string, value: string) => {
    switch (field) {
      case 'created_at':
      case 'last_job_date':
        if (operator === 'after') return `after ${new Date(value).toLocaleDateString()}`;
        if (operator === 'before') return `before ${new Date(value).toLocaleDateString()}`;
        if (operator === 'between') return `between dates`;
        break;
      case 'total_spent':
        if (operator === 'greater_than') return `greater than $${value}`;
        if (operator === 'less_than') return `less than $${value}`;
        if (operator === 'between') return `between amounts`;
        if (operator === 'top_percent') return `top ${value}% by spending`;
        break;
      case 'total_jobs':
        if (operator === 'greater_than') return `more than ${value} jobs`;
        if (operator === 'less_than') return `less than ${value} jobs`;
        if (operator === 'equals') return `exactly ${value} jobs`;
        break;
      case 'email':
        if (operator === 'is_not_null') return 'has email address';
        if (operator === 'is_null') return 'no email address';
        break;
      case 'phone':
        if (operator === 'is_not_null') return 'has phone number';
        if (operator === 'is_null') return 'no phone number';
        break;
      case 'type':
        if (operator === 'equals') return `customer type is ${value}`;
        if (operator === 'not_equals') return `customer type is not ${value}`;
        break;
    }
    return `${operator} ${value}`;
  };

  const getFieldLabel = (field: string) => {
    const labels: Record<string, string> = {
      'created_at': 'Registration Date',
      'last_job_date': 'Last Job Date',
      'total_spent': 'Total Spent',
      'total_jobs': 'Total Jobs',
      'email': 'Email',
      'phone': 'Phone',
      'type': 'Customer Type'
    };
    return labels[field] || field;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl" aria-describedby="segment-preview-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-gradient-${segment.color} text-white`}>
              {segment.icon}
            </div>
            {segment.name}
          </DialogTitle>
        </DialogHeader>
        
        <div id="segment-preview-description" className="sr-only">
          Preview smart segment template details and rules
        </div>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Description</h4>
              <p className="text-gray-600">{segment.description}</p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Business Goal</h4>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-blue-800">{segment.businessGoal}</p>
              </div>
            </div>
          </div>

          {/* Rules Preview */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Segment Rules</h4>
            <Card className="p-4">
              <div className="space-y-3">
                {segment.ruleSet.rules.map((rule: any, index: number) => (
                  <div key={rule.id || index} className="flex items-center gap-2">
                    {index > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {rule.logic || 'AND'}
                      </Badge>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">{getFieldLabel(rule.field)}</span>
                      <span className="text-gray-600">
                        {formatRuleValue(rule.field, rule.operator, rule.value)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Estimated Size */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-900">Estimated Size:</span>
              <Badge variant={segment.color as any} className="text-lg px-3 py-1">
                {segment.estimatedCount || 0} customers
              </Badge>
            </div>
          </div>

          {/* Usage Examples */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">How to Use This Segment</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• Create targeted email campaigns for this specific customer group</p>
              <p>• Send personalized SMS messages with relevant offers</p>
              <p>• Generate reports to track performance of this segment</p>
              <p>• Set up automated marketing workflows</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};