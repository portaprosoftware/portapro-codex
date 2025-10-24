import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, DollarSign } from 'lucide-react';
import { FeeSuggestion } from '../../types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface FeeSuggestionsBuilderProps {
  suggestions: FeeSuggestion[];
  onChange: (suggestions: FeeSuggestion[]) => void;
}

// Default fee suggestions based on the spec
const DEFAULT_FEE_SUGGESTIONS: Omit<FeeSuggestion, 'id'>[] = [
  {
    fee_id: 'fee_blocked_access',
    fee_name: 'Blocked Access Fee',
    fee_amount: 50.00,
    conditions: [
      { field: 'unit_status', operator: 'equals', value: 'Not Serviced' },
      { field: 'not_serviced_reason', operator: 'equals', value: 'Blocked Access', logic: 'AND' },
    ],
    scope: 'per_unit',
    auto_add: true,
    prevent_duplicates: false,
    is_active: true,
  },
  {
    fee_id: 'fee_extra_blue',
    fee_name: 'Extra Blue/Deodorizer',
    fee_amount: 15.00,
    conditions: [
      { field: 'blue_used', operator: 'greater_than', value: 16 },
    ],
    scope: 'per_unit',
    auto_add: false,
    prevent_duplicates: false,
    is_active: true,
  },
  {
    fee_id: 'fee_excess_waste',
    fee_name: 'Excess Waste / Heavy Pump',
    fee_amount: 25.00,
    conditions: [
      { field: 'time_on_unit', operator: 'greater_than', value: 360 }, // 6 minutes in seconds
    ],
    scope: 'per_unit',
    auto_add: true,
    prevent_duplicates: false,
    is_active: true,
  },
  {
    fee_id: 'fee_relocation',
    fee_name: 'Relocation Fee',
    fee_amount: 35.00,
    conditions: [
      { field: 'unit_relocated', operator: 'equals', value: true },
      { field: 'relocation_distance', operator: 'greater_than', value: 25, logic: 'AND' },
    ],
    scope: 'per_unit',
    auto_add: true,
    prevent_duplicates: false,
    is_active: true,
  },
  {
    fee_id: 'fee_tipped_recovery',
    fee_name: 'Tipped Unit Recovery',
    fee_amount: 25.00,
    conditions: [
      { field: 'unit_tipped', operator: 'equals', value: true },
    ],
    scope: 'per_unit',
    auto_add: true,
    prevent_duplicates: false,
    is_active: true,
  },
  {
    fee_id: 'fee_graffiti',
    fee_name: 'Graffiti Removal',
    fee_amount: 35.00,
    conditions: [
      { field: 'issue_code', operator: 'equals', value: 'Graffiti' },
    ],
    scope: 'per_unit',
    auto_add: false,
    prevent_duplicates: false,
    is_active: true,
  },
  {
    fee_id: 'fee_frozen_tank',
    fee_name: 'Frozen Tank Treatment',
    fee_amount: 20.00,
    conditions: [
      { field: 'frozen_unsafe', operator: 'equals', value: true },
    ],
    scope: 'per_unit',
    auto_add: true,
    prevent_duplicates: false,
    is_active: true,
  },
  {
    fee_id: 'fee_after_hours',
    fee_name: 'After-Hours Service',
    fee_amount: 40.00,
    conditions: [
      { field: 'service_hour', operator: 'less_than', value: 7, logic: 'OR' },
      { field: 'service_hour', operator: 'greater_than', value: 18, logic: 'OR' },
    ],
    scope: 'per_job',
    auto_add: true,
    prevent_duplicates: true,
    is_active: true,
  },
  {
    fee_id: 'fee_lock',
    fee_name: 'Missing/Damaged Lock',
    fee_amount: 8.00,
    conditions: [
      { field: 'issue_code', operator: 'equals', value: 'Lock' },
    ],
    scope: 'per_unit',
    auto_add: false,
    prevent_duplicates: false,
    is_active: true,
  },
  {
    fee_id: 'fee_anchor',
    fee_name: 'Anchor/Strap Add',
    fee_amount: 15.00,
    conditions: [
      { field: 'wind_exposure', operator: 'equals', value: 'High' },
      { field: 'anchoring', operator: 'equals', value: false, logic: 'AND' },
    ],
    scope: 'per_unit',
    auto_add: false,
    prevent_duplicates: false,
    is_active: true,
  },
];

export const FeeSuggestionsBuilder: React.FC<FeeSuggestionsBuilderProps> = ({
  suggestions,
  onChange,
}) => {
  const initializeFees = () => {
    const feesWithIds = DEFAULT_FEE_SUGGESTIONS.map((fee) => ({
      ...fee,
      id: fee.fee_id,
    }));
    onChange([...feesWithIds, ...suggestions]);
  };

  const toggleFeeActive = (feeId: string, active: boolean) => {
    onChange(
      suggestions.map((fee) =>
        fee.id === feeId ? { ...fee, is_active: active } : fee
      )
    );
  };

  const toggleAutoAdd = (feeId: string, autoAdd: boolean) => {
    onChange(
      suggestions.map((fee) =>
        fee.id === feeId ? { ...fee, auto_add: autoAdd } : fee
      )
    );
  };

  if (suggestions.length === 0) {
    return (
      <div className="space-y-4">
        <div className="text-center py-6 space-y-4 border-2 border-dashed rounded-lg">
          <p className="text-sm text-muted-foreground">
            Load industry-standard fee suggestions based on common scenarios
          </p>
          <Button onClick={initializeFees} className="gap-2 bg-gradient-to-r from-green-500 to-green-600">
            <Plus className="w-4 h-4" />
            Load Default Fee Rules (10)
          </Button>
        </div>
        <div className="p-4 rounded-lg bg-muted/30 text-xs text-muted-foreground">
          <p className="font-medium mb-2">💰 Available Fee Rules:</p>
          <div className="grid grid-cols-2 gap-2">
            <ul className="space-y-1 list-disc list-inside">
              <li>Blocked Access ($50)</li>
              <li>Extra Blue/Deodorizer ($15)</li>
              <li>Excess Waste ($25)</li>
              <li>Relocation ($35)</li>
              <li>Tipped Unit Recovery ($25)</li>
            </ul>
            <ul className="space-y-1 list-disc list-inside">
              <li>Graffiti Removal ($35)</li>
              <li>Frozen Tank ($20)</li>
              <li>After-Hours ($40)</li>
              <li>Damaged Lock ($8)</li>
              <li>Anchor/Strap ($15)</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  const activeFees = suggestions.filter(f => f.is_active);
  const inactiveFees = suggestions.filter(f => !f.is_active);

  return (
    <div className="space-y-4">
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active">
            Active ({activeFees.length})
          </TabsTrigger>
          <TabsTrigger value="all">
            All ({suggestions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-2 mt-4">
          {activeFees.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No active fee rules
            </p>
          ) : (
            activeFees.map((fee) => (
              <FeeRuleCard
                key={fee.id}
                fee={fee}
                onToggleActive={(active) => toggleFeeActive(fee.id, active)}
                onToggleAutoAdd={(autoAdd) => toggleAutoAdd(fee.id, autoAdd)}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-2 mt-4">
          {suggestions.map((fee) => (
            <FeeRuleCard
              key={fee.id}
              fee={fee}
              onToggleActive={(active) => toggleFeeActive(fee.id, active)}
              onToggleAutoAdd={(autoAdd) => toggleAutoAdd(fee.id, autoAdd)}
            />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface FeeRuleCardProps {
  fee: FeeSuggestion;
  onToggleActive: (active: boolean) => void;
  onToggleAutoAdd: (autoAdd: boolean) => void;
}

const FeeRuleCard: React.FC<FeeRuleCardProps> = ({ 
  fee, 
  onToggleActive, 
  onToggleAutoAdd 
}) => {
  return (
    <div
      className={`rounded-lg border p-3 ${
        fee.is_active ? 'bg-card' : 'bg-muted/50'
      }`}
    >
      <div className="flex items-start gap-3">
        <Switch
          checked={fee.is_active}
          onCheckedChange={onToggleActive}
        />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h5 className="text-sm font-medium">{fee.fee_name}</h5>
                <Badge variant="outline" className="text-xs">
                  ${fee.fee_amount.toFixed(2)}
                </Badge>
                <Badge variant="secondary" className="text-xs capitalize">
                  {fee.scope.replace('_', '-')}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {fee.conditions.map((c, i) => (
                  <span key={i}>
                    {i > 0 && ` ${c.logic || 'AND'} `}
                    {c.field} {c.operator.replace('_', ' ')} {String(c.value)}
                  </span>
                ))}
              </p>
            </div>
          </div>

          {fee.is_active && (
            <div className="flex items-center gap-2 text-xs">
              <Switch
                checked={fee.auto_add}
                onCheckedChange={onToggleAutoAdd}
                className="scale-75"
              />
              <span className={fee.auto_add ? 'font-medium' : 'text-muted-foreground'}>
                Auto-add (pre-checked in review)
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
