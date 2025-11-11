import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useOrganizationId } from '@/hooks/useOrganizationId';
import { safeRead } from '@/lib/supabase-helpers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart3, TrendingUp, Mail, MousePointer } from 'lucide-react';
import { format } from 'date-fns';

interface Campaign {
  id: string;
  name: string;
  status: string;
  total_recipients: number | null;
  delivered_count: number | null;
  opened_count: number | null;
  clicked_count: number | null;
  sent_at: string | null;
}

export function CampaignAnalyticsOverview() {
  const navigate = useNavigate();
  const { orgId } = useOrganizationId();

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['marketing-campaigns', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await safeRead('marketing_campaigns', orgId)
        .select('id, name, status, total_recipients, delivered_count, opened_count, clicked_count, sent_at')
        .order('sent_at', { ascending: false });
      
      if (error) throw error;
      return data as Campaign[];
    },
    enabled: !!orgId,
  });

  const sentCampaigns = useMemo(() => 
    campaigns.filter(c => c.status === 'sent'),
    [campaigns]
  );

  const metrics = useMemo(() => {
    const totalCampaigns = sentCampaigns.length;
    
    const totalRecipients = sentCampaigns.reduce((sum, c) => sum + (c.total_recipients || 0), 0);
    const totalDelivered = sentCampaigns.reduce((sum, c) => sum + (c.delivered_count || 0), 0);
    const totalOpened = sentCampaigns.reduce((sum, c) => sum + (c.opened_count || 0), 0);
    const totalClicked = sentCampaigns.reduce((sum, c) => sum + (c.clicked_count || 0), 0);

    const deliveryRate = totalRecipients > 0 ? (totalDelivered / totalRecipients) * 100 : 0;
    const openRate = totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0;
    const clickRate = totalDelivered > 0 ? (totalClicked / totalDelivered) * 100 : 0;

    return {
      totalCampaigns,
      deliveryRate: deliveryRate.toFixed(1),
      openRate: openRate.toFixed(1),
      clickRate: clickRate.toFixed(1),
    };
  }, [sentCampaigns]);

  const recentCampaigns = useMemo(() => 
    sentCampaigns.slice(0, 5),
    [sentCampaigns]
  );

  const calculateRate = (numerator: number, denominator: number): string => {
    if (denominator === 0) return '0.0';
    return ((numerator / denominator) * 100).toFixed(1);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Total Campaigns</p>
                <p className="text-3xl font-bold">{metrics.totalCampaigns}</p>
              </div>
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Delivery Rate</p>
                <p className="text-3xl font-bold">{metrics.deliveryRate}%</p>
              </div>
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Open Rate</p>
                <p className="text-3xl font-bold">{metrics.openRate}%</p>
              </div>
              <Mail className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Click Rate</p>
                <p className="text-3xl font-bold">{metrics.clickRate}%</p>
              </div>
              <MousePointer className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          {recentCampaigns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No campaigns sent yet
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign Name</TableHead>
                  <TableHead>Sent Date</TableHead>
                  <TableHead className="text-right">Delivery Rate</TableHead>
                  <TableHead className="text-right">Open Rate</TableHead>
                  <TableHead className="text-right">Click Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentCampaigns.map((campaign) => {
                  const delivered = campaign.delivered_count || 0;
                  const recipients = campaign.total_recipients || 0;
                  const opened = campaign.opened_count || 0;
                  const clicked = campaign.clicked_count || 0;

                  return (
                    <TableRow key={campaign.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/marketing/campaigns/${campaign.id}`)}>
                      <TableCell className="font-medium hover:text-primary">{campaign.name}</TableCell>
                      <TableCell>
                        {campaign.sent_at 
                          ? format(new Date(campaign.sent_at), 'MMM dd, yyyy — h:mm a')
                          : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        {calculateRate(delivered, recipients)}%
                      </TableCell>
                      <TableCell className="text-right">
                        {calculateRate(opened, delivered)}%
                      </TableCell>
                      <TableCell className="text-right">
                        {calculateRate(clicked, delivered)}%
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
