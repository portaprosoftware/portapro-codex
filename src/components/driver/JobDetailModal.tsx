import React, { useState, useEffect } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { formatDateSafe } from '@/lib/dateUtils';
import { 
  MapPin, 
  Clock, 
  Phone, 
  Navigation, 
  Camera, 
  FileSignature,
  CheckCircle,
  MessageSquare,
  FileText,
  RotateCcw,
  User,
  Star,
  Mail,
  Building,
  Key,
  Shield,
  Info,
  AlertTriangle,
  Package,
  Truck,
  Wrench
} from 'lucide-react';
import { PhotoCapture } from './PhotoCapture';
import { SignatureCapture } from './SignatureCapture';
import { ServiceReportForm } from './ServiceReportForm';
import { useToast } from '@/hooks/use-toast';
import { getDualJobStatusInfo } from '@/lib/jobStatusUtils';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { ReadOnlyPinsMap } from '../jobs/steps/ReadOnlyPinsMap';

interface Job {
  id: string;
  job_number: string;
  job_type: string;
  status: string;
  scheduled_date: string;
  scheduled_time?: string;
  notes?: string;
  special_instructions?: string;
  customer_id: string;
  contact_id?: string;
  driver_id?: string;
  vehicle_id?: string;
  assigned_template_ids?: any;
  default_template_id?: string;
  is_priority?: boolean;
  locks_requested?: boolean;
  locks_count?: number;
  lock_notes?: string;
  zip_tied_on_dropoff?: boolean;
  reference_pin_ids?: string[];
  customers: {
    id?: string;
    name?: string;
    customer_type?: string;
    email?: string;
    phone?: string;
    service_street?: string;
    service_street2?: string;
    service_city?: string;
    service_state?: string;
    service_zip?: string;
    customer_service_locations?: Array<{
      id: string;
      location_name: string;
      street?: string;
      street2?: string;
      city?: string;
      state?: string;
      zip?: string;
      contact_person?: string;
      contact_phone?: string;
      access_instructions?: string;
      notes?: string;
      is_default: boolean;
    }>;
    customer_contacts?: Array<{
      id: string;
      first_name: string;
      last_name: string;
      phone?: string;
      email?: string;
      title?: string;
      contact_type: string;
      is_primary: boolean;
    }>;
  } | null;
  customer_contacts?: {
    first_name: string;
    last_name: string;
    phone?: string;
    email?: string;
    title?: string;
  } | null;
  driver?: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
  vehicle?: {
    id: string;
    license_plate: string;
    vehicle_type: string;
  } | null;
}

interface JobDetailModalProps {
  job: Job | null;
  open: boolean;
  onClose: () => void;
  onStatusUpdate: () => void;
}

const formatServiceAddress = (customer: Job['customers']) => {
  if (!customer) return 'Service Location';
  
  const parts = [];
  if (customer.service_street) parts.push(customer.service_street);
  if (customer.service_street2) parts.push(customer.service_street2);
  if (customer.service_city) parts.push(customer.service_city);
  if (customer.service_state) parts.push(customer.service_state);
  if (customer.service_zip) parts.push(customer.service_zip);
  
  return parts.length > 0 ? parts.join(', ') : 'Service Location';
};


export const JobDetailModal: React.FC<JobDetailModalProps> = ({
  job,
  open,
  onClose,
  onStatusUpdate
}) => {
  const { toast } = useToast();
  const [notes, setNotes] = useState('');
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);
  const [showSignature, setShowSignature] = useState(false);
  const [showServiceReport, setShowServiceReport] = useState(false);
  const [showNavigationPopup, setShowNavigationPopup] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [assignedTemplates, setAssignedTemplates] = useState<any[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // Fetch job items to show what needs to be delivered/serviced/picked up
  const { data: jobItems } = useQuery({
    queryKey: ['job-items', job?.id],
    queryFn: async () => {
      if (!job?.id) return [];
      
      const { data, error } = await supabase
        .from('job_items')
        .select(`
          *,
          products(name, category),
          routine_maintenance_services(name, description)
        `)
        .eq('job_id', job.id);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!job?.id && open
  });

  useEffect(() => {
    if (open && job) {
      loadAssignedTemplates();
    }
  }, [open, job]);

  const loadAssignedTemplates = async () => {
    if (!job) return;
    
    setLoadingTemplates(true);
    try {
      // Get templates assigned to this job
      const templateIds = [
        ...(job.assigned_template_ids || []),
        ...(job.default_template_id ? [job.default_template_id] : [])
      ].filter(Boolean);

      if (templateIds.length === 0) {
        // Check for default templates from job services
        const { data: jobItems } = await supabase
          .from('job_items')
          .select(`
            *,
            routine_maintenance_services!inner(
              *,
              template:maintenance_report_templates!default_template_id(*)
            )
          `)
          .eq('job_id', job.id)
          .eq('line_item_type', 'service');

        const serviceTemplates = jobItems
          ?.map(item => (item as any)?.routine_maintenance_services?.template)
          .filter(Boolean) || [];

        setAssignedTemplates(serviceTemplates);
      } else {
        // Load specific assigned templates
        const { data: templates } = await supabase
          .from('maintenance_report_templates')
          .select('*')
          .in('id', templateIds);

        setAssignedTemplates(templates || []);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      setAssignedTemplates([]);
    } finally {
      setLoadingTemplates(false);
    }
  };

  if (!job) return null;

  const customerName = job.customers?.name || 'Unknown Customer';
  const contactName = job.customer_contacts 
    ? `${job.customer_contacts.first_name} ${job.customer_contacts.last_name}${job.customer_contacts.title ? ` (${job.customer_contacts.title})` : ''}`
    : null;
  const contactPhone = job.customer_contacts?.phone || job.customers?.phone;
  const contactEmail = job.customer_contacts?.email || job.customers?.email;
  const statusInfo = getDualJobStatusInfo(job);
  const hasServiceTemplates = assignedTemplates.length > 0;
  const canReverseJob = job.status === 'in-progress' || job.status === 'completed';

  const handleStatusUpdate = async (newStatus: string) => {
    if (newStatus === 'in-progress' && hasServiceTemplates) {
      // If job has service templates, show service report form instead of just updating status
      setShowServiceReport(true);
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ 
          status: newStatus,
          ...(newStatus === 'completed' ? { actual_completion_time: new Date().toISOString() } : {})
        })
        .eq('id', job.id);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Job status changed to ${newStatus}`,
      });
      onStatusUpdate();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update job status",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReverseJob = async () => {
    const newStatus = job.status === 'completed' ? 'in-progress' : 'assigned';
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ status: newStatus })
        .eq('id', job.id);

      if (error) throw error;

      toast({
        title: "Status Reversed",
        description: `Job status changed to ${newStatus}`,
      });
      onStatusUpdate();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reverse job status",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleServiceReportComplete = () => {
    setShowServiceReport(false);
    onStatusUpdate(); // Refresh job data
  };

  const handleAddNotes = async () => {
    if (!notes.trim()) return;
    
    try {
      // TODO: Implement notes API call
      toast({
        title: "Notes Added",
        description: "Job notes have been saved",
      });
      setNotes('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save notes",
        variant: "destructive",
      });
    }
  };

  const handleCall = () => {
    const phoneNumber = contactPhone || job.customers?.phone || '';
    if (phoneNumber) {
      // For mobile devices, directly open the phone app
      if (window.confirm(`Call ${phoneNumber}?`)) {
        window.location.href = `tel:${phoneNumber}`;
      }
    } else {
      toast({
        title: "No Phone Number",
        description: "No contact phone number available",
        variant: "destructive",
      });
    }
  };

  const handleNavigate = () => {
    setShowNavigationPopup(true);
  };

  const handleNavigateToApp = (app: 'google' | 'apple' | 'waze') => {
    const serviceAddress = formatServiceAddress(job.customers);
    const encodedAddress = encodeURIComponent(serviceAddress);
    
    let url = '';
    
    switch (app) {
      case 'google':
        url = `https://maps.google.com/?daddr=${encodedAddress}`;
        break;
      case 'apple':
        url = `https://maps.apple.com/?daddr=${encodedAddress}`;
        break;
      case 'waze':
        url = `https://www.waze.com/ul?q=${encodedAddress}&navigate=yes`;
        break;
    }
    
    // Try to open in app first, then fallback to web
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowNavigationPopup(false);
  };

  const handleSendMessage = () => {
    const phoneNumber = contactPhone || job.customers?.phone || '';
    if (phoneNumber) {
      // For mobile devices, directly open the messages app
      window.location.href = `sms:${phoneNumber}`;
    } else {
      toast({
        title: "No Phone Number", 
        description: "No contact phone number available",
        variant: "destructive",
      });
    }
  };

  return (
    <Drawer open={open} onOpenChange={onClose}>
      <DrawerContent className="h-[100vh] fixed inset-x-0 bottom-0 z-50 mt-0 flex flex-col rounded-t-[10px] border bg-background">
        <div className="mx-auto w-full max-w-md flex flex-col h-full">
          <DrawerHeader className="flex-shrink-0 pb-4">
            <DrawerTitle className="flex items-center justify-between text-lg font-semibold">
              <span>{job.job_number}</span>
              <div className="flex flex-col gap-1">
                <Badge className={`${statusInfo.primary.gradient} text-white border-0 font-medium px-3 py-1 rounded-full`}>
                  {statusInfo.primary.label}
                </Badge>
                {statusInfo.secondary && (
                  <Badge className={`${statusInfo.secondary.gradient} text-white border-0 font-medium px-3 py-1 rounded-full text-xs`}>
                    {statusInfo.secondary.label}
                  </Badge>
                )}
              </div>
            </DrawerTitle>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <div className="space-y-4">
              
              {/* Priority Status Badge */}
              {job.is_priority && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">Priority Job</span>
                  </div>
                </div>
              )}

              {/* Job Items - Critical Information */}
              {jobItems && jobItems.length > 0 && (
                <Card className="border-2 border-primary/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      {job.job_type === 'delivery' && <Package className="w-4 h-4 text-blue-600" />}
                      {(job.job_type === 'pickup' || job.job_type === 'partial-pickup') && <Truck className="w-4 h-4 text-green-600" />}
                      {job.job_type === 'service' && <Wrench className="w-4 h-4 text-purple-600" />}
                      <span className="text-primary">
                        {job.job_type === 'delivery' && 'Items to Deliver'}
                        {(job.job_type === 'pickup' || job.job_type === 'partial-pickup') && 'Items to Pick Up'}
                        {job.job_type === 'service' && 'Services to Provide'}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {jobItems.map((item: any, index: number) => (
                        <div key={index} className="border rounded-lg p-3 bg-gray-50">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">
                                {item.line_item_type === 'product' 
                                  ? (item.products?.name || item.product_name || 'Unknown Product')
                                  : (item.routine_maintenance_services?.name || item.service_name || 'Unknown Service')
                                }
                              </h4>
                              {item.line_item_type === 'product' && item.products?.category && (
                                <p className="text-xs text-muted-foreground mt-1">{item.products.category}</p>
                              )}
                              {item.line_item_type === 'service' && item.routine_maintenance_services?.description && (
                                <p className="text-xs text-muted-foreground mt-1">{item.routine_maintenance_services.description}</p>
                              )}
                              {item.notes && (
                                <p className="text-xs text-blue-600 mt-1 font-medium">Note: {item.notes}</p>
                              )}
                            </div>
                            <div className="text-right ml-3">
                              <div className="text-lg font-bold text-primary">
                                {item.quantity || 1}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {item.line_item_type === 'product' ? 'Units' : 'Service'}
                              </div>
                            </div>
                          </div>
                          {item.pricing_strategy && (
                            <div className="mt-2 pt-2 border-t border-gray-200">
                              <p className="text-xs text-muted-foreground">
                                Strategy: {item.pricing_strategy.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Contact Information */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Phone className="w-4 h-4" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Primary Contact from customer_contacts */}
                  {contactName && (
                    <div className="space-y-2">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Primary Contact</label>
                        <p className="text-sm font-medium">{contactName}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {contactPhone && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Phone</label>
                            <p className="text-sm">{contactPhone}</p>
                          </div>
                        )}
                        {contactEmail && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Email</label>
                            <p className="text-sm">{contactEmail}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Additional Contacts */}
                  {job.customers?.customer_contacts && job.customers.customer_contacts.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Additional Contacts</label>
                      {job.customers.customer_contacts.map((contact, index) => (
                        <div key={contact.id} className="border rounded-lg p-2 space-y-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">{contact.first_name} {contact.last_name}</p>
                            {contact.is_primary && (
                              <Badge variant="secondary" className="text-xs">Primary</Badge>
                            )}
                          </div>
                          {contact.title && (
                            <p className="text-xs text-muted-foreground">{contact.title}</p>
                          )}
                          <div className="flex gap-4">
                            {contact.phone && (
                              <p className="text-xs text-muted-foreground">{contact.phone}</p>
                            )}
                            {contact.email && (
                              <p className="text-xs text-muted-foreground">{contact.email}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Contact Actions */}
                  <div className="space-y-2 pt-2 border-t">
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={handleCall}
                        className="flex-1"
                        disabled={!contactPhone}
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        Call {contactName ? 'Contact' : 'Customer'}
                      </Button>
                      
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={handleSendMessage}
                        className="flex-1"
                        disabled={!contactPhone}
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Message
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Update Status */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CheckCircle className="w-4 h-4" />
                    Update Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-3">
                    {job.status === 'assigned' && (
                      <>
                        {hasServiceTemplates ? (
                          <Button 
                            onClick={() => setShowServiceReport(true)}
                            disabled={isUpdating || loadingTemplates}
                            className="w-full"
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            {loadingTemplates ? 'Loading...' : 'Start Service Report'}
                          </Button>
                        ) : (
                          <Button 
                            onClick={() => handleStatusUpdate('in-progress')}
                            disabled={isUpdating}
                            className="w-full"
                          >
                            Start Job
                          </Button>
                        )}
                      </>
                    )}
                    
                    {job.status === 'in-progress' && (
                      <>
                        {hasServiceTemplates ? (
                          <Button 
                            onClick={() => setShowServiceReport(true)}
                            disabled={loadingTemplates}
                            className="w-full bg-blue-600 hover:bg-blue-700"
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            {loadingTemplates ? 'Loading...' : 'Complete Service Report'}
                          </Button>
                        ) : (
                          <Button 
                            onClick={() => handleStatusUpdate('completed')}
                            disabled={isUpdating}
                            className="w-full"
                            variant="default"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Mark Complete
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                  
                  {/* Reverse Status Button */}
                  {canReverseJob && (
                    <Button 
                      onClick={handleReverseJob}
                      disabled={isUpdating}
                      variant="outline"
                      className="w-full"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Reverse Status
                    </Button>
                  )}
                  
                  {hasServiceTemplates && (
                    <p className="text-xs text-muted-foreground">
                      {assignedTemplates.length} service template(s) assigned
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Schedule Information */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Clock className="w-4 h-4" />
                    Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Date</label>
                      <p className="text-sm">{formatDateSafe(job.scheduled_date, 'long')}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Time</label>
                      <p className="text-sm">{job.scheduled_time || 'Any time'}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Job Type</label>
                    <p className="text-sm capitalize">{job.job_type}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Service Address</label>
                    <p className="text-sm">{formatServiceAddress(job.customers)}</p>
                  </div>
                  <div className="mt-3">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={handleNavigate}
                    >
                      <Navigation className="w-4 h-4 mr-2" />
                      Navigate to Location
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Special Instructions */}
              {job.special_instructions && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Info className="w-4 h-4" />
                      Special Instructions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm bg-amber-50 p-3 rounded border border-amber-200">{job.special_instructions}</p>
                  </CardContent>
                </Card>
              )}

              {/* Reference Pins */}
              {job.reference_pin_ids && job.reference_pin_ids.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <MapPin className="w-4 h-4 text-primary" />
                      Reference Pins ({job.reference_pin_ids.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ReadOnlyPinsMap 
                      customerId={job.customer_id}
                      selectedPinIds={job.reference_pin_ids}
                      readOnly={true}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Lock Options */}
              {(job.locks_requested || job.zip_tied_on_dropoff) && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Key className="w-4 h-4" />
                      Lock Options
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Locks Requested:</span>
                      <span className="text-sm">{job.locks_requested ? 'Yes' : 'No'}</span>
                    </div>
                    {job.locks_requested && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Number of Locks:</span>
                        <span className="text-sm">{job.locks_count || 1}</span>
                      </div>
                    )}
                    {job.lock_notes && (
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Lock Details:</span>
                        <p className="text-sm mt-1 bg-gray-50 p-2 rounded">{job.lock_notes}</p>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Zip-Tied on Drop-off:</span>
                      <span className="text-sm">{job.zip_tied_on_dropoff ? 'Yes' : 'No'}</span>
                    </div>
                  </CardContent>
                </Card>
              )}


              {/* Documentation Actions */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Camera className="w-4 h-4" />
                    Documentation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline"
                      onClick={() => setShowPhotoCapture(true)}
                      className="w-full"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Add Photo
                    </Button>
                    
                    <Button 
                      variant="outline"
                      onClick={() => setShowSignature(true)}
                      className="w-full"
                    >
                      <FileSignature className="w-4 h-4 mr-2" />
                      Signature
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Notes Section */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="w-4 h-4" />
                    Add Notes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea
                    placeholder="Add job notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                  <Button 
                    onClick={handleAddNotes}
                    disabled={!notes.trim()}
                    variant="outline"
                    className="w-full"
                  >
                    Save Notes
                  </Button>
                </CardContent>
              </Card>

              {/* Existing Notes */}
              {job.notes && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FileText className="w-4 h-4" />
                      Existing Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm bg-gray-50 p-3 rounded">{job.notes}</p>
                  </CardContent>
                </Card>
              )}

              {/* Close Button */}
              <div className="pt-4 border-t">
                <Button 
                  onClick={onClose}
                  variant="outline"
                  className="w-full"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Photo Capture Modal */}
        <PhotoCapture 
          open={showPhotoCapture}
          onClose={() => setShowPhotoCapture(false)}
          jobId={job.id}
        />

        {/* Signature Capture Modal */}
        <SignatureCapture 
          open={showSignature}
          onClose={() => setShowSignature(false)}
          jobId={job.id}
        />

        {/* Service Report Form Modal */}
        <ServiceReportForm
          open={showServiceReport}
          onClose={() => setShowServiceReport(false)}
          onComplete={handleServiceReportComplete}
          job={job}
          templates={assignedTemplates}
        />

        {/* Navigation Options Dialog */}
        <Dialog open={showNavigationPopup} onOpenChange={setShowNavigationPopup}>
          <DialogContent className="max-w-sm mx-auto">
            <DialogHeader>
              <DialogTitle className="text-center">Choose Navigation App</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-4">
              <Button 
                variant="outline" 
                className="w-full h-12 text-left justify-start"
                onClick={() => handleNavigateToApp('google')}
              >
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                  <Navigation className="w-4 h-4 text-white" />
                </div>
                Google Maps
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full h-12 text-left justify-start"
                onClick={() => handleNavigateToApp('apple')}
              >
                <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center mr-3">
                  <Navigation className="w-4 h-4 text-white" />
                </div>
                Apple Maps
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full h-12 text-left justify-start"
                onClick={() => handleNavigateToApp('waze')}
              >
                <div className="w-8 h-8 bg-blue-400 rounded-lg flex items-center justify-center mr-3">
                  <Navigation className="w-4 h-4 text-white" />
                </div>
                Waze
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </DrawerContent>
    </Drawer>
  );
};