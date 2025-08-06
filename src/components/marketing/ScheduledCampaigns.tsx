import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Edit, Trash2, Send, Calendar as CalendarIcon, Clock, Mail, MessageSquare, Search, Filter, X } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
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
import { CampaignCreation } from './CampaignCreation';
import { useScheduledCampaignsFilters } from '@/hooks/useScheduledCampaignsFilters';

export const ScheduledCampaigns: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingCampaign, setEditingCampaign] = useState<any>(null);
  const filtersHook = useScheduledCampaignsFilters();

  // Fetch scheduled campaigns with filters
  const { data: scheduledCampaigns, isLoading } = useQuery({
    queryKey: ['scheduled-campaigns', filtersHook.filters.searchQuery, filtersHook.filters.campaignType, filtersHook.filters.dateRange?.from?.toISOString(), filtersHook.filters.dateRange?.to?.toISOString()],
    queryFn: async () => {
      let query = supabase
        .from('marketing_campaigns')
        .select('*');
      
      // Apply filters 
      const whereClause = filtersHook.buildWhereClause;
      whereClause.forEach(condition => {
        if (condition.operator === 'eq') {
          query = query.eq(condition.column, condition.value);
        } else if (condition.operator === 'ilike') {
          query = query.ilike(condition.column, condition.value);
        } else if (condition.operator === 'gte') {
          query = query.gte(condition.column, condition.value);
        } else if (condition.operator === 'lte') {
          query = query.lte(condition.column, condition.value);
        }
      });
      
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
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditCampaign(campaign)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Send className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="font-inter">Send Campaign Now?</AlertDialogTitle>
                            <AlertDialogDescription className="font-inter">
                              This will send the campaign "{campaign.name}" immediately to all recipients.
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="font-inter">Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => sendNowMutation.mutate(campaign.id)}
                              className="font-inter"
                            >
                              Send Now
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="font-inter">Cancel Scheduled Campaign?</AlertDialogTitle>
                            <AlertDialogDescription className="font-inter">
                              This will cancel the scheduled campaign "{campaign.name}" and move it back to drafts.
                              You can reschedule it later if needed.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="font-inter">Keep Scheduled</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => cancelCampaignMutation.mutate(campaign.id)}
                              className="font-inter"
                            >
                              Cancel Campaign
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
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
    </div>
  );
};