import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  History, 
  Copy, 
  GitBranch, 
  Clock, 
  User, 
  FileText,
  CheckCircle,
  AlertCircle,
  Plus,
  RotateCcw
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface TemplateVersioningModalProps {
  templateId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

interface TemplateVersion {
  id: string;
  version: number;
  name: string;
  description: string;
  created_at: string;
  created_by: string;
  is_current: boolean;
  change_summary: string;
  template_data: any;
}

export const TemplateVersioningModal: React.FC<TemplateVersioningModalProps> = ({
  templateId,
  isOpen,
  onClose
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [isCreatingVersion, setIsCreatingVersion] = useState(false);
  const [versionData, setVersionData] = useState({
    name: '',
    description: '',
    changeSummary: ''
  });

  // Fetch template versions
  const { data: versions = [], isLoading } = useQuery({
    queryKey: ['template-versions', templateId],
    queryFn: async () => {
      if (!templateId) return [];
      
      const { data, error } = await supabase
        .from('maintenance_report_templates')
        .select(`
          id,
          version,
          name,
          description,
          created_at,
          created_by,
          template_data,
          change_summary,
          parent_template_id
        `)
        .or(`id.eq.${templateId},parent_template_id.eq.${templateId}`)
        .order('version', { ascending: false });
      
      if (error) throw error;
      
      // Mock version data since we don't have full versioning yet
      return data.map((template: any, index: number) => ({
        ...template,
        is_current: index === 0,
        version: template.version || template.current_version || (data.length - index)
      })) as TemplateVersion[];
    },
    enabled: !!templateId
  });

  // Create new version mutation
  const createVersionMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; changeSummary: string }) => {
      if (!templateId) throw new Error('No template selected');

      // Get current template data
      const { data: currentTemplate, error: fetchError } = await supabase
        .from('maintenance_report_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (fetchError) throw fetchError;

      // Create new version
      const { data: newVersion, error: createError } = await supabase
        .from('maintenance_report_templates')
        .insert({
          name: data.name,
          description: data.description,
          template_type: currentTemplate.template_type,
          template_data: currentTemplate.template_data,
          parent_template_id: templateId,
          version: ((currentTemplate as any).version || (currentTemplate as any).current_version || 1) + 1,
          change_summary: data.changeSummary,
          page_size: (currentTemplate as any).page_size,
          orientation: (currentTemplate as any).orientation,
          company_logo_url: (currentTemplate as any).company_logo_url,
          color_accent: (currentTemplate as any).color_accent,
          category: (currentTemplate as any).category
        })
        .select()
        .single();

      if (createError) throw createError;

      // Copy template sections
      const { data: sections, error: sectionsError } = await supabase
        .from('template_sections')
        .select('*')
        .eq('template_id', templateId);

      if (sectionsError) throw sectionsError;

      if (sections && sections.length > 0) {
        const newSections = sections.map(section => ({
          template_id: newVersion.id,
          section_type: section.section_type,
          position: section.position,
          settings: section.settings,
          is_active: section.is_active
        }));

        const { error: insertSectionsError } = await supabase
          .from('template_sections')
          .insert(newSections);

        if (insertSectionsError) throw insertSectionsError;
      }

      return newVersion;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template-versions', templateId] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-report-templates'] });
      setIsCreatingVersion(false);
      setVersionData({ name: '', description: '', changeSummary: '' });
      toast({
        title: 'Version Created',
        description: 'New template version created successfully'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to create version: ${error.message}`,
        variant: 'destructive'
      });
    }
  });

  // Restore version mutation
  const restoreVersionMutation = useMutation({
    mutationFn: async (versionId: string) => {
      if (!templateId) throw new Error('No template selected');

      // Get version data
      const { data: versionTemplate, error: fetchError } = await supabase
        .from('maintenance_report_templates')
        .select('*')
        .eq('id', versionId)
        .single();

      if (fetchError) throw fetchError;

      // Update current template with version data
      const { error: updateError } = await supabase
        .from('maintenance_report_templates')
        .update({
          template_data: versionTemplate.template_data,
          name: versionTemplate.name,
          description: versionTemplate.description,
          version: ((versionTemplate as any).version || (versionTemplate as any).current_version || 1) + 1,
          change_summary: `Restored from version ${(versionTemplate as any).version || (versionTemplate as any).current_version || 1}`
        })
        .eq('id', templateId);

      if (updateError) throw updateError;

      // Delete current sections
      await supabase
        .from('template_sections')
        .delete()
        .eq('template_id', templateId);

      // Copy sections from version
      const { data: versionSections, error: sectionsError } = await supabase
        .from('template_sections')
        .select('*')
        .eq('template_id', versionId);

      if (sectionsError) throw sectionsError;

      if (versionSections && versionSections.length > 0) {
        const newSections = versionSections.map(section => ({
          template_id: templateId,
          section_type: section.section_type,
          position: section.position,
          settings: section.settings,
          is_active: section.is_active
        }));

        const { error: insertSectionsError } = await supabase
          .from('template_sections')
          .insert(newSections);

        if (insertSectionsError) throw insertSectionsError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template-versions', templateId] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-report-templates'] });
      queryClient.invalidateQueries({ queryKey: ['template', templateId] });
      toast({
        title: 'Version Restored',
        description: 'Template restored to selected version'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to restore version: ${error.message}`,
        variant: 'destructive'
      });
    }
  });

  const handleCreateVersion = () => {
    createVersionMutation.mutate(versionData);
  };

  const handleRestoreVersion = (versionId: string) => {
    restoreVersionMutation.mutate(versionId);
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <History className="h-5 w-5" />
            <span>Template Version History</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 grid grid-cols-12 gap-6 overflow-hidden">
          {/* Left Panel - Version List */}
          <div className="col-span-5 flex flex-col space-y-4 overflow-hidden">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Versions</h3>
              <Button
                onClick={() => setIsCreatingVersion(true)}
                size="sm"
                className="flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>New Version</span>
              </Button>
            </div>

            <ScrollArea className="flex-1">
              <div className="space-y-3">
                {versions.map((version) => (
                  <Card 
                    key={version.id}
                    className={`cursor-pointer transition-colors hover:bg-accent/50 ${
                      selectedVersion === version.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedVersion(version.id)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge variant={version.is_current ? 'default' : 'secondary'}>
                            v{version.version}
                          </Badge>
                          {version.is_current && (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Current
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(version.created_at))} ago
                        </div>
                      </div>
                      <CardTitle className="text-sm">{version.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-2">
                        {version.description}
                      </p>
                      {version.change_summary && (
                        <div className="flex items-start space-x-2">
                          <GitBranch className="h-3 w-3 mt-0.5 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">
                            {version.change_summary}
                          </p>
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span>Created by User</span>
                        </div>
                        {!version.is_current && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRestoreVersion(version.id);
                            }}
                            disabled={restoreVersionMutation.isPending}
                          >
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Restore
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Right Panel - Version Details or Create Form */}
          <div className="col-span-7 flex flex-col overflow-hidden">
            {isCreatingVersion ? (
              <Card className="flex-1">
                <CardHeader>
                  <CardTitle>Create New Version</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="version-name">Version Name</Label>
                    <Input
                      id="version-name"
                      value={versionData.name}
                      onChange={(e) => setVersionData({ ...versionData, name: e.target.value })}
                      placeholder="e.g., Enhanced Layout Update"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="version-description">Description</Label>
                    <Textarea
                      id="version-description"
                      value={versionData.description}
                      onChange={(e) => setVersionData({ ...versionData, description: e.target.value })}
                      placeholder="Describe what changed in this version"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="change-summary">Change Summary</Label>
                    <Textarea
                      id="change-summary"
                      value={versionData.changeSummary}
                      onChange={(e) => setVersionData({ ...versionData, changeSummary: e.target.value })}
                      placeholder="Brief summary of changes for version history"
                      rows={2}
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setIsCreatingVersion(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateVersion}
                      disabled={createVersionMutation.isPending || !versionData.name}
                    >
                      {createVersionMutation.isPending ? 'Creating...' : 'Create Version'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : selectedVersion ? (
              <Card className="flex-1">
                <CardHeader>
                  <CardTitle>Version Details</CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const version = versions.find(v => v.id === selectedVersion);
                    if (!version) return <div>Version not found</div>;

                    return (
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium">Version</Label>
                            <p className="text-sm text-muted-foreground">v{version.version}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Status</Label>
                            <div className="flex items-center space-x-2">
                              {version.is_current ? (
                                <Badge variant="default" className="text-green-600 bg-green-100">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Current
                                </Badge>
                              ) : (
                                <Badge variant="secondary">
                                  <History className="h-3 w-3 mr-1" />
                                  Archived
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <Label className="text-sm font-medium">Name</Label>
                          <p className="text-sm text-muted-foreground">{version.name}</p>
                        </div>

                        <div>
                          <Label className="text-sm font-medium">Description</Label>
                          <p className="text-sm text-muted-foreground">{version.description}</p>
                        </div>

                        {version.change_summary && (
                          <div>
                            <Label className="text-sm font-medium">Changes</Label>
                            <p className="text-sm text-muted-foreground">{version.change_summary}</p>
                          </div>
                        )}

                        <Separator />

                        <div>
                          <Label className="text-sm font-medium">Created</Label>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>{new Date(version.created_at).toLocaleString()}</span>
                            <span>({formatDistanceToNow(new Date(version.created_at))} ago)</span>
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium">Template Data</Label>
                          <div className="mt-2 p-3 bg-muted rounded-lg">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="font-medium">Sections:</span>
                                <span className="ml-2 text-muted-foreground">
                                  {Object.keys(version.template_data || {}).length} configured
                                </span>
                              </div>
                              <div>
                                <span className="font-medium">Type:</span>
                                <span className="ml-2 text-muted-foreground">
                                  {version.template_data?.template_type || 'maintenance'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {!version.is_current && (
                          <div className="flex justify-end">
                            <Button
                              onClick={() => handleRestoreVersion(version.id)}
                              disabled={restoreVersionMutation.isPending}
                              className="flex items-center space-x-2"
                            >
                              <RotateCcw className="h-4 w-4" />
                              <span>
                                {restoreVersionMutation.isPending ? 'Restoring...' : 'Restore This Version'}
                              </span>
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            ) : (
              <Card className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">Select a Version</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose a version from the list to view its details
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};