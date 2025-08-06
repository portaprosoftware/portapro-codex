import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  CalendarIcon, 
  Send, 
  Edit, 
  Trash2, 
  Mail, 
  MessageSquare, 
  Search,
  Filter,
  X,
  MoreHorizontal,
  Clock
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { CampaignCreation } from './CampaignCreation';
import { useScheduledCampaignsFilters } from '@/hooks/useScheduledCampaignsFilters';

export const ScheduledCampaigns: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingCampaign, setEditingCampaign] = useState<{
    id: string;
    data: any;
  } | null>(null);
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState<{
    campaignId: string;
    currentDate: Date;
  } | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState<Date | undefined>();
  const [rescheduleTime, setRescheduleTime] = useState<string>('');

  const filtersHook = useScheduledCampaignsFilters();

  // Fetch scheduled campaigns with filters
  const { data: scheduledCampaigns, isLoading } = useQuery({
    queryKey: ['scheduled-campaigns', filtersHook.filters.searchQuery, filtersHook.filters.campaignType, filtersHook.filters.dateRange?.from?.toISOString(), filtersHook.filters.dateRange?.to?.toISOString()],
    queryFn: async () => {
      let query = supabase
        .from('marketing_campaigns')
        .select('*');
      
      // Apply filters - build conditions inline to avoid type inference issues
      query = query.eq('status', 'scheduled');
      
      if (filtersHook.filters.searchQuery.trim()) {
        query = query.ilike('name', `%${filtersHook.filters.searchQuery.trim()}%`);
      }
      
      if (filtersHook.filters.campaignType !== 'all') {
        query = query.eq('campaign_type', filtersHook.filters.campaignType);
      }
      
      if (filtersHook.filters.dateRange?.from) {
        query = query.gte('scheduled_at', filtersHook.filters.dateRange.from.toISOString());
      }
      
      if (filtersHook.filters.dateRange?.to) {
        const endDate = new Date(filtersHook.filters.dateRange.to);
        endDate.setHours(23, 59, 59, 999);
        query = query.lte('scheduled_at', endDate.toISOString());
      }
      
      query = query.order('scheduled_at', { ascending: true });
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 60000, // Refresh every minute for countdown updates
  });

  // Cancel campaign mutation
  const cancelCampaignMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      const { error } = await supabase
        .from('marketing_campaigns')
        .update({ status: 'draft' })
        .eq('id', campaignId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-campaigns'] });
      toast({
        title: "Campaign Cancelled",
        description: "The campaign has been moved back to drafts.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to cancel campaign.",
        variant: "destructive",
      });
    }
  });

  // Send now mutation
  const sendNowMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      const { error } = await supabase
        .from('marketing_campaigns')
        .update({ 
          status: 'sent',
          sent_at: new Date().toISOString()
        })
        .eq('id', campaignId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-campaigns'] });
      toast({
        title: "Campaign Sent",
        description: "The campaign has been sent immediately.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send campaign.",
        variant: "destructive",
      });
    }
  });

  // Reschedule campaign mutation
  const rescheduleCampaignMutation = useMutation({
    mutationFn: async ({ campaignId, newScheduledAt }: { campaignId: string; newScheduledAt: string }) => {
      const { error } = await supabase
        .from('marketing_campaigns')
        .update({ scheduled_at: newScheduledAt })
        .eq('id', campaignId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-campaigns'] });
      toast({
        title: "Campaign Rescheduled",
        description: "The campaign has been successfully rescheduled.",
      });
      setRescheduleDialogOpen(null);
      setRescheduleDate(undefined);
      setRescheduleTime('');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to reschedule campaign. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update campaign mutation for editing
  const updateCampaignMutation = useMutation({
    mutationFn: async ({ campaignId, data }: { campaignId: string; data: any }) => {
      const { error } = await supabase
        .from('marketing_campaigns')
        .update(data)
        .eq('id', campaignId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-campaigns'] });
      setEditingCampaign(null);
      toast({
        title: "Campaign Updated",
        description: "The campaign has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update campaign.",
        variant: "destructive",
      });
    }
  });

  const handleEditCampaign = async (campaign: any) => {
    // Fetch full campaign data for editing
    const { data, error } = await supabase
      .from('marketing_campaigns')
      .select('*')
      .eq('id', campaign.id)
      .single();
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load campaign for editing.",
        variant: "destructive",
      });
      return;
    }

    // Transform the data to match CampaignCreation's expected format
    const editData = {
      name: data.name,
      campaign_type: data.campaign_type,
      message_source: data.message_source,
      template_id: data.template_id,
      custom_message: data.custom_message_data || {
        subject: data.custom_subject || '',
        content: data.custom_content || '',
        buttons: []
      },
      target_segments: data.target_segments || [],
      target_customer_types: data.target_customer_types || [],
      target_customers: data.target_customers || [],
      recipient_type: data.recipient_type,
      scheduled_at: data.scheduled_at ? new Date(data.scheduled_at) : undefined,
      currentStep: 4 // Jump to final step for editing
    };

    setEditingCampaign({ id: campaign.id, data: editData });
  };

  const handleReschedule = (campaign: any) => {
    const currentDate = new Date(campaign.scheduled_at);
    setRescheduleDialogOpen({
      campaignId: campaign.id,
      currentDate
    });
    setRescheduleDate(currentDate);
    setRescheduleTime(format(currentDate, 'HH:mm'));
  };

  const handleRescheduleConfirm = () => {
    if (!rescheduleDialogOpen || !rescheduleDate || !rescheduleTime) return;
    
    const [hours, minutes] = rescheduleTime.split(':').map(Number);
    const newDateTime = new Date(rescheduleDate);
    newDateTime.setHours(hours, minutes, 0, 0);
    
    rescheduleCampaignMutation.mutate({
      campaignId: rescheduleDialogOpen.campaignId,
      newScheduledAt: newDateTime.toISOString()
    });
  };

  const getCampaignTypeIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="w-4 h-4" />;
      case 'sms':
        return <MessageSquare className="w-4 h-4" />;
      default:
        return <Mail className="w-4 h-4" />;
    }
  };

  const getTimeUntilSend = (scheduledAt: string) => {
    const scheduledDate = new Date(scheduledAt);
    const now = new Date();
    
    if (scheduledDate <= now) {
      return "Overdue";
    }
    
    return formatDistanceToNow(scheduledDate, { addSuffix: true });
  };

  const getStatusBadge = (scheduledAt: string) => {
    const scheduledDate = new Date(scheduledAt);
    const now = new Date();
    const timeDiff = scheduledDate.getTime() - now.getTime();
    const hoursUntil = timeDiff / (1000 * 60 * 60);
    
    if (timeDiff <= 0) {
      return <Badge variant="destructive">Overdue</Badge>;
    } else if (hoursUntil <= 1) {
      return <Badge variant="secondary">Sending Soon</Badge>;
    } else if (hoursUntil <= 24) {
      return <Badge variant="outline">Today</Badge>;
    } else {
      return <Badge variant="default">Scheduled</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-inter">Loading Scheduled Campaigns...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!scheduledCampaigns || scheduledCampaigns.length === 0) {
    if (filtersHook.hasActiveFilters) {
      return (
        <div className="space-y-6">
          {/* Filter Bar */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold font-inter flex items-center gap-2">
                    <Filter className="w-5 h-5" />
                    Filter Campaigns
                  </h3>
                  {filtersHook.hasActiveFilters && (
                    <Button variant="outline" size="sm" onClick={filtersHook.clearFilters}>
                      <X className="w-4 h-4 mr-2" />
                      Clear Filters
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search campaigns..."
                      value={filtersHook.filters.searchQuery}
                      onChange={(e) => filtersHook.updateFilter('searchQuery', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  {/* Campaign Type */}
                  <Select 
                    value={filtersHook.filters.campaignType} 
                    onValueChange={(value) => filtersHook.updateFilter('campaignType', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Campaign Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {/* Date Range */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filtersHook.filters.dateRange?.from ? (
                          filtersHook.filters.dateRange?.to ? (
                            <>
                              {format(filtersHook.filters.dateRange.from, "LLL dd, y")} -{" "}
                              {format(filtersHook.filters.dateRange.to, "LLL dd, y")}
                            </>
                          ) : (
                            format(filtersHook.filters.dateRange.from, "LLL dd, y")
                          )
                        ) : (
                          <span>Pick a date range</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={filtersHook.filters.dateRange?.from}
                        selected={filtersHook.filters.dateRange}
                        onSelect={(range) => filtersHook.updateFilter('dateRange', range)}
                        numberOfMonths={2}
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="font-inter flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                No Campaigns Found
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 font-inter mb-2">No Campaigns Match Your Filters</h3>
                <p className="text-gray-600 font-inter mb-4">
                  Try adjusting your filters or clear them to see all scheduled campaigns.
                </p>
                <Button variant="outline" onClick={filtersHook.clearFilters}>
                  Clear All Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-inter flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Scheduled Campaigns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 font-inter mb-2">No Scheduled Campaigns</h3>
              <p className="text-gray-600 font-inter">
                You don't have any campaigns scheduled to send. Create a new campaign and schedule it for later.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold font-inter flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filter Campaigns
              </h3>
              {filtersHook.hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={filtersHook.clearFilters}>
                  <X className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search campaigns..."
                  value={filtersHook.filters.searchQuery}
                  onChange={(e) => filtersHook.updateFilter('searchQuery', e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {/* Campaign Type */}
              <Select 
                value={filtersHook.filters.campaignType} 
                onValueChange={(value) => filtersHook.updateFilter('campaignType', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Campaign Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Date Range */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filtersHook.filters.dateRange?.from ? (
                      filtersHook.filters.dateRange?.to ? (
                        <>
                          {format(filtersHook.filters.dateRange.from, "LLL dd, y")} -{" "}
                          {format(filtersHook.filters.dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(filtersHook.filters.dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={filtersHook.filters.dateRange?.from}
                    selected={filtersHook.filters.dateRange}
                    onSelect={(range) => filtersHook.updateFilter('dateRange', range)}
                    numberOfMonths={2}
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="font-inter flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Scheduled Campaigns ({scheduledCampaigns.length})
            {filtersHook.hasActiveFilters && (
              <Badge variant="secondary" className="ml-2">
                Filtered
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-inter">Campaign</TableHead>
                <TableHead className="font-inter">Type</TableHead>
                <TableHead className="font-inter">Recipients</TableHead>
                <TableHead className="font-inter">Scheduled Date</TableHead>
                <TableHead className="font-inter">Status</TableHead>
                <TableHead className="font-inter">Time Until Send</TableHead>
                <TableHead className="font-inter">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scheduledCampaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium font-inter">{campaign.name}</div>
                      {campaign.custom_subject && (
                        <div className="text-sm text-gray-500 font-inter">
                          Subject: {campaign.custom_subject}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getCampaignTypeIcon(campaign.campaign_type)}
                      <span className="capitalize font-inter">{campaign.campaign_type}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-inter">
                    {campaign.total_recipients || 0}
                  </TableCell>
                  <TableCell className="font-inter">
                    {campaign.scheduled_at && format(new Date(campaign.scheduled_at), 'MMM d, yyyy h:mm a')}
                  </TableCell>
                  <TableCell>
                    {campaign.scheduled_at && getStatusBadge(campaign.scheduled_at)}
                  </TableCell>
                  <TableCell className="font-inter">
                    {campaign.scheduled_at && getTimeUntilSend(campaign.scheduled_at)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditCampaign(campaign)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleReschedule(campaign)}>
                          <Clock className="w-4 h-4 mr-2" />
                          Reschedule
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => sendNowMutation.mutate(campaign.id)}
                          className="text-blue-600"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Send Now
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => cancelCampaignMutation.mutate(campaign.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Cancel
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
        
      {/* Edit Campaign Modal */}
      <Dialog open={!!editingCampaign} onOpenChange={() => setEditingCampaign(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="font-inter">Edit Campaign</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            {editingCampaign && (
              <CampaignCreation
                initialData={editingCampaign.data}
                onClose={() => setEditingCampaign(null)}
                isEditing={true}
                campaignId={editingCampaign.id}
                onUpdate={(data) => updateCampaignMutation.mutate({ campaignId: editingCampaign.id, data })}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Reschedule Dialog */}
      <Dialog open={!!rescheduleDialogOpen} onOpenChange={() => setRescheduleDialogOpen(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-inter">Reschedule Campaign</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 font-inter">New Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {rescheduleDate ? format(rescheduleDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={rescheduleDate}
                    onSelect={setRescheduleDate}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 font-inter">Time</label>
              <Input
                type="time"
                value={rescheduleTime}
                onChange={(e) => setRescheduleTime(e.target.value)}
                className="w-full"
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setRescheduleDialogOpen(null)}>
                Cancel
              </Button>
              <Button 
                onClick={handleRescheduleConfirm}
                disabled={!rescheduleDate || !rescheduleTime || rescheduleCampaignMutation.isPending}
              >
                {rescheduleCampaignMutation.isPending ? 'Rescheduling...' : 'Reschedule'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};