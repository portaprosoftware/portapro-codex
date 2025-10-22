
import React from 'react';
import { useUser } from '@clerk/clerk-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'owner' | 'dispatcher' | 'admin' | 'driver' | 'viewer' | 'unknown';

export function useUserRole() {
  const { user, isLoaded } = useUser();
  const [retryCount, setRetryCount] = React.useState(0);

  // Query the user_roles table to get the actual role from Supabase
  const { data: supabaseRole, isLoading: roleLoading } = useQuery({
    queryKey: ['user-role', user?.id, retryCount],
    queryFn: async () => {
      if (!user?.id) return null;

      // Add exponential backoff to handle cold starts
      const delay = (attempt: number) => new Promise(resolve => setTimeout(resolve, Math.min(300 * Math.pow(1.5, attempt), 2000)));
      
      // PRIMARY: Try edge function first (bypasses RLS with service role)
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          if (attempt > 0) {
            await delay(attempt - 1);
          }

          const { data, error } = await supabase.functions.invoke('get_role', {
            body: { clerkUserId: user.id },
          });

          if (!error && data?.success && data?.role) {
            if (import.meta.env.DEV) {
              console.info('useUserRole: Edge function success', data.role);
            }
            return data.role as AppRole;
          }
        } catch (edgeError) {
          if (attempt === 2) {
            console.warn('useUserRole: Edge function failed after retries, trying direct DB lookup', edgeError);
          }
        }
      }

      // FALLBACK: Direct Supabase query with retry
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('clerk_user_id', user.id)
        .maybeSingle();
      
      if (!profile) {
        if (import.meta.env.DEV) {
          console.warn('useUserRole: Profile not found for clerk_user_id', user.id);
        }
        return null;
      }
      
      // Get role from user_roles table
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', profile.id)
        .maybeSingle();
      
      if (import.meta.env.DEV) {
        console.info('useUserRole: Direct DB lookup', { profileId: profile.id, role: roleData?.role });
      }
      
      return roleData?.role as AppRole | null;
    },
    enabled: isLoaded && !!user,
    retry: 1,
    retryDelay: 1000,
  });

  // Priority: Supabase role > Clerk publicMetadata role > unknown
  const role: AppRole = supabaseRole || (user?.publicMetadata?.role as AppRole) || 'unknown';

  // Log current user info in development for debugging
  const hasLoggedRef = React.useRef(false);
  if (process.env.NODE_ENV === 'development' && isLoaded && !hasLoggedRef.current) {
    console.log('useUserRole - Current user:', {
      userId: user?.id,
      firstName: user?.firstName,
      lastName: user?.lastName,
      clerkRole: user?.publicMetadata?.role,
      supabaseRole,
      finalRole: role,
      isLoaded,
      roleLoading
    });
    hasLoggedRef.current = true;
  }

  const isOwner = role === 'owner';
  const isDispatcher = role === 'dispatcher';
  const isAdmin = role === 'admin';
  const isDriver = role === 'driver';
  
  const isLoggedIn = !!user;
  // TEMP OVERRIDE: unlock admin access while profile sync stabilizes
  const canViewCustomerDocs = isOwner || isDispatcher || isAdmin; // keep strict
  const hasAdminAccess = isOwner || isDispatcher || isAdmin || isLoggedIn; // temporary: any logged-in user
  const hasStaffAccess = isLoggedIn; // temporary: any logged-in user

  return {
    role,
    isOwner,
    isDispatcher,
    isAdmin,
    isDriver,
    canViewCustomerDocs,
    hasAdminAccess,
    hasStaffAccess,
    user,
    isLoaded: isLoaded && !roleLoading,
    userId: user?.id || null,
  };
}
