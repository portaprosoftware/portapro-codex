
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
import { CalendarIcon, Users, Mail, MessageSquare, Send, Clock, Search } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/components/ui/use-toast';

interface CampaignData {
  name: string;
  campaign_type: 'email' | 'sms' | 'both';
  template_id?: string;
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
    target_segments: [],
    target_customer_types: [],
    target_customers: [],
    recipient_type: 'all',
  });
  const [scheduledDate, setScheduledDate] = useState<Date>();
  const [customerSearch, setCustomerSearch] = useState('');
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
      const { data } = await supabase.rpc('get_customer_type_counts');
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
        target_segments: [],
        target_customer_types: [],
        target_customers: [],
        recipient_type: 'all',
      });
      setCurrentStep(1);
      setScheduledDate(undefined);
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
                    {customerTypes.map((type) => (
                      <div key={type.customer_type} className="flex items-center space-x-3">
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
                          className="text-sm font-medium font-inter capitalize cursor-pointer"
                        >
                          {type.customer_type.replace(/[_-]/g, ' ')}
                        </label>
                      </div>
                    ))}
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

        {/* Step 3: Select Template */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold mb-4">Select Template</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates
                .filter(t => campaignData.campaign_type === 'both' || t.type === campaignData.campaign_type)
                .map((template) => (
                <Card 
                  key={template.id} 
                  className={`p-4 cursor-pointer border-2 ${
                    campaignData.template_id === template.id
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setCampaignData({...campaignData, template_id: template.id})}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {template.type === 'email' ? (
                      <Mail className="w-4 h-4 text-blue-500" />
                    ) : (
                      <MessageSquare className="w-4 h-4 text-green-500" />
                    )}
                    <Badge variant="secondary">{template.category}</Badge>
                  </div>
                  <h3 className="font-semibold mb-1">{template.name}</h3>
                  {template.subject && (
                    <p className="text-sm text-gray-600 mb-2">Subject: {template.subject}</p>
                  )}
                  <p className="text-sm text-gray-500 line-clamp-2">
                    {template.content.substring(0, 100)}...
                  </p>
                </Card>
              ))}
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
                (currentStep === 3 && !campaignData.template_id)
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
    </div>
  );
};
