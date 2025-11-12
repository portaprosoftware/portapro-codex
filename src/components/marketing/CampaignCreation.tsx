import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarIcon, Users, Mail, MessageSquare, Send, Clock, Search, List, Grid3X3, Eye, Save, ToggleLeft, ToggleRight } from 'lucide-react';
import { TemplateOrCustomSelector } from './TemplateOrCustomSelector';
import { MessageComposer } from './MessageComposer';
import { TimePicker } from '@/components/ui/time-picker';
import { TimePresetButtons } from '@/components/ui/time-preset-buttons';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCampaignDrafts } from '@/hooks/useCampaignDrafts';
import { useOrganizationId } from '@/hooks/useOrganizationId';
import { safeRead } from '@/lib/supabase-helpers';
import { useMemo } from 'react';

interface CampaignData {
  name: string;
  campaign_type: 'email' | 'sms' | 'both';
  template_id?: string;
  custom_message?: {
    subject?: string;
    content: string;
    buttons: Array<{
      id: string;
      text: string;
      type: 'url' | 'phone' | 'email';
      value: string;
      style: 'primary' | 'secondary';
    }>;
    customImageUrl?: string;
    imagePosition?: 'top' | 'middle' | 'bottom' | 'left';
    showCompanyLogo?: boolean;
    logoSize?: 'small' | 'medium' | 'large';
  };
  message_source: 'template' | 'custom';
  target_segments: string[];
  target_customer_types: string[];
  target_customers: string[];
  recipient_type: 'all' | 'segments' | 'types' | 'individuals';
  scheduled_at?: Date;
  currentStep?: number;
}

interface CampaignCreationProps {
  onClose?: () => void;
  draftId?: string;
  initialData?: Partial<CampaignData>;
  isEditing?: boolean;
  campaignId?: string;
  onUpdate?: (data: any) => void;
}

export const CampaignCreation: React.FC<CampaignCreationProps> = ({ 
  onClose, 
  draftId: initialDraftId, 
  initialData,
  isEditing = false,
  campaignId,
  onUpdate 
}) => {
  const [currentStep, setCurrentStep] = useState(() => {
    // If resuming a draft, start on step 3, otherwise step 1
    return initialData?.currentStep || (initialData ? 3 : 1);
  });
  const [showingTemplates, setShowingTemplates] = useState(false);
  const [campaignData, setCampaignData] = useState<CampaignData>(() => {
    if (initialData) {
      console.log('🔍 Loading draft with initialData:', initialData);
      console.log('🔍 Raw initialData keys:', Object.keys(initialData));
      console.log('🔍 Raw initialData.custom_message:', initialData.custom_message);
      console.log('🔍 Full initialData object:', JSON.stringify(initialData, null, 2));
      
      const defaults = {
        name: '',
        campaign_type: 'email' as const,
        message_source: 'template' as const,
        target_segments: [],
        target_customer_types: [],
        target_customers: [],
        recipient_type: 'all' as const,
      };
      
      const result: CampaignData = {
        ...defaults,
        ...initialData,
        // Ensure proper types for required fields
        campaign_type: (initialData.campaign_type || defaults.campaign_type) as 'email' | 'sms' | 'both',
        message_source: (initialData.message_source || defaults.message_source) as 'template' | 'custom',
        recipient_type: (initialData.recipient_type || defaults.recipient_type) as 'all' | 'segments' | 'types' | 'individuals',
        // Ensure custom message has all required fields
        custom_message: initialData.custom_message ? {
          subject: '',
          content: '',
          buttons: [],
          ...initialData.custom_message
        } : undefined
      };
      console.log('🔍 Final campaignData:', result);
      console.log('🔍 Custom message data:', result.custom_message);
      return result;
    }
    return {
      name: '',
      campaign_type: 'email',
      message_source: 'template',
      target_segments: [],
      target_customer_types: [],
      target_customers: [],
      recipient_type: 'all',
    };
  });
  const [hasMessageContent, setHasMessageContent] = useState(false);
  const [hasSubjectContent, setHasSubjectContent] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date>(initialData?.scheduled_at);
  const [scheduledTime, setScheduledTime] = useState<string | null>(
    initialData?.scheduled_at ? format(new Date(initialData.scheduled_at), 'HH:mm') : null
  );
  const [sendMode, setSendMode] = useState<'now' | 'schedule'>('now');
  const [customerSearch, setCustomerSearch] = useState('');
  const [templateSourceFilter, setTemplateSourceFilter] = useState<'system' | 'user'>('user');
  const [templateViewMode, setTemplateViewMode] = useState<'list' | 'grid'>('list');
  const [segmentSearch, setSegmentSearch] = useState('');
  const [segmentViewMode, setSegmentViewMode] = useState<'list' | 'grid'>('list');
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);
  
  const [currentDraftId, setCurrentDraftId] = useState(initialDraftId);
  
  const queryClient = useQueryClient();
  const { saveDraft, isSaving } = useCampaignDrafts();
  const { orgId } = useOrganizationId();

  // Fetch templates from marketing_templates
  const { data: templates = [] } = useQuery({
    queryKey: ['marketing-templates', orgId],
    queryFn: async () => {
      const { data, error } = await safeRead('marketing_templates', orgId)
        .select('id, name, subject, content, category, preview_image_url');
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  // Fetch segments
  const { data: segments = [] } = useQuery({
    queryKey: ['customer-segments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_segments')
        .select('*')
        .eq('is_active', true);
      if (error) throw error;
      return data;
    }
  });


  // Fetch all customers for individual selection AND customer type aggregation
  const { data: customers = [], isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['customers-for-types', orgId],
    queryFn: async () => {
      const { data, error } = await safeRead('customers', orgId)
        .select('id, name, customer_type');
      return data ?? [];
    },
    enabled: !!orgId,
  });

  // Compute customer type counts from customers (client-side aggregation)
  const customerTypeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of customers) {
      const type = c.customer_type || 'Other';
      counts[type] = (counts[type] || 0) + 1;
    }
    return Object.entries(counts).map(([type, total]) => ({
      customer_type: type,
      total_count: total,
    }));
  }, [customers]);

  // Create campaign mutation
  const createCampaignMutation = useMutation({
    mutationFn: async (data: CampaignData & { sendMode: 'now' | 'schedule' | 'draft' }) => {
      if (!orgId) {
        throw new Error('Organization context required');
      }

      // Determine status and timestamps based on send mode
      let status: string;
      let scheduled_at: string | null = null;
      let sent_at: string | null = null;

      if (data.sendMode === 'now') {
        status = 'sent';
        sent_at = new Date().toISOString();
      } else if (data.sendMode === 'schedule') {
        status = 'scheduled';
        scheduled_at = getScheduledDateTime()?.toISOString() || null;
      } else {
        status = 'draft';
      }

      // Prepare the campaign object for the database structure
      const campaignObject: any = {
        organization_id: orgId,
        name: data.name,
        campaign_type: data.campaign_type,
        message_source: data.message_source,
        target_segments: data.target_segments,
        target_customer_types: data.target_customer_types,
        target_customers: data.target_customers,
        recipient_type: data.recipient_type,
        status,
        scheduled_at,
        sent_at,
      };

      // Add custom message fields if using custom message
      if (data.custom_message) {
        campaignObject.custom_subject = data.custom_message.subject;
        campaignObject.custom_content = data.custom_message.content;
        campaignObject.custom_message_data = data.custom_message;
      }

      // Add template_id if using template
      if (data.template_id) {
        campaignObject.template_id = data.template_id;
      }

      const { data: insertedCampaign, error } = await supabase
        .from('marketing_campaigns')
        .insert(campaignObject)
        .select()
        .single();
      
      if (error) throw error;

      // If status is "sent", trigger immediate send
      if (status === 'sent' && insertedCampaign) {
        const { error: sendError } = await supabase.functions.invoke('send-marketing-campaign', {
          body: { campaignId: insertedCampaign.id }
        });
        
        if (sendError) {
          console.error('Error sending campaign:', sendError);
          throw new Error('Campaign created but failed to send');
        }
      }

      return { campaign: insertedCampaign, status };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['scheduled-campaigns'] });
      
      const { status } = result;
      
      if (status === 'sent') {
        toast({ title: 'Campaign sent successfully!' });
      } else if (status === 'scheduled') {
        toast({ title: 'Campaign scheduled successfully!' });
      } else {
        toast({ title: 'Campaign saved as draft!' });
      }
      
      // Reset form
      setCampaignData({
        name: '',
        campaign_type: 'email',
        message_source: 'template',
        target_segments: [],
        target_customer_types: [],
        target_customers: [],
        recipient_type: 'all',
      });
      setCurrentStep(1);
      setScheduledDate(undefined);
      setScheduledTime(null);
      setSendMode('now');
      onClose?.();
      
      // Navigate to scheduled tab if campaign was scheduled
      if (status === 'scheduled' && typeof window !== 'undefined') {
        window.location.href = '/marketing/scheduled';
      }
    },
    onError: () => {
      toast({ title: 'Error creating campaign', variant: 'destructive' });
    }
  });


  const messageComposerRef = useRef<{
    saveMessage: () => void;
    hasContent: () => boolean;
    getCurrentMessageData: () => any;
  }>(null);

  // Helper function to combine date and time
  const getScheduledDateTime = () => {
    if (!scheduledDate) return null;
    
    if (scheduledTime) {
      const [hours, minutes] = scheduledTime.split(':').map(Number);
      const dateTime = new Date(scheduledDate);
      dateTime.setHours(hours, minutes, 0, 0);
      return dateTime;
    }
    
    return scheduledDate;
  };

  const handleNext = () => {
    if (currentStep === 3 && messageComposerRef.current) {
      messageComposerRef.current.saveMessage();
    }
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      // Reset template view when going back to step 2
      if (currentStep === 3 && campaignData.message_source === 'template') {
        setShowingTemplates(false);
      }
    }
  };

  const handleSubmit = async () => {
    if (isEditing && onUpdate) {
      // For editing, prepare update data
      const updateData: any = {
        name: campaignData.name,
        campaign_type: campaignData.campaign_type,
        message_source: campaignData.message_source,
        target_segments: campaignData.target_segments,
        target_customer_types: campaignData.target_customer_types,
        target_customers: campaignData.target_customers,
        recipient_type: campaignData.recipient_type,
        scheduled_at: getScheduledDateTime()?.toISOString(),
        status: getScheduledDateTime() ? 'scheduled' : 'draft'
      };

      // Add custom message fields if using custom message
      if (campaignData.custom_message) {
        updateData.custom_subject = campaignData.custom_message.subject;
        updateData.custom_content = campaignData.custom_message.content;
        updateData.custom_message_data = campaignData.custom_message;
      }

      // Add template_id if using template
      if (campaignData.template_id) {
        updateData.template_id = campaignData.template_id;
      }

      onUpdate(updateData);
    } else {
      // For creating new campaigns - pass sendMode to mutation
      createCampaignMutation.mutate({ ...campaignData, sendMode });
      
      // Delete draft after successful campaign creation
      if (currentDraftId) {
        try {
          await supabase
            .from('campaign_drafts')
            .delete()
            .eq('id', currentDraftId);
        } catch (error) {
          console.error('Error deleting draft:', error);
        }
      }
    }
  };

  const handleSaveDraft = async () => {
    // Use draft mode for saving drafts
    createCampaignMutation.mutate({ ...campaignData, sendMode: 'draft' });
    
    // Delete existing draft after successful save
    if (currentDraftId) {
      try {
        await supabase
          .from('campaign_drafts')
          .delete()
          .eq('id', currentDraftId);
      } catch (error) {
        console.error('Error deleting draft:', error);
      }
    }
  };


  const totalRecipients = (() => {
    if (campaignData.recipient_type === 'all') {
      return customers.length; // All customers
    } else if (campaignData.recipient_type === 'individuals') {
      return campaignData.target_customers.length;
    } else if (campaignData.recipient_type === 'segments') {
      return campaignData.target_segments.reduce((total, segmentId) => {
        const segment = segments.find(s => s.id === segmentId);
        return total + (segment?.customer_count || 0);
      }, 0);
    } else if (campaignData.recipient_type === 'types') {
      return campaignData.target_customer_types.reduce((total, type) => {
        const row = customerTypeCounts.find(t => t.customer_type === type);
        return total + (row?.total_count || 0);
      }, 0);
    }
    return 0;
  })();

  return (
    <>
      <div className="flex flex-col h-full">{/* Main container with flex column */}
      
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto space-y-6">{/* Scrollable area */}
      <div className="flex items-center justify-center mb-6">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step <= currentStep
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {step}
            </div>
            {step < 4 && (
              <div
                className={`w-16 h-1 mx-2 ${
                  step < currentStep ? 'bg-primary' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Campaign Type */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Campaign Type</h2>
            
            <div className="space-y-4">
              <div>
                <Label>Campaign Type</Label>
                <Tabs 
                  value={campaignData.campaign_type} 
                  onValueChange={(value) => setCampaignData({...campaignData, campaign_type: value as any})}
                >
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="email">Email</TabsTrigger>
                    <TabsTrigger value="sms">SMS</TabsTrigger>
                    <TabsTrigger value="both">Both</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      )}

        {/* Step 2: Select Recipients and Message Source */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold mb-4 font-inter">Recipients & Message Source</h2>
            
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium font-inter">Recipient Group</Label>
                <Select 
                  value={campaignData.recipient_type} 
                  onValueChange={(value) => setCampaignData({
                    ...campaignData, 
                    recipient_type: value as any,
                    target_segments: [],
                    target_customer_types: [],
                    target_customers: []
                  })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select recipient type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Customers</SelectItem>
                    <SelectItem value="segments">Segments</SelectItem>
                    <SelectItem value="types">Select Customer Types</SelectItem>
                    <SelectItem value="individuals">Select Individual Customers</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* All Customers Option */}
              {campaignData.recipient_type === 'all' && (
                <div className="p-4 bg-gradient-to-r from-blue-700 to-blue-800 rounded-lg border border-blue-200">
                  <p className="text-sm text-white font-inter">
                    This campaign will be sent to all customers in your database.
                  </p>
                </div>
              )}

              {/* Segments Option */}
              {campaignData.recipient_type === 'segments' && (
                <div className="space-y-4">
                  {/* Search and View Controls */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search segments..."
                        value={segmentSearch}
                        onChange={(e) => setSegmentSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <div className="flex items-center gap-2 border rounded-lg p-1">
                      <Button
                        variant={segmentViewMode === 'list' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setSegmentViewMode('list')}
                        className="px-3"
                      >
                        <List className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={segmentViewMode === 'grid' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setSegmentViewMode('grid')}
                        className="px-3"
                      >
                        <Grid3X3 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Segments Display */}
                  {segmentViewMode === 'list' ? (
                    <div className="space-y-2">
                      {segments
                        .filter(segment => 
                          segment.name.toLowerCase().includes(segmentSearch.toLowerCase()) ||
                          segment.description.toLowerCase().includes(segmentSearch.toLowerCase())
                        )
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((segment) => (
                          <div 
                            key={segment.id} 
                            className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                              campaignData.target_segments.includes(segment.id)
                                ? 'border-primary bg-primary/5'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => {
                              const isSelected = campaignData.target_segments.includes(segment.id);
                              setCampaignData({
                                ...campaignData,
                                target_segments: isSelected
                                  ? campaignData.target_segments.filter(id => id !== segment.id)
                                  : [...campaignData.target_segments, segment.id]
                              });
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <Checkbox
                                  checked={campaignData.target_segments.includes(segment.id)}
                                  className="h-5 w-5 pointer-events-none"
                                />
                                <div>
                                  <h3 className="font-semibold font-inter">{segment.name}</h3>
                                  <p className="text-sm text-gray-600 font-inter">{segment.description}</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-3">
                                <Badge variant="secondary">Smart</Badge>
                                <span className="font-bold text-lg">{segment.customer_count}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {segments
                        .filter(segment => 
                          segment.name.toLowerCase().includes(segmentSearch.toLowerCase()) ||
                          segment.description.toLowerCase().includes(segmentSearch.toLowerCase())
                        )
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((segment) => (
                          <Card 
                            key={segment.id} 
                            className={`p-4 cursor-pointer border-2 ${
                              campaignData.target_segments.includes(segment.id)
                                ? 'border-primary bg-primary/5'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => {
                              const isSelected = campaignData.target_segments.includes(segment.id);
                              setCampaignData({
                                ...campaignData,
                                target_segments: isSelected
                                  ? campaignData.target_segments.filter(id => id !== segment.id)
                                  : [...campaignData.target_segments, segment.id]
                              });
                            }}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <Badge variant="secondary">Smart</Badge>
                              <span className="font-bold text-lg">{segment.customer_count}</span>
                            </div>
                            <h3 className="font-semibold mb-1 font-inter">{segment.name}</h3>
                            <p className="text-sm text-gray-600 font-inter">{segment.description}</p>
                          </Card>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* Customer Types Option */}
              {campaignData.recipient_type === 'types' && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 font-inter mb-4">
                    Select customer types to target specific segments of your audience.
                  </p>

                  {isLoadingCustomers ? (
                    <div className="flex justify-center p-8">
                      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                    </div>
                  ) : customerTypeCounts.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      No customer types found in your database.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {customerTypeCounts.map((typeData) => (
                        <Card
                          key={typeData.customer_type}
                          className={`p-4 cursor-pointer border-2 transition-all ${
                            campaignData.target_customer_types.includes(typeData.customer_type)
                              ? 'border-primary bg-primary/5'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => {
                            const isSelected = campaignData.target_customer_types.includes(typeData.customer_type);
                            setCampaignData({
                              ...campaignData,
                              target_customer_types: isSelected
                                ? campaignData.target_customer_types.filter(t => t !== typeData.customer_type)
                                : [...campaignData.target_customer_types, typeData.customer_type]
                            });
                          }}
                        >
                          <div className="flex justify-between items-center mb-2">
                            <Checkbox
                              checked={campaignData.target_customer_types.includes(typeData.customer_type)}
                              className="h-5 w-5 pointer-events-none"
                            />
                            <span className="font-bold text-2xl text-primary">{typeData.total_count}</span>
                          </div>
                          <h3 className="font-semibold text-lg font-inter capitalize">
                            {typeData.customer_type}
                          </h3>
                          <p className="text-sm text-gray-600 font-inter mt-1">
                            {typeData.total_count} {typeData.total_count === 1 ? 'customer' : 'customers'}
                          </p>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Individual Customers Option */}
              {campaignData.recipient_type === 'individuals' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search customers..."
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setCampaignData({
                        ...campaignData,
                        target_customers: customers.map(c => c.id)
                      })}
                      size="sm"
                    >
                      Select All
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setCampaignData({
                        ...campaignData,
                        target_customers: []
                      })}
                      size="sm"
                    >
                      Deselect All
                    </Button>
                  </div>

                  <div className="border border-gray-200 rounded-lg">
                    <ScrollArea className="h-64">
                      <div className="p-4 space-y-3">
                        {customers
                          .filter(customer => 
                            customer.name.toLowerCase().includes(customerSearch.toLowerCase())
                          )
                          .map((customer) => (
                            <div key={customer.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                              <div className="flex items-center space-x-3">
                                <Checkbox
                                  id={customer.id}
                                  checked={campaignData.target_customers.includes(customer.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setCampaignData({
                                        ...campaignData,
                                        target_customers: [...campaignData.target_customers, customer.id]
                                      });
                                    } else {
                                      setCampaignData({
                                        ...campaignData,
                                        target_customers: campaignData.target_customers.filter(id => id !== customer.id)
                                      });
                                    }
                                  }}
                                />
                                 <div>
                                   <p className="font-medium font-inter">{customer.name}</p>
                                   <p className="text-sm text-gray-500 font-inter capitalize">
                                     {customer.customer_type?.replace(/[_-]/g, ' ')}
                                   </p>
                                 </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </ScrollArea>
                  </div>

                  {campaignData.target_customers.length > 0 && (
                    <div className="text-sm text-gray-600 font-inter">
                      {campaignData.target_customers.length} customer(s) selected
                    </div>
                  )}
                </div>
              )}
              
              {/* Message Source Selection */}
              <div className="mt-6 pt-6 border-t">
                {!showingTemplates ? (
                  <TemplateOrCustomSelector
                    onSelectTemplate={() => {
                      setCampaignData(prev => ({ ...prev, message_source: 'template' }));
                      setShowingTemplates(true);
                    }}
                    onCreateCustom={() => {
                      setCampaignData(prev => ({ ...prev, message_source: 'custom' }));
                      setCurrentStep(3);
                    }}
                  />
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Button
                        variant="outline"
                        onClick={() => setShowingTemplates(false)}
                        size="sm"
                      >
                        ← Back to Options
                      </Button>
                      <h3 className="text-lg font-semibold font-inter">Select Template</h3>
                    </div>
                    
                    {/* Template Filters */}
                    <div className="flex gap-2 justify-end">
                      {/* View Toggle */}
                      <div className="flex border rounded-lg">
                        <Button
                          variant={templateViewMode === 'list' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setTemplateViewMode('list')}
                        >
                          <List className="w-4 h-4" />
                        </Button>
                        <Button
                          variant={templateViewMode === 'grid' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setTemplateViewMode('grid')}
                        >
                          <Grid3X3 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Templates Display */}
                    {templates.length === 0 ? (
                      <Card className="p-8 text-center">
                        <p className="text-muted-foreground">No templates available. Create one in the Templates Library.</p>
                      </Card>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Template List/Grid */}
                        <div className={templateViewMode === 'grid' ? 'grid grid-cols-1 gap-3' : 'space-y-3'}>
                          {templates.map((template) => (
                            <Card 
                              key={template.id} 
                              className={`cursor-pointer border-2 transition-colors ${
                                campaignData.template_id === template.id
                                  ? 'border-primary bg-primary/5'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                              onClick={() => {
                                setCampaignData({...campaignData, template_id: template.id});
                              }}
                            >
                              <div className="p-4">
                                {template.preview_image_url && (
                                  <div className="w-full h-24 bg-muted rounded-md mb-3 overflow-hidden">
                                    <img 
                                      src={template.preview_image_url} 
                                      alt={template.name}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                )}
                                
                                <div className="flex items-center justify-between mb-2">
                                  <h3 className="font-semibold font-inter">{template.name}</h3>
                                  <span className="px-2 py-1 bg-muted rounded text-xs">
                                    {template.category}
                                  </span>
                                </div>
                                
                                <p className="text-sm text-muted-foreground line-clamp-2 font-inter">
                                  {template.subject}
                                </p>
                              </div>
                            </Card>
                          ))}
                        </div>

                        {/* Template Preview Panel */}
                        <div className="lg:sticky lg:top-4 h-fit">
                          {campaignData.template_id ? (
                            <Card className="p-4">
                              <h4 className="font-semibold mb-3 font-inter">Preview</h4>
                              {(() => {
                                const selectedTemplate = templates.find(t => t.id === campaignData.template_id);
                                if (!selectedTemplate) return null;
                                
                                return (
                                  <div className="space-y-3">
                                    {selectedTemplate.preview_image_url && (
                                      <div className="aspect-video bg-muted rounded overflow-hidden">
                                        <img
                                          src={selectedTemplate.preview_image_url}
                                          alt={selectedTemplate.name}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                    )}
                                    
                                    <div>
                                      <Label className="text-xs text-muted-foreground">Subject</Label>
                                      <p className="font-medium">{selectedTemplate.subject}</p>
                                    </div>
                                    
                                    <div>
                                      <Label className="text-xs text-muted-foreground">Content</Label>
                                      <div className="text-sm bg-muted p-3 rounded max-h-64 overflow-y-auto">
                                        <pre className="whitespace-pre-wrap font-sans">
                                          {selectedTemplate.content}
                                        </pre>
                                      </div>
                                    </div>

                                    <Button 
                                      className="w-full mt-4"
                                      onClick={() => setCurrentStep(3)}
                                    >
                                      Continue with this template
                                    </Button>
                                  </div>
                                );
                              })()}
                            </Card>
                          ) : (
                            <Card className="p-8 text-center">
                              <p className="text-muted-foreground">Select a template to preview</p>
                            </Card>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      {/* Step 3: Message */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold mb-4">Message Content</h2>

          {campaignData.message_source === 'template' && (
            <div className="space-y-4">
              {campaignData.template_id ? (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Template Selected</h3>
                  <p className="text-gray-700">
                    {templates.find(t => t.id === campaignData.template_id)?.name || 'Selected template'}
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800">No template selected. Please go back and select a template.</p>
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    className="mt-2"
                  >
                    Back
                  </Button>
                </div>
              )}
            </div>
          )}

          {campaignData.message_source === 'custom' && (
              <MessageComposer
                ref={messageComposerRef}
                campaignType={campaignData.campaign_type}
                onSave={(messageData) => {
                  setCampaignData(prev => ({ 
                    ...prev, 
                    custom_message: messageData,
                    message_source: 'custom'
                  }));
                  toast({ title: 'Custom message saved!' });
                }}
                onBack={() => {
                  setCurrentStep(2);
                  setShowingTemplates(false);
                }}
                onContentChange={setHasMessageContent}
                onSubjectChange={setHasSubjectContent}
                initialData={(() => {
                  console.log('🔍 Passing to MessageComposer - campaignData:', campaignData);
                  console.log('🔍 Passing to MessageComposer - custom_message:', campaignData.custom_message);
                  return campaignData.custom_message;
                })()}
              />
            )}

            {/* Campaign Name Field - Moved from Step 4 */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
              <Label htmlFor="campaign-name">Campaign Name *</Label>
              <Input
                id="campaign-name"
                value={campaignData.name}
                onChange={(e) => setCampaignData({...campaignData, name: e.target.value})}
                placeholder="Enter campaign name"
                className="mt-1"
              />
            </div>
          </div>
        )}

        {/* Step 4: Schedule & Review */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold mb-4">Schedule & Review</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Scheduling</Label>
                <Tabs value={sendMode} onValueChange={(v) => setSendMode(v as 'now' | 'schedule')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="now">Send Now</TabsTrigger>
                    <TabsTrigger value="schedule">Schedule</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="schedule" className="mt-4 space-y-4">
                    {/* Date Selection */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Select Date</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {scheduledDate ? format(scheduledDate, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={scheduledDate}
                            onSelect={setScheduledDate}
                            initialFocus
                            disabled={(date) => date < new Date()}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Time Selection */}
                    {scheduledDate && (
                      <div className="space-y-3">
                        <label className="text-sm font-medium block">Select Time</label>
                        
                        {/* Time Preset Buttons */}
                        <TimePresetButtons 
                          onTimeSelect={setScheduledTime}
                          selectedTime={scheduledTime}
                        />
                        
                        {/* Custom Time Picker */}
                        <div>
                          <label className="text-xs text-muted-foreground mb-2 block">Or choose custom time:</label>
                          <TimePicker
                            value={scheduledTime}
                            onChange={setScheduledTime}
                          />
                        </div>

                        {/* Preview */}
                        {getScheduledDateTime() && (
                          <div className="bg-muted/50 p-3 rounded-lg">
                            <p className="text-sm text-muted-foreground">
                              Campaign will be sent on:
                            </p>
                            <p className="font-medium">
                              {format(getScheduledDateTime()!, "EEEE, MMMM do, yyyy 'at' h:mm a")}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>

              <div>
                <h3 className="font-medium mb-4">Campaign Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Campaign Name:</span>
                    <span className="font-medium">{campaignData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <Badge variant="secondary">{campaignData.campaign_type}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Recipients:</span>
                    <span className="font-medium">{totalRecipients}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Segments:</span>
                    <span className="font-medium">{campaignData.target_segments.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Customer Types:</span>
                    <span className="font-medium">{campaignData.target_customer_types.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>{/* End scrollable content */}

      {/* Fixed Footer - Navigation Buttons */}
      <div className="sticky bottom-0 bg-white border-t shadow-lg p-3 md:p-4 mt-auto">
        <div className="flex flex-col-reverse md:flex-row md:justify-between gap-3">{/* Changed for mobile stacking */}
        <Button 
          variant="outline" 
          onClick={handleBack}
          disabled={currentStep === 1}
        >
          Back
        </Button>
        
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">{/* Stack actions on mobile */}
          {/* Save as Draft button - Show on steps 3 and 4 only */}
          {(currentStep === 3 || currentStep === 4) && (
            <Button
              variant="outline"
              onClick={async () => {
                 try {
                  let draftData = {
                    ...campaignData,
                    currentStep,
                  };
                  
                  // Save message content first if we're on step 3
                  if (currentStep === 3 && messageComposerRef.current) {
                    // Get current message data directly from MessageComposer
                    const messageComposer = messageComposerRef.current as any;
                    if (messageComposer && messageComposer.getCurrentMessageData) {
                      const currentMessageData = messageComposer.getCurrentMessageData();
                      draftData.custom_message = currentMessageData;
                      console.log('🔍 Captured current message data for draft:', currentMessageData);
                    } else {
                      // Fallback: trigger save and wait for state update
                      messageComposerRef.current.saveMessage();
                      await new Promise(resolve => setTimeout(resolve, 100));
                      draftData = {
                        ...campaignData,
                        currentStep,
                      };
                    }
                  }
                  
                  const draftName = draftData.name.trim() || `Campaign Draft - ${new Date().toLocaleDateString()}`;
                  
                  console.log('🔍 Saving draft with data:', draftData);
                  console.log('🔍 Custom message in draft:', draftData.custom_message);
                  
                  await saveDraft(draftName, draftData, currentDraftId);
                  toast({
                    title: "Draft saved",
                    description: "Your campaign progress has been saved.",
                  });
                  
                  // Close the dialog after saving
                  onClose?.();
                } catch (error) {
                  console.error('Save draft error:', error);
                  toast({
                    title: "Save failed",
                    description: "Could not save draft. Please try again.",
                    variant: "destructive"
                  });
                }
              }}
              disabled={
                isSaving ||
                !campaignData.name.trim() ||
                (campaignData.message_source === 'custom' && campaignData.campaign_type !== 'sms' && !hasSubjectContent) ||
                (campaignData.message_source === 'custom' && !hasMessageContent)
              }
              className="text-blue-600 border-blue-600 hover:bg-blue-50"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save as Draft'}
            </Button>
          )}
          
          {currentStep < 4 && currentStep !== 2 ? (
            <Button 
              onClick={handleNext}
              disabled={
                (currentStep === 1 && !campaignData.campaign_type) ||
                (currentStep === 3 && (
                  !campaignData.name.trim() ||
                  (campaignData.message_source === 'template' && !campaignData.template_id) ||
                  (campaignData.message_source === 'custom' && !hasMessageContent) ||
                  (campaignData.message_source === 'custom' && campaignData.campaign_type !== 'sms' && !hasSubjectContent)
                ))
              }
              data-next-button
            >
              Next
            </Button>
          ) : currentStep === 4 ? (
            <Button 
              onClick={handleSubmit}
              disabled={
                createCampaignMutation.isPending || 
                !campaignData.name.trim() ||
                (sendMode === 'schedule' && !getScheduledDateTime())
              }
              className="bg-primary text-white"
            >
              {sendMode === 'schedule' ? (
                <>
                  <Clock className="w-4 h-4 mr-2" />
                  Schedule Campaign
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Now
                </>
              )}
            </Button>
          ) : null}
        </div>
      </div>{/* End fixed footer */}
      </div>{/* End main flex container */}

      {/* Template Preview Modal */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-inter">{previewTemplate?.name}</DialogTitle>
          </DialogHeader>
          {previewTemplate && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Badge variant="secondary">{previewTemplate.type}</Badge>
                <Badge variant="outline">{previewTemplate.category}</Badge>
                <Badge 
                  variant={previewTemplate.source === 'system' ? 'default' : 'info'}
                  className="text-xs"
                >
                  {previewTemplate.source === 'system' ? 'system' : 'user'}
                </Badge>
              </div>
              {previewTemplate.subject && (
                <div>
                  <h4 className="font-medium mb-2 font-inter">Subject:</h4>
                  <p className="text-gray-700 font-inter">{previewTemplate.subject}</p>
                </div>
              )}
              <div>
                <h4 className="font-medium mb-2 font-inter">Content:</h4>
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="whitespace-pre-wrap font-inter">{previewTemplate.content}</p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setPreviewTemplate(null)}>
                  Close
                </Button>
                <Button 
                  onClick={() => {
                    setCampaignData({...campaignData, template_id: previewTemplate.id});
                    setPreviewTemplate(null);
                  }}
                >
                  Select This Template
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>

    </>
  );
};