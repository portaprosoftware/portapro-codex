
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface WorkingHour {
  driver_id: string;
  day_of_week: number;
  is_working: boolean;
  start_time: string;
  end_time: string;
}

export function useDriverWorkingHours(driverId?: string) {
  return useQuery({
    queryKey: ['driver-working-hours', driverId],
    queryFn: async () => {
      let query = supabase
        .from('driver_working_hours')
        .select('*');
      
      if (driverId) {
        query = query.eq('driver_id', driverId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!driverId,
  });
}

export function useUpdateDriverWorkingHours() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ driverId, schedule }: { driverId: string; schedule: WorkingHour[] }) => {
      // Delete existing hours
      await supabase
        .from('driver_working_hours')
        .delete()
        .eq('driver_id', driverId);
      
      // Insert new hours
      const { error } = await supabase
        .from('driver_working_hours')
        .insert(schedule);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Driver working hours updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['driver-working-hours'] });
      queryClient.invalidateQueries({ queryKey: ['drivers-for-hours'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update working hours",
        variant: "destructive",
      });
    }
  });
}

export function useDrivers() {
  return useQuery({
    queryKey: ['drivers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          user_roles!inner(role)
        `)
        .eq('user_roles.role', 'driver');
      
      if (error) throw error;
      return data;
    },
  });
}
