import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@clerk/clerk-react';
import { useToast } from '@/hooks/use-toast';

export interface FilterPreset {
  id: string;
  name: string;
  description?: string;
  filter_data: Record<string, any>;
  preset_type: string;
  is_public: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
  usage_count: number;
  last_used_at?: string;
}

export interface FilterData {
  dateRange?: any;
  searchTerm?: string;
  selectedDriver?: string;
  selectedJobType?: string;
  selectedStatus?: string;
  [key: string]: any; // Allow additional properties for JSON compatibility
}

export function useFilterPresets(presetType: string = 'jobs') {
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's presets
  const { data: presets = [], isLoading } = useQuery({
    queryKey: ['filter-presets', presetType, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('filter_presets')
        .select('*')
        .eq('preset_type', presetType)
        .or(`created_by.eq.${user?.id},is_public.eq.true`)
        .order('last_used_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as FilterPreset[];
    },
    enabled: !!user?.id,
  });

  // Save preset mutation
  const savePresetMutation = useMutation({
    mutationFn: async ({ name, description, filterData }: {
      name: string;
      description?: string;
      filterData: FilterData;
    }) => {
      const { data, error } = await supabase
        .from('filter_presets')
        .insert({
          name,
          description,
          filter_data: filterData as any,
          preset_type: presetType,
          created_by: user?.id,
          is_public: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['filter-presets'] });
      toast({
        title: 'Preset Saved',
        description: 'Your filter preset has been saved successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to save preset. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Apply preset mutation (tracks usage)
  const applyPresetMutation = useMutation({
    mutationFn: async ({ presetId, resultsCount }: {
      presetId: string;
      resultsCount?: number;
    }) => {
      // Track usage
      await supabase
        .from('filter_preset_usage')
        .insert({
          preset_id: presetId,
          user_id: user?.id,
          results_count: resultsCount,
        });

      // Get the preset data
      const { data, error } = await supabase
        .from('filter_presets')
        .select('*')
        .eq('id', presetId)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['filter-presets'] });
    },
  });

  // Delete preset mutation
  const deletePresetMutation = useMutation({
    mutationFn: async (presetId: string) => {
      const { error } = await supabase
        .from('filter_presets')
        .delete()
        .eq('id', presetId)
        .eq('created_by', user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['filter-presets'] });
      toast({
        title: 'Preset Deleted',
        description: 'Filter preset has been deleted.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete preset.',
        variant: 'destructive',
      });
    },
  });

  // Generate shareable URL
  const generateShareUrl = (preset: FilterPreset) => {
    const baseUrl = window.location.origin;
    const params = new URLSearchParams({
      preset: preset.id,
      ...Object.entries(preset.filter_data).reduce((acc, [key, value]) => {
        if (value && value !== 'all') {
          acc[key] = typeof value === 'object' ? JSON.stringify(value) : String(value);
        }
        return acc;
      }, {} as Record<string, string>)
    });
    
    return `${baseUrl}/jobs/custom?${params.toString()}`;
  };

  return {
    presets,
    isLoading,
    savePreset: savePresetMutation.mutate,
    applyPreset: applyPresetMutation.mutate,
    deletePreset: deletePresetMutation.mutate,
    generateShareUrl,
    isSaving: savePresetMutation.isPending,
    isApplying: applyPresetMutation.isPending,
    isDeleting: deletePresetMutation.isPending,
  };
}