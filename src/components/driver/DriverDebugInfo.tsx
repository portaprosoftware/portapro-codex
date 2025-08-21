import React, { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useUserRole } from '@/hooks/useUserRole';
import { ChevronDown, ChevronUp, User, Database, CheckCircle } from 'lucide-react';

export const DriverDebugInfo: React.FC = () => {
  const { user } = useUser();
  const { role, userId } = useUserRole();
  const [isExpanded, setIsExpanded] = useState(false);

  // Check profiles table
  const { data: profileData } = useQuery({
    queryKey: ['debug-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('clerk_user_id', user.id)
        .maybeSingle();
      
      return { data, error };
    },
    enabled: !!user?.id
  });

  // Check jobs with direct Clerk ID
  const { data: directJobs } = useQuery({
    queryKey: ['debug-direct-jobs', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('jobs')
        .select('*, customers(name)')
        .eq('driver_id', user.id)
        .limit(5);
      
      return { data, error };
    },
    enabled: !!user?.id
  });

  // Check jobs with profile ID
  const { data: profileJobs } = useQuery({
    queryKey: ['debug-profile-jobs', profileData?.data?.id],
    queryFn: async () => {
      if (!profileData?.data?.id) return null;
      
      const { data, error } = await supabase
        .from('jobs')
        .select('*, customers(name)')
        .eq('driver_id', profileData.data.id)
        .limit(5);
      
      return { data, error };
    },
    enabled: !!profileData?.data?.id
  });

  if (!isExpanded) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsExpanded(true)}
          size="sm"
          variant="outline"
          className="bg-yellow-50 border-yellow-200 text-yellow-800 hover:bg-yellow-100"
        >
          Debug Info
          <ChevronUp className="w-4 h-4 ml-2" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 max-h-96 overflow-y-auto">
      <Card className="bg-yellow-50 border-yellow-200">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm text-yellow-800">Debug Info</CardTitle>
            <Button
              onClick={() => setIsExpanded(false)}
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
            >
              <ChevronDown className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          {/* User Info */}
          <div>
            <div className="flex items-center gap-1 mb-1">
              <User className="w-3 h-3" />
              <span className="font-medium">Clerk User</span>
            </div>
            <div className="pl-4 space-y-1">
              <div><strong>ID:</strong> {user?.id || 'Not found'}</div>
              <div><strong>Name:</strong> {user?.fullName || 'Not found'}</div>
              <div><strong>Role:</strong> <Badge variant="outline" className="text-xs">{role}</Badge></div>
            </div>
          </div>

          {/* Profile Data */}
          <div>
            <div className="flex items-center gap-1 mb-1">
              <Database className="w-3 h-3" />
              <span className="font-medium">Supabase Profile</span>
            </div>
            <div className="pl-4 space-y-1">
              {profileData?.error ? (
                <div className="text-red-600">Error: {profileData.error.message}</div>
              ) : profileData?.data ? (
                <>
                  <div><strong>Profile ID:</strong> {profileData.data.id}</div>
                  <div><strong>Clerk ID:</strong> {profileData.data.clerk_user_id}</div>
                  <div><strong>Name:</strong> {profileData.data.first_name} {profileData.data.last_name}</div>
                </>
              ) : (
                <div className="text-orange-600">No profile found</div>
              )}
            </div>
          </div>

          {/* Direct Jobs */}
          <div>
            <div className="flex items-center gap-1 mb-1">
              <CheckCircle className="w-3 h-3" />
              <span className="font-medium">Jobs (Direct Clerk ID)</span>
            </div>
            <div className="pl-4">
              {directJobs?.error ? (
                <div className="text-red-600">Error: {directJobs.error.message}</div>
              ) : directJobs?.data && directJobs.data.length > 0 ? (
                <div>
                  <div className="font-medium text-green-600">{directJobs.data.length} jobs found</div>
                  {directJobs.data.slice(0, 2).map(job => (
                    <div key={job.id} className="text-xs">
                      {job.job_number} - {job.customers?.name}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-orange-600">No jobs found</div>
              )}
            </div>
          </div>

          {/* Profile Jobs */}
          {profileData?.data && (
            <div>
              <div className="flex items-center gap-1 mb-1">
                <CheckCircle className="w-3 h-3" />
                <span className="font-medium">Jobs (Profile ID)</span>
              </div>
              <div className="pl-4">
                {profileJobs?.error ? (
                  <div className="text-red-600">Error: {profileJobs.error.message}</div>
                ) : profileJobs?.data && profileJobs.data.length > 0 ? (
                  <div>
                    <div className="font-medium text-green-600">{profileJobs.data.length} jobs found</div>
                    {profileJobs.data.slice(0, 2).map(job => (
                      <div key={job.id} className="text-xs">
                        {job.job_number} - {job.customers?.name}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-orange-600">No jobs found</div>
                )}
              </div>
            </div>
          )}

          <div className="text-xs text-muted-foreground border-t pt-2">
            This debug panel helps identify ID mapping issues between Clerk and Supabase.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};