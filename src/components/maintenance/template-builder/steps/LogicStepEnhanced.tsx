import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from '@/components/ui/collapsible';
import {
  AlertCircle,
  ChevronDown,
  ChevronRight,
  DollarSign,
  FileText,
  MapPin,
  Plus,
  Settings2,
  Zap,
} from 'lucide-react';
import { LogicRules } from '../types';
import { PerUnitLoopConfig } from './logic/PerUnitLoopConfig';
import { AutoRequirementsBuilder } from './logic/AutoRequirementsBuilder';
import { FeeSuggestionsBuilder } from './logic/FeeSuggestionsBuilder';
import { DefaultValuesBuilder } from './logic/DefaultValuesBuilder';

interface LogicStepProps {
  logicRules: LogicRules;
  onLogicRulesChange: (rules: LogicRules) => void;
}

export const LogicStepEnhanced: React.FC<LogicStepProps> = ({ 
  logicRules, 
  onLogicRulesChange 
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['per-unit-loop'])
  );

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  return (
    <div className="space-y-4">
      {/* Per-Unit Looping */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-lg">Per-Unit Looping</CardTitle>
                <Badge className="bg-gradient-to-r from-primary to-primary/80 text-white font-bold">
                  Powerful
                </Badge>
              </div>
              <CardDescription>
                Repeat this section for each unit. Ideal for routes with 10–150 units.
              </CardDescription>
            </div>
            <Switch
              checked={logicRules.per_unit_loop}
              onCheckedChange={(checked) => {
                onLogicRulesChange({
                  ...logicRules,
                  per_unit_loop: checked,
                  unit_loop_config: checked
                    ? logicRules.unit_loop_config || {
                        enabled: true,
                        scan_first_mode: false,
                        limit_to_job_list: true,
                        allow_duplicate_scans: true,
                        auto_capture: {
                          timestamp_in_out: true,
                          gps_location: true,
                          time_tracking: true,
                        },
                      }
                    : undefined,
                });
              }}
            />
          </div>
        </CardHeader>

        {logicRules.per_unit_loop && (
          <CardContent className="pt-0">
            <Collapsible
              open={expandedSections.has('per-unit-loop')}
              onOpenChange={() => toggleSection('per-unit-loop')}
            >
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    <Settings2 className="w-4 h-4" />
                    Configuration Options
                  </span>
                  {expandedSections.has('per-unit-loop') ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4">
                <PerUnitLoopConfig
                  config={logicRules.unit_loop_config!}
                  onChange={(config) =>
                    onLogicRulesChange({
                      ...logicRules,
                      unit_loop_config: config,
                    })
                  }
                />
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        )}
      </Card>

      {/* Auto Requirements */}
      <Card className="border-l-4 border-l-orange-500">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="w-5 h-5 text-orange-500" />
            <CardTitle className="text-lg">Auto Requirements</CardTitle>
          </div>
          <CardDescription>
            Make fields required only when they matter (e.g., "Not Serviced" → photo + reason).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AutoRequirementsBuilder
            requirements={logicRules.auto_requirements}
            onChange={(requirements) =>
              onLogicRulesChange({
                ...logicRules,
                auto_requirements: requirements,
              })
            }
          />
        </CardContent>
      </Card>

      {/* Fee Suggestions */}
      <Card className="border-l-4 border-l-green-500">
        <CardHeader className="pb-3">
          <div className="mb-1">
            <CardTitle className="text-lg">Fee Suggestions</CardTitle>
          </div>
          <CardDescription>
            Turn real-world issues into billable line items. Review before publishing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FeeSuggestionsBuilder
            suggestions={logicRules.fee_suggestions}
            onChange={(suggestions) =>
              onLogicRulesChange({
                ...logicRules,
                fee_suggestions: suggestions,
              })
            }
          />
        </CardContent>
      </Card>

      {/* Default Values */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-3">
          <div className="mb-1">
            <CardTitle className="text-lg">Default Values</CardTitle>
          </div>
          <CardDescription>
            Pre-fill from job and last visit to move faster. Edit anytime.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DefaultValuesBuilder
            rules={logicRules.default_value_rules || []}
            onChange={(rules) =>
              onLogicRulesChange({
                ...logicRules,
                default_value_rules: rules,
              })
            }
          />
        </CardContent>
      </Card>
    </div>
  );
};
