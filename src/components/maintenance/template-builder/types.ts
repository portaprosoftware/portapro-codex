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

export interface AutoRequirement {
  condition: string;
  field: string;
  action: 'require' | 'show' | 'hide';
}

export interface FeeSuggestion {
  condition: string;
  fee_name: string;
  fee_amount?: number;
}

export interface LogicRules {
  per_unit_loop: boolean;
  auto_requirements: AutoRequirement[];
  default_values: Record<string, any>;
  fee_suggestions: FeeSuggestion[];
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
