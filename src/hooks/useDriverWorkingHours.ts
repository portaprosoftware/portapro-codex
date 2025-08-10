
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

interface WorkingHour {
  driver_id: string;
  day_of_week: number;
  is_active: boolean;
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

export function useDriversWithHours() {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ['drivers-with-hours'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_drivers_with_hours');
      if (error) throw error;
      return data;
    },
  });

  // Set up real-time subscriptions for automatic updates
  useEffect(() => {
    const channel = supabase
      .channel('driver-data-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['drivers-with-hours'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_roles'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['drivers-with-hours'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'driver_working_hours'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['drivers-with-hours'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
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
      queryClient.invalidateQueries({ queryKey: ['drivers-with-hours'] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
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
