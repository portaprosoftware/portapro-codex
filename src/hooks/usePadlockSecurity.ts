import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@clerk/clerk-react';

export interface SecurityIncident {
  incident_id: string;
  item_id: string;
  item_code: string;
  product_name: string;
  incident_type: 'missing_padlock' | 'damaged_padlock' | 'unauthorized_access' | 'lost_key' | 'forgotten_combination';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  description: string;
  reported_at: string;
  days_since_reported: number;
}

export interface CodeAccessRequest {
  itemId: string;
  reason?: string;
}

export const usePadlockSecurity = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useUser();

  // Access padlock code with audit logging
  const accessPadlockCode = useMutation({
    mutationFn: async ({ itemId, reason }: CodeAccessRequest) => {
      const { data, error } = await supabase.rpc('log_padlock_code_access', {
        item_uuid: itemId,
        user_uuid: user?.id || '',
        reason_text: reason,
        session_id_param: null, // Session ID not available in Clerk
        ip_param: null, // Could be obtained from client if needed
        user_agent_param: navigator.userAgent
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      if (data?.success) {
        // Don't show toast for security reasons - code access should be silent
        return data;
      } else {
        toast({
          title: "Access Denied",
          description: data?.error || "Unable to access padlock code",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Access Error",
        description: error.message || "Failed to access padlock code",
        variant: "destructive",
      });
    },
  });

  // Report security incident
  const reportIncident = useMutation({
    mutationFn: async (incident: {
      itemId: string;
      incidentType: string;
      description: string;
      severity?: string;
    }) => {
      const { data, error } = await supabase.rpc('report_padlock_incident', {
        item_uuid: incident.itemId,
        incident_type_param: incident.incidentType,
        user_uuid: user?.id || '',
        description_param: incident.description,
        severity_param: incident.severity || 'medium'
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      if (data?.success) {
        toast({
          title: "Incident Reported",
          description: data.message || "Security incident reported successfully",
        });
        
        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: ['security-incidents'] });
      } else {
        toast({
          title: "Error",
          description: data?.error || "Failed to report incident",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to report security incident",
        variant: "destructive",
      });
    },
  });

  // Update incident status
  const updateIncidentStatus = useMutation({
    mutationFn: async (update: {
      incidentId: string;
      status: string;
      resolutionNotes?: string;
    }) => {
      const { data, error } = await supabase.rpc('update_incident_status', {
        incident_uuid: update.incidentId,
        new_status: update.status,
        user_uuid: user?.id || '',
        resolution_notes_param: update.resolutionNotes
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      if (data?.success) {
        toast({
          title: "Status Updated",
          description: data.message || "Incident status updated successfully",
        });
        
        queryClient.invalidateQueries({ queryKey: ['security-incidents'] });
      } else {
        toast({
          title: "Error",
          description: data?.error || "Failed to update incident status",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update incident status",
        variant: "destructive",
      });
    },
  });

  return {
    accessPadlockCode: accessPadlockCode.mutate,
    reportIncident: reportIncident.mutate,
    updateIncidentStatus: updateIncidentStatus.mutate,
    isAccessingCode: accessPadlockCode.isPending,
    isReportingIncident: reportIncident.isPending,
    isUpdatingStatus: updateIncidentStatus.isPending,
  };
};

export const useSecurityIncidents = (statusFilter?: string, severityFilter?: string) => {
  return useQuery({
    queryKey: ['security-incidents', statusFilter, severityFilter],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_padlock_security_incidents', {
        status_filter: statusFilter || null,
        severity_filter: severityFilter || null,
        limit_count: 100
      });
      
      if (error) throw error;
      return data as SecurityIncident[];
    },
    refetchInterval: 30000, // Refresh every 30 seconds for real-time security monitoring
  });
};