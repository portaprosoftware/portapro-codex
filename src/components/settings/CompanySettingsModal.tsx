import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Upload, Save, Mail, MapPin, Percent } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
// LogoUploadModal import removed - logo management separated

const companySettingsSchema = z.object({
  company_name: z.string().min(1, "Company name is required"),
  company_email: z.string().email("Invalid email address").optional().or(z.literal("")),
  company_phone: z.string().optional(),
  company_street: z.string().min(1, "Street address is required"),
  company_street2: z.string().optional(),
  company_city: z.string().min(1, "City is required"),
  company_state: z.string().min(1, "State is required"),
  company_zipcode: z.string().min(1, "Zipcode is required"),
  company_timezone: z.string().min(1, "Timezone is required"),
  default_deposit_percentage: z.number()
    .min(0, "Percentage must be at least 0")
    .max(100, "Percentage cannot exceed 100")
    .optional()
    .default(25),
  default_delivery_fee: z.number()
    .min(0, "Fee must be at least 0")
    .optional()
    .default(0),
  auto_enable_delivery_fee: z.boolean()
    .optional()
    .default(false),
});

type CompanySettingsFormData = z.infer<typeof companySettingsSchema>;

const US_STATES = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
];

const timezones = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Phoenix", label: "Arizona Time" },
  { value: "America/Anchorage", label: "Alaska Time" },
  { value: "Pacific/Honolulu", label: "Hawaii Time" },
];

interface CompanySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  companySettings: any;
}

export function CompanySettingsModal({ isOpen, onClose, companySettings }: CompanySettingsModalProps) {
  // Logo management removed - now handled by LogoManagementModal
  const queryClient = useQueryClient();

  const form = useForm<CompanySettingsFormData>({
    resolver: zodResolver(companySettingsSchema),
    defaultValues: {
      company_name: companySettings?.company_name || "",
      company_email: companySettings?.company_email || "",
      company_phone: companySettings?.company_phone || "",
      company_street: companySettings?.company_street || "",
      company_street2: companySettings?.company_street2 || "",
      company_city: companySettings?.company_city || "",
      company_state: companySettings?.company_state || "",
      company_zipcode: companySettings?.company_zipcode || "",
      company_timezone: companySettings?.company_timezone || "America/New_York",
      default_deposit_percentage: companySettings?.default_deposit_percentage || 25,
      default_delivery_fee: companySettings?.default_delivery_fee || 0,
      auto_enable_delivery_fee: companySettings?.auto_enable_delivery_fee || false,
    },
  });

  React.useEffect(() => {
    console.log("Form reset triggered:", { companySettings, isOpen });
    if (companySettings && isOpen) {
      const formData = {
        company_name: companySettings.company_name || "",
        company_email: companySettings.company_email || "",
        company_phone: companySettings.company_phone || "",
        company_street: companySettings.company_street || "",
        company_street2: companySettings.company_street2 || "",
        company_city: companySettings.company_city || "",
        company_state: companySettings.company_state || "",
        company_zipcode: companySettings.company_zipcode || "",
        company_timezone: companySettings.company_timezone || "America/New_York",
        default_deposit_percentage: companySettings.default_deposit_percentage || 25,
        default_delivery_fee: companySettings.default_delivery_fee || 0,
        auto_enable_delivery_fee: companySettings.auto_enable_delivery_fee || false,
      };
      console.log("Resetting form with data:", formData);
      form.reset(formData);
    }
  }, [companySettings, isOpen, form]);

  const updateCompanySettings = useMutation({
    mutationFn: async (data: CompanySettingsFormData) => {
      console.log("Updating company settings:", data);
      
      if (!companySettings?.id) {
        throw new Error('Company settings ID is required');
      }
      
      // Use update instead of upsert for editing existing settings
      const { data: result, error } = await supabase
        .from("company_settings")
        .update(data)
        .eq('id', companySettings.id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: (updatedData) => {
      console.log("Company settings updated successfully:", updatedData);
      
      // Update the company-settings cache
      queryClient.setQueryData(["company-settings"], updatedData);
      
      toast.success("Company settings updated successfully!");
      onClose();
    },
    onError: (error) => {
      toast.error("Failed to update company settings");
      console.error("Error updating company settings:", error);
    },
  });

  // Logo upload logic removed - now handled by LogoManagementModal

  const onSubmit = (data: CompanySettingsFormData) => {
    updateCompanySettings.mutate(data);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Company Information</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Logo section removed - now managed separately */}

            {/* Form */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="company_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter company name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="company_timezone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Timezone</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select timezone" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {timezones.map((tz) => (
                              <SelectItem key={tz.value} value={tz.value}>
                                {tz.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="company_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                            <Input 
                              placeholder="company@example.com" 
                              className="pl-10"
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="company_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="(555) 123-4567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Company Address Fields */}
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-foreground">Company Address</h3>
                  
                  <FormField
                    control={form.control}
                    name="company_street"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street Address *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                            <Input 
                              placeholder="123 Main Street"
                              className="pl-10"
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="company_street2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street 2 (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Suite 100, Apt 2B, etc."
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="company_city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="New York"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="company_state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select state" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {US_STATES.map((state) => (
                                <SelectItem key={state.value} value={state.value}>
                                  {state.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="company_zipcode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Zipcode *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="12345"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="default_deposit_percentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default Deposit Percentage</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Percent className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                            <Input 
                              type="number"
                              min="0"
                              max="100"
                              step="1"
                              placeholder="25" 
                              className="pl-10"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                        <p className="text-xs text-muted-foreground">
                          Default percentage used for deposit collection on quotes and jobs
                        </p>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Delivery Fee Settings */}
                <div className="space-y-6 pt-6 border-t">
                  <h3 className="text-lg font-medium text-foreground">Delivery Fee Settings</h3>
                  <p className="text-sm text-muted-foreground -mt-4">
                    Configure default delivery fee behavior for job and quote creation
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="default_delivery_fee">Default Delivery Fee</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold">$</span>
                        <Input
                          id="default_delivery_fee"
                          type="number"
                          min="0"
                          max="9999"
                          step="0.01"
                          value={form.watch('default_delivery_fee') || 0}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            form.setValue('default_delivery_fee' as any, value);
                          }}
                          className="flex-1"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        This amount will be used as the default delivery fee when creating jobs or quotes
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-6">
                      <div className="space-y-0.5">
                        <Label htmlFor="auto_enable_delivery_fee">
                          Auto-Enable Delivery Fee
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Automatically turn on delivery fee when users reach the services step
                        </p>
                      </div>
                      <Switch
                        id="auto_enable_delivery_fee"
                        checked={form.watch('auto_enable_delivery_fee') || false}
                        onCheckedChange={(checked) => 
                          form.setValue('auto_enable_delivery_fee' as any, checked)
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={updateCompanySettings.isPending}
                    className="min-w-[120px]"
                  >
                    {updateCompanySettings.isPending ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Saving...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Save className="w-4 h-4" />
                        <span>Save Changes</span>
                      </div>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Logo management moved to LogoManagementModal */}
    </>
  );
}