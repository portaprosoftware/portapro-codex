import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Calendar, Filter, CalendarOff, PlusCircle, Grid3X3, List } from "lucide-react";
import { TimeOffRequestForm } from "@/components/team/enhanced/TimeOffRequestForm";
import { TimeOffCalendarView } from "@/components/team/enhanced/TimeOffCalendarView";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
interface DriverTimeOffSectionProps {
  onBack: () => void;
}
export function DriverTimeOffSection({
  onBack
}: DriverTimeOffSectionProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [currentView, setCurrentView] = useState<'requests' | 'calendar' | 'form'>('requests');
  const queryClient = useQueryClient();
  const {
    data: timeOffRequests,
    isLoading
  } = useQuery({
    queryKey: ['driver-timeoff-requests', statusFilter, dateFilter],
    queryFn: async () => {
      let q = supabase.from('driver_time_off_requests').select('*').order('created_at', {
        ascending: false
      });
      if (statusFilter !== 'all') {
        q = q.eq('status', statusFilter);
      }
      if (dateFilter) {
        q = q.gte('request_date', dateFilter);
      }
      const {
        data: requests,
        error
      } = await q;
      if (error) throw error;
      const driverIds = Array.from(new Set((requests || []).map((r: any) => r.driver_id).filter(Boolean)));
      let profilesMap: Record<string, {
        first_name: string;
        last_name: string;
      }> = {};
      if (driverIds.length) {
        const {
          data: profiles
        } = await supabase.from('profiles').select('first_name,last_name,clerk_user_id').in('clerk_user_id', driverIds);
        (profiles || []).forEach((p: any) => {
          profilesMap[p.clerk_user_id] = {
            first_name: p.first_name,
            last_name: p.last_name
          };
        });
      }
      return (requests || []).map((r: any) => ({
        ...r,
        driver_name: profilesMap[r.driver_id] ? `${profilesMap[r.driver_id].first_name || ''} ${profilesMap[r.driver_id].last_name || ''}`.trim() : 'Unknown Driver'
      }));
    }
  });
  const approveRequest = useMutation({
    mutationFn: async (id: string) => {
      const {
        error
      } = await supabase.from('driver_time_off_requests').update({
        status: 'approved'
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({
      queryKey: ['driver-timeoff-requests']
    })
  });
  const denyRequest = useMutation({
    mutationFn: async (id: string) => {
      const {
        error
      } = await supabase.from('driver_time_off_requests').update({
        status: 'denied'
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({
      queryKey: ['driver-timeoff-requests']
    })
  });
  if (isLoading) {
    return <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted rounded"></div>)}
          </div>
        </div>
      </div>;
  }
  return;
}