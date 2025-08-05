import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, Clock } from 'lucide-react';

interface CustomerSegment {
  id: string;
  name: string;
  description?: string;
  rule_set: Record<string, any>;
  customer_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface SegmentDetailsModalProps {
  segment: CustomerSegment | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SegmentDetailsModal: React.FC<SegmentDetailsModalProps> = ({
  segment,
  isOpen,
  onClose
}) => {
  if (!segment) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatRule = (rule: any) => {
    const fieldLabels: Record<string, string> = {
      type: 'Customer Type',
      email: 'Has Email',
      phone: 'Has Phone',
      created_at: 'Registration Date',
      last_job_date: 'Last Job Date',
      total_delivery_jobs: 'Total Delivery Jobs',
      total_spent: 'Total Spent'
    };

    const operatorLabels: Record<string, string> = {
      equals: 'Equals',
      not_equals: 'Not Equals',
      is_not_null: 'Has',
      is_null: 'Does Not Have',
      after: 'After',
      before: 'Before',
      between: 'Between',
      within_last_days: 'Within Last',
      more_than_days_ago: 'More Than',
      greater_than: 'Greater Than',
      less_than: 'Less Than'
    };

    const fieldLabel = fieldLabels[rule.field] || rule.field;
    const operatorLabel = operatorLabels[rule.operator] || rule.operator;
    
    let valueText = rule.value;
    if (rule.operator === 'within_last_days' || rule.operator === 'more_than_days_ago') {
      valueText = `${rule.value} days`;
    }
    if (rule.field === 'type') {
      valueText = rule.value.replace(/_/g, ' ');
    }

    return `${fieldLabel} ${operatorLabel} ${valueText || ''}`.trim();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Segment Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Segment Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">{segment.name}</CardTitle>
              {segment.description && (
                <p className="text-muted-foreground">{segment.description}</p>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <div>
                    <div className="text-2xl font-bold">{segment.customer_count.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Customers</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Created</div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(segment.created_at)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Last Updated</div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(segment.updated_at)}
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Badge variant={segment.is_active ? 'default' : 'secondary'}>
                  {segment.is_active ? 'Active' : 'Inactive'}
                </Badge>
                <Badge variant="outline">Smart Segment</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Segment Rules */}
          <Card>
            <CardHeader>
              <CardTitle>Segment Rules</CardTitle>
              <p className="text-sm text-muted-foreground">
                Customers must match all of the following criteria to be included in this segment:
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {segment.rule_set?.rules?.map((rule: any, index: number) => (
                  <div key={index} className="flex items-center gap-2">
                    {index > 0 && (
                      <Badge variant="outline" className="text-xs px-2 py-1">
                        {rule.logic || 'AND'}
                      </Badge>
                    )}
                    <div className="flex-1 p-3 bg-muted/50 rounded-lg">
                      <code className="text-sm">{formatRule(rule)}</code>
                    </div>
                  </div>
                )) || (
                  <p className="text-sm text-muted-foreground italic">No rules defined</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};