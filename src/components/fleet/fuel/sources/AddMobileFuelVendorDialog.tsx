import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';
import { useAddMobileFuelVendor } from '@/hooks/useMobileFuelVendors';
import { useForm } from 'react-hook-form';
import { ChevronDown, Upload, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AddMobileFuelVendorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface VendorFormData {
  vendor_name: string;
  contact_person: string;
  phone: string;
  email: string;
  after_hours_contact_person: string;
  after_hours_phone: string;
  preferred_contact_method: 'phone' | 'email' | 'portal' | 'text';
  fuel_type: 'diesel' | 'gasoline' | 'off_road_diesel';
  service_area: string;
  delivery_hours: string;
  min_delivery_quantity_gal: number;
  pricing_model: 'fixed' | 'market_index' | 'cost_plus' | 'tiered';
  payment_terms: 'net_15' | 'net_30' | 'cod' | 'prepaid';
  contract_number: string;
  // Tier 2
  insurance_expiration_date: string;
  dot_hazmat_permit: string;
  safety_status: 'verified' | 'pending' | 'flagged';
  last_audit_date: string;
  // Tier 3
  service_radius_mi: number;
  average_response_time_hrs: number;
  fuel_surcharge_policy: boolean;
  fuel_surcharge_notes: string;
  notes: string;
}

export const AddMobileFuelVendorDialog: React.FC<AddMobileFuelVendorDialogProps> = ({ 
  open, 
  onOpenChange 
}) => {
  const [complianceOpen, setComplianceOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [fuelCertifications, setFuelCertifications] = useState<string[]>([]);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [documentUrls, setDocumentUrls] = useState({
    contract: '',
    w9: '',
    insurance: ''
  });

  const { register, handleSubmit, reset, setValue, watch } = useForm<VendorFormData>({
    defaultValues: {
      fuel_type: 'diesel',
      preferred_contact_method: 'phone',
      pricing_model: 'fixed',
      payment_terms: 'net_30',
      safety_status: 'pending',
      fuel_surcharge_policy: false,
    },
  });
  
  const addVendor = useAddMobileFuelVendor();
  const fuelType = watch('fuel_type');
  const preferredContactMethod = watch('preferred_contact_method');
  const pricingModel = watch('pricing_model');
  const paymentTerms = watch('payment_terms');
  const safetyStatus = watch('safety_status');
  const fuelSurchargePolicy = watch('fuel_surcharge_policy');

  const handleFileUpload = async (file: File, docType: 'contract' | 'w9' | 'insurance') => {
    setUploadingDoc(docType);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${docType}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data, error } = await supabase.storage
        .from('mobile-vendor-docs')
        .upload(filePath, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('mobile-vendor-docs')
        .getPublicUrl(filePath);

      setDocumentUrls(prev => ({ ...prev, [docType]: publicUrl }));
      toast.success(`${docType.toUpperCase()} document uploaded`);
    } catch (error: any) {
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setUploadingDoc(null);
    }
  };

  const toggleCertification = (cert: string) => {
    setFuelCertifications(prev => 
      prev.includes(cert) 
        ? prev.filter(c => c !== cert)
        : [...prev, cert]
    );
  };

  const onSubmit = async (data: VendorFormData) => {
    await addVendor.mutateAsync({
      ...data,
      fuel_certifications: fuelCertifications,
      contract_document_url: documentUrls.contract || undefined,
      w9_document_url: documentUrls.w9 || undefined,
      insurance_document_url: documentUrls.insurance || undefined,
      is_active: true,
    });
    reset();
    setFuelCertifications([]);
    setDocumentUrls({ contract: '', w9: '', insurance: '' });
    setComplianceOpen(false);
    setAnalyticsOpen(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Mobile Fuel Vendor</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="vendor_name">Vendor Name *</Label>
            <Input
              id="vendor_name"
              {...register('vendor_name', { required: true })}
              placeholder="e.g., Quick Fill Mobile Fueling"
            />
          </div>

          {/* Primary Contact */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact_person">Contact Person</Label>
              <Input
                id="contact_person"
                {...register('contact_person')}
                placeholder="Contact name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                {...register('phone')}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="vendor@example.com"
            />
          </div>

          {/* After-Hours Contact */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="after_hours_contact_person">After-Hours Contact</Label>
              <Input
                id="after_hours_contact_person"
                {...register('after_hours_contact_person')}
                placeholder="Night/weekend contact"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="after_hours_phone">After-Hours Phone</Label>
              <Input
                id="after_hours_phone"
                type="tel"
                {...register('after_hours_phone')}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          {/* Preferred Contact Method */}
          <div className="space-y-2">
            <Label htmlFor="preferred_contact_method">Preferred Contact Method</Label>
            <Select
              value={preferredContactMethod}
              onValueChange={(value) => setValue('preferred_contact_method', value as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="phone">Phone</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="portal">Portal</SelectItem>
                <SelectItem value="text">Text</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Service Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fuel_type">Fuel Type *</Label>
              <Select
                value={fuelType}
                onValueChange={(value) => setValue('fuel_type', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="diesel">Diesel</SelectItem>
                  <SelectItem value="gasoline">Gasoline</SelectItem>
                  <SelectItem value="off_road_diesel">Off-Road Diesel</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="service_area">Service Area</Label>
              <Input
                id="service_area"
                {...register('service_area')}
                placeholder="e.g., 50 mile radius"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="delivery_hours">Delivery Hours</Label>
              <Input
                id="delivery_hours"
                {...register('delivery_hours')}
                placeholder="e.g., Weekdays 6 PM - 5 AM"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="min_delivery_quantity_gal">Min. Delivery (gallons)</Label>
              <Input
                id="min_delivery_quantity_gal"
                type="number"
                {...register('min_delivery_quantity_gal', { valueAsNumber: true })}
                placeholder="e.g., 100"
              />
            </div>
          </div>

          {/* Pricing & Payment */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pricing_model">Pricing Model</Label>
              <Select
                value={pricingModel}
                onValueChange={(value) => setValue('pricing_model', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed Price</SelectItem>
                  <SelectItem value="market_index">Market Index</SelectItem>
                  <SelectItem value="cost_plus">Cost + Markup</SelectItem>
                  <SelectItem value="tiered">Tiered Pricing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_terms">Payment Terms</Label>
              <Select
                value={paymentTerms}
                onValueChange={(value) => setValue('payment_terms', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="net_15">Net 15</SelectItem>
                  <SelectItem value="net_30">Net 30</SelectItem>
                  <SelectItem value="cod">COD</SelectItem>
                  <SelectItem value="prepaid">Prepaid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contract_number">Contract Number</Label>
            <Input
              id="contract_number"
              {...register('contract_number')}
              placeholder="Contract #"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Additional vendor notes..."
              rows={3}
            />
          </div>

          {/* Tier 2: Compliance & Billing Details - Collapsible */}
          <Collapsible open={complianceOpen} onOpenChange={setComplianceOpen} className="border rounded-lg p-4 space-y-4">
            <CollapsibleTrigger className="flex items-center justify-between w-full">
              <span className="font-semibold text-sm">Compliance & Billing Details</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${complianceOpen ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            
            <CollapsibleContent className="space-y-4 pt-4">
              {/* Insurance & Permits */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="insurance_expiration_date">Insurance Expiration</Label>
                  <Input
                    id="insurance_expiration_date"
                    type="date"
                    {...register('insurance_expiration_date')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dot_hazmat_permit">DOT/Hazmat Permit #</Label>
                  <Input
                    id="dot_hazmat_permit"
                    {...register('dot_hazmat_permit')}
                    placeholder="Permit number"
                  />
                </div>
              </div>

              {/* Safety Status & Last Audit */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="safety_status">Safety Status</Label>
                  <Select
                    value={safetyStatus}
                    onValueChange={(value) => setValue('safety_status', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="flagged">Flagged</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_audit_date">Last Audit Date</Label>
                  <Input
                    id="last_audit_date"
                    type="date"
                    {...register('last_audit_date')}
                  />
                </div>
              </div>

              {/* Fuel Certifications */}
              <div className="space-y-2">
                <Label>Fuel Certifications</Label>
                <div className="grid grid-cols-2 gap-3">
                  {['ULSD Compliant', 'Winterized Blend', 'Biodiesel B5', 'Biodiesel B20', 'Dyed Off-Road'].map(cert => (
                    <div key={cert} className="flex items-center space-x-2">
                      <Checkbox
                        id={cert}
                        checked={fuelCertifications.includes(cert)}
                        onCheckedChange={() => toggleCertification(cert)}
                      />
                      <label htmlFor={cert} className="text-sm cursor-pointer">{cert}</label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Document Uploads */}
              <div className="space-y-3">
                <Label>Document Uploads</Label>
                
                <div className="grid gap-3">
                  {/* Contract */}
                  <div className="flex items-center gap-2">
                    <label htmlFor="contract-upload" className="flex-1">
                      <div className="border-2 border-dashed rounded-lg p-3 hover:border-primary cursor-pointer transition-colors">
                        <div className="flex items-center gap-2">
                          {uploadingDoc === 'contract' ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                          ) : documentUrls.contract ? (
                            <FileText className="h-4 w-4 text-green-600" />
                          ) : (
                            <Upload className="h-4 w-4" />
                          )}
                          <span className="text-sm">
                            {documentUrls.contract ? 'Contract Uploaded ✓' : 'Upload Contract'}
                          </span>
                        </div>
                      </div>
                    </label>
                    <input
                      id="contract-upload"
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'contract')}
                    />
                  </div>

                  {/* W-9 */}
                  <div className="flex items-center gap-2">
                    <label htmlFor="w9-upload" className="flex-1">
                      <div className="border-2 border-dashed rounded-lg p-3 hover:border-primary cursor-pointer transition-colors">
                        <div className="flex items-center gap-2">
                          {uploadingDoc === 'w9' ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                          ) : documentUrls.w9 ? (
                            <FileText className="h-4 w-4 text-green-600" />
                          ) : (
                            <Upload className="h-4 w-4" />
                          )}
                          <span className="text-sm">
                            {documentUrls.w9 ? 'W-9 Uploaded ✓' : 'Upload W-9'}
                          </span>
                        </div>
                      </div>
                    </label>
                    <input
                      id="w9-upload"
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'w9')}
                    />
                  </div>

                  {/* Insurance Certificate */}
                  <div className="flex items-center gap-2">
                    <label htmlFor="insurance-upload" className="flex-1">
                      <div className="border-2 border-dashed rounded-lg p-3 hover:border-primary cursor-pointer transition-colors">
                        <div className="flex items-center gap-2">
                          {uploadingDoc === 'insurance' ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                          ) : documentUrls.insurance ? (
                            <FileText className="h-4 w-4 text-green-600" />
                          ) : (
                            <Upload className="h-4 w-4" />
                          )}
                          <span className="text-sm">
                            {documentUrls.insurance ? 'Insurance Certificate Uploaded ✓' : 'Upload Insurance Certificate'}
                          </span>
                        </div>
                      </div>
                    </label>
                    <input
                      id="insurance-upload"
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'insurance')}
                    />
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Tier 3: Advanced Analytics - Collapsible */}
          <Collapsible open={analyticsOpen} onOpenChange={setAnalyticsOpen} className="border rounded-lg p-4 space-y-4">
            <CollapsibleTrigger className="flex items-center justify-between w-full">
              <span className="font-semibold text-sm">Advanced Analytics & Performance</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${analyticsOpen ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            
            <CollapsibleContent className="space-y-4 pt-4">
              {/* Service Radius & Response Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="service_radius_mi">Service Radius (miles)</Label>
                  <Input
                    id="service_radius_mi"
                    type="number"
                    {...register('service_radius_mi', { valueAsNumber: true })}
                    placeholder="e.g., 50"
                  />
                  <p className="text-xs text-muted-foreground">For map-based filtering</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="average_response_time_hrs">Avg. Response Time (hours)</Label>
                  <Input
                    id="average_response_time_hrs"
                    type="number"
                    step="0.5"
                    {...register('average_response_time_hrs', { valueAsNumber: true })}
                    placeholder="e.g., 2.5"
                  />
                  <p className="text-xs text-muted-foreground">Manual entry, auto-calculated later</p>
                </div>
              </div>

              {/* Fuel Surcharge Policy */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="fuel_surcharge_policy"
                    checked={fuelSurchargePolicy}
                    onCheckedChange={(checked) => setValue('fuel_surcharge_policy', checked as boolean)}
                  />
                  <Label htmlFor="fuel_surcharge_policy" className="cursor-pointer font-normal">
                    Vendor has fuel surcharge policy
                  </Label>
                </div>

                {fuelSurchargePolicy && (
                  <div className="space-y-2 pl-6">
                    <Label htmlFor="fuel_surcharge_notes">Surcharge Policy Details</Label>
                    <Textarea
                      id="fuel_surcharge_notes"
                      {...register('fuel_surcharge_notes')}
                      placeholder="e.g., $0.15/gal when crude oil exceeds $90/barrel"
                      rows={2}
                    />
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addVendor.isPending}>
              {addVendor.isPending ? 'Adding...' : 'Add Vendor'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
