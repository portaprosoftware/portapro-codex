import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2, Send, Calendar, Clock, Mail, MessageSquare } from 'lucide-react';
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

export const ScheduledCampaigns: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch scheduled campaigns
  const { data: scheduledCampaigns, isLoading } = useQuery({
    queryKey: ['scheduled-campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketing_campaigns')
        .select('*')
        .eq('status', 'scheduled')
        .order('scheduled_at', { ascending: true });
      
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
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-inter flex items-center gap-2">
              <Calendar className="w-5 h-5" />
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
      <Card>
        <CardHeader>
          <CardTitle className="font-inter flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Scheduled Campaigns ({scheduledCampaigns.length})
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
                      <Button variant="outline" size="sm">
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
    </div>
  );
};