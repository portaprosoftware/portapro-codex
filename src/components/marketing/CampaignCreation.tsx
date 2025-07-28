import React, { useState } from 'react';
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
import { CalendarIcon, Users, Mail, MessageSquare, Send, Clock, Search, List, Grid3X3, Eye } from 'lucide-react';
import { TemplateOrCustomSelector } from './TemplateOrCustomSelector';
import { MessageComposer } from './MessageComposer';
import { format } from 'date-fns';
import { toast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
  };
  message_source: 'template' | 'custom';
  target_segments: string[];
  target_customer_types: string[];
  target_customers: string[];
  recipient_type: 'all' | 'segments' | 'types' | 'individuals';
  scheduled_at?: Date;
}

export const CampaignCreation: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [campaignData, setCampaignData] = useState<CampaignData>({
    name: '',
    campaign_type: 'email',
    message_source: 'template',
    target_segments: [],
    target_customer_types: [],
    target_customers: [],
    recipient_type: 'all',
  });
  const [scheduledDate, setScheduledDate] = useState<Date>();
  const [customerSearch, setCustomerSearch] = useState('');
  const [templateSourceFilter, setTemplateSourceFilter] = useState<'system' | 'user'>('system');
  const [templateViewMode, setTemplateViewMode] = useState<'list' | 'grid'>('list');
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);
  const [step3Mode, setStep3Mode] = useState<'selector' | 'template' | 'custom'>('selector');
  const queryClient = useQueryClient();

  // Fetch templates
  const { data: templates = [] } = useQuery({
    queryKey: ['communication-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('communication_templates')
        .select('*')
        .eq('is_active', true);
      if (error) throw error;
      return data;
    }
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

  // Fetch customer type counts
  const { data: customerTypes = [] } = useQuery({
    queryKey: ['customer-type-counts'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_customer_type_counts');
      if (error) {
        console.error('Error fetching customer type counts:', error);
        return [];
      }
      return data || [];
    }
  });

  // Fetch all customers for individual selection
  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, customer_type')
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  // Create campaign mutation
  const createCampaignMutation = useMutation({
    mutationFn: async (data: CampaignData) => {
      const { error } = await supabase
        .from('marketing_campaigns')
        .insert({
          ...data,
          scheduled_at: scheduledDate?.toISOString(),
          status: scheduledDate ? 'scheduled' : 'draft'
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] });
      toast({ title: 'Campaign created successfully!' });
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
      setStep3Mode('selector');
    },
    onError: () => {
      toast({ title: 'Error creating campaign', variant: 'destructive' });
    }
  });

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = () => {
    createCampaignMutation.mutate(campaignData);
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
        const typeData = customerTypes.find(t => t.customer_type === type);
        return total + (typeData?.total_count || 0);
      }, 0);
    }
    return 0;
  })();

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
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

      <Card className="p-6">
        {/* Step 1: Campaign Details */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Campaign Details</h2>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="campaign-name">Campaign Name</Label>
                  <Input
                    id="campaign-name"
                    value={campaignData.name}
                    onChange={(e) => setCampaignData({...campaignData, name: e.target.value})}
                    placeholder="Enter campaign name"
                  />
                </div>

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

        {/* Step 2: Select Recipients */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold mb-4 font-inter">Recipients</h2>
            
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
                    <SelectItem value="segments">Smart Segments</SelectItem>
                    <SelectItem value="types">Select Customer Types</SelectItem>
                    <SelectItem value="individuals">Select Individual Customers</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* All Customers Option */}
              {campaignData.recipient_type === 'all' && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-gray-600 font-inter">
                    This campaign will be sent to all customers in your database.
                  </p>
                </div>
              )}

              {/* Smart Segments Option */}
              {campaignData.recipient_type === 'segments' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {segments.map((segment) => (
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
                </div>
              )}

              {/* Customer Types Option */}
              {campaignData.recipient_type === 'types' && (
                <div className="space-y-4">
                  <Label className="text-base font-medium font-inter">Select Customer Types:</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {customerTypes.map((type) => {
                      const getTypeGradient = (type: string) => {
                        const typeGradients = {
                          'events_festivals': 'bg-gradient-to-r from-purple-500 to-purple-600',
                          'sports_recreation': 'bg-gradient-to-r from-green-500 to-green-600', 
                          'municipal_government': 'bg-gradient-to-r from-blue-500 to-blue-600',
                          'commercial': 'bg-gradient-to-r from-gray-600 to-gray-700',
                          'construction': 'bg-gradient-to-r from-orange-500 to-orange-600',
                          'emergency_disaster_relief': 'bg-gradient-to-r from-red-500 to-red-600',
                          'private_events_weddings': 'bg-gradient-to-r from-pink-500 to-pink-600'
                        };
                        return typeGradients[type as keyof typeof typeGradients] || 'bg-gradient-to-r from-gray-500 to-gray-600';
                      };

                      return (
                        <div key={type.customer_type} className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                          <Checkbox
                            id={type.customer_type}
                            checked={campaignData.target_customer_types.includes(type.customer_type)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setCampaignData({
                                  ...campaignData,
                                  target_customer_types: [...campaignData.target_customer_types, type.customer_type]
                                });
                              } else {
                                setCampaignData({
                                  ...campaignData,
                                  target_customer_types: campaignData.target_customer_types.filter(t => t !== type.customer_type)
                                });
                              }
                            }}
                            className="h-5 w-5"
                          />
                          <label 
                            htmlFor={type.customer_type} 
                            className="cursor-pointer flex-1"
                          >
                            <Badge className={`${getTypeGradient(type.customer_type)} text-white border-0 font-bold px-3 py-1 rounded-full`}>
                              {type.customer_type.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </Badge>
                          </label>
                          <span className="text-sm text-gray-500 font-inter">
                            ({type.total_count} customers)
                          </span>
                        </div>
                      );
                    })}
                  </div>
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
            </div>
          </div>
        )}

        {/* Step 3: Template or Custom Message */}
        {currentStep === 3 && (
          <div className="space-y-6">
            {step3Mode === 'selector' && (
              <TemplateOrCustomSelector
                onSelectTemplate={() => {
                  setStep3Mode('template');
                  setCampaignData(prev => ({ ...prev, message_source: 'template' }));
                }}
                onCreateCustom={() => {
                  setStep3Mode('custom');
                  setCampaignData(prev => ({ ...prev, message_source: 'custom' }));
                }}
              />
            )}

            {step3Mode === 'template' && (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setStep3Mode('selector')}
                  >
                    ← Back to Options
                  </Button>
                  <h2 className="text-xl font-semibold font-inter">Select Template</h2>
                </div>
                
                {/* Template Filters */}
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                  {/* Source Toggle */}
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <Button
                      variant={templateSourceFilter === 'system' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setTemplateSourceFilter('system')}
                      className="rounded-md"
                    >
                      System Generated
                    </Button>
                    <Button
                      variant={templateSourceFilter === 'user' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setTemplateSourceFilter('user')}
                      className="rounded-md"
                    >
                      User Created
                    </Button>
                  </div>

                  {/* View Toggle */}
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <Button
                      variant={templateViewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setTemplateViewMode('list')}
                      className="rounded-md"
                    >
                      <List className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={templateViewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setTemplateViewMode('grid')}
                      className="rounded-md"
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Templates Display */}
                <div className={templateViewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
                  {templates
                    .filter(template => template.source === templateSourceFilter)
                    .filter(template => template.type === campaignData.campaign_type || template.type === 'both' || campaignData.campaign_type === 'both')
                    .map((template) => (
                      <Card 
                        key={template.id} 
                        className={`cursor-pointer border-2 transition-colors ${
                          campaignData.template_id === template.id
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setCampaignData({...campaignData, template_id: template.id})}
                      >
                        {templateViewMode === 'grid' ? (
                          <div className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <Badge 
                                variant={template.source === 'system' ? 'default' : 'secondary'}
                                className={template.source === 'system' ? 'bg-blue-500 text-white' : 'bg-blue-500 text-white'}
                              >
                                {template.source === 'system' ? 'System' : 'User'}
                              </Badge>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewTemplate(template);
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </div>
                            
                            <h3 className="font-semibold mb-2 font-inter">{template.name}</h3>
                            <div className="flex items-center gap-2 mb-2">
                              {template.type === 'email' && <Mail className="w-4 h-4 text-blue-500" />}
                              {template.type === 'sms' && <MessageSquare className="w-4 h-4 text-green-500" />}
                              {template.type === 'both' && (
                                <>
                                  <Mail className="w-4 h-4 text-blue-500" />
                                  <MessageSquare className="w-4 h-4 text-green-500" />
                                </>
                              )}
                              <span className="text-sm text-gray-600 capitalize font-inter">
                                {template.type}
                              </span>
                            </div>
                            
                            {template.image_url && (
                              <div className="w-full h-24 bg-gray-100 rounded-md mb-3 flex items-center justify-center">
                                <img 
                                  src={template.image_url} 
                                  alt={template.name}
                                  className="w-full h-full object-cover rounded-md"
                                />
                              </div>
                            )}
                            
                            <p className="text-sm text-gray-600 line-clamp-3 font-inter">
                              {template.subject || template.content?.substring(0, 100) + '...'}
                            </p>
                          </div>
                        ) : (
                          <div className="p-4 flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-semibold font-inter">{template.name}</h3>
                                <Badge 
                                  variant={template.source === 'system' ? 'default' : 'secondary'}
                                  className={template.source === 'system' ? 'bg-blue-500 text-white' : 'bg-blue-500 text-white'}
                                >
                                  {template.source === 'system' ? 'System' : 'User'}
                                </Badge>
                                <div className="flex items-center gap-1">
                                  {template.type === 'email' && <Mail className="w-4 h-4 text-blue-500" />}
                                  {template.type === 'sms' && <MessageSquare className="w-4 h-4 text-green-500" />}
                                  {template.type === 'both' && (
                                    <>
                                      <Mail className="w-4 h-4 text-blue-500" />
                                      <MessageSquare className="w-4 h-4 text-green-500" />
                                    </>
                                  )}
                                </div>
                              </div>
                              <p className="text-sm text-gray-600 font-inter">
                                {template.subject || template.content?.substring(0, 150) + '...'}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewTemplate(template);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </Card>
                    ))}
                </div>

                {/* No Templates Message */}
                {templates.filter(template => template.source === templateSourceFilter).length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500 font-inter">
                      No {templateSourceFilter} templates found for {campaignData.campaign_type} campaigns.
                    </p>
                  </div>
                )}

                {/* Template Preview Modal */}
                <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Eye className="w-5 h-5" />
                        Template Preview
                      </DialogTitle>
                    </DialogHeader>
                    
                    {previewTemplate && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold font-inter">{previewTemplate.name}</h3>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={previewTemplate.source === 'system' ? 'default' : 'secondary'}
                              className={previewTemplate.source === 'system' ? 'bg-blue-500 text-white' : 'bg-blue-500 text-white'}
                            >
                              {previewTemplate.source === 'system' ? 'System' : 'User'}
                            </Badge>
                            <Badge variant="outline" className="capitalize">
                              {previewTemplate.type}
                            </Badge>
                          </div>
                        </div>

                        {previewTemplate.image_url && (
                          <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                            <img 
                              src={previewTemplate.image_url} 
                              alt={previewTemplate.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        {previewTemplate.subject && (
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Subject</Label>
                            <p className="mt-1 p-3 bg-gray-50 rounded-md font-inter">{previewTemplate.subject}</p>
                          </div>
                        )}

                        <div>
                          <Label className="text-sm font-medium text-gray-700">Content</Label>
                          <div className="mt-1 p-4 bg-gray-50 rounded-md">
                            <p className="whitespace-pre-wrap font-inter">{previewTemplate.content}</p>
                          </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                          <Button 
                            onClick={() => {
                              setCampaignData({...campaignData, template_id: previewTemplate.id});
                              setPreviewTemplate(null);
                              toast({ title: 'Template selected!' });
                            }}
                            className="flex-1"
                          >
                            Use This Template
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => setPreviewTemplate(null)}
                          >
                            Close
                          </Button>
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            )}

            {step3Mode === 'custom' && (
              <MessageComposer
                campaignType={campaignData.campaign_type}
                onSave={(messageData) => {
                  setCampaignData(prev => ({ 
                    ...prev, 
                    custom_message: messageData 
                  }));
                  toast({ title: 'Custom message saved!' });
                }}
                onBack={() => setStep3Mode('selector')}
                initialData={campaignData.custom_message}
              />
            )}
          </div>
        )}

        {/* Step 4: Schedule & Review */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold mb-4">Schedule & Review</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Scheduling</Label>
                <Tabs defaultValue="now">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="now">Send Now</TabsTrigger>
                    <TabsTrigger value="schedule">Schedule</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="schedule" className="mt-4">
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
                        />
                      </PopoverContent>
                    </Popover>
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

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <Button 
            variant="outline" 
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            Back
          </Button>
          
          {currentStep < 4 ? (
            <Button 
              onClick={handleNext}
              disabled={
                (currentStep === 1 && !campaignData.name) ||
                (currentStep === 2 && (
                  (campaignData.recipient_type === 'segments' && campaignData.target_segments.length === 0) ||
                  (campaignData.recipient_type === 'types' && campaignData.target_customer_types.length === 0) ||
                  (campaignData.recipient_type === 'individuals' && campaignData.target_customers.length === 0)
                )) ||
                (currentStep === 3 && (
                  (campaignData.message_source === 'template' && !campaignData.template_id) ||
                  (campaignData.message_source === 'custom' && !campaignData.custom_message?.content) ||
                  step3Mode === 'selector'
                ))
              }
            >
              Next
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit}
              disabled={createCampaignMutation.isPending}
              className="bg-primary text-white"
            >
              {scheduledDate ? (
                <>
                  <Clock className="w-4 h-4 mr-2" />
                  Schedule Campaign
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Campaign
                </>
              )}
            </Button>
          )}
        </div>
      </Card>

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
  );
};