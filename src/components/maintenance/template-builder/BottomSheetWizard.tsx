import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { EnhancedTemplate, BuilderStep, EnhancedSection, SectionBlockType, LogicRules, Permissions, OutputConfig } from './types';
import { StepNavigation } from './StepNavigation';
import { BasicsStep } from './steps/BasicsStep';
import { SectionsStep } from './steps/SectionsStep';
import { LogicStep } from './steps/LogicStep';
import { PermissionsStep } from './steps/PermissionsStep';
import { OutputStep } from './steps/OutputStep';
import { ReviewStep } from './steps/ReviewStep';
import { industryBlocks } from './sections/IndustryBlocks';
import { genericBlocks } from './sections/GenericBlocks';

interface BottomSheetWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: Partial<EnhancedTemplate>) => void;
  initialTemplate?: EnhancedTemplate;
}

export const BottomSheetWizard: React.FC<BottomSheetWizardProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTemplate,
}) => {
  const [currentStep, setCurrentStep] = useState<BuilderStep>(1);
  const [completedSteps, setCompletedSteps] = useState<BuilderStep[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Template state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [templateType, setTemplateType] = useState<'delivery' | 'service' | 'pickup' | 'repair' | 'inspection' | 'event'>('service');
  const [sections, setSections] = useState<EnhancedSection[]>([]);
  const [logicRules, setLogicRules] = useState<LogicRules>({
    per_unit_loop: false,
    auto_requirements: [],
    default_values: {},
    fee_suggestions: [],
  });
  const [permissions, setPermissions] = useState<Permissions>({
    tech_editable_fields: ['*'],
    office_editable_fields: ['*'],
    internal_only_fields: [],
  });
  const [outputConfig, setOutputConfig] = useState<OutputConfig>({
    pdf_layout: 'summary_first',
    customer_pdf_fields: [],
    internal_pdf_fields: [],
    photo_grid_columns: 2,
    watermark: '',
    show_brand_header: true,
  });
  const [version, setVersion] = useState('1.0');
  const [isDefaultForType, setIsDefaultForType] = useState(false);

  // Initialize with initial template if provided
  useEffect(() => {
    if (initialTemplate) {
      setName(initialTemplate.name);
      setDescription(initialTemplate.description || '');
      setTemplateType(initialTemplate.template_type);
      setSections(initialTemplate.sections);
      setLogicRules(initialTemplate.logic_rules);
      setPermissions(initialTemplate.permissions);
      setOutputConfig(initialTemplate.output_config);
      setVersion(initialTemplate.version);
      setIsDefaultForType(initialTemplate.is_default_for_type);
    }
  }, [initialTemplate]);

  // Mark as having unsaved changes when any field changes
  useEffect(() => {
    if (name || description || sections.length > 0) {
      setHasUnsavedChanges(true);
    }
  }, [name, description, sections]);

  const handleStepClick = (step: BuilderStep) => {
    if (completedSteps.includes(step) || step <= currentStep) {
      setCurrentStep(step);
    }
  };

  const handleNext = () => {
    if (currentStep < 6) {
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps([...completedSteps, currentStep]);
      }
      setCurrentStep((currentStep + 1) as BuilderStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as BuilderStep);
    }
  };

  const handleAddSection = (blockType: SectionBlockType) => {
    const allBlocks = [...industryBlocks, ...genericBlocks];
    const block = allBlocks.find((b) => b.type === blockType);
    
    if (block) {
      const newSection: EnhancedSection = {
        id: `section-${Date.now()}`,
        type: blockType,
        title: block.title,
        description: block.description,
        repeat_for_each: blockType === 'per_unit_loop',
        fields: [],
      };
      setSections([...sections, newSection]);
    }
  };

  const handleRemoveSection = (sectionId: string) => {
    setSections(sections.filter((s) => s.id !== sectionId));
  };

  const handleReorderSections = (reorderedSections: EnhancedSection[]) => {
    setSections(reorderedSections);
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose();
        resetForm();
      }
    } else {
      onClose();
      resetForm();
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setCompletedSteps([]);
    setName('');
    setDescription('');
    setTemplateType('service');
    setSections([]);
    setLogicRules({ per_unit_loop: false, auto_requirements: [], default_values: {}, fee_suggestions: [] });
    setPermissions({ tech_editable_fields: ['*'], office_editable_fields: ['*'], internal_only_fields: [] });
    setOutputConfig({ pdf_layout: 'summary_first', customer_pdf_fields: [], internal_pdf_fields: [], photo_grid_columns: 2, watermark: '', show_brand_header: true });
    setVersion('1.0');
    setIsDefaultForType(false);
    setHasUnsavedChanges(false);
  };

  const handleSaveDraft = () => {
    const template: Partial<EnhancedTemplate> = {
      name: name || 'Untitled Template',
      description,
      template_type: templateType,
      sections,
      logic_rules: logicRules,
      permissions,
      output_config: outputConfig,
      version,
      is_default_for_type: isDefaultForType,
      is_active: false,
    };
    onSave(template);
    setHasUnsavedChanges(false);
  };

  const handlePublish = () => {
    const template: Partial<EnhancedTemplate> = {
      name,
      description,
      template_type: templateType,
      sections,
      logic_rules: logicRules,
      permissions,
      output_config: outputConfig,
      version,
      is_default_for_type: isDefaultForType,
      is_active: true,
    };
    onSave(template);
    onClose();
    resetForm();
  };

  const canGoNext = () => {
    switch (currentStep) {
      case 1:
        return name.trim().length > 0 && templateType;
      case 2:
        return sections.length > 0;
      default:
        return true;
    }
  };

  const canPublish = () => {
    return name.trim().length > 0 && templateType && sections.length > 0;
  };

  const currentTemplate: Partial<EnhancedTemplate> = {
    name,
    description,
    template_type: templateType,
    sections,
    logic_rules: logicRules,
    permissions,
    output_config: outputConfig,
    version,
    is_default_for_type: isDefaultForType,
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent 
        side="bottom" 
        className="h-screen w-full p-0 flex flex-col"
      >
        {/* Sticky Header - 64px height */}
        <div className="flex items-center justify-between px-6 h-16 border-b bg-background sticky top-0 z-10">
          <h2 className="text-xl font-semibold">Create New Template</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleSaveDraft}>
              Save as Draft
            </Button>
            <Button 
              onClick={handlePublish} 
              disabled={!canPublish()}
            >
              Publish Template
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="ml-2"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Scrollable Content - 24px padding, 20-24px section spacing */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Step Navigation */}
          <StepNavigation
            currentStep={currentStep}
            onStepClick={handleStepClick}
            completedSteps={completedSteps}
          />

          {/* Step Content */}
          <div className="max-w-7xl mx-auto">
            {currentStep === 1 && (
              <BasicsStep
                name={name}
                description={description}
                templateType={templateType}
                onNameChange={setName}
                onDescriptionChange={setDescription}
                onTemplateTypeChange={setTemplateType}
              />
            )}

            {currentStep === 2 && (
              <SectionsStep
                sections={sections}
                onAddSection={handleAddSection}
                onRemoveSection={handleRemoveSection}
                onReorderSections={handleReorderSections}
              />
            )}

            {currentStep === 3 && (
              <LogicStep
                logicRules={logicRules}
                onLogicRulesChange={setLogicRules}
              />
            )}

            {currentStep === 4 && (
              <PermissionsStep
                permissions={permissions}
                onPermissionsChange={setPermissions}
              />
            )}

            {currentStep === 5 && (
              <OutputStep
                outputConfig={outputConfig}
                onOutputConfigChange={setOutputConfig}
              />
            )}

            {currentStep === 6 && (
              <ReviewStep 
                template={currentTemplate}
                version={version}
                onVersionChange={setVersion}
                isDefaultForType={isDefaultForType}
                onIsDefaultChange={setIsDefaultForType}
                onPublish={handlePublish}
                isPublishing={false}
              />
            )}
          </div>
        </div>

        {/* Sticky Footer - 64px height */}
        <div className="flex items-center justify-between px-6 h-16 border-t bg-background sticky bottom-0 z-10">
          <span className="text-sm text-muted-foreground">
            Step {currentStep} of 6
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={!canGoNext() || currentStep === 6}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
