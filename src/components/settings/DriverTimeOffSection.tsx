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
  return <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h1 className="font-bold text-2xl">Driver Time Off Management</h1>
          <p className="text-muted-foreground">Review and manage driver time-off requests</p>
        </div>
        
        {/* View Toggle */}
        <div className="flex items-center space-x-2">
          <Button variant={currentView === 'form' ? 'default' : 'outline'} size="sm" onClick={() => setCurrentView('form')}>
            <PlusCircle className="w-4 h-4 mr-2" />
            New Request
          </Button>
          <Button variant={currentView === 'requests' ? 'default' : 'outline'} size="sm" onClick={() => setCurrentView('requests')}>
            <List className="w-4 h-4 mr-2" />
            All Requests
          </Button>
          <Button variant={currentView === 'calendar' ? 'default' : 'outline'} size="sm" onClick={() => setCurrentView('calendar')}>
            <Grid3X3 className="w-4 h-4 mr-2" />
            Calendar View
          </Button>
        </div>
      </div>

      {/* Conditional Content */}
      {currentView === 'form' && <TimeOffRequestForm />}
      
      {currentView === 'calendar' && <TimeOffCalendarView />}
      
      {currentView === 'requests' && <>
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Filter className="w-5 h-5" />
                <span>Filters</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium">Status:</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="denied">Denied</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium">From Date:</label>
                  <Input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="w-40" />
                </div>

                {(statusFilter !== 'all' || dateFilter) && <Button variant="outline" size="sm" onClick={() => {
              setStatusFilter('all');
              setDateFilter('');
            }}>
                    Clear Filters
                  </Button>}
              </div>
            </CardContent>
          </Card>

          {/* Time Off Requests */}
          <Card>
            <CardHeader>
              <CardTitle>Time Off Requests ({timeOffRequests?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              {timeOffRequests?.length === 0 ? <div className="text-center py-12">
                  <CalendarOff className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No Time Off Requests</h3>
                  <p className="text-muted-foreground mb-4">
                    {statusFilter !== 'all' || dateFilter ? 'No requests match your current filters' : 'No time-off requests have been submitted yet'}
                  </p>
                  {(statusFilter !== 'all' || dateFilter) && <Button variant="outline" onClick={() => {
              setStatusFilter('all');
              setDateFilter('');
            }}>
                      Clear Filters
                    </Button>}
                </div> : <div className="space-y-3">
                  {timeOffRequests?.map(request => <div key={request.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-3">
                            <span className="font-medium">
                              {request.driver_name}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${request.status === 'approved' ? 'bg-green-100 text-green-800' : request.status === 'denied' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(request.request_date).toLocaleDateString()} | {request.start_time} - {request.end_time}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Time Slot: {request.time_slot} | Reason: {request.reason || 'Not specified'}
                          </div>
                        </div>
                        
                        {request.status === 'pending' && <div className="space-x-2">
                            <Button variant="outline" size="sm" onClick={() => approveRequest.mutate(request.id)}>
                              Approve
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => denyRequest.mutate(request.id)}>
                              Deny
                            </Button>
                          </div>}
                      </div>
                    </div>)}
                </div>}
            </CardContent>
          </Card>
        </>}
    </div>;
}