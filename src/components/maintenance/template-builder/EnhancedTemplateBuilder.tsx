import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { BuilderStep, EnhancedTemplate, TemplateType, SectionBlockType, EnhancedSection } from './types';
import { StepNavigation } from './StepNavigation';
import { BasicsStep } from './steps/BasicsStep';
import { SectionsStep } from './steps/SectionsStep';
import { LogicStepEnhanced } from './steps/LogicStepEnhanced';
import { PermissionsStep } from './steps/PermissionsStep';
import { OutputStep } from './steps/OutputStep';
import { ReviewStep } from './steps/ReviewStep';
import { PreviewPanel } from './preview/PreviewPanel';
import { DEFAULT_PERMISSIONS } from './steps/permissions/defaultPermissions';

interface EnhancedTemplateBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: Partial<EnhancedTemplate>) => void;
  initialTemplate?: Partial<EnhancedTemplate>;
}

export const EnhancedTemplateBuilder: React.FC<EnhancedTemplateBuilderProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTemplate,
}) => {
  const [currentStep, setCurrentStep] = useState<BuilderStep>(1);
  const [completedSteps, setCompletedSteps] = useState<BuilderStep[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);

  // Template state
  const [name, setName] = useState(initialTemplate?.name || '');
  const [description, setDescription] = useState(initialTemplate?.description || '');
  const [templateType, setTemplateType] = useState<TemplateType>(initialTemplate?.template_type || 'service');
  const [sections, setSections] = useState<EnhancedSection[]>(initialTemplate?.sections || []);
  const [logicRules, setLogicRules] = useState(initialTemplate?.logic_rules || {
    per_unit_loop: false,
    auto_requirements: [],
    default_values: {},
    fee_suggestions: [],
  });
  const [permissions, setPermissions] = useState(initialTemplate?.permissions || DEFAULT_PERMISSIONS);
  const [outputConfig, setOutputConfig] = useState(initialTemplate?.output_config || {
    pdf_layout: 'summary_first' as const,
    customer_pdf_fields: [],
    internal_pdf_fields: ['*'],
    photo_grid_columns: 2,
    show_brand_header: true,
  });
  const [version, setVersion] = useState(initialTemplate?.version || '1.0');
  const [isDefaultForType, setIsDefaultForType] = useState(initialTemplate?.is_default_for_type || false);

  const handleStepClick = (step: BuilderStep) => {
    setCurrentStep(step);
  };

  const handleNext = () => {
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep]);
    }
    if (currentStep < 6) {
      setCurrentStep((currentStep + 1) as BuilderStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as BuilderStep);
    }
  };

  const handleAddSection = (blockType: SectionBlockType) => {
    const newSection: EnhancedSection = {
      id: `section-${Date.now()}`,
      type: blockType,
      title: blockType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      fields: [],
      repeat_for_each: blockType === 'per_unit_loop',
    };
    setSections([...sections, newSection]);
  };

  const handleRemoveSection = (sectionId: string) => {
    setSections(sections.filter(s => s.id !== sectionId));
  };

  const handlePublish = () => {
    setIsPublishing(true);
    const template: Partial<EnhancedTemplate> = {
      name,
      description,
      template_type: templateType,
      version,
      is_default_for_type: isDefaultForType,
      sections,
      logic_rules: logicRules,
      permissions,
      output_config: outputConfig,
      is_active: true,
    };
    onSave(template);
    setIsPublishing(false);
    onClose();
  };

  const currentTemplate: Partial<EnhancedTemplate> = {
    name,
    description,
    template_type: templateType,
    sections,
    logic_rules: logicRules,
    permissions,
    output_config: outputConfig,
  };

  const canGoNext = () => {
    switch (currentStep) {
      case 1:
        return name && templateType;
      case 2:
        return sections.length > 0;
      default:
        return true;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-full h-[95vh] p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="text-2xl">
            {initialTemplate ? 'Edit Template' : 'Create New Template'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Step Navigation */}
          <div className="px-6 pt-4">
            <StepNavigation
              currentStep={currentStep}
              onStepClick={handleStepClick}
              completedSteps={completedSteps}
            />
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Builder (Top) */}
            <div className="flex-1 overflow-y-auto px-6 py-4 border-b">
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
                  onReorderSections={setSections}
                />
              )}
              {currentStep === 3 && (
                <LogicStepEnhanced
                  logicRules={logicRules}
                  onLogicRulesChange={setLogicRules}
                />
              )}
              {currentStep === 4 && (
                <PermissionsStep
                  permissions={permissions}
                  onPermissionsChange={setPermissions}
                  sections={sections}
                />
              )}
              {currentStep === 5 && (
                <OutputStep
                  outputConfig={outputConfig}
                  onOutputConfigChange={setOutputConfig}
                  sections={sections}
                  permissions={permissions}
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
                  isPublishing={isPublishing}
                />
              )}
            </div>

            {/* Preview (Bottom) */}
            <div className="h-[300px] overflow-y-auto px-6 py-4 bg-muted/30">
              <PreviewPanel template={currentTemplate} />
            </div>
          </div>

          {/* Footer Navigation */}
          <div className="border-t p-6 flex items-center justify-between bg-background">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <div className="text-sm text-muted-foreground">
              Step {currentStep} of 6
            </div>

            {currentStep < 6 ? (
              <Button
                onClick={handleNext}
                disabled={!canGoNext()}
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handlePublish}
                disabled={!canGoNext() || isPublishing}
                className="bg-gradient-to-r from-primary to-primary/80"
              >
                {isPublishing ? 'Publishing...' : 'Publish Template'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
