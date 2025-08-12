import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StateScroller } from '@/components/ui/state-scroller';
import { CertificateUploadButton } from '@/components/training/CertificateUploadButton';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  CreditCard, Calendar, AlertTriangle, Edit, 
  Upload, Download, ExternalLink 
} from 'lucide-react';

const credentialsSchema = z.object({
  license_number: z.string().min(1, "License number is required"),
  license_class: z.string().min(1, "License class is required"),
  license_state: z.string().min(1, "License state is required"),
  license_expiry_date: z.string().min(1, "Expiry date is required"),
  license_endorsements: z.array(z.string()).optional(),
  medical_card_expiry_date: z.string().optional(),
  medical_card_reference: z.string().optional(),
});

type CredentialsFormData = z.infer<typeof credentialsSchema>;

interface DriverCredentialsSectionProps {
  driverId: string;
}

const LICENSE_CLASSES = [
  { value: 'A', label: 'Class A - Heavy Trucks' },
  { value: 'B', label: 'Class B - Large Trucks' },
  { value: 'C', label: 'Class C - Regular Vehicles' },
];

const ENDORSEMENTS = [
  { value: 'H', label: 'Hazmat' },
  { value: 'P', label: 'Passenger' },
  { value: 'S', label: 'School Bus' },
  { value: 'N', label: 'Tank Vehicle' },
  { value: 'X', label: 'Hazmat + Tank' },
];

export function DriverCredentialsSection({ driverId }: DriverCredentialsSectionProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: credentials, isLoading } = useQuery({
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
      license_number: credentials?.license_number || '',
      license_class: credentials?.license_class || '',
      license_state: credentials?.license_state || '',
      license_expiry_date: credentials?.license_expiry_date || '',
      license_endorsements: credentials?.license_endorsements || [],
      medical_card_expiry_date: credentials?.medical_card_expiry_date || '',
      medical_card_reference: credentials?.medical_card_reference || '',
    }
  });

  // Reset form when credentials data changes
  React.useEffect(() => {
    if (credentials) {
      form.reset({
        license_number: credentials.license_number || '',
        license_class: credentials.license_class || '',
        license_state: credentials.license_state || '',
        license_expiry_date: credentials.license_expiry_date || '',
        license_endorsements: credentials.license_endorsements || [],
        medical_card_expiry_date: credentials.medical_card_expiry_date || '',
        medical_card_reference: credentials.medical_card_reference || '',
      });
    }
  }, [credentials, form]);

  const updateCredentials = useMutation({
    mutationFn: async (data: CredentialsFormData) => {
      console.log('Updating credentials with data:', data);
      console.log('Driver ID:', driverId);
      
      const credentialsData = {
        driver_id: driverId,
        license_number: data.license_number,
        license_class: data.license_class,
        license_state: data.license_state,
        license_expiry_date: data.license_expiry_date || null,
        license_endorsements: data.license_endorsements || [],
        medical_card_expiry_date: data.medical_card_expiry_date || null,
        medical_card_reference: data.medical_card_reference || null,
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
      toast.success('Credentials updated successfully');
      setIsEditModalOpen(false);
    },
    onError: (error) => {
      toast.error('Failed to update credentials');
      console.error('Error updating credentials:', error);
    }
  });

  const onSubmit = (data: CredentialsFormData) => {
    updateCredentials.mutate(data);
  };

  const isLicenseExpiring = credentials?.license_expiry_date && 
    new Date(credentials.license_expiry_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  
  const isMedicalExpiring = credentials?.medical_card_expiry_date && 
    new Date(credentials.medical_card_expiry_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Driver License */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="w-5 h-5" />
              <span>Driver License</span>
            </CardTitle>
            
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Edit Driver Credentials</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="license_number"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>License Number</FormLabel>
                            <FormControl>
                              <Input placeholder="DL123456789" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="license_class"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>License Class</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select class" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {LICENSE_CLASSES.map((cls) => (
                                  <SelectItem key={cls.value} value={cls.value}>
                                    {cls.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
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
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="license_expiry_date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Expiry Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="medical_card_expiry_date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Medical Card Expiry</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="medical_card_reference"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Medical Card Reference</FormLabel>
                            <FormControl>
                              <Input placeholder="MC123456" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={updateCredentials.isPending}>
                        {updateCredentials.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {credentials ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">License Number</Label>
                  <p className="font-mono text-sm">{credentials.license_number || 'Not set'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Class</Label>
                  <p className="text-sm">{credentials.license_class || 'Not set'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">State</Label>
                  <p className="text-sm">{credentials.license_state || 'Not set'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Expiry Date</Label>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm">
                      {credentials.license_expiry_date ? 
                        new Date(credentials.license_expiry_date).toLocaleDateString() : 'Not set'}
                    </p>
                    {isLicenseExpiring && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Expiring Soon
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {credentials.license_endorsements && credentials.license_endorsements.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Endorsements</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {credentials.license_endorsements.map((endorsement) => (
                      <Badge key={endorsement} variant="secondary" className="text-xs">
                        {endorsement}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">License Document</Label>
                <CertificateUploadButton
                  driverId={driverId}
                  certificationName="Driver License"
                  onUploaded={(url) => {
                    // Handle license document upload
                    console.log('License uploaded:', url);
                  }}
                  uploadedFile={credentials.license_image_url}
                  onRemove={() => {
                    // Handle license document removal
                    console.log('Remove license document');
                  }}
                  buttonText="Upload License"
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">No license information on file</p>
              <Button onClick={() => setIsEditModalOpen(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Add License Information
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Medical Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>DOT Medical Card</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {credentials?.medical_card_expiry_date ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Expiry Date</Label>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm">
                      {new Date(credentials.medical_card_expiry_date).toLocaleDateString()}
                    </p>
                    {isMedicalExpiring && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Expiring Soon
                      </Badge>
                    )}
                  </div>
                </div>
                {credentials.medical_card_reference && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Reference Number</Label>
                    <p className="font-mono text-sm">{credentials.medical_card_reference}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">Medical Card Document</Label>
                <CertificateUploadButton
                  driverId={driverId}
                  certificationName="Medical Card"
                  onUploaded={(url) => {
                    console.log('Medical card uploaded:', url);
                  }}
                  uploadedFile={credentials.medical_card_image_url}
                  onRemove={() => {
                    console.log('Remove medical card document');
                  }}
                  buttonText="Upload Medical Card"
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <Calendar className="w-10 h-10 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600 text-sm">No medical card information</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}