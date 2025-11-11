import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOrganizationId } from '@/hooks/useOrganizationId';
import { safeRead, safeUpdate } from '@/lib/supabase-helpers';
import { supabase } from '@/integrations/supabase/client';
import { format, formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Send, X, Clock, Loader2 } from 'lucide-react';

interface ScheduledCampaign {
  id: string;
  name: string;
  scheduled_at: string;
  total_recipients: number | null;
  status: string;
  organization_id: string;
}

export default function ScheduledCampaignsPage() {
  const { orgId } = useOrganizationId();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rescheduleModal, setRescheduleModal] = useState<{
    isOpen: boolean;
    campaignId: string | null;
    campaignName: string;
    currentScheduledAt: Date | null;
  }>({
    isOpen: false,
    campaignId: null,
    campaignName: '',
    currentScheduledAt: null,
  });
  const [newScheduledDate, setNewScheduledDate] = useState<Date | undefined>();
  const [newScheduledTime, setNewScheduledTime] = useState<string>('09:00');

  // Fetch scheduled campaigns
  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['scheduled-campaigns', orgId],
    queryFn: async () => {
      const { data, error } = await safeRead('marketing_campaigns', orgId, { status: 'scheduled' })
        .select('id, name, scheduled_at, total_recipients, status, organization_id')
        .order('scheduled_at', { ascending: true });

      if (error) throw error;
      return data as ScheduledCampaign[];
    },
    enabled: !!orgId,
  });

  // Send Now mutation
  const sendNowMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      const { error } = await supabase.functions.invoke('send-marketing-campaign', {
        body: { campaignId },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Campaign Sent',
        description: 'The campaign has been sent successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['scheduled-campaigns', orgId] });
    },
    onError: (error: any) => {
      toast({
        title: 'Send Failed',
        description: error.message || 'Failed to send campaign',
        variant: 'destructive',
      });
    },
  });

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: async (campaign: ScheduledCampaign) => {
      const { error } = await safeUpdate(
        'marketing_campaigns',
        { status: 'cancelled', scheduled_at: null },
        orgId,
        { id: campaign.id }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Campaign Cancelled',
        description: 'The scheduled campaign has been cancelled.',
      });
      queryClient.invalidateQueries({ queryKey: ['scheduled-campaigns', orgId] });
    },
    onError: (error: any) => {
      toast({
        title: 'Cancellation Failed',
        description: error.message || 'Failed to cancel campaign',
        variant: 'destructive',
      });
    },
  });

  // Reschedule mutation
  const rescheduleMutation = useMutation({
    mutationFn: async ({
      campaignId,
      newScheduledAt,
    }: {
      campaignId: string;
      newScheduledAt: string;
    }) => {
      const { error } = await safeUpdate(
        'marketing_campaigns',
        { scheduled_at: newScheduledAt },
        orgId,
        { id: campaignId }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Campaign Rescheduled',
        description: 'The campaign has been rescheduled successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['scheduled-campaigns', orgId] });
      setRescheduleModal({ isOpen: false, campaignId: null, campaignName: '', currentScheduledAt: null });
      setNewScheduledDate(undefined);
      setNewScheduledTime('09:00');
    },
    onError: (error: any) => {
      toast({
        title: 'Reschedule Failed',
        description: error.message || 'Failed to reschedule campaign',
        variant: 'destructive',
      });
    },
  });

  const handleReschedule = (campaign: ScheduledCampaign) => {
    const currentDate = campaign.scheduled_at ? new Date(campaign.scheduled_at) : new Date();
    setRescheduleModal({
      isOpen: true,
      campaignId: campaign.id,
      campaignName: campaign.name,
      currentScheduledAt: currentDate,
    });
    setNewScheduledDate(currentDate);
    setNewScheduledTime(format(currentDate, 'HH:mm'));
  };

  const handleRescheduleSubmit = () => {
    if (!rescheduleModal.campaignId || !newScheduledDate) {
      toast({
        title: 'Invalid Selection',
        description: 'Please select a date and time',
        variant: 'destructive',
      });
      return;
    }

    const [hours, minutes] = newScheduledTime.split(':');
    const scheduledDateTime = new Date(newScheduledDate);
    scheduledDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

    rescheduleMutation.mutate({
      campaignId: rescheduleModal.campaignId,
      newScheduledAt: scheduledDateTime.toISOString(),
    });
  };

  if (!orgId) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Organization context required</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Scheduled Campaigns</h1>
          <p className="text-muted-foreground mt-1">
            Manage campaigns scheduled for future delivery
          </p>
        </div>

        <div className="bg-card rounded-2xl shadow-md border border-border">
          {isLoading ? (
            <div className="p-12 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : campaigns && campaigns.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign Name</TableHead>
                  <TableHead>Scheduled For</TableHead>
                  <TableHead>Time Until Send</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium">{campaign.name}</TableCell>
                    <TableCell>
                      {campaign.scheduled_at
                        ? format(new Date(campaign.scheduled_at), 'MMM dd, yyyy — h:mm a')
                        : '—'}
                    </TableCell>
                    <TableCell>
                      {campaign.scheduled_at ? (
                        <span className="text-sm font-medium">
                          {campaign.status === 'sent' 
                            ? formatDistanceToNow(new Date(campaign.scheduled_at), { addSuffix: true })
                            : `Sending ${formatDistanceToNow(new Date(campaign.scheduled_at), { addSuffix: true }).replace('in ', '')}`
                          }
                        </span>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>
                      {campaign.total_recipients ?? <span className="text-muted-foreground">Calculating...</span>}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {campaign.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => sendNowMutation.mutate(campaign.id)}
                          disabled={sendNowMutation.isPending}
                          className="gap-1"
                        >
                          <Send className="h-3 w-3" />
                          Send Immediately
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReschedule(campaign)}
                          disabled={rescheduleMutation.isPending}
                          className="gap-1"
                        >
                          <Clock className="h-3 w-3" />
                          Reschedule
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => cancelMutation.mutate(campaign)}
                          disabled={cancelMutation.isPending}
                          className="gap-1 text-destructive hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                          Cancel
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-12 text-center">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No Scheduled Campaigns
              </h3>
              <p className="text-muted-foreground">
                Campaigns scheduled for future delivery will appear here.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Reschedule Modal */}
      <Dialog open={rescheduleModal.isOpen} onOpenChange={(open) => {
        if (!open) {
          setRescheduleModal({ isOpen: false, campaignId: null, campaignName: '', currentScheduledAt: null });
          setNewScheduledDate(undefined);
          setNewScheduledTime('09:00');
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reschedule Campaign</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                Rescheduling: <span className="font-medium text-foreground">{rescheduleModal.campaignName}</span>
              </p>
            </div>
            <div className="space-y-2">
              <Label>Select Date</Label>
              <Calendar
                mode="single"
                selected={newScheduledDate}
                onSelect={setNewScheduledDate}
                disabled={(date) => date < new Date()}
                className="rounded-md border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Select Time</Label>
              <Input
                id="time"
                type="time"
                value={newScheduledTime}
                onChange={(e) => setNewScheduledTime(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRescheduleModal({ isOpen: false, campaignId: null, campaignName: '', currentScheduledAt: null });
                setNewScheduledDate(undefined);
                setNewScheduledTime('09:00');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRescheduleSubmit}
              disabled={rescheduleMutation.isPending || !newScheduledDate}
            >
              {rescheduleMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reschedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
