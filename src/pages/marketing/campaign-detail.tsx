import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganizationId } from '@/hooks/useOrganizationId';
import { safeRead } from '@/lib/supabase-helpers';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Mail, Users, Eye, MousePointer, Check, X } from 'lucide-react';
import { format } from 'date-fns';

export default function CampaignDetail() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const { orgId } = useOrganizationId();

  // Fetch campaign details
  const { data: campaign, isLoading: campaignLoading } = useQuery({
    queryKey: ['campaign-detail', campaignId, orgId],
    queryFn: async () => {
      if (!orgId || !campaignId) return null;
      const { data, error } = await safeRead('marketing_campaigns', orgId)
        .select('*')
        .eq('id', campaignId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!orgId && !!campaignId
  });

  // Fetch engagement events with customer details
  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ['campaign-engagement', campaignId, orgId],
    queryFn: async () => {
      if (!orgId || !campaignId) return [];
      const { data, error } = await supabase
        .from('marketing_campaign_events')
        .select(`
          customer_id,
          event_type,
          created_at,
          customers (
            id,
            name,
            email,
            phone
          )
        `)
        .eq('campaign_id', campaignId)
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId && !!campaignId
  });

  // Group events by customer
  const customerEngagement = useMemo(() => {
    if (!events || events.length === 0) return [];
    
    const grouped = events.reduce((acc: Record<string, any>, event: any) => {
      const customerId = event.customer_id;
      if (!acc[customerId]) {
        acc[customerId] = {
          customer: event.customers,
          opened: false,
          clicked: false,
          lastEngagement: null
        };
      }
      
      if (event.event_type === 'open') acc[customerId].opened = true;
      if (event.event_type === 'click') acc[customerId].clicked = true;
      
      if (!acc[customerId].lastEngagement || 
          new Date(event.created_at) > new Date(acc[customerId].lastEngagement)) {
        acc[customerId].lastEngagement = event.created_at;
      }
      
      return acc;
    }, {});
    
    return Object.values(grouped).sort((a: any, b: any) => {
      if (!a.lastEngagement) return 1;
      if (!b.lastEngagement) return -1;
      return new Date(b.lastEngagement).getTime() - new Date(a.lastEngagement).getTime();
    });
  }, [events]);

  // Calculate metrics
  const metrics = useMemo(() => {
    if (!campaign) return { deliveryRate: 0, openRate: 0, clickRate: 0 };
    
    const totalRecipients = campaign.total_recipients || 0;
    const delivered = campaign.delivered_count || 0;
    const opened = campaign.opened_count || 0;
    const clicked = campaign.clicked_count || 0;
    
    return {
      deliveryRate: totalRecipients > 0 ? (delivered / totalRecipients) * 100 : 0,
      openRate: delivered > 0 ? (opened / delivered) * 100 : 0,
      clickRate: opened > 0 ? (clicked / opened) * 100 : 0
    };
  }, [campaign]);

  if (campaignLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="container mx-auto py-8">
        <Card className="p-8 text-center">
          <p className="text-gray-600">Campaign not found</p>
          <Button onClick={() => navigate('/marketing')} className="mt-4">
            Back to Marketing
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/marketing')}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{campaign.name}</h1>
          <div className="flex items-center gap-3 mt-2">
            <Badge variant={campaign.status === 'sent' ? 'default' : 'secondary'}>
              {campaign.status}
            </Badge>
            <span className="text-sm text-gray-600">
              {campaign.campaign_type}
            </span>
            {campaign.sent_at && (
              <span className="text-sm text-gray-600">
                Sent {format(new Date(campaign.sent_at), 'MMM dd, yyyy — h:mm a')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Engagement Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 rounded-2xl shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Recipients</p>
              <p className="text-2xl font-bold">{campaign.total_recipients || 0}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 rounded-2xl shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Delivery Rate</p>
              <p className="text-2xl font-bold text-green-600">{metrics.deliveryRate.toFixed(1)}%</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
              <Mail className="w-5 h-5 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 rounded-2xl shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Open Rate</p>
              <p className="text-2xl font-bold text-purple-600">{metrics.openRate.toFixed(1)}%</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center">
              <Eye className="w-5 h-5 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 rounded-2xl shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Click Rate</p>
              <p className="text-2xl font-bold text-orange-600">{metrics.clickRate.toFixed(1)}%</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center">
              <MousePointer className="w-5 h-5 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Engagement Table */}
      <Card className="p-6 rounded-2xl shadow-md">
        <h2 className="text-xl font-semibold mb-4">Customer Engagement</h2>
        {eventsLoading ? (
          <div className="animate-pulse space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        ) : customerEngagement.length === 0 ? (
          <p className="text-gray-600 text-center py-8">No engagement data yet</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-center">Opened</TableHead>
                <TableHead className="text-center">Clicked</TableHead>
                <TableHead>Last Engagement</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customerEngagement.map((item: any) => (
                <TableRow key={item.customer.id}>
                  <TableCell className="font-medium">{item.customer.name}</TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {item.customer.email || item.customer.phone || '—'}
                  </TableCell>
                  <TableCell className="text-center">
                    {item.opened ? (
                      <Check className="w-5 h-5 text-green-500 mx-auto" />
                    ) : (
                      <X className="w-5 h-5 text-gray-300 mx-auto" />
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {item.clicked ? (
                      <Check className="w-5 h-5 text-green-500 mx-auto" />
                    ) : (
                      <X className="w-5 h-5 text-gray-300 mx-auto" />
                    )}
                  </TableCell>
                  <TableCell>
                    {item.lastEngagement 
                      ? format(new Date(item.lastEngagement), 'MMM dd, yyyy — h:mm a')
                      : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
