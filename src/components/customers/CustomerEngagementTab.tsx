import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganizationId } from '@/hooks/useOrganizationId';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, X, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

interface CustomerEngagementTabProps {
  customerId: string;
}

interface EngagementEvent {
  campaign_id: string;
  campaign_name: string;
  sent_at: string;
  event_type: string;
  event_time: string;
}

interface CampaignEngagement {
  campaignId: string;
  campaignName: string;
  sentAt: string;
  opened: boolean;
  clicked: boolean;
  lastEngagement: string;
}

export function CustomerEngagementTab({ customerId }: CustomerEngagementTabProps) {
  const { orgId } = useOrganizationId();

  const { data: events, isLoading } = useQuery({
    queryKey: ['customer-engagement', customerId, orgId],
    queryFn: async () => {
      if (!orgId) throw new Error('Organization ID required');

      const { data, error } = await supabase
        .from('marketing_campaign_events')
        .select(`
          campaign_id,
          event_type,
          created_at,
          marketing_campaigns!inner (
            id,
            name,
            sent_at
          )
        `)
        .eq('customer_id', customerId)
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map((event: any) => ({
        campaign_id: event.campaign_id,
        campaign_name: event.marketing_campaigns.name,
        sent_at: event.marketing_campaigns.sent_at,
        event_type: event.event_type,
        event_time: event.created_at,
      })) as EngagementEvent[];
    },
    enabled: !!orgId && !!customerId,
  });

  // Group events by campaign
  const campaignEngagement: CampaignEngagement[] = (events || []).reduce((acc, event) => {
    const existing = acc.find(e => e.campaignId === event.campaign_id);
    
    if (existing) {
      if (event.event_type === 'open') existing.opened = true;
      if (event.event_type === 'click') existing.clicked = true;
      
      // Update last engagement if this event is more recent
      if (new Date(event.event_time) > new Date(existing.lastEngagement)) {
        existing.lastEngagement = event.event_time;
      }
    } else {
      acc.push({
        campaignId: event.campaign_id,
        campaignName: event.campaign_name,
        sentAt: event.sent_at,
        opened: event.event_type === 'open',
        clicked: event.event_type === 'click',
        lastEngagement: event.event_time,
      });
    }
    
    return acc;
  }, [] as CampaignEngagement[]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold">Engagement History</h3>
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!campaignEngagement.length) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold">Engagement History</h3>
        </div>
        <div className="text-center py-12 text-muted-foreground">
          <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>No marketing campaign engagement yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-purple-600" />
        <h3 className="text-lg font-semibold">Engagement History</h3>
      </div>
      
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campaign</TableHead>
              <TableHead>Sent</TableHead>
              <TableHead className="text-center">Opened</TableHead>
              <TableHead className="text-center">Clicked</TableHead>
              <TableHead>Last Engagement</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaignEngagement.map((campaign) => (
              <TableRow key={campaign.campaignId}>
                <TableCell className="font-medium">{campaign.campaignName}</TableCell>
                <TableCell>
                  {campaign.sentAt 
                    ? format(new Date(campaign.sentAt), 'MMM dd, yyyy')
                    : '—'}
                </TableCell>
                <TableCell className="text-center">
                  {campaign.opened ? (
                    <Check className="w-5 h-5 text-green-600 mx-auto" />
                  ) : (
                    <X className="w-5 h-5 text-gray-300 mx-auto" />
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {campaign.clicked ? (
                    <Check className="w-5 h-5 text-green-600 mx-auto" />
                  ) : (
                    <X className="w-5 h-5 text-gray-300 mx-auto" />
                  )}
                </TableCell>
                <TableCell>
                  {format(new Date(campaign.lastEngagement), 'MMM dd, yyyy — h:mm a')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
