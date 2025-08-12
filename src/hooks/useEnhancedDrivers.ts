import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EnhancedDriver {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
  current_role: string;
  phone?: string | null;
  profile_photo?: string | null;
  hire_date?: string | null;
  created_at?: string | null;
  // Driver-specific fields
  driver_id?: string;
  license_expiry_date?: string | null;
  medical_card_expiry_date?: string | null;
  next_training_due?: string | null;
  home_base?: string | null;
  supervisor?: string | null;
  app_last_login?: string | null;
}

export function useEnhancedDrivers() {
  return useQuery({
    queryKey: ['enhanced-drivers'],
    queryFn: async () => {
      // Get all users with driver role
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          email,
          is_active,
          phone,
          profile_photo,
          hire_date,
          created_at,
          user_roles!inner(role)
        `)
        .eq('user_roles.role', 'driver');

      if (usersError) throw usersError;

      // For each driver, get their credentials and additional info
      const enhancedDrivers: EnhancedDriver[] = await Promise.all(
        (users || []).map(async (user: any) => {
          // Get driver credentials - using id since profiles.id is text type
          const { data: credentials } = await supabase
            .from('driver_credentials')
            .select('license_expiry_date, medical_card_expiry_date')
            .eq('driver_id', user.id)
            .maybeSingle();

          // Get next training due date
          const { data: training } = await supabase
            .from('driver_training_records')
            .select('next_due')
            .eq('driver_id', user.id)
            .order('next_due', { ascending: true })
            .limit(1)
            .maybeSingle();

          // Get device info for last login
          const { data: device } = await supabase
            .from('driver_devices')
            .select('app_last_login')
            .eq('driver_id', user.id)
            .maybeSingle();

          return {
            ...user,
            current_role: 'driver',
            driver_id: user.id,
            license_expiry_date: credentials?.license_expiry_date || null,
            medical_card_expiry_date: credentials?.medical_card_expiry_date || null,
            next_training_due: training?.next_due || null,
            home_base: null, // TODO: Add home base assignment when implemented
            supervisor: null, // TODO: Add supervisor assignment when implemented
            app_last_login: device?.app_last_login || null,
          };
        })
      );

      return enhancedDrivers;
    }
  });
}

export function useAllEnhancedUsers() {
  return useQuery({
    queryKey: ['all-enhanced-users'],
    queryFn: async () => {
      // Get all users
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          email,
          is_active,
          phone,
          profile_photo,
          hire_date,
          created_at,
          user_roles!inner(role)
        `);

      if (usersError) throw usersError;

      // For each user, if they're a driver, get their additional info
      const enhancedUsers: EnhancedDriver[] = await Promise.all(
        (users || []).map(async (user: any) => {
          const isDriver = user.user_roles.role === 'driver';
          
          if (!isDriver) {
            return {
              ...user,
              current_role: user.user_roles.role,
            };
          }

          // Get driver-specific data
          const { data: credentials } = await supabase
            .from('driver_credentials')
            .select('license_expiry_date, medical_card_expiry_date')
            .eq('driver_id', user.id)
            .maybeSingle();

          const { data: training } = await supabase
            .from('driver_training_records')
            .select('next_due')
            .eq('driver_id', user.id)
            .order('next_due', { ascending: true })
            .limit(1)
            .maybeSingle();

          const { data: device } = await supabase
            .from('driver_devices')
            .select('app_last_login')
            .eq('driver_id', user.id)
            .maybeSingle();

          return {
            ...user,
            current_role: user.user_roles.role,
            driver_id: user.id,
            license_expiry_date: credentials?.license_expiry_date || null,
            medical_card_expiry_date: credentials?.medical_card_expiry_date || null,
            next_training_due: training?.next_due || null,
            home_base: null,
            supervisor: null,
            app_last_login: device?.app_last_login || null,
          };
        })
      );

      return enhancedUsers;
    }
  });
}