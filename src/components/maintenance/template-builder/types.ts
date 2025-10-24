export type TemplateType = 'delivery' | 'service' | 'pickup' | 'repair' | 'inspection' | 'event';

export type SectionBlockType = 
  // Generic blocks
  | 'text_input' 
  | 'text_area' 
  | 'date_time' 
  | 'number' 
  | 'dropdown' 
  | 'multi_select' 
  | 'checklist' 
  | 'photo' 
  | 'signature' 
  | 'file_upload'
  | 'parts_used'
  // Industry blocks
  | 'per_unit_loop'
  | 'delivery_setup'
  | 'pickup_removal'
  | 'event_service'
  | 'repair_damage'
  | 'compliance_safety'
  | 'customer_signoff';

export interface FieldConfig {
  id: string;
  type: string;
  label: string;
  required?: boolean;
  options?: string[];
  placeholder?: string;
  rows?: number;
  auto?: boolean;
  required_if?: string;
}

export interface EnhancedSection {
  id: string;
  type: SectionBlockType;
  title: string;
  description?: string;
  repeat_for_each?: boolean;
  fields: FieldConfig[];
  auto_actions?: {
    create_task_if?: string[];
    suggest_fee_if?: string[];
  };
}

export interface RuleCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in_list';
  value: any;
  logic?: 'AND' | 'OR';
}

export interface EvidenceRequirements {
  min_photos?: number;
  max_photos?: number;
  photo_types?: string[];
  gps_required?: boolean;
  gps_accuracy?: number;
  signature_required?: boolean;
  timestamp_required?: boolean;
}

export interface AutoRequirement {
  id: string;
  preset_type?: string;
  name: string;
  description?: string;
  conditions: RuleCondition[];
  required_fields: string[];
  evidence_requirements?: EvidenceRequirements;
  auto_actions?: {
    create_task?: boolean;
    task_template?: string;
    due_days?: number;
    notify?: string[];
    validate_reconciliation?: boolean;
  };
  is_active: boolean;
}

export interface FeeDefinition {
  id: string;
  name: string;
  description?: string;
  default_amount: number;
  taxable: boolean;
  gl_code?: string;
  category?: string;
}

export interface FeeSuggestion {
  id: string;
  fee_id: string;
  fee_name: string;
  fee_amount: number;
  conditions: RuleCondition[];
  scope: 'per_unit' | 'per_job';
  auto_add: boolean;
  prevent_duplicates: boolean;
  is_active: boolean;
}

export interface DefaultValueRule {
  field_id: string;
  source: 'job_data' | 'last_visit' | 'static' | 'system' | 'formula';
  source_field?: string;
  static_value?: any;
  days_threshold?: number;
  formula?: string;
  conditions?: RuleCondition[];
}

export interface UnitLoopConfig {
  enabled: boolean;
  scan_first_mode: boolean;
  limit_to_job_list: boolean;
  allow_duplicate_scans: boolean;
  auto_capture: {
    timestamp_in_out: boolean;
    gps_location: boolean;
    time_tracking: boolean;
  };
}

export interface LogicRules {
  per_unit_loop: boolean;
  unit_loop_config?: UnitLoopConfig;
  auto_requirements: AutoRequirement[];
  default_values: Record<string, any>;
  default_value_rules?: DefaultValueRule[];
  fee_suggestions: FeeSuggestion[];
  validation_rules?: {
    block_submit_on_incomplete: boolean;
    require_all_units_completed: boolean;
  };
}

export interface Permissions {
  tech_editable_fields: string[];
  office_editable_fields: string[];
  internal_only_fields: string[];
}

export interface OutputConfig {
  pdf_layout: 'summary_first' | 'per_unit_first';
  customer_pdf_fields: string[];
  internal_pdf_fields: string[];
  photo_grid_columns: number;
  watermark?: string;
  show_brand_header: boolean;
}

export interface EnhancedTemplate {
  id: string;
  name: string;
  description: string;
  template_type: TemplateType;
  version: string;
  is_default_for_type: boolean;
  sections: EnhancedSection[];
  logic_rules: LogicRules;
  permissions: Permissions;
  output_config: OutputConfig;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export type BuilderStep = 1 | 2 | 3 | 4 | 5 | 6;
