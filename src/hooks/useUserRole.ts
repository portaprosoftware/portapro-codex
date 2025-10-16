
import React from 'react';
import { useUser } from '@clerk/clerk-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'owner' | 'dispatcher' | 'admin' | 'driver' | 'viewer' | 'unknown';

export function useUserRole() {
  const { user, isLoaded } = useUser();

  // Query the user_roles table to get the actual role from Supabase
  const { data: supabaseRole, isLoading: roleLoading } = useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // PRIMARY: Try edge function first (bypasses RLS with service role)
      try {
        const projectUrl = 'https://unpnuonbndubcuzxfnmg.supabase.co';
        const edgeResponse = await fetch(`${projectUrl}/functions/v1/get_role`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVucG51b25ibmR1YmN1enhmbm1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxMzkyMjgsImV4cCI6MjA2NDcxNTIyOH0.goME2hFzqxm0tnFdXAB_0evuiueh8wWfGLIY1vvvqmE',
          },
          body: JSON.stringify({ clerkUserId: user.id }),
        });

        if (edgeResponse.ok) {
          const result = await edgeResponse.json();
          if (result.success && result.role) {
            console.info('useUserRole: Edge function success', result.role);
            return result.role as AppRole;
          }
        }
      } catch (edgeError) {
        console.warn('useUserRole: Edge function failed, trying Supabase fallback', edgeError);
      }

      // FALLBACK: Direct Supabase query
      // First get the profile to map clerk_user_id to profile id
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('clerk_user_id', user.id)
        .maybeSingle();
      
      if (!profile) return null;
      
      // Then get the role from user_roles table
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', profile.id)
        .maybeSingle();
      
      return roleData?.role as AppRole | null;
    },
    enabled: isLoaded && !!user,
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
