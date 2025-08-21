import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getStatusBadgeVariant } from '@/lib/statusBadgeUtils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Plus,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  User,
  FileText,
  Upload,
  CheckCircle,
  AlertCircle,
  Loader2,
  Phone,
  Key,
  Truck,
  Package,
  Wrench,
  RotateCcw
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface RequestsTabProps {
  customerId: string;
}

interface ServiceRequest {
  id: string;
  title: string;
  description: string;
  status: string;
  preferred_time?: string;
  location?: string;
  contact_person: string;
  contact_phone: string;
  priority?: string;
  created_at: string;
  updated_at: string;
  assigned_to?: string;
  completed_at?: string;
}

const REQUEST_TYPES = [
  { value: 'delivery', label: 'New Delivery', icon: Truck, description: 'Request new unit delivery' },
  { value: 'pickup', label: 'Pickup', icon: Package, description: 'Schedule unit pickup' },
  { value: 'relocation', label: 'Relocation', icon: RotateCcw, description: 'Move units to new location' },
  { value: 'service', label: 'Extra Service', icon: Wrench, description: 'Additional cleaning or maintenance' },
  { value: 'maintenance', label: 'Maintenance', icon: Wrench, description: 'Repair or maintenance request' }
];

const TIME_SLOTS = [
  { value: '08:00-10:00', label: '8:00 AM - 10:00 AM' },
  { value: '10:00-12:00', label: '10:00 AM - 12:00 PM' },
  { value: '12:00-14:00', label: '12:00 PM - 2:00 PM' },
  { value: '14:00-16:00', label: '2:00 PM - 4:00 PM' },
  { value: '16:00-18:00', label: '4:00 PM - 6:00 PM' },
  { value: 'flexible', label: 'Flexible (Anytime)' }
];

export const RequestsTab: React.FC<RequestsTabProps> = ({ customerId }) => {
  const [showNewRequestDialog, setShowNewRequestDialog] = useState(false);
  const [selectedRequestType, setSelectedRequestType] = useState('');
  const [formData, setFormData] = useState({
    preferred_date: undefined as Date | undefined,
    preferred_time: '',
    location_id: '',
    contact_person: '',
    contact_phone: '',
    special_instructions: '',
    gate_code: '',
    access_notes: '',
    urgency: 'normal',
    quantity: 1
  });

  const queryClient = useQueryClient();

  // Fetch existing requests
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['service-requests', customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_requests')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!customerId,
  });

  // Fetch customer locations
  const { data: locations = [] } = useQuery({
    queryKey: ['customer-locations', customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_service_locations')
        .select('id, location_name, street, city, state')
        .eq('customer_id', customerId)
        .eq('is_active', true);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!customerId,
  });

  // Submit new request mutation
  const submitRequestMutation = useMutation({
    mutationFn: async (requestData: any) => {
      const { data, error } = await supabase
        .from('service_requests')
        .insert([{
          customer_id: customerId,
          title: `${selectedRequestType} Request`,
          description: requestData.special_instructions || `${selectedRequestType} request`,
          status: 'submitted',
          preferred_time: requestData.preferred_time,
          contact_person: requestData.contact_person,
          contact_phone: requestData.contact_phone,
          priority: requestData.urgency,
          location: requestData.location_id || null
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-requests', customerId] });
      setShowNewRequestDialog(false);
      resetForm();
      toast.success('Service request submitted successfully!');
    },
    onError: (error) => {
      toast.error('Failed to submit request. Please try again.');
      console.error('Request submission error:', error);
    }
  });

  const resetForm = () => {
    setFormData({
      preferred_date: undefined,
      preferred_time: '',
      location_id: '',
      contact_person: '',
      contact_phone: '',
      special_instructions: '',
      gate_code: '',
      access_notes: '',
      urgency: 'normal',
      quantity: 1
    });
    setSelectedRequestType('');
  };

  const handleSubmitRequest = () => {
    if (!selectedRequestType) {
      toast.error('Please select a request type');
      return;
    }

    if (!formData.preferred_date) {
      toast.error('Please select a preferred date');
      return;
    }

    if (!formData.contact_person || !formData.contact_phone) {
      toast.error('Please provide contact information');
      return;
    }

    submitRequestMutation.mutate(formData);
  };


  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted': return Clock;
      case 'approved': return CheckCircle;
      case 'scheduled': return CalendarIcon;
      case 'in_progress': return Loader2;
      case 'completed': return CheckCircle;
      case 'cancelled': return AlertCircle;
      default: return Clock;
    }
  };

  const getRequestTypeIcon = (type: string) => {
    const requestType = REQUEST_TYPES.find(rt => rt.value === type);
    return requestType?.icon || FileText;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse border rounded-lg p-6">
            <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
            <div className="h-3 bg-muted rounded w-1/2 mb-4"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Service Requests</h3>
          <p className="text-sm text-muted-foreground">
            Submit and track your service requests
          </p>
        </div>
        
        <Dialog open={showNewRequestDialog} onOpenChange={setShowNewRequestDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Request
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Submit New Service Request</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Request Type Selection */}
              <div className="space-y-3">
                <Label>Service Type</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {REQUEST_TYPES.map((type) => {
                    const Icon = type.icon;
                    return (
                      <Card
                        key={type.value}
                        className={cn(
                          "cursor-pointer transition-all hover:shadow-md",
                          selectedRequestType === type.value && "ring-2 ring-primary"
                        )}
                        onClick={() => setSelectedRequestType(type.value)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Icon className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h4 className="font-medium">{type.label}</h4>
                              <p className="text-sm text-muted-foreground">{type.description}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {selectedRequestType && (
                <>
                  {/* Date and Time */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Preferred Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !formData.preferred_date && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.preferred_date ? format(formData.preferred_date, "PPP") : "Select date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={formData.preferred_date}
                            onSelect={(date) => setFormData({...formData, preferred_date: date})}
                            disabled={(date) => date < new Date()}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label>Preferred Time</Label>
                      <Select value={formData.preferred_time} onValueChange={(value) => setFormData({...formData, preferred_time: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select time window" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_SLOTS.map((slot) => (
                            <SelectItem key={slot.value} value={slot.value}>
                              {slot.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="space-y-2">
                    <Label>Service Location</Label>
                    <Select value={formData.location_id} onValueChange={(value) => setFormData({...formData, location_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select service location" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map((location) => (
                          <SelectItem key={location.id} value={location.id}>
                            {location.location_name} - {location.street}, {location.city}, {location.state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Contact Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>On-site Contact Person</Label>
                      <Input
                        placeholder="Contact name"
                        value={formData.contact_person}
                        onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Contact Phone</Label>
                      <Input
                        placeholder="Phone number"
                        value={formData.contact_phone}
                        onChange={(e) => setFormData({...formData, contact_phone: e.target.value})}
                      />
                    </div>
                  </div>

                  {/* Access Information */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Special Instructions</Label>
                      <Textarea
                        placeholder="Any special requirements or instructions..."
                        value={formData.special_instructions}
                        onChange={(e) => setFormData({...formData, special_instructions: e.target.value})}
                        rows={3}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Access Notes (Gate codes, directions, etc.)</Label>
                      <Textarea
                        placeholder="Gate codes, directions, key locations..."
                        value={formData.access_notes}
                        onChange={(e) => setFormData({...formData, access_notes: e.target.value})}
                        rows={2}
                      />
                    </div>
                  </div>

                  {/* Additional Options */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Urgency</Label>
                      <Select value={formData.urgency} onValueChange={(value) => setFormData({...formData, urgency: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low Priority</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="high">High Priority</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {(selectedRequestType === 'delivery' || selectedRequestType === 'pickup') && (
                      <div className="space-y-2">
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          min="1"
                          value={formData.quantity}
                          onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 1})}
                        />
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="flex gap-3 pt-4 border-t">
                    <Button 
                      onClick={handleSubmitRequest}
                      disabled={submitRequestMutation.isPending}
                      className="flex-1"
                    >
                      {submitRequestMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Submit Request
                    </Button>
                    <Button variant="outline" onClick={() => setShowNewRequestDialog(false)}>
                      Cancel
                    </Button>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {requests.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No service requests yet</h3>
              <p className="text-muted-foreground mb-4">
                Submit your first service request to get started
              </p>
              <Button onClick={() => setShowNewRequestDialog(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Request
              </Button>
            </CardContent>
          </Card>
        ) : (
          requests.map((request) => {
            const StatusIcon = getStatusIcon(request.status);
            const TypeIcon = getRequestTypeIcon(request.title);
            const requestType = REQUEST_TYPES.find(rt => request.title.toLowerCase().includes(rt.value.toLowerCase()));
            
            return (
              <Card key={request.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <TypeIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{request.title}</h4>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" />
                            {format(new Date(request.created_at), 'MMM dd, yyyy')}
                          </span>
                          {request.preferred_time && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {request.preferred_time}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Badge variant={getStatusBadgeVariant(request.status as any)}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {request.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>Contact: {request.contact_person}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{request.contact_phone}</span>
                    </div>
                  </div>

                  {request.description && (
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Description
                      </Label>
                      <p className="text-sm mt-1">{request.description}</p>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-3 border-t text-xs text-muted-foreground">
                    <span>Submitted: {format(new Date(request.created_at), 'MMM dd, yyyy h:mm a')}</span>
                    {request.completed_at && (
                      <span>Completed: {format(new Date(request.completed_at), 'MMM dd, yyyy')}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};