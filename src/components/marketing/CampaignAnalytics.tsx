
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChartWrapper } from '@/components/analytics/ChartWrapper';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Mail, MessageSquare, Users, Eye, MousePointer } from 'lucide-react';
import { startOfYear, startOfMonth } from 'date-fns';

export const CampaignAnalytics: React.FC = () => {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<'YTD' | 'MTD'>('YTD');

  // Fetch campaigns
  const { data: campaigns = [] } = useQuery({
    queryKey: ['marketing-campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketing_campaigns')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Filter campaigns based on date range
  const filteredCampaigns = useMemo(() => {
    const now = new Date();
    const startDate = dateRange === 'YTD' ? startOfYear(now) : startOfMonth(now);
    
    return campaigns.filter(campaign => {
      const campaignDate = new Date(campaign.sent_at || campaign.created_at);
      return campaignDate >= startDate;
    });
  }, [campaigns, dateRange]);

  // Calculate summary stats
  const totalCampaigns = campaigns.length;
  const activeCampaigns = campaigns.filter(c => c.status === 'sending' || c.status === 'scheduled').length;
  const completedCampaigns = campaigns.filter(c => c.status === 'completed').length;
  const totalRecipients = campaigns.reduce((sum, c) => sum + (c.total_recipients || 0), 0);
  const totalDelivered = campaigns.reduce((sum, c) => sum + (c.delivered_count || 0), 0);
  const totalOpened = campaigns.reduce((sum, c) => sum + (c.opened_count || 0), 0);
  const totalClicked = campaigns.reduce((sum, c) => sum + (c.clicked_count || 0), 0);

  const deliveryRate = totalRecipients > 0 ? (totalDelivered / totalRecipients) * 100 : 0;
  const openRate = totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0;
  const clickRate = totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0;

  // Chart data
  const campaignPerformanceData = campaigns.slice(0, 10).map(campaign => ({
    name: campaign.name.substring(0, 15) + '...',
    delivered: campaign.delivered_count || 0,
    opened: campaign.opened_count || 0,
    clicked: campaign.clicked_count || 0,
    bounced: campaign.bounced_count || 0
  }));

  const monthlyData = [
    { month: 'Jan', campaigns: 12, recipients: 2340 },
    { month: 'Feb', campaigns: 15, recipients: 2890 },
    { month: 'Mar', campaigns: 18, recipients: 3120 },
    { month: 'Apr', campaigns: 22, recipients: 3850 },
    { month: 'May', campaigns: 19, recipients: 3200 },
    { month: 'Jun', campaigns: 25, recipients: 4100 }
  ];

  const channelData = [
    { name: 'Email', value: filteredCampaigns.filter(c => c.campaign_type === 'email').length, color: '#3B82F6' },
    { name: 'SMS', value: filteredCampaigns.filter(c => c.campaign_type === 'sms').length, color: '#10B981' },
    { name: 'Both', value: filteredCampaigns.filter(c => c.campaign_type === 'both').length, color: '#8B5CF6' }
  ];

  const summaryCards = [
    {
      title: 'Total Campaigns',
      value: totalCampaigns,
      icon: TrendingUp,
      color: 'hsl(var(--primary))'
    },
    {
      title: 'Delivery Rate',
      value: `${deliveryRate.toFixed(1)}%`,
      icon: Mail,
      color: 'hsl(142, 71%, 45%)'
    },
    {
      title: 'Open Rate',
      value: `${openRate.toFixed(1)}%`,
      icon: Eye,
      color: 'hsl(259, 55%, 52%)'
    },
    {
      title: 'Click Rate',
      value: `${clickRate.toFixed(1)}%`,
      icon: MousePointer,
      color: 'hsl(25, 95%, 53%)'
    }
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Summary Cards - Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {summaryCards.map((card, index) => (
          <Card key={index} className="p-4 md:p-6 rounded-2xl shadow-md min-h-[88px]">
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-600 mb-1 truncate">{card.title}</p>
                <p className="text-2xl font-bold truncate" style={{ color: card.color }}>
                  {card.value}
                </p>
              </div>
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ml-2"
                style={{ backgroundColor: card.color }}
              >
                <card.icon className="w-5 h-5 text-white" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Channel Distribution & Recent Campaigns - Mobile Stack */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Channel Distribution with YTD/MTD Toggle */}
        <Card className="p-4 md:p-6 rounded-2xl shadow-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <h3 className="text-base md:text-lg font-semibold">Campaign Channels {dateRange}</h3>
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              <Button
                variant={dateRange === 'YTD' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setDateRange('YTD')}
                className="min-h-[44px] px-4"
              >
                YTD
              </Button>
              <Button
                variant={dateRange === 'MTD' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setDateRange('MTD')}
                className="min-h-[44px] px-4"
              >
                MTD
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <ChartWrapper>
              {(Recharts) => {
                const { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } = Recharts;
                
                return (
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={channelData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {channelData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                );
              }}
            </ChartWrapper>
          </div>
          <div className="flex flex-wrap justify-center gap-3 md:gap-4 mt-4">
            {channelData.map((channel) => (
              <div key={channel.name} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: channel.color }}
                />
                <span className="text-sm">{channel.name} ({channel.value})</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Campaigns */}
        <Card className="p-4 md:p-6 rounded-2xl shadow-md">
          <h3 className="text-base md:text-lg font-semibold mb-4">Recent Campaigns</h3>
          <div className="space-y-3 md:space-y-4">
            {campaigns.slice(0, 5).map((campaign) => (
              <div key={campaign.id} className="flex items-center justify-between gap-3 min-h-[44px] cursor-pointer hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors" onClick={() => navigate(`/marketing/campaigns/${campaign.id}`)}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-medium text-sm truncate hover:text-primary">{campaign.name}</span>
                    <Badge 
                      variant={
                        campaign.status === 'completed' ? 'default' :
                        campaign.status === 'sending' ? 'destructive' :
                        campaign.status === 'scheduled' ? 'secondary' : 'outline'
                      }
                      className="text-xs shrink-0"
                    >
                      {campaign.status}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs text-gray-500">
                    <span className="shrink-0">{campaign.campaign_type}</span>
                    <span className="shrink-0">{campaign.total_recipients || 0} recipients</span>
                    {campaign.delivered_count > 0 && (
                      <span className="shrink-0">{((campaign.opened_count || 0) / campaign.delivered_count * 100).toFixed(1)}% open rate</span>
                    )}
                  </div>
                </div>
                {campaign.campaign_type === 'email' ? (
                  <Mail className="w-4 h-4 text-blue-500 shrink-0" />
                ) : campaign.campaign_type === 'sms' ? (
                  <MessageSquare className="w-4 h-4 text-green-500 shrink-0" />
                ) : (
                  <Users className="w-4 h-4 text-purple-500 shrink-0" />
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
