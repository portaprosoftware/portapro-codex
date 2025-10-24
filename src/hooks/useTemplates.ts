import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@clerk/clerk-react';
import { EnhancedTemplate } from '@/components/maintenance/template-builder/types';
import { toast } from 'sonner';

export const useTemplates = () => {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const organizationId = user?.publicMetadata?.organizationId as string;

  const { data: templates, isLoading } = useQuery({
    queryKey: ['service-report-templates', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_report_templates')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as any[];
    },
    enabled: !!organizationId,
  });

  const createTemplate = useMutation({
    mutationFn: async (template: Omit<EnhancedTemplate, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('service_report_templates')
        .insert({
          name: template.name,
          description: template.description,
          template_type: template.template_type,
          version: template.version,
          is_default_for_type: template.is_default_for_type,
          is_active: template.is_active,
          sections: template.sections as any,
          logic_rules: template.logic_rules as any,
          permissions: template.permissions as any,
          output_config: template.output_config as any,
          organization_id: organizationId,
          created_by: user?.id,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-report-templates'] });
      toast.success('Template created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create template: ${error.message}`);
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...template }: Partial<EnhancedTemplate> & { id: string }) => {
      const updateData: any = {};
      if (template.name) updateData.name = template.name;
      if (template.description !== undefined) updateData.description = template.description;
      if (template.template_type) updateData.template_type = template.template_type;
      if (template.version) updateData.version = template.version;
      if (template.is_default_for_type !== undefined) updateData.is_default_for_type = template.is_default_for_type;
      if (template.sections) updateData.sections = template.sections;
      if (template.logic_rules) updateData.logic_rules = template.logic_rules;
      if (template.permissions) updateData.permissions = template.permissions;
      if (template.output_config) updateData.output_config = template.output_config;

      const { data, error } = await supabase
        .from('service_report_templates')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-report-templates'] });
      toast.success('Template updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update template: ${error.message}`);
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('service_report_templates')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-report-templates'] });
      toast.success('Template deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete template: ${error.message}`);
    },
  });

  const cloneTemplate = useMutation({
    mutationFn: async (sourceId: string) => {
      const source = templates?.find((t: any) => t.id === sourceId);
      if (!source) throw new Error('Template not found');

      const cloned = {
        ...source,
        name: `${source.name} (Copy)`,
        is_default_for_type: false,
        organization_id: organizationId,
        created_by: user?.id,
      };

      delete (cloned as any).id;
      delete (cloned as any).created_at;
      delete (cloned as any).updated_at;

      const { data, error } = await supabase
        .from('service_report_templates')
        .insert(cloned)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-report-templates'] });
      toast.success('Template cloned successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to clone template: ${error.message}`);
    },
  });

  return { templates, isLoading, createTemplate, updateTemplate, deleteTemplate, cloneTemplate };
};
