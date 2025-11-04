import React, { useState, useEffect } from 'react';
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
import { PhotoCapture } from './PhotoCapture';
import { SignatureCapture } from './SignatureCapture';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@clerk/clerk-react';
import { useEnhancedOffline } from '@/hooks/useEnhancedOffline';
import { saveDraftReport, getDraftReport, savePendingReport } from '@/lib/serviceReportDB';
import { triggerAssetMovementNotification, triggerDriverCheckinNotification } from '@/utils/notificationTriggers';
import {
  FileText, 
  Camera, 
  FileSignature, 
  CheckCircle, 
  ArrowLeft, 
  ArrowRight,
  Save,
  Upload,
  Wifi,
  WifiOff,
  CloudOff
} from 'lucide-react';

interface MaintenanceTemplate {
  id: string;
  name: string;
  description?: string;
  template_type: string;
  template_data: Record<string, any>;
}

interface ServiceReportFormProps {
  job: any;
  templates: MaintenanceTemplate[];
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}

interface FormSection {
  id: string;
  title: string;
  fields: FormField[];
}

interface FormField {
  id: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'checkbox' | 'date' | 'time' | 'photo' | 'signature';
  label: string;
  required?: boolean;
  options?: string[];
  description?: string;
  value?: any;
}

export const ServiceReportForm: React.FC<ServiceReportFormProps> = ({
  job,
  templates,
  open,
  onClose,
  onComplete
}) => {
  const { toast } = useToast();
  const { user } = useUser();
  const { isOnline, addOfflineData, queueCount } = useEnhancedOffline();
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [sections, setSections] = useState<FormSection[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);
  const [showSignature, setShowSignature] = useState(false);
  const [currentPhotoField, setCurrentPhotoField] = useState<string | null>(null);
  const [currentSignatureField, setCurrentSignatureField] = useState<string | null>(null);
  const [photosData, setPhotosData] = useState<Array<{ fieldId: string; dataUrl: string }>>([]);
  const [signaturesData, setSignaturesData] = useState<Array<{ fieldId: string; dataUrl: string }>>([]);
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (open && templates.length > 0) {
      initializeForm();
      
      // Load draft from IndexedDB
      const loadDraft = async () => {
        const draft = await getDraftReport(job.id);
        if (draft && draft.formData) {
          setFormData(draft.formData);
          if (draft.photos) setPhotosData(draft.photos);
          if (draft.signatures) setSignaturesData(draft.signatures);
          toast({
            title: "Draft Loaded",
            description: "Your previous progress has been restored",
          });
        }
      };
      
      loadDraft();
    }
    
    return () => {
      if (autoSaveTimer) clearTimeout(autoSaveTimer);
    };
  }, [open, templates, job.id]);

  useEffect(() => {
    calculateCompletionPercentage();
  }, [formData, sections]);

  // Auto-save functionality
  useEffect(() => {
    if (Object.keys(formData).length > 0) {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
      
      const timer = setTimeout(async () => {
        try {
          await saveDraftReport({
            id: job.id,
            jobId: job.id,
            templateId: templates[0]?.id || '',
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
    }
  }, [formData, photosData, signaturesData]);

  const initializeForm = () => {
    // Use the first template for now - could enhance to show selection if multiple
    const template = templates[0];
    if (!template?.template_data) return;

    // Parse template data into sections
    const templateSections = template.template_data.sections || [];
    const parsedSections: FormSection[] = templateSections.map((section: any, index: number) => ({
      id: section.id || `section_${index}`,
      title: section.title || `Section ${index + 1}`,
      fields: (section.fields || []).map((field: any) => ({
        id: field.id || `field_${Date.now()}_${Math.random()}`,
        type: field.type || 'text',
        label: field.label || 'Untitled Field',
        required: field.required || false,
        options: field.options || [],
        description: field.description,
        value: ''
      }))
    }));

    // Add default sections if template doesn't have any
    if (parsedSections.length === 0) {
      parsedSections.push({
        id: 'general',
        title: 'General Service Information',
        fields: [
          {
            id: 'service_type',
            type: 'text',
            label: 'Service Type',
            required: true,
            value: job.job_type || ''
          },
          {
            id: 'service_notes',
            type: 'textarea',
            label: 'Service Notes',
            required: false,
            value: ''
          },
          {
            id: 'completion_status',
            type: 'select',
            label: 'Completion Status',
            required: true,
            options: ['Completed Successfully', 'Partially Completed', 'Unable to Complete'],
            value: ''
          },
          {
            id: 'technician_signature',
            type: 'signature',
            label: 'Technician Signature',
            required: true,
            value: ''
          }
        ]
      });
    }

    setSections(parsedSections);
    setCurrentSectionIndex(0);
    
    // Initialize form data
    const initialData: Record<string, any> = {};
    parsedSections.forEach(section => {
      section.fields.forEach(field => {
        initialData[field.id] = field.value || '';
      });
    });
    setFormData(initialData);
  };

  const calculateCompletionPercentage = () => {
    if (sections.length === 0) return;

    const totalFields = sections.reduce((acc, section) => acc + section.fields.length, 0);
    const completedFields = Object.values(formData).filter(value => 
      value !== '' && value !== null && value !== undefined
    ).length;

    const percentage = totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;
    setCompletionPercentage(percentage);
  };

  const updateFieldValue = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handlePhotoCapture = (fieldId: string) => {
    setCurrentPhotoField(fieldId);
    setShowPhotoCapture(true);
  };

  const handleSignatureCapture = (fieldId: string) => {
    setCurrentSignatureField(fieldId);
    setShowSignature(true);
  };

  const onPhotoComplete = (photoUrl: string) => {
    if (currentPhotoField) {
      updateFieldValue(currentPhotoField, photoUrl);
      setPhotosData(prev => [...prev, { fieldId: currentPhotoField, dataUrl: photoUrl }]);
    }
    setShowPhotoCapture(false);
    setCurrentPhotoField(null);
  };

  const onSignatureComplete = (signatureUrl: string) => {
    if (currentSignatureField) {
      updateFieldValue(currentSignatureField, signatureUrl);
      setSignaturesData(prev => [...prev, { fieldId: currentSignatureField, dataUrl: signatureUrl }]);
    }
    setShowSignature(false);
    setCurrentSignatureField(null);
  };

  const validateCurrentSection = () => {
    const currentSection = sections[currentSectionIndex];
    if (!currentSection) return true;

    for (const field of currentSection.fields) {
      if (field.required && (!formData[field.id] || formData[field.id] === '')) {
        toast({
          title: "Required Field Missing",
          description: `Please fill out: ${field.label}`,
          variant: "destructive"
        });
        return false;
      }
    }
    return true;
  };

  const goToNextSection = () => {
    if (!validateCurrentSection()) return;
    
    if (currentSectionIndex < sections.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
    }
  };

  const goToPreviousSection = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateCurrentSection()) return;

    setIsSubmitting(true);
    try {
      const template = templates[0];

      if (!isOnline) {
        // Queue for offline sync
        await savePendingReport({
          id: job.id,
          jobId: job.id,
          templateId: template.id,
          formData,
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
        }, user?.id || '');

        toast({
          title: "Report Saved Offline",
          description: "Report will sync when connection is restored",
        });

        onComplete();
        onClose();
        return;
      }

      // Online submission - upload photos and signatures first
      const uploadedPhotos: string[] = [];
      const uploadedSignatures: string[] = [];

      for (const photo of photosData) {
        const photoBlob = await fetch(photo.dataUrl).then(r => r.blob());
        const photoPath = `${job.id}/${Date.now()}_${photo.fieldId}.jpg`;
        const { data, error } = await supabase.storage
          .from('service-reports')
          .upload(photoPath, photoBlob);
        
        if (!error && data) {
          const { data: { publicUrl } } = supabase.storage
            .from('service-reports')
            .getPublicUrl(photoPath);
          uploadedPhotos.push(publicUrl);
        }
      }

      for (const signature of signaturesData) {
        const signatureBlob = await fetch(signature.dataUrl).then(r => r.blob());
        const signaturePath = `${job.id}/${Date.now()}_${signature.fieldId}.png`;
        const { data, error } = await supabase.storage
          .from('service-reports')
          .upload(signaturePath, signatureBlob);
        
        if (!error && data) {
          const { data: { publicUrl } } = supabase.storage
            .from('service-reports')
            .getPublicUrl(signaturePath);
          uploadedSignatures.push(publicUrl);
        }
      }
      
      // Create maintenance report record
      await supabase
        .from('maintenance_reports')
        .insert({
          job_id: job.id,
          template_id: template.id,
          report_number: `SVC-${Date.now().toString().slice(-6)}`,
          report_data: {
            ...formData,
            uploaded_photos: uploadedPhotos,
            uploaded_signatures: uploadedSignatures,
          },
          status: 'completed',
          completed_at: new Date().toISOString(),
          created_by: user?.id || job.driver_id,
          customer_id: job.customer_id
        });

      // Update job status to completed
      await supabase
        .from('jobs')
        .update({ 
          status: 'completed',
          actual_completion_time: new Date().toISOString()
        })
        .eq('id', job.id);

      toast({
        title: "Report Submitted",
        description: "Service report has been completed successfully",
      });

      // Trigger asset movement notification (units were serviced)
      if (job && user) {
        await triggerAssetMovementNotification({
          assetId: job.id,
          assetName: `Job ${job.job_number}`,
          movementType: 'returned',
          jobNumber: job.job_number,
          driverId: user.id,
          notifyUserIds: [user.id],
        });

        // Trigger driver check-in notification (job completion)
        await triggerDriverCheckinNotification({
          driverId: user.id,
          driverName: user.fullName || user.firstName || 'Driver',
          checkinType: 'job_departure',
          timestamp: new Date().toISOString(),
          jobNumber: job.job_number,
          notes: `Completed service report for job ${job.job_number}`,
          notifyUserIds: [user.id],
        });
      }

      onComplete();
      onClose();
    } catch (error) {
      console.error('Error submitting report:', error);
      toast({
        title: "Submission Failed",
        description: "Failed to submit service report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: FormField) => {
    const value = formData[field.id] || '';

    switch (field.type) {
      case 'text':
        return (
          <Input
            value={value}
            onChange={(e) => updateFieldValue(field.id, e.target.value)}
            placeholder={field.description}
            className="w-full"
          />
        );

      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => updateFieldValue(field.id, e.target.value)}
            placeholder={field.description}
            rows={3}
            className="w-full"
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => updateFieldValue(field.id, parseFloat(e.target.value) || '')}
            placeholder={field.description}
            className="w-full"
          />
        );

      case 'select':
        return (
          <Select value={value} onValueChange={(val) => updateFieldValue(field.id, val)}>
            <SelectTrigger>
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={value}
              onCheckedChange={(checked) => updateFieldValue(field.id, checked)}
            />
            <Label>{field.description || 'Check if applicable'}</Label>
          </div>
        );

      case 'date':
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => updateFieldValue(field.id, e.target.value)}
            className="w-full"
          />
        );

      case 'time':
        return (
          <Input
            type="time"
            value={value}
            onChange={(e) => updateFieldValue(field.id, e.target.value)}
            className="w-full"
          />
        );

      case 'photo':
        return (
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handlePhotoCapture(field.id)}
              className="w-full"
            >
              <Camera className="w-4 h-4 mr-2" />
              {value ? 'Photo Captured' : 'Take Photo'}
            </Button>
            {value && (
              <Badge variant="secondary" className="w-full justify-center">
                Photo captured successfully
              </Badge>
            )}
          </div>
        );

      case 'signature':
        return (
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSignatureCapture(field.id)}
              className="w-full"
            >
              <FileSignature className="w-4 h-4 mr-2" />
              {value ? 'Signature Captured' : 'Capture Signature'}
            </Button>
            {value && (
              <Badge variant="secondary" className="w-full justify-center">
                Signature captured successfully
              </Badge>
            )}
          </div>
        );

      default:
        return (
          <Input
            value={value}
            onChange={(e) => updateFieldValue(field.id, e.target.value)}
            placeholder={field.description}
            className="w-full"
          />
        );
    }
  };

  if (!open) return null;

  const currentSection = sections[currentSectionIndex];
  const isFirstSection = currentSectionIndex === 0;
  const isLastSection = currentSectionIndex === sections.length - 1;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              <span>Service Report - {templates[0]?.name || 'General Report'}</span>
            </div>
            <div className="flex items-center gap-2">
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

        <div className="space-y-6">
          {/* Progress Indicator */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{completionPercentage}% Complete</span>
            </div>
            <Progress value={completionPercentage} className="w-full" />
          </div>

          {/* Section Navigation */}
          {sections.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {sections.map((section, index) => (
                <Button
                  key={section.id}
                  variant={index === currentSectionIndex ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentSectionIndex(index)}
                  className="whitespace-nowrap"
                >
                  {section.title}
                </Button>
              ))}
            </div>
          )}

          {/* Current Section */}
          {currentSection && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{currentSection.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentSection.fields.map((field) => (
                  <div key={field.id} className="space-y-2">
                    <Label className="text-sm font-medium">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    {renderField(field)}
                    {field.description && field.type !== 'checkbox' && (
                      <p className="text-xs text-muted-foreground">{field.description}</p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <div>
              {!isFirstSection && (
                <Button variant="outline" onClick={goToPreviousSection}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              {!isLastSection ? (
                <Button onClick={goToNextSection}>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmit} 
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700"
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
              )}
            </div>
          </div>
        </div>

        {/* Photo Capture Modal */}
        <PhotoCapture 
          open={showPhotoCapture}
          onClose={() => {
            setShowPhotoCapture(false);
            setCurrentPhotoField(null);
          }}
          jobId={job.id}
        />

        {/* Signature Capture Modal */}
        <SignatureCapture 
          open={showSignature}
          onClose={() => {
            setShowSignature(false);
            setCurrentSignatureField(null);
          }}
          jobId={job.id}
        />
      </DialogContent>
    </Dialog>
  );
};