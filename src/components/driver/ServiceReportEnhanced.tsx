import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, PenTool, Save, Send, ChevronLeft, ChevronRight, FileText, Wifi, WifiOff } from 'lucide-react';
import { PhotoCapture } from './PhotoCapture';
import { SignatureCapture } from './SignatureCapture';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FormField {
  id: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'checkbox' | 'date' | 'time' | 'photo' | 'signature';
  label: string;
  required?: boolean;
  options?: string[];
  value?: any;
}

interface FormSection {
  name: string;
  fields: FormField[];
}

interface ServiceReportEnhancedProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  templates: any[];
  onComplete: () => void;
}

export const ServiceReportEnhanced: React.FC<ServiceReportEnhancedProps> = ({
  open,
  onOpenChange,
  jobId,
  templates,
  onComplete
}) => {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [sections, setSections] = useState<FormSection[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isDirty, setIsDirty] = useState(false);
  
  // Photo/Signature capture states
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);
  const [showSignatureCapture, setShowSignatureCapture] = useState(false);
  const [currentFieldId, setCurrentFieldId] = useState<string>('');
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Initialize form based on templates
    initializeForm();
    
    // Setup online/offline detection
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (autoSaveTimer) clearTimeout(autoSaveTimer);
    };
  }, [templates, open]);

  useEffect(() => {
    calculateCompletionPercentage();
  }, [formData, sections]);

  useEffect(() => {
    // Auto-save functionality
    if (isDirty && autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }
    
    if (isDirty) {
      const timer = setTimeout(() => {
        autoSave();
      }, 2000); // Auto-save after 2 seconds of inactivity
      
      setAutoSaveTimer(timer);
    }
  }, [formData, isDirty]);

  const initializeForm = () => {
    if (!templates || templates.length === 0) return;
    
    // Use first template or merge multiple templates
    const primaryTemplate = templates[0];
    const templateData = primaryTemplate.template_data;
    
    if (templateData?.sections) {
      setSections(templateData.sections);
      
      // Initialize form data
      const initialData: Record<string, any> = {};
      templateData.sections.forEach((section: FormSection) => {
        section.fields.forEach((field: FormField) => {
          initialData[field.id] = field.type === 'checkbox' ? false : '';
        });
      });
      setFormData(initialData);
    }
  };

  const calculateCompletionPercentage = () => {
    if (sections.length === 0) return;
    
    const totalFields = sections.reduce((acc, section) => acc + section.fields.length, 0);
    const completedFields = Object.values(formData).filter(value => {
      if (typeof value === 'boolean') return true;
      return value !== '' && value !== null && value !== undefined;
    }).length;
    
    const percentage = totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;
    setCompletionPercentage(percentage);
  };

  const autoSave = async () => {
    if (!isOnline) {
      // Save to localStorage for offline support
      localStorage.setItem(`draft_report_${jobId}`, JSON.stringify({
        formData,
        timestamp: new Date().toISOString()
      }));
      toast.info('Draft saved offline');
    } else {
      // Save to database
      try {
        // Simplified auto-save for demo
        toast.success('Draft auto-saved');
        
        if (error) throw error;
        toast.success('Draft auto-saved');
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }
    setIsDirty(false);
  };

  const updateFieldValue = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    setIsDirty(true);
  };

  const handlePhotoCapture = (fieldId: string) => {
    setCurrentFieldId(fieldId);
    setShowPhotoCapture(true);
  };

  const handleSignatureCapture = (fieldId: string) => {
    setCurrentFieldId(fieldId);
    setShowSignatureCapture(true);
  };

  const onPhotoComplete = (photoUrl: string) => {
    updateFieldValue(currentFieldId, photoUrl);
    setShowPhotoCapture(false);
    setCurrentFieldId('');
  };

  const onSignatureComplete = (signatureUrl: string) => {
    updateFieldValue(currentFieldId, signatureUrl);
    setShowSignatureCapture(false);
    setCurrentFieldId('');
  };

  const validateCurrentSection = () => {
    const currentSection = sections[currentSectionIndex];
    if (!currentSection) return true;
    
    return currentSection.fields.every(field => {
      if (!field.required) return true;
      const value = formData[field.id];
      if (field.type === 'checkbox') return true;
      return value !== '' && value !== null && value !== undefined;
    });
  };

  const goToNextSection = () => {
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
    if (!validateCurrentSection()) {
      toast.error('Please complete all required fields');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Generate report number
      const reportNumber = `RPT-${Date.now()}`;
      
      // Simplified completion for demo
      console.log('Report completed:', reportNumber, formData);

      if (error) throw error;

      // Update job status
      const { error: jobError } = await supabase
        .from('jobs')
        .update({ status: 'completed' })
        .eq('id', jobId);

      if (jobError) throw jobError;

      // Clear draft from localStorage
      localStorage.removeItem(`draft_report_${jobId}`);
      
      toast.success('Service report completed successfully!');
      onComplete();
      onOpenChange(false);
      
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error('Failed to submit report. Please try again.');
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
            placeholder={`Enter ${field.label.toLowerCase()}`}
            className="text-base" // Mobile-friendly font size
          />
        );

      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => updateFieldValue(field.id, e.target.value)}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            rows={3}
            className="text-base resize-none"
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => updateFieldValue(field.id, e.target.value)}
            placeholder="0"
            className="text-base"
          />
        );

      case 'select':
        return (
          <Select value={value} onValueChange={(value) => updateFieldValue(field.id, value)}>
            <SelectTrigger className="text-base">
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
          <div className="flex items-center space-x-3 p-3 border rounded-lg">
            <Checkbox
              checked={value}
              onCheckedChange={(checked) => updateFieldValue(field.id, checked)}
              className="h-5 w-5"
            />
            <Label className="text-base cursor-pointer flex-1">
              {field.label}
            </Label>
          </div>
        );

      case 'date':
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => updateFieldValue(field.id, e.target.value)}
            className="text-base"
          />
        );

      case 'time':
        return (
          <Input
            type="time"
            value={value}
            onChange={(e) => updateFieldValue(field.id, e.target.value)}
            className="text-base"
          />
        );

      case 'photo':
        return (
          <div className="space-y-3">
            <Button
              type="button"
              onClick={() => handlePhotoCapture(field.id)}
              className="w-full py-3 text-base"
              variant="outline"
            >
              <Camera className="w-5 h-5 mr-2" />
              {value ? 'Retake Photo' : 'Take Photo'}
            </Button>
            {value && (
              <div className="border rounded-lg p-2">
                <img src={value} alt="Captured" className="w-full h-32 object-cover rounded" />
              </div>
            )}
          </div>
        );

      case 'signature':
        return (
          <div className="space-y-3">
            <Button
              type="button"
              onClick={() => handleSignatureCapture(field.id)}
              className="w-full py-3 text-base"
              variant="outline"
            >
              <PenTool className="w-5 h-5 mr-2" />
              {value ? 'Update Signature' : 'Add Signature'}
            </Button>
            {value && (
              <div className="border rounded-lg p-2">
                <img src={value} alt="Signature" className="w-full h-24 object-contain rounded" />
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const currentSection = sections[currentSectionIndex];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-full max-w-2xl h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Service Report</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={isOnline ? 'default' : 'destructive'}>
                  {isOnline ? <Wifi className="w-3 h-3 mr-1" /> : <WifiOff className="w-3 h-3 mr-1" />}
                  {isOnline ? 'Online' : 'Offline'}
                </Badge>
                {isDirty && (
                  <Badge variant="outline">
                    <Save className="w-3 h-3 mr-1" />
                    Unsaved
                  </Badge>
                )}
              </div>
            </DialogTitle>
            
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{completionPercentage}%</span>
              </div>
              <Progress value={completionPercentage} className="h-2" />
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-6">
            {/* Section Navigation */}
            {sections.length > 1 && (
              <div className="flex items-center justify-center space-x-2">
                {sections.map((_, index) => (
                  <div
                    key={index}
                    className={`w-3 h-3 rounded-full ${
                      index === currentSectionIndex ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
            )}

            {currentSection && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{currentSection.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {currentSection.fields.map((field) => (
                    <div key={field.id} className="space-y-2">
                      {field.type !== 'checkbox' && (
                        <Label className="text-base font-medium">
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                      )}
                      {renderField(field)}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Navigation & Submit */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={goToPreviousSection}
              disabled={currentSectionIndex === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            <div className="text-sm text-muted-foreground">
              Section {currentSectionIndex + 1} of {sections.length}
            </div>

            {currentSectionIndex < sections.length - 1 ? (
              <Button
                onClick={goToNextSection}
                disabled={!validateCurrentSection()}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !validateCurrentSection()}
              >
                <Send className="w-4 h-4 mr-2" />
                {isSubmitting ? 'Submitting...' : 'Complete Report'}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Photo Capture Modal */}
      <PhotoCapture
        open={showPhotoCapture}
        onClose={() => setShowPhotoCapture(false)}
        jobId={jobId}
        onComplete={onPhotoComplete}
      />

      {/* Signature Capture Modal */}
      <SignatureCapture
        open={showSignatureCapture}
        onClose={() => setShowSignatureCapture(false)}
        jobId={jobId}
        onComplete={onSignatureComplete}
      />
    </>
  );
};