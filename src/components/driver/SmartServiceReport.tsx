import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { PhotoCapture } from './PhotoCapture';
import { SignatureCapture } from './SignatureCapture';
import { PerUnitLoopNav } from './PerUnitLoopNav';
import { GPSLockIndicator } from './GPSLockIndicator';
import { FeeSuggestionsPanel, SuggestedFee } from './FeeSuggestionsPanel';
import { ValidationBlocker } from './ValidationBlocker';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@clerk/clerk-react';
import { useEnhancedOffline } from '@/hooks/useEnhancedOffline';
import { useAutomationRules } from '@/hooks/useAutomationRules';
import { saveDraftReport, getDraftReport, savePendingReport } from '@/lib/serviceReportDB';
import { 
  evaluateAutoRequirements, 
  evaluateFeeSuggestions, 
  evaluateDefaultValues,
  validateSubmit,
  createAutomationAudit,
  UnitFormData,
  FormData as AutoFormData
} from '@/lib/rulesEngine';
import { processAutoActions } from '@/lib/taskAutomation';
import { 
  Camera, 
  FileSignature, 
  CheckCircle, 
  Save,
  Upload,
  Wifi,
  WifiOff,
  CloudOff,
  AlertCircle,
  MapPin
} from 'lucide-react';

interface SmartServiceReportProps {
  job: any;
  templates: any[];
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}

interface FormField {
  id: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'checkbox' | 'date' | 'time' | 'photo' | 'signature';
  label: string;
  required?: boolean;
  options?: string[];
  description?: string;
}

interface FormSection {
  id: string;
  title: string;
  fields: FormField[];
}

export const SmartServiceReport: React.FC<SmartServiceReportProps> = ({
  job,
  templates,
  open,
  onClose,
  onComplete
}) => {
  const { user } = useUser();
  const { isOnline, addOfflineData, queueCount } = useEnhancedOffline();
  const template = templates[0];
  const { data: automationRules } = useAutomationRules(template?.id || '');
  
  // Form state
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [sections, setSections] = useState<FormSection[]>([]);
  // Simple unit type matching PerUnitLoopNav requirements
  interface Unit {
    id: string;
    unit_number: string;
    unit_type: string;
    status?: 'not_started' | 'in_progress' | 'completed' | 'not_serviced';
  }
  
  const [units, setUnits] = useState<Unit[]>([]);
  const [currentUnitIndex, setCurrentUnitIndex] = useState(0);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  
  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showValidationBlocker, setShowValidationBlocker] = useState(false);
  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [showFeeReview, setShowFeeReview] = useState(false);
  const [suggestedFees, setSuggestedFees] = useState<SuggestedFee[]>([]);
  const [feeDecisions, setFeeDecisions] = useState<Map<string, { applied: boolean; reason?: string }>>(new Map());
  
  // Evidence capture state
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);
  const [showSignature, setShowSignature] = useState(false);
  const [currentPhotoField, setCurrentPhotoField] = useState<string | null>(null);
  const [currentSignatureField, setCurrentSignatureField] = useState<string | null>(null);
  const [photosData, setPhotosData] = useState<Array<{ fieldId: string; dataUrl: string }>>([]);
  const [signaturesData, setSignaturesData] = useState<Array<{ fieldId: string; dataUrl: string }>>([]);
  const [gpsData, setGpsData] = useState<Map<string, any>>(new Map());
  
  // Progress tracking
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);

  const isPerUnitMode = template?.template_data?.logic_rules?.per_unit_loop;
  const logicRules = automationRules?.logic_rules || template?.template_data?.logic_rules;

  // Initialize form
  useEffect(() => {
    if (!open || !template) return;

    const initializeForm = async () => {
      // Parse sections from template
      const templateSections: FormSection[] = template.template_data?.sections || [];
      setSections(templateSections);

      // Load units if per-unit mode
      if (isPerUnitMode) {
        // Use mock units for now to avoid Supabase type inference issues
        // TODO: Replace with actual query when Supabase types are fixed
        const mockUnits: Unit[] = [
          { id: '1', unit_number: 'Unit-001', unit_type: 'Standard', status: 'not_started' },
          { id: '2', unit_number: 'Unit-002', unit_type: 'ADA', status: 'not_started' },
          { id: '3', unit_number: 'Unit-003', unit_type: 'Standard', status: 'not_started' },
        ];
        setUnits(mockUnits);
      }

      // Apply default values
      const jobData = {
        customer_name: job.customer?.name,
        site_address: job.site?.address,
        tech_name: user?.fullName,
        ...job,
      };

      const defaults = evaluateDefaultValues(
        jobData,
        logicRules?.default_value_rules || [],
        null
      );

      setFormData(defaults);

      // Load draft
      const draft = await getDraftReport(job.id);
      if (draft?.formData) {
        setFormData(draft.formData);
        if (draft.photos) setPhotosData(draft.photos);
        if (draft.signatures) setSignaturesData(draft.signatures);
        toast.info('Draft loaded');
      }
    };

    initializeForm();

    return () => {
      if (autoSaveTimer) clearTimeout(autoSaveTimer);
    };
  }, [open, template, job.id]);

  // Auto-save
  useEffect(() => {
    if (Object.keys(formData).length === 0 || !open) return;

    if (autoSaveTimer) clearTimeout(autoSaveTimer);

    const timer = setTimeout(async () => {
      try {
        await saveDraftReport({
          id: job.id,
          jobId: job.id,
          templateId: template.id,
          formData,
          photos: photosData,
          signatures: signaturesData,
          status: 'draft',
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, 2000);

    setAutoSaveTimer(timer);
  }, [formData, photosData, signaturesData]);

  // Real-time requirement evaluation
  const currentRequirements = useMemo(() => {
    if (!logicRules?.auto_requirements) {
      return { 
        requiredFields: new Set<string>(), 
        evidenceRequirements: new Map(), 
        triggeredRules: [] as any[]
      };
    }

    const currentData = isPerUnitMode && units[currentUnitIndex]
      ? formData[`unit_${units[currentUnitIndex]?.id}`] || {}
      : formData;

    return evaluateAutoRequirements(
      formData,
      logicRules.auto_requirements,
      isPerUnitMode ? currentData : undefined
    );
  }, [formData, currentUnitIndex, logicRules, isPerUnitMode, units]);

  // Update field value
  const updateFieldValue = (fieldId: string, value: any) => {
    if (isPerUnitMode && units[currentUnitIndex]) {
      const unitId = units[currentUnitIndex].id;
      setFormData(prev => ({
        ...prev,
        [`unit_${unitId}`]: {
          ...prev[`unit_${unitId}`],
          [fieldId]: value,
        },
      }));
    } else {
      setFormData(prev => ({ ...prev, [fieldId]: value }));
    }
  };

  // Handle photo capture
  const handlePhotoCapture = (fieldId: string) => {
    setCurrentPhotoField(fieldId);
    setShowPhotoCapture(true);
  };

  const onPhotoComplete = (photoUrl: string) => {
    if (currentPhotoField) {
      updateFieldValue(currentPhotoField, photoUrl);
      setPhotosData(prev => [...prev, { fieldId: currentPhotoField, dataUrl: photoUrl }]);
    }
    setShowPhotoCapture(false);
    setCurrentPhotoField(null);
  };

  // Handle signature capture
  const handleSignatureCapture = (fieldId: string) => {
    setCurrentSignatureField(fieldId);
    setShowSignature(true);
  };

  const onSignatureComplete = (signatureUrl: string) => {
    if (currentSignatureField) {
      updateFieldValue(currentSignatureField, signatureUrl);
      setSignaturesData(prev => [...prev, { fieldId: currentSignatureField, dataUrl: signatureUrl }]);
    }
    setShowSignature(false);
    setCurrentSignatureField(null);
  };

  // Handle GPS lock
  const handleGPSLock = (fieldId: string, coords: any) => {
    updateFieldValue(fieldId, coords);
    setGpsData(prev => new Map(prev).set(fieldId, coords));
  };

  // Per-unit navigation
  const goToNextUnit = () => {
    if (currentUnitIndex < units.length - 1) {
      setCurrentUnitIndex(currentUnitIndex + 1);
      setCurrentSectionIndex(0);
    }
  };

  const goToPreviousUnit = () => {
    if (currentUnitIndex > 0) {
      setCurrentUnitIndex(currentUnitIndex - 1);
      setCurrentSectionIndex(0);
    }
  };

  const jumpToUnit = (index: number) => {
    setCurrentUnitIndex(index);
    setCurrentSectionIndex(0);
  };

  // Validate and submit
  const handleSubmit = async () => {
    // Validate
    const unitFormData: UnitFormData[] = units.map(u => formData[`unit_${u.id}`] || {});
    const validation = validateSubmit(
      formData as AutoFormData,
      logicRules?.auto_requirements || [],
      isPerUnitMode ? unitFormData : undefined,
      logicRules?.unit_loop_config
    );

    if (validation.length > 0) {
      setValidationErrors(validation.map(v => ({ 
        message: v.message,
        unitIndex: v.unit_index,
        unitId: v.unit_id,
        fieldId: v.field_id 
      })));
      setShowValidationBlocker(true);
      return;
    }

    // Evaluate fee suggestions
    const fees = evaluateFeeSuggestions(
      formData as AutoFormData,
      logicRules?.fee_suggestions || [],
      isPerUnitMode ? unitFormData : undefined
    );

    if (fees.length > 0) {
      const mappedFees: SuggestedFee[] = fees.map(f => ({
        id: f.fee_id,
        name: f.fee_name,
        amount: f.fee_amount,
        reason: f.reason,
        auto_added: f.auto_added,
        unit_id: f.unit_id,
      }));
      setSuggestedFees(mappedFees);
      setShowFeeReview(true);
      return;
    }

    // No fees, submit directly
    await performSubmit([]);
  };

  const handleFeesApplied = async (appliedFeeIds: string[]) => {
    const appliedFees = suggestedFees.filter(f => appliedFeeIds.includes(f.id));
    setShowFeeReview(false);
    await performSubmit(appliedFees);
  };

  const handleFeeDismissed = (feeId: string, reason: string) => {
    setFeeDecisions(prev => new Map(prev).set(feeId, { applied: false, reason }));
  };

  const performSubmit = async (appliedFees: SuggestedFee[]) => {
    setIsSubmitting(true);

    try {
      // Create automation audit
      const unitFormData: UnitFormData[] = units.map(u => formData[`unit_${u.id}`] || {});
      const audit = createAutomationAudit(
        formData as AutoFormData,
        logicRules?.auto_requirements || [],
        logicRules?.fee_suggestions || [],
        isPerUnitMode ? unitFormData : undefined
      );

      // Add fee decisions
      audit.fees_suggested.forEach(fee => {
        const decision = feeDecisions.get(fee.fee_id);
        if (decision) {
          fee.user_decision = decision.applied ? 'applied' : 'dismissed';
          fee.dismiss_reason = decision.reason;
        } else if (appliedFees.some(f => f.id === fee.fee_id)) {
          fee.user_decision = 'applied';
        }
      });

      // Process auto-actions (task creation, notifications)
      for (const rule of currentRequirements.triggeredRules) {
        if (rule.auto_actions?.create_task || rule.auto_actions?.notify) {
          const actions = await processAutoActions(rule, formData, {
            jobId: job.id,
            customerId: job.customer_id,
            techId: user?.id || '',
            photos: photosData.map(p => p.dataUrl),
          });

          actions.forEach(action => {
            if (action.type === 'task_created') {
              audit.tasks_created.push({
                task_id: action.result.id,
                rule_id: rule.id,
                rule_name: rule.name,
              });
            } else if (action.type === 'notification_sent') {
              audit.notifications_sent.push({
                type: 'email',
                recipient: action.result.recipients.join(', '),
                timestamp: new Date().toISOString(),
              });
            }
          });
        }
      }

      if (!isOnline) {
        // Queue offline
        await savePendingReport({
          id: job.id,
          jobId: job.id,
          templateId: template.id,
          formData: { ...formData, automation_audit: audit, applied_fees: appliedFees },
          photos: photosData,
          signatures: signaturesData,
          status: 'pending',
          timestamp: new Date().toISOString(),
        });

        addOfflineData('service_report', {
          jobId: job.id,
          templateId: template.id,
          formData,
          photos: photosData,
          signatures: signaturesData,
          customerId: job.customer_id,
          automationAudit: audit,
          appliedFees,
        }, user?.id || '');

        toast.success('Report saved offline and will sync when connected');
      } else {
        // Online submission - upload media
        const uploadedPhotos: string[] = [];
        for (const photo of photosData) {
          const photoBlob = await fetch(photo.dataUrl).then(r => r.blob());
          const photoPath = `${job.id}/${Date.now()}_${photo.fieldId}.jpg`;
          const { data } = await supabase.storage
            .from('service-reports')
            .upload(photoPath, photoBlob);
          
          if (data) {
            const { data: { publicUrl } } = supabase.storage
              .from('service-reports')
              .getPublicUrl(photoPath);
            uploadedPhotos.push(publicUrl);
          }
        }

        const uploadedSignatures: string[] = [];
        for (const signature of signaturesData) {
          const signatureBlob = await fetch(signature.dataUrl).then(r => r.blob());
          const signaturePath = `${job.id}/${Date.now()}_${signature.fieldId}.png`;
          const { data } = await supabase.storage
            .from('service-reports')
            .upload(signaturePath, signatureBlob);
          
          if (data) {
            const { data: { publicUrl } } = supabase.storage
              .from('service-reports')
              .getPublicUrl(signaturePath);
            uploadedSignatures.push(publicUrl);
          }
        }

        // Create maintenance report
        const { error: reportError } = await supabase.from('maintenance_reports').insert({
          template_id: template.id,
          report_number: `SVC-${Date.now().toString().slice(-6)}`,
          report_data: {
            form_data: formData,
            automation_audit: audit,
            applied_fees: appliedFees,
            uploaded_photos: uploadedPhotos,
            uploaded_signatures: uploadedSignatures,
          } as any,
          status: 'completed',
          completed_at: new Date().toISOString(),
          created_by: user?.id || job.driver_id,
          customer_id: job.customer_id,
        } as any);

        if (reportError) throw reportError;

        // Update job status
        await supabase
          .from('jobs')
          .update({ 
            status: 'completed',
            actual_completion_time: new Date().toISOString()
          })
          .eq('id', job.id);

        toast.success('Report submitted successfully!');
      }

      onComplete();
      onClose();
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: FormField) => {
    const currentData = isPerUnitMode && units[currentUnitIndex]
      ? formData[`unit_${units[currentUnitIndex].id}`] || {}
      : formData;
    const value = currentData[field.id] || '';
    const isRequired = field.required || currentRequirements.requiredFields.has(field.id);
    const evidence = currentRequirements.evidenceRequirements.get(field.id);

    switch (field.type) {
      case 'text':
        return <Input value={value} onChange={(e) => updateFieldValue(field.id, e.target.value)} />;
      
      case 'textarea':
        return <Textarea value={value} onChange={(e) => updateFieldValue(field.id, e.target.value)} rows={3} />;
      
      case 'number':
        return <Input type="number" value={value} onChange={(e) => updateFieldValue(field.id, e.target.value)} />;
      
      case 'select':
        return (
          <Select value={value} onValueChange={(val) => updateFieldValue(field.id, val)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {field.options?.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
            </SelectContent>
          </Select>
        );
      
      case 'checkbox':
        return (
          <div className="flex items-center gap-2">
            <Checkbox checked={value} onCheckedChange={(checked) => updateFieldValue(field.id, checked)} />
            <Label>{field.label}</Label>
          </div>
        );
      
      case 'date':
        return <Input type="date" value={value} onChange={(e) => updateFieldValue(field.id, e.target.value)} />;
      
      case 'time':
        return <Input type="time" value={value} onChange={(e) => updateFieldValue(field.id, e.target.value)} />;
      
      case 'photo':
        return (
          <div className="space-y-2">
            <Button variant="outline" onClick={() => handlePhotoCapture(field.id)} className="w-full">
              <Camera className="w-4 h-4 mr-2" />
              {value ? 'Retake Photo' : 'Take Photo'}
            </Button>
            {evidence?.min_photos && (
              <p className="text-xs text-muted-foreground">
                Minimum {evidence.min_photos} photo(s) required
              </p>
            )}
            {evidence?.gps_required && (
              <GPSLockIndicator 
                required 
                onLock={(coords) => handleGPSLock(`${field.id}_gps`, coords)} 
              />
            )}
          </div>
        );
      
      case 'signature':
        return (
          <Button variant="outline" onClick={() => handleSignatureCapture(field.id)} className="w-full">
            <FileSignature className="w-4 h-4 mr-2" />
            {value ? 'Update Signature' : 'Capture Signature'}
          </Button>
        );
      
      default:
        return null;
    }
  };

  const currentSection = sections[currentSectionIndex];
  const currentUnit = isPerUnitMode ? units[currentUnitIndex] : null;

  if (!open) return null;

  return (
    <>
      <Dialog open={open && !showFeeReview && !showValidationBlocker} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{template?.name || 'Service Report'}</span>
              <div className="flex gap-2">
                <Badge variant={isOnline ? 'default' : 'destructive'}>
                  {isOnline ? <Wifi className="w-3 h-3 mr-1" /> : <WifiOff className="w-3 h-3 mr-1" />}
                  {isOnline ? 'Online' : 'Offline'}
                </Badge>
                {!isOnline && queueCount > 0 && (
                  <Badge variant="outline">
                    <CloudOff className="w-3 h-3 mr-1" />
                    {queueCount} queued
                  </Badge>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>

          {/* Per-Unit Navigation */}
          {isPerUnitMode && units.length > 0 && (
            <PerUnitLoopNav
              units={units}
              currentUnitIndex={currentUnitIndex}
              onPrevious={goToPreviousUnit}
              onNext={goToNextUnit}
              onJumpTo={jumpToUnit}
              canNavigate={!isSubmitting}
            />
          )}

          <div className="flex-1 overflow-y-auto space-y-4 p-4">
            {currentSection && (
              <Card>
                <CardHeader>
                  <CardTitle>{currentSection.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentSection.fields.map(field => {
                    const isRequired = field.required || currentRequirements.requiredFields.has(field.id);
                    const triggeredRule = currentRequirements.triggeredRules.find(r => 
                      r.required_fields.includes(field.id)
                    );

                    return (
                      <div key={field.id} className="space-y-2">
                        {field.type !== 'checkbox' && (
                          <Label className="flex items-center gap-2">
                            {field.label}
                            {isRequired && <span className="text-red-500">*</span>}
                            {triggeredRule && (
                              <Badge variant="outline" className="text-xs">
                                Required: {triggeredRule.name}
                              </Badge>
                            )}
                          </Label>
                        )}
                        {renderField(field)}
                        {field.description && <p className="text-xs text-muted-foreground">{field.description}</p>}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="border-t p-4">
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-green-500 to-green-600"
            >
              {isSubmitting ? (
                <>
                  <Upload className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Complete Report
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Validation Blocker Dialog */}
      <Dialog open={showValidationBlocker} onOpenChange={setShowValidationBlocker}>
        <DialogContent className="max-w-2xl">
          <ValidationBlocker
            errors={validationErrors}
            warnings={validationWarnings}
            onJumpToUnit={jumpToUnit}
          />
        </DialogContent>
      </Dialog>

      {/* Fee Review Dialog */}
      <Dialog open={showFeeReview} onOpenChange={setShowFeeReview}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Fee Suggestions</DialogTitle>
          </DialogHeader>
          <FeeSuggestionsPanel
            suggestedFees={suggestedFees}
            onApply={handleFeesApplied}
            onDismiss={handleFeeDismissed}
          />
        </DialogContent>
      </Dialog>

      <PhotoCapture 
        open={showPhotoCapture}
        onClose={() => setShowPhotoCapture(false)}
        jobId={job.id}
        onComplete={onPhotoComplete}
      />

      <SignatureCapture 
        open={showSignature}
        onClose={() => setShowSignature(false)}
        jobId={job.id}
        onComplete={onSignatureComplete}
      />
    </>
  );
};
