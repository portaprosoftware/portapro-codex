import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { LogicRules } from '../types';

interface LogicStepProps {
  logicRules: LogicRules;
  onLogicRulesChange: (rules: LogicRules) => void;
}

export const LogicStep: React.FC<LogicStepProps> = ({ logicRules, onLogicRulesChange }) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Smart Automation</CardTitle>
          <CardDescription>
            Configure how your template behaves based on user input
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Per-Unit Looping */}
          <div className="flex items-start justify-between gap-4 p-4 rounded-lg border bg-card">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Label htmlFor="per-unit-loop" className="text-base font-semibold">
                  Per-Unit Looping
                </Label>
                <Badge className="bg-gradient-to-r from-primary to-primary/80 text-white">
                  Powerful
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Repeat the form for each unit on the job. Perfect for route service where techs scan 10-150 units.
              </p>
            </div>
            <Switch
              id="per-unit-loop"
              checked={logicRules.per_unit_loop}
              onCheckedChange={(checked) =>
                onLogicRulesChange({ ...logicRules, per_unit_loop: checked })
              }
            />
          </div>

          {/* Auto Requirements */}
          <div className="space-y-3">
            <div>
              <Label className="text-base font-semibold">Auto Requirements</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Automatically require fields based on conditions (coming soon)
              </p>
            </div>
            <div className="p-4 rounded-lg border bg-muted/50">
              <p className="text-sm text-muted-foreground italic">
                Example: If status = "Not Serviced", require reason + photo
              </p>
            </div>
          </div>

          {/* Fee Suggestions */}
          <div className="space-y-3">
            <div>
              <Label className="text-base font-semibold">Fee Suggestions</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Auto-suggest fees based on conditions (coming soon)
              </p>
            </div>
            <div className="p-4 rounded-lg border bg-muted/50">
              <p className="text-sm text-muted-foreground italic">
                Example: If "Blocked Access" selected, suggest $50 fee
              </p>
            </div>
          </div>

          {/* Default Values */}
          <div className="space-y-3">
            <div>
              <Label className="text-base font-semibold">Default Values</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Pre-fill fields from job data (coming soon)
              </p>
            </div>
            <div className="p-4 rounded-lg border bg-muted/50">
              <p className="text-sm text-muted-foreground italic">
                Example: Auto-fill customer name, site address, tech name from job
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
