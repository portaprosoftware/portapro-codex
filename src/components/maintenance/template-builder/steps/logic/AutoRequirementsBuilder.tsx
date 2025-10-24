import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { AutoRequirement } from '../../types';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface AutoRequirementsBuilderProps {
  requirements: AutoRequirement[];
  onChange: (requirements: AutoRequirement[]) => void;
}

// Default presets based on the spec
const DEFAULT_PRESETS: Omit<AutoRequirement, 'id'>[] = [
  {
    preset_type: 'not_serviced',
    name: 'Not Serviced → Reason + Photo + GPS',
    description: 'Require documentation when a unit cannot be serviced',
    conditions: [{ field: 'unit_status', operator: 'equals', value: 'Not Serviced' }],
    required_fields: ['not_serviced_reason', 'not_serviced_photo'],
    evidence_requirements: {
      min_photos: 1,
      gps_required: true,
      gps_accuracy: 50,
    },
    auto_actions: {
      create_task: true,
      task_template: 'follow_up_access_issue',
      notify: ['dispatch'],
    },
    is_active: true,
  },
  {
    preset_type: 'damage',
    name: 'Damage/Issue → Photos + Task',
    description: 'Require photos and create repair task for any damage',
    conditions: [{ field: 'damage_detected', operator: 'equals', value: true }],
    required_fields: ['damage_photos', 'damage_description'],
    evidence_requirements: {
      min_photos: 2,
      photo_types: ['close_up', 'context'],
    },
    auto_actions: {
      create_task: true,
      task_template: 'repair_damage',
      due_days: 3,
    },
    is_active: true,
  },
  {
    preset_type: 'delivery_setup',
    name: 'Delivery/Setup → Placement Proof',
    description: 'Require placement documentation for deliveries',
    conditions: [{ field: 'template_type', operator: 'equals', value: 'delivery' }],
    required_fields: ['placement_map_pin', 'surface_type', 'level_check', 'distance_from_truck', 'placement_photos'],
    evidence_requirements: {
      min_photos: 2,
      gps_required: true,
      photo_types: ['door_side', 'wide_angle'],
    },
    is_active: true,
  },
  {
    preset_type: 'pickup_removal',
    name: 'Pickup/Removal → Final Area Photo',
    description: 'Require proof that area is left clean',
    conditions: [{ field: 'template_type', operator: 'equals', value: 'pickup' }],
    required_fields: ['area_clean_checkbox', 'final_area_photo'],
    evidence_requirements: {
      min_photos: 1,
    },
    is_active: true,
  },
  {
    preset_type: 'event_service',
    name: 'Event Service → Zone/Bank + Count Check',
    description: 'Require zone tracking and reconciliation for events',
    conditions: [{ field: 'template_type', operator: 'equals', value: 'event' }],
    required_fields: ['zone_selection', 'bank_selection', 'units_expected', 'units_serviced'],
    auto_actions: {
      validate_reconciliation: true,
    },
    is_active: true,
  },
  {
    preset_type: 'ada_units',
    name: 'ADA Units → Access Checks',
    description: 'Ensure ADA compliance requirements are met',
    conditions: [{ field: 'unit_type', operator: 'equals', value: 'ADA' }],
    required_fields: ['ground_level_check', 'path_clear_check', 'door_clearance_check', 'ada_compliance_photo'],
    evidence_requirements: {
      min_photos: 1,
      photo_types: ['ramp_clearance'],
    },
    is_active: true,
  },
  {
    preset_type: 'spill_incident',
    name: 'Spill/Incident → Compliance Form + Notify',
    description: 'Handle spill incidents with full documentation',
    conditions: [{ field: 'spill_incident', operator: 'equals', value: true }],
    required_fields: ['spill_checklist', 'spill_photos', 'spill_location'],
    evidence_requirements: {
      min_photos: 2,
      gps_required: true,
    },
    auto_actions: {
      create_task: true,
      task_template: 'compliance_follow_up',
      notify: ['dispatch', 'safety'],
    },
    is_active: true,
  },
];

export const AutoRequirementsBuilder: React.FC<AutoRequirementsBuilderProps> = ({
  requirements,
  onChange,
}) => {
  const [expandedPresets, setExpandedPresets] = useState<Set<string>>(new Set());

  const initializePresets = () => {
    const presetsWithIds = DEFAULT_PRESETS.map((preset, index) => ({
      ...preset,
      id: `preset_${preset.preset_type}`,
    }));
    onChange([...presetsWithIds, ...requirements]);
  };

  const togglePreset = (presetId: string) => {
    const newExpanded = new Set(expandedPresets);
    if (newExpanded.has(presetId)) {
      newExpanded.delete(presetId);
    } else {
      newExpanded.add(presetId);
    }
    setExpandedPresets(newExpanded);
  };

  const togglePresetActive = (presetId: string, active: boolean) => {
    onChange(
      requirements.map((req) =>
        req.id === presetId ? { ...req, is_active: active } : req
      )
    );
  };

  const existingPresets = requirements.filter(r => r.preset_type);
  const customRules = requirements.filter(r => !r.preset_type);

  if (existingPresets.length === 0) {
    return (
      <div className="space-y-4">
        <div className="text-center py-6 space-y-4 border-2 border-dashed rounded-lg">
          <p className="text-sm text-muted-foreground">
            Load industry-standard presets to get started quickly
          </p>
          <Button onClick={initializePresets} className="gap-2 bg-gradient-to-r from-orange-500 to-orange-600">
            <Plus className="w-4 h-4" />
            Load Default Presets (7)
          </Button>
        </div>
        <div className="p-4 rounded-lg bg-muted/30 text-xs text-muted-foreground">
          <p className="font-medium mb-2">📋 Available Presets:</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Not Serviced → Reason + Photo + GPS</li>
            <li>Damage/Issue → Photos + Task</li>
            <li>Delivery/Setup → Placement Proof</li>
            <li>Pickup/Removal → Final Area Photo</li>
            <li>Event Service → Zone/Bank + Count Check</li>
            <li>ADA Units → Access Checks</li>
            <li>Spill/Incident → Compliance Form + Notify</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Presets Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">Presets</h4>
          <Badge variant="outline">
            {existingPresets.filter(p => p.is_active).length} active
          </Badge>
        </div>

        {existingPresets.map((preset) => (
          <div
            key={preset.id}
            className={`rounded-lg border ${
              preset.is_active ? 'border-l-4 border-l-green-500 bg-card' : 'bg-muted/50'
            } p-3`}
          >
            <div className="flex items-start gap-3">
              <Switch
                checked={preset.is_active}
                onCheckedChange={(checked) => togglePresetActive(preset.id, checked)}
              />
              <div className="flex-1 min-w-0">
                <Collapsible
                  open={expandedPresets.has(preset.id)}
                  onOpenChange={() => togglePreset(preset.id)}
                >
                  <CollapsibleTrigger asChild>
                    <button className="w-full text-left">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <h5 className="text-sm font-medium">{preset.name}</h5>
                          {preset.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {preset.description}
                            </p>
                          )}
                        </div>
                        {expandedPresets.has(preset.id) ? (
                          <ChevronDown className="w-4 h-4 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="w-4 h-4 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-3 space-y-2">
                    <div className="text-xs space-y-1">
                      <div>
                        <span className="font-medium">When:</span>{' '}
                        {preset.conditions.map(c => `${c.field} = "${c.value}"`).join(', ')}
                      </div>
                      <div>
                        <span className="font-medium">Require:</span>{' '}
                        {preset.required_fields.join(', ')}
                      </div>
                      {preset.evidence_requirements && (
                        <div>
                          <span className="font-medium">Evidence:</span>{' '}
                          {preset.evidence_requirements.min_photos && `${preset.evidence_requirements.min_photos}+ photos`}
                          {preset.evidence_requirements.gps_required && ', GPS lock'}
                        </div>
                      )}
                      {preset.auto_actions?.create_task && (
                        <div>
                          <span className="font-medium">Auto-create:</span> Task (
                          {preset.auto_actions.due_days ? `due in ${preset.auto_actions.due_days} days` : 'follow-up'}
                          )
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Custom Rules Section (placeholder for future) */}
      {customRules.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Custom Rules</h4>
          <p className="text-xs text-muted-foreground">
            {customRules.length} custom rule(s) defined
          </p>
        </div>
      )}

      <Button variant="outline" size="sm" className="w-full gap-2" disabled>
        <Plus className="w-4 h-4" />
        Add Custom Rule (Coming Soon)
      </Button>
    </div>
  );
};
