import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GripVertical, Trash2 } from 'lucide-react';
import { EnhancedSection, SectionBlockType } from '../types';
import { IndustryBlockCard, industryBlocks } from '../sections/IndustryBlocks';
import { GenericBlockCard, genericBlocks } from '../sections/GenericBlocks';

interface SectionsStepProps {
  sections: EnhancedSection[];
  onAddSection: (blockType: SectionBlockType) => void;
  onRemoveSection: (sectionId: string) => void;
  onReorderSections: (sections: EnhancedSection[]) => void;
}

export const SectionsStep: React.FC<SectionsStepProps> = ({
  sections,
  onAddSection,
  onRemoveSection,
  onReorderSections,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Section Library */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-1">Section Library</h3>
          <p className="text-sm text-muted-foreground">
            Click any block to add it to your template
          </p>
        </div>

        <Tabs defaultValue="industry" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="industry">Industry Blocks</TabsTrigger>
            <TabsTrigger value="generic">Generic Blocks</TabsTrigger>
          </TabsList>

          <TabsContent value="industry" className="space-y-3 mt-4">
            {industryBlocks.map((block) => (
              <IndustryBlockCard
                key={block.type}
                block={block}
                onAdd={onAddSection}
              />
            ))}
          </TabsContent>

          <TabsContent value="generic" className="grid grid-cols-2 gap-3 mt-4">
            {genericBlocks.map((block) => (
              <GenericBlockCard
                key={block.type}
                block={block}
                onAdd={onAddSection}
              />
            ))}
          </TabsContent>
        </Tabs>
      </div>

      {/* Right: Template Builder */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-1">Your Template</h3>
          <p className="text-sm text-muted-foreground">
            Drag to reorder • {sections.length} section{sections.length !== 1 ? 's' : ''} added
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Template Sections</CardTitle>
            <CardDescription>
              Sections will appear in this order on the form
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sections.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-sm">No sections added yet</p>
                <p className="text-xs mt-1">Click a block from the left to get started</p>
              </div>
            ) : (
              <div className="space-y-2">
                {sections.map((section, index) => (
                  <div
                    key={section.id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group"
                  >
                    {/* Drag handle */}
                    <button className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
                      <GripVertical className="w-4 h-4" />
                    </button>

                    {/* Section info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium truncate">
                          {section.title}
                        </span>
                        {section.repeat_for_each && (
                          <Badge className="bg-gradient-to-r from-primary to-primary/80 text-white text-xs">
                            Per-Unit Loop
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {section.fields.length} field{section.fields.length !== 1 ? 's' : ''}
                      </p>
                    </div>

                    {/* Delete button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => onRemoveSection(section.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
