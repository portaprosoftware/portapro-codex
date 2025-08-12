import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StateScroller } from '@/components/ui/state-scroller';
import { CertificateUploadButton } from '@/components/training/CertificateUploadButton';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Edit, Calendar, AlertTriangle, HelpCircle, Truck, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const credentialsSchema = z.object({
  license_category: z.enum(['NON_CDL', 'CDL']).optional(),
  cdl_class: z.enum(['A', 'B', 'C']).optional(),
  license_number: z.string().optional(),
  license_state: z.string().optional(),
  license_expiry_date: z.string().optional(),
  license_endorsements: z.array(z.string()).optional(),
  license_restrictions: z.array(z.string()).optional(),
  operating_scope: z.enum(['INTERSTATE', 'INTRASTATE']).optional(),
  medical_card_expiry_date: z.string().optional(),
  medical_card_reference: z.string().optional(),
  notes: z.string().optional(),
  custom_restriction: z.string().optional(),
}).refine((data) => {
  // If CDL is selected, cdl_class is required
  if (data.license_category === 'CDL' && !data.cdl_class) {
    return false;
  }
  return true;
}, {
  message: "CDL class is required when license category is CDL",
  path: ["cdl_class"],
});

type CredentialsFormData = z.infer<typeof credentialsSchema>;

interface DriverCredentialsSectionProps {
  driverId: string;
}

const CDL_CLASSES = [
  {
    value: 'A',
    label: 'Class A — Combination vehicles',
    description: 'GCWR ≥ 26,001 lbs and tows > 10,000 lbs'
  },
  {
    value: 'B',
    label: 'Class B — Single vehicle',
    description: 'GVWR ≥ 26,001 lbs; may tow ≤ 10,000 lbs'
  },
  {
    value: 'C',
    label: 'Class C — Not A/B, but CDL needed',
    description: 'Passengers or hazmat'
  }
];

const ENDORSEMENTS = [
  { value: 'N', label: 'N — Tanker', common: true },
  { value: 'X', label: 'X — Tanker + Hazmat' },
  { value: 'H', label: 'H — Hazmat' },
  { value: 'P', label: 'P — Passenger' },
  { value: 'S', label: 'S — School Bus' },
  { value: 'T', label: 'T — Double/Triple Trailers' },
];

const RESTRICTIONS = [
  { value: 'L', label: 'L — No Air Brakes' },
  { value: 'E', label: 'E — Automatic Transmission Only' },
  { value: 'K', label: 'K — Intrastate Only' },
  { value: 'OTHER', label: 'Other (enter note)' },
];

export function DriverCredentialsSection({ driverId }: DriverCredentialsSectionProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: credentialsData, isLoading } = useQuery({
    queryKey: ['driver-credentials', driverId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('driver_credentials')
        .select('*')
        .eq('driver_id', driverId)
        .maybeSingle();

      if (error) throw error;
      return data;
    }
  });

  const form = useForm<CredentialsFormData>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: {
      license_category: undefined,
      cdl_class: undefined,
      license_number: '',
      license_state: '',
      license_expiry_date: '',
      license_endorsements: [],
      license_restrictions: [],
      operating_scope: 'INTERSTATE',
      medical_card_expiry_date: '',
      medical_card_reference: '',
      notes: '',
      custom_restriction: '',
    }
  });

  const updateCredentials = useMutation({
    mutationFn: async (data: CredentialsFormData) => {
      console.log('Updating credentials with data:', data);
      console.log('Driver ID:', driverId);
      
      // Handle custom restriction
      let finalRestrictions = data.license_restrictions || [];
      if (finalRestrictions.includes('OTHER') && data.custom_restriction) {
        finalRestrictions = finalRestrictions.filter(r => r !== 'OTHER');
        finalRestrictions.push(data.custom_restriction);
      }
      
      const credentialsData = {
        driver_id: driverId,
        license_category: data.license_category || null,
        cdl_class: data.cdl_class || null,
        license_number: data.license_number || null,
        license_state: data.license_state || null,
        license_expiry_date: data.license_expiry_date || null,
        license_endorsements: data.license_endorsements || [],
        license_restrictions: finalRestrictions,
        operating_scope: data.operating_scope || 'INTERSTATE',
        medical_card_expiry_date: data.medical_card_expiry_date || null,
        medical_card_reference: data.medical_card_reference || null,
        notes: data.notes || null,
      };

      console.log('Final credentials data:', credentialsData);

      const { error } = await supabase
        .from('driver_credentials')
        .upsert(credentialsData);

      if (error) {
        console.error('Database error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-credentials', driverId] });
      toast.success('Driver credentials updated successfully');
      setIsEditModalOpen(false);
    },
    onError: (error) => {
      toast.error('Failed to update credentials');
      console.error('Error updating credentials:', error);
    }
  });

  React.useEffect(() => {
    if (credentialsData) {
      // Check if any restrictions are custom (not in the predefined list)
      const predefinedRestrictions = ['L', 'E', 'K'];
      const customRestrictions = (credentialsData.license_restrictions || [])
        .filter(restriction => !predefinedRestrictions.includes(restriction));
      const standardRestrictions = (credentialsData.license_restrictions || [])
        .filter(restriction => predefinedRestrictions.includes(restriction));

      form.reset({
        license_category: (credentialsData.license_category as 'NON_CDL' | 'CDL') || undefined,
        cdl_class: (credentialsData.cdl_class as 'A' | 'B' | 'C') || undefined,
        license_number: credentialsData.license_number || '',
        license_state: credentialsData.license_state || '',
        license_expiry_date: credentialsData.license_expiry_date || '',
        license_endorsements: credentialsData.license_endorsements || [],
        license_restrictions: customRestrictions.length > 0 
          ? [...standardRestrictions, 'OTHER'] 
          : standardRestrictions,
        operating_scope: (credentialsData.operating_scope as 'INTERSTATE' | 'INTRASTATE') || 'INTERSTATE',
        medical_card_expiry_date: credentialsData.medical_card_expiry_date || '',
        medical_card_reference: credentialsData.medical_card_reference || '',
        notes: credentialsData.notes || '',
        custom_restriction: customRestrictions.join(', ') || '',
      });
    }
  }, [credentialsData, form]);

  const onSubmit = (data: CredentialsFormData) => {
    updateCredentials.mutate(data);
  };

  const watchLicenseCategory = form.watch('license_category');
  const watchRestrictions = form.watch('license_restrictions');

  // Helper function to get expiry status
  const getExpiryStatus = (expiryDate: string | null) => {
    if (!expiryDate) return null;
    
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      return { variant: 'destructive' as const, label: 'Expired' };
    } else if (daysUntilExpiry <= 30) {
      return { variant: 'destructive' as const, label: `Expires in ${daysUntilExpiry} days` };
    } else if (daysUntilExpiry <= 90) {
      return { variant: 'secondary' as const, label: `Expires in ${daysUntilExpiry} days` };
    }
    return null;
  };

  const licenseExpiryStatus = getExpiryStatus(credentialsData?.license_expiry_date);
  const medicalCardExpiryStatus = getExpiryStatus(credentialsData?.medical_card_expiry_date);

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Truck className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle>Driver Credentials</CardTitle>
                  <CardDescription>Commercial and regular driver license information for portable sanitation operations</CardDescription>
                </div>
              </div>
              <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Edit Driver Credentials</DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                      
                      {/* Step 1: License Category */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">1</div>
                          <h3 className="text-lg font-semibold">License Category</h3>
                          <Tooltip>
                            <TooltipTrigger>
                              <HelpCircle className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">Choose Non-CDL for regular licenses. Choose CDL if the driver operates commercial vehicles that require a CDL.</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        
                        <FormField
                          control={form.control}
                          name="license_category"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <RadioGroup
                                  onValueChange={field.onChange}
                                  value={field.value}
                                  className="flex flex-col space-y-2"
                                >
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="NON_CDL" id="non-cdl" />
                                    <label htmlFor="non-cdl" className="font-medium">Non-CDL (Regular Driver License)</label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="CDL" id="cdl" />
                                    <label htmlFor="cdl" className="font-medium">CDL (Commercial Driver License)</label>
                                  </div>
                                </RadioGroup>
                              </FormControl>
                              <FormDescription>
                                Most vacuum/pump trucks ≥26,001 lbs or towing heavy trailers require a CDL.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Separator />

                      {/* Step 2: CDL Class (conditional) */}
                      {watchLicenseCategory === 'CDL' && (
                        <>
                          <div className="space-y-4">
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">2</div>
                              <h3 className="text-lg font-semibold">CDL Class (US)</h3>
                              <Tooltip>
                                <TooltipTrigger>
                                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs">Portable sanitation fleets often use Class B. If towing heavy restroom trailers over 10k, you may need Class A.</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            
                            <FormField
                              control={form.control}
                              name="cdl_class"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <RadioGroup
                                      onValueChange={field.onChange}
                                      value={field.value}
                                      className="space-y-3"
                                    >
                                      {CDL_CLASSES.map((cdlClass) => (
                                        <div key={cdlClass.value} className="flex items-start space-x-2">
                                          <RadioGroupItem value={cdlClass.value} id={`cdl-${cdlClass.value}`} />
                                          <div className="space-y-1">
                                            <label htmlFor={`cdl-${cdlClass.value}`} className="font-medium">
                                              {cdlClass.label}
                                            </label>
                                            <p className="text-sm text-muted-foreground">{cdlClass.description}</p>
                                          </div>
                                        </div>
                                      ))}
                                    </RadioGroup>
                                  </FormControl>
                                  <FormDescription>
                                    Pick the highest class the driver holds.
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <Separator />
                        </>
                      )}

                      {/* Step 3: Basic License Information */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                            {watchLicenseCategory === 'CDL' ? '3' : '2'}
                          </div>
                          <h3 className="text-lg font-semibold">License Information</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="license_number"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>License Number</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., AB1234567" {...field} />
                                </FormControl>
                                <FormDescription>
                                  Enter exactly as printed. Letters and numbers allowed.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="license_state"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Issuing State</FormLabel>
                                <FormControl>
                                  <StateScroller
                                    value={field.value}
                                    onValueChange={field.onChange}
                                    placeholder="Select state"
                                  />
                                </FormControl>
                                <FormDescription>
                                  State shown on the license.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="license_expiry_date"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>License Expiration</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} />
                                </FormControl>
                                <FormDescription>
                                  We'll remind the driver and manager at 90/60/30 days.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="operating_scope"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">Operating Scope</FormLabel>
                                  <FormDescription>
                                    Interstate = crosses state lines. Intrastate only typically maps to the K restriction.
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value === 'INTERSTATE'}
                                    onCheckedChange={(checked) => 
                                      field.onChange(checked ? 'INTERSTATE' : 'INTRASTATE')
                                    }
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <Separator />

                      {/* Step 4: Endorsements */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                            {watchLicenseCategory === 'CDL' ? '4' : '3'}
                          </div>
                          <h3 className="text-lg font-semibold">Endorsements</h3>
                          <Tooltip>
                            <TooltipTrigger>
                              <HelpCircle className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">Most septage operations need N – Tanker. Hazmat is uncommon unless hauling regulated materials.</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        
                        <FormField
                          control={form.control}
                          name="license_endorsements"
                          render={() => (
                            <FormItem>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {ENDORSEMENTS.map((endorsement) => (
                                  <FormField
                                    key={endorsement.value}
                                    control={form.control}
                                    name="license_endorsements"
                                    render={({ field }) => {
                                      return (
                                        <FormItem
                                          key={endorsement.value}
                                          className="flex flex-row items-start space-x-3 space-y-0"
                                        >
                                          <FormControl>
                                            <Checkbox
                                              checked={field.value?.includes(endorsement.value)}
                                              onCheckedChange={(checked) => {
                                                const value = field.value || [];
                                                if (checked) {
                                                  field.onChange([...value, endorsement.value]);
                                                } else {
                                                  field.onChange(value.filter((val) => val !== endorsement.value));
                                                }
                                              }}
                                            />
                                          </FormControl>
                                          <FormLabel className="font-normal">
                                            <span className={endorsement.common ? 'font-semibold text-primary' : ''}>
                                              {endorsement.label}
                                            </span>
                                            {endorsement.common && (
                                              <Badge variant="secondary" className="ml-2 text-xs">Common</Badge>
                                            )}
                                          </FormLabel>
                                        </FormItem>
                                      );
                                    }}
                                  />
                                ))}
                              </div>
                              <FormDescription>
                                Select all endorsements printed on the license. Most pump trucks require N – Tanker.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Separator />

                      {/* Step 5: Restrictions */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                            {watchLicenseCategory === 'CDL' ? '5' : '4'}
                          </div>
                          <h3 className="text-lg font-semibold">Restrictions</h3>
                          <Tooltip>
                            <TooltipTrigger>
                              <HelpCircle className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">Air-brake (L) or intrastate-only (K) limits what vehicles/routes a driver can take.</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        
                        <FormField
                          control={form.control}
                          name="license_restrictions"
                          render={() => (
                            <FormItem>
                              <div className="space-y-3">
                                {RESTRICTIONS.map((restriction) => (
                                  <FormField
                                    key={restriction.value}
                                    control={form.control}
                                    name="license_restrictions"
                                    render={({ field }) => {
                                      return (
                                        <FormItem
                                          key={restriction.value}
                                          className="flex flex-row items-start space-x-3 space-y-0"
                                        >
                                          <FormControl>
                                            <Checkbox
                                              checked={field.value?.includes(restriction.value)}
                                              onCheckedChange={(checked) => {
                                                const value = field.value || [];
                                                if (checked) {
                                                  field.onChange([...value, restriction.value]);
                                                } else {
                                                  field.onChange(value.filter((val) => val !== restriction.value));
                                                }
                                              }}
                                            />
                                          </FormControl>
                                          <FormLabel className="font-normal">
                                            {restriction.label}
                                          </FormLabel>
                                        </FormItem>
                                      );
                                    }}
                                  />
                                ))}
                              </div>

                              {watchRestrictions?.includes('OTHER') && (
                                <FormField
                                  control={form.control}
                                  name="custom_restriction"
                                  render={({ field }) => (
                                    <FormItem className="ml-6">
                                      <FormLabel>Other Restriction Details</FormLabel>
                                      <FormControl>
                                        <Input placeholder="Enter state-specific or other restrictions" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              )}

                              <FormDescription>
                                Match the restriction codes on the license.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* DOT Medical Card Section */}
                      {watchLicenseCategory === 'CDL' && (
                        <>
                          <Separator />
                          <div className="space-y-4">
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">6</div>
                              <h3 className="text-lg font-semibold">DOT Medical Card</h3>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <FormField
                                control={form.control}
                                name="medical_card_reference"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Medical Card Reference</FormLabel>
                                    <FormControl>
                                      <Input placeholder="DOT-12345 or 'on file'" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                      Store the reference and set reminders before it expires.
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name="medical_card_expiry_date"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Medical Card Expiration</FormLabel>
                                    <FormControl>
                                      <Input type="date" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                      We'll remind the driver and manager before expiration.
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                          <Separator />
                        </>
                      )}

                      {/* Notes Section */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                            {watchLicenseCategory === 'CDL' ? '7' : '5'}
                          </div>
                          <h3 className="text-lg font-semibold">Notes (Optional)</h3>
                        </div>
                        
                        <FormField
                          control={form.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Textarea 
                                  placeholder="Non-sensitive notes only..."
                                  className="min-h-[80px]"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Additional non-sensitive notes about driver credentials.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex justify-end space-x-2 pt-6">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsEditModalOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={updateCredentials.isPending}
                        >
                          {updateCredentials.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            'Save Changes'
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : credentialsData ? (
              <div className="space-y-6">
                {/* License Category & Class */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">License Category</div>
                    <div className="flex items-center gap-2">
                      <Badge variant={credentialsData.license_category === 'CDL' ? 'default' : 'secondary'}>
                        {credentialsData.license_category === 'CDL' ? 'Commercial (CDL)' : 'Non-CDL (Regular)'}
                      </Badge>
                      {credentialsData.license_category === 'CDL' && credentialsData.cdl_class && (
                        <Badge variant="outline">
                          Class {credentialsData.cdl_class}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Operating Scope</div>
                    <Badge variant={credentialsData.operating_scope === 'INTERSTATE' ? 'default' : 'secondary'}>
                      {credentialsData.operating_scope || 'Interstate'}
                    </Badge>
                  </div>
                </div>

                {/* Basic License Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">License Number</div>
                    <div className="text-sm font-mono">{credentialsData.license_number || 'Not provided'}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Issuing State</div>
                    <div className="text-sm">{credentialsData.license_state || 'Not provided'}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Expiration</div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        {credentialsData.license_expiry_date ? format(new Date(credentialsData.license_expiry_date), 'MMM dd, yyyy') : 'Not set'}
                      </span>
                      {licenseExpiryStatus && (
                        <Badge variant={licenseExpiryStatus.variant}>
                          {licenseExpiryStatus.label}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Endorsements */}
                {credentialsData.license_endorsements && credentialsData.license_endorsements.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Endorsements</div>
                    <div className="flex flex-wrap gap-2">
                      {credentialsData.license_endorsements.map((endorsement) => (
                        <Badge key={endorsement} variant="secondary" className="font-mono">
                          {endorsement}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Restrictions */}
                {credentialsData.license_restrictions && credentialsData.license_restrictions.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Restrictions</div>
                    <div className="flex flex-wrap gap-2">
                      {credentialsData.license_restrictions.map((restriction) => (
                        <Badge key={restriction} variant="outline" className="font-mono">
                          {restriction}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Medical Card (CDL only) */}
                {credentialsData.license_category === 'CDL' && (
                  <div className="border-t pt-4 space-y-4">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <h4 className="font-medium">DOT Medical Card</h4>
                    </div>
                    
                    {credentialsData.medical_card_expiry_date ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-muted-foreground">Expiration Date</div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">
                              {format(new Date(credentialsData.medical_card_expiry_date), 'MMM dd, yyyy')}
                            </span>
                            {medicalCardExpiryStatus && (
                              <Badge variant={medicalCardExpiryStatus.variant}>
                                {medicalCardExpiryStatus.label}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-muted-foreground">Reference</div>
                          <div className="text-sm">{credentialsData.medical_card_reference || 'Not provided'}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">Medical card information not provided</div>
                    )}
                  </div>
                )}

                {/* Notes */}
                {credentialsData.notes && (
                  <div className="border-t pt-4 space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Notes</div>
                    <div className="text-sm bg-muted/50 p-3 rounded-md">
                      {credentialsData.notes}
                    </div>
                  </div>
                )}

                {/* Document Upload Section */}
                <div className="border-t pt-4 space-y-3">
                  <div className="text-sm font-medium text-muted-foreground">Document Uploads</div>
                  <div className="flex flex-wrap gap-2">
              <CertificateUploadButton
                driverId={driverId}
                buttonText="Upload License"
                onUploaded={() => {}}
                    />
                    {credentialsData.license_category === 'CDL' && (
                <CertificateUploadButton
                  driverId={driverId}
                  buttonText="Upload Medical Card"
                  onUploaded={() => {}}
                      />
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 space-y-3">
                <div className="text-muted-foreground">
                  No driver credentials found
                </div>
                <div className="text-sm text-muted-foreground">
                  Click "Edit" to add license information, endorsements, and restrictions
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}