import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@clerk/clerk-react';
import { EnhancedTemplate } from '@/components/maintenance/template-builder/types';
import { toast } from 'sonner';
import { useEffect, useRef } from 'react';
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { useOrganizationId } from './useOrganizationId';

interface TemplateDB extends DBSchema {
  templates: {
    key: string;
    value: any & { cached_at: string };
  };
  'automation-rules': {
    key: string;
    value: {
      template_id: string;
      logic_rules: any;
      fee_catalog: any[];
      cached_at: string;
    };
  };
}

const initDB = async (): Promise<IDBPDatabase<TemplateDB>> => {
  return openDB<TemplateDB>('maintenance-templates-db', 2, {
    upgrade(db, oldVersion) {
      if (!db.objectStoreNames.contains('templates')) {
        db.createObjectStore('templates', { keyPath: 'id' });
      }
      if (oldVersion < 2 && !db.objectStoreNames.contains('automation-rules')) {
        db.createObjectStore('automation-rules', { keyPath: 'template_id' });
      }
    },
  });
};

export const useTemplates = () => {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const { orgId, source } = useOrganizationId();
  const fallbackWarningShown = useRef(false);

  // Show fallback warning once per session
  useEffect(() => {
    if (source && source !== 'clerk' && !fallbackWarningShown.current) {
      toast.warning('Using fallback organization ID. Set Clerk publicMetadata.organizationId for multi-tenant setup.');
      fallbackWarningShown.current = true;
    }
  }, [source]);

  const { data: templates, isLoading } = useQuery({
    queryKey: ['service-report-templates', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_report_templates')
        .select('*')
        .eq('organization_id', orgId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as any[];
    },
    enabled: !!orgId,
  });

  // Cache templates and automation rules for offline use
  useEffect(() => {
    if (templates && templates.length > 0) {
      const cacheTemplates = async () => {
        try {
          const db = await initDB();
          const tx = db.transaction(['templates', 'automation-rules'], 'readwrite');
          
          for (const template of templates) {
            await tx.objectStore('templates').put({ 
              ...template, 
              cached_at: new Date().toISOString() 
            });
            
            // Cache automation rules if they exist
            if (template.logic_rules) {
              await tx.objectStore('automation-rules').put({
                template_id: template.id,
                logic_rules: template.logic_rules,
                fee_catalog: template.logic_rules?.fee_catalog || [],
                cached_at: new Date().toISOString(),
              });
            }
          }
          await tx.done;
        } catch (error) {
          console.error('Failed to cache templates:', error);
        }
      };
      
      cacheTemplates();
    }
  }, [templates]);

  // Get cached templates when offline
  const getCachedTemplates = async (): Promise<any[]> => {
    try {
      const db = await initDB();
      const cachedTemplates = await db.getAll('templates');
      return cachedTemplates || [];
    } catch {
      return [];
    }
  };

  const createTemplate = useMutation({
    mutationFn: async (template: Omit<EnhancedTemplate, 'id' | 'created_at' | 'updated_at'>) => {
      if (!orgId) {
        throw new Error('Organization ID is missing. Please refresh and try again.');
      }

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
          organization_id: orgId,
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
      if (!orgId) {
        throw new Error('Organization ID is missing. Please refresh and try again.');
      }

      const source = templates?.find((t: any) => t.id === sourceId);
      if (!source) throw new Error('Template not found');

      const cloned = {
        ...source,
        name: `${source.name} (Copy)`,
        is_default_for_type: false,
        organization_id: orgId,
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

  return { 
    templates: templates || [], 
    isLoading, 
    createTemplate, 
    updateTemplate, 
    deleteTemplate, 
    cloneTemplate,
    getCachedTemplates 
  };
};
