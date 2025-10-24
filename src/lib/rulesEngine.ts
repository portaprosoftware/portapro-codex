import { 
  AutoRequirement, 
  FeeSuggestion, 
  DefaultValueRule, 
  RuleCondition,
  UnitLoopConfig 
} from '@/components/maintenance/template-builder/types';

export interface UnitFormData {
  unit_id?: string;
  unit_type?: string;
  unit_status?: string;
  [key: string]: any;
}

export interface FormData {
  [key: string]: any;
  units?: UnitFormData[];
}

export interface ValidationIssue {
  unit_id?: string;
  unit_index?: number;
  field_id: string;
  field_label: string;
  issue_type: 'required_field' | 'missing_evidence' | 'invalid_value';
  message: string;
  rule_name?: string;
}

export interface FeeRecommendation {
  fee_id: string;
  fee_name: string;
  fee_amount: number;
  reason: string;
  unit_id?: string;
  auto_added: boolean;
  rule_id: string;
}

export interface AutomationAudit {
  rules_evaluated: {
    rule_id: string;
    rule_name: string;
    triggered: boolean;
    timestamp: string;
  }[];
  auto_requirements_triggered: {
    rule_id: string;
    rule_name: string;
    fields_required: string[];
    unit_id?: string;
  }[];
  fees_suggested: {
    fee_id: string;
    fee_name: string;
    fee_amount: number;
    reason: string;
    auto_added: boolean;
    user_decision?: 'applied' | 'dismissed';
    dismiss_reason?: string;
  }[];
  tasks_created: {
    task_id?: string;
    rule_id: string;
    rule_name: string;
    unit_id?: string;
  }[];
  notifications_sent: {
    type: string;
    recipient: string;
    timestamp: string;
  }[];
  validation_results: {
    blocking_issues: ValidationIssue[];
    warnings: string[];
  };
}

/**
 * Evaluate a single condition against form data
 */
export function evaluateCondition(
  condition: RuleCondition,
  formData: FormData | UnitFormData
): boolean {
  const fieldValue = formData[condition.field];
  
  switch (condition.operator) {
    case 'equals':
      return fieldValue === condition.value;
    
    case 'not_equals':
      return fieldValue !== condition.value;
    
    case 'greater_than':
      return Number(fieldValue) > Number(condition.value);
    
    case 'less_than':
      return Number(fieldValue) < Number(condition.value);
    
    case 'contains':
      return String(fieldValue || '').includes(String(condition.value));
    
    case 'in_list':
      return Array.isArray(condition.value) && condition.value.includes(fieldValue);
    
    default:
      return false;
  }
}

/**
 * Evaluate multiple conditions with AND/OR logic
 */
export function evaluateConditions(
  conditions: RuleCondition[],
  formData: FormData | UnitFormData
): boolean {
  if (conditions.length === 0) return false;
  
  // Check if any condition specifies OR logic
  const hasOrLogic = conditions.some(c => c.logic === 'OR');
  
  if (hasOrLogic) {
    // OR logic: at least one condition must be true
    return conditions.some(condition => evaluateCondition(condition, formData));
  } else {
    // AND logic (default): all conditions must be true
    return conditions.every(condition => evaluateCondition(condition, formData));
  }
}

/**
 * Evaluate auto-requirements and return fields that should be required
 */
export function evaluateAutoRequirements(
  formData: FormData,
  rules: AutoRequirement[],
  unitData?: UnitFormData
): {
  requiredFields: Set<string>;
  evidenceRequirements: Map<string, any>;
  triggeredRules: AutoRequirement[];
} {
  const requiredFields = new Set<string>();
  const evidenceRequirements = new Map();
  const triggeredRules: AutoRequirement[] = [];
  
  const dataToEvaluate = unitData || formData;
  
  for (const rule of rules) {
    if (!rule.is_active) continue;
    
    const triggered = evaluateConditions(rule.conditions, dataToEvaluate);
    
    if (triggered) {
      triggeredRules.push(rule);
      
      // Add required fields
      rule.required_fields.forEach(field => requiredFields.add(field));
      
      // Add evidence requirements
      if (rule.evidence_requirements) {
        evidenceRequirements.set(rule.id, rule.evidence_requirements);
      }
    }
  }
  
  return { requiredFields, evidenceRequirements, triggeredRules };
}

/**
 * Evaluate fee suggestions and return recommended fees
 */
export function evaluateFeeSuggestions(
  formData: FormData,
  feeRules: FeeSuggestion[],
  units?: UnitFormData[]
): FeeRecommendation[] {
  const recommendations: FeeRecommendation[] = [];
  const seenFees = new Set<string>();
  
  for (const rule of feeRules) {
    if (!rule.is_active) continue;
    
    if (rule.scope === 'per_unit' && units) {
      // Evaluate for each unit
      units.forEach((unit, index) => {
        const triggered = evaluateConditions(rule.conditions, unit);
        
        if (triggered) {
          const feeKey = rule.prevent_duplicates 
            ? `${rule.fee_id}` 
            : `${rule.fee_id}-${unit.unit_id || index}`;
          
          if (!seenFees.has(feeKey)) {
            recommendations.push({
              fee_id: rule.fee_id,
              fee_name: rule.fee_name,
              fee_amount: rule.fee_amount,
              reason: `From unit ${unit.unit_id || `#${index + 1}`}: ${getReason(rule.conditions, unit)}`,
              unit_id: unit.unit_id,
              auto_added: rule.auto_add,
              rule_id: rule.id,
            });
            
            if (rule.prevent_duplicates) {
              seenFees.add(feeKey);
            }
          }
        }
      });
    } else if (rule.scope === 'per_job') {
      // Evaluate for entire job
      const triggered = evaluateConditions(rule.conditions, formData);
      
      if (triggered) {
        const feeKey = `${rule.fee_id}`;
        
        if (!seenFees.has(feeKey) || !rule.prevent_duplicates) {
          recommendations.push({
            fee_id: rule.fee_id,
            fee_name: rule.fee_name,
            fee_amount: rule.fee_amount,
            reason: getReason(rule.conditions, formData),
            auto_added: rule.auto_add,
            rule_id: rule.id,
          });
          
          if (rule.prevent_duplicates) {
            seenFees.add(feeKey);
          }
        }
      }
    }
  }
  
  return recommendations;
}

/**
 * Get human-readable reason from conditions
 */
function getReason(conditions: RuleCondition[], data: any): string {
  const triggered = conditions.find(c => evaluateCondition(c, data));
  if (!triggered) return 'Condition met';
  
  return `${triggered.field} ${triggered.operator.replace('_', ' ')} ${triggered.value}`;
}

/**
 * Evaluate default values and return prefilled form data
 */
export function evaluateDefaultValues(
  jobData: any,
  rules: DefaultValueRule[],
  historyData?: any
): Partial<FormData> {
  const defaults: Partial<FormData> = {};
  
  for (const rule of rules) {
    // Check conditions if any
    if (rule.conditions && rule.conditions.length > 0) {
      const conditionsMet = evaluateConditions(rule.conditions, jobData);
      if (!conditionsMet) continue;
    }
    
    let value: any;
    
    switch (rule.source) {
      case 'job_data':
        value = rule.source_field ? jobData[rule.source_field] : undefined;
        break;
      
      case 'last_visit':
        if (historyData && rule.source_field) {
          // Check if within days threshold
          const lastVisitDate = new Date(historyData.date);
          const now = new Date();
          const daysDiff = Math.floor((now.getTime() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (rule.days_threshold && daysDiff <= rule.days_threshold) {
            value = historyData[rule.source_field];
          }
        }
        break;
      
      case 'static':
        value = rule.static_value;
        break;
      
      case 'system':
        value = getSystemValue(rule.source_field || '');
        break;
      
      case 'formula':
        // Simple formula evaluation (can be enhanced)
        value = evaluateFormula(rule.formula || '', jobData);
        break;
    }
    
    if (value !== undefined) {
      defaults[rule.field_id] = value;
    }
  }
  
  return defaults;
}

/**
 * Get system values like current date, time, user
 */
function getSystemValue(field: string): any {
  switch (field) {
    case 'current_date':
      return new Date().toISOString().split('T')[0];
    case 'current_time':
      return new Date().toISOString().split('T')[1].split('.')[0];
    case 'current_datetime':
      return new Date().toISOString();
    default:
      return undefined;
  }
}

/**
 * Simple formula evaluator (can be enhanced)
 */
function evaluateFormula(formula: string, data: any): any {
  // Very basic formula support
  try {
    // Replace field references with actual values
    let processedFormula = formula;
    Object.keys(data).forEach(key => {
      processedFormula = processedFormula.replace(new RegExp(`\\{${key}\\}`, 'g'), data[key]);
    });
    
    // Evaluate simple math expressions
    // Note: In production, use a safer expression evaluator
    return eval(processedFormula);
  } catch (error) {
    console.error('Formula evaluation error:', error);
    return undefined;
  }
}

/**
 * Validate form for submission
 */
export function validateSubmit(
  formData: FormData,
  autoRequirements: AutoRequirement[],
  units?: UnitFormData[],
  unitLoopConfig?: UnitLoopConfig
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  if (unitLoopConfig?.enabled && units) {
    // Validate each unit
    units.forEach((unit, index) => {
      const { requiredFields, evidenceRequirements } = evaluateAutoRequirements(
        formData,
        autoRequirements,
        unit
      );
      
      // Check required fields
      requiredFields.forEach(fieldId => {
        if (!unit[fieldId] || (Array.isArray(unit[fieldId]) && unit[fieldId].length === 0)) {
          issues.push({
            unit_id: unit.unit_id,
            unit_index: index,
            field_id: fieldId,
            field_label: fieldId.replace(/_/g, ' '),
            issue_type: 'required_field',
            message: `Required field missing`,
          });
        }
      });
      
      // Check evidence requirements
      evidenceRequirements.forEach((requirements, ruleId) => {
        if (requirements.min_photos) {
          const photoFields = Object.keys(unit).filter(k => k.includes('photo'));
          const totalPhotos = photoFields.reduce((sum, field) => {
            const photos = unit[field];
            return sum + (Array.isArray(photos) ? photos.length : 0);
          }, 0);
          
          if (totalPhotos < requirements.min_photos) {
            issues.push({
              unit_id: unit.unit_id,
              unit_index: index,
              field_id: 'photos',
              field_label: 'Photos',
              issue_type: 'missing_evidence',
              message: `Requires at least ${requirements.min_photos} photo(s), found ${totalPhotos}`,
            });
          }
        }
        
        if (requirements.gps_required && !unit.gps_location) {
          issues.push({
            unit_id: unit.unit_id,
            unit_index: index,
            field_id: 'gps_location',
            field_label: 'GPS Location',
            issue_type: 'missing_evidence',
            message: 'GPS lock required',
          });
        }
        
        if (requirements.signature_required && !unit.signature) {
          issues.push({
            unit_id: unit.unit_id,
            unit_index: index,
            field_id: 'signature',
            field_label: 'Signature',
            issue_type: 'missing_evidence',
            message: 'Signature required',
          });
        }
      });
    });
  } else {
    // Validate entire form
    const { requiredFields, evidenceRequirements } = evaluateAutoRequirements(
      formData,
      autoRequirements
    );
    
    requiredFields.forEach(fieldId => {
      if (!formData[fieldId] || (Array.isArray(formData[fieldId]) && formData[fieldId].length === 0)) {
        issues.push({
          field_id: fieldId,
          field_label: fieldId.replace(/_/g, ' '),
          issue_type: 'required_field',
          message: 'Required field missing',
        });
      }
    });
  }
  
  return issues;
}

/**
 * Create automation audit trail
 */
export function createAutomationAudit(
  formData: FormData,
  autoRequirements: AutoRequirement[],
  feeRules: FeeSuggestion[],
  units?: UnitFormData[]
): AutomationAudit {
  const timestamp = new Date().toISOString();
  
  // Evaluate all rules
  const requirementsResult = evaluateAutoRequirements(formData, autoRequirements);
  const feeRecommendations = evaluateFeeSuggestions(formData, feeRules, units);
  const validationIssues = validateSubmit(formData, autoRequirements, units);
  
  return {
    rules_evaluated: autoRequirements.map(rule => ({
      rule_id: rule.id,
      rule_name: rule.name,
      triggered: requirementsResult.triggeredRules.some(r => r.id === rule.id),
      timestamp,
    })),
    auto_requirements_triggered: requirementsResult.triggeredRules.map(rule => ({
      rule_id: rule.id,
      rule_name: rule.name,
      fields_required: rule.required_fields,
    })),
    fees_suggested: feeRecommendations.map(fee => ({
      fee_id: fee.fee_id,
      fee_name: fee.fee_name,
      fee_amount: fee.fee_amount,
      reason: fee.reason,
      auto_added: fee.auto_added,
    })),
    tasks_created: [],
    notifications_sent: [],
    validation_results: {
      blocking_issues: validationIssues,
      warnings: [],
    },
  };
}
