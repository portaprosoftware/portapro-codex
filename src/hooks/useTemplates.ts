import { useState } from 'react';
import { EnhancedTemplate } from '@/components/maintenance/template-builder/types';
import { starterTemplates } from '@/components/maintenance/template-builder/utils/starterTemplates';

export const useTemplates = () => {
  // TODO: Replace with actual Supabase integration once migration is approved
  const [templates, setTemplates] = useState<EnhancedTemplate[]>(starterTemplates);
  const isLoading = false;

  const createTemplate = {
    mutateAsync: async (template: any) => {
      const newTemplate = { ...template, id: crypto.randomUUID(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      setTemplates(prev => [...prev, newTemplate]);
      return newTemplate;
    },
    isPending: false,
  };

  const updateTemplate = {
    mutateAsync: async (template: any) => {
      setTemplates(prev => prev.map(t => t.id === template.id ? { ...t, ...template } : t));
      return template;
    },
    isPending: false,
  };

  const deleteTemplate = {
    mutateAsync: async (id: string) => {
      setTemplates(prev => prev.filter(t => t.id !== id));
    },
    isPending: false,
  };

  const cloneTemplate = {
    mutateAsync: async (id: string) => {
      const source = templates.find(t => t.id === id);
      if (source) {
        const cloned = { ...source, id: crypto.randomUUID(), name: `${source.name} (Copy)`, is_default_for_type: false };
        setTemplates(prev => [...prev, cloned]);
      }
    },
    isPending: false,
  };

  return { templates, isLoading, createTemplate, updateTemplate, deleteTemplate, cloneTemplate };
};
