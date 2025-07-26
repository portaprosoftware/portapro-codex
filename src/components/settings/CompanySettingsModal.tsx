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
import { StateScroller } from "@/components/ui/state-scroller";
import { Label } from "@/components/ui/label";
import { Upload, Save, Mail, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LogoUploadModal } from "@/components/settings/LogoUploadModal";

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
  support_email: z.string().email("Invalid email address").optional().or(z.literal("")),
});

type CompanySettingsFormData = z.infer<typeof companySettingsSchema>;

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
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [showLogoModal, setShowLogoModal] = useState(false);
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
      support_email: companySettings?.support_email || "",
    },
  });

  React.useEffect(() => {
    if (companySettings && isOpen) {
      form.reset({
        company_name: companySettings.company_name || "",
        company_email: companySettings.company_email || "",
        company_phone: companySettings.company_phone || "",
        company_street: companySettings.company_street || "",
        company_street2: companySettings.company_street2 || "",
        company_city: companySettings.company_city || "",
        company_state: companySettings.company_state || "",
        company_zipcode: companySettings.company_zipcode || "",
        company_timezone: companySettings.company_timezone || "America/New_York",
        support_email: companySettings.support_email || "",
      });
    }
  }, [companySettings, isOpen, form]);

  const updateCompanySettings = useMutation({
    mutationFn: async (data: CompanySettingsFormData & { company_logo?: string }) => {
      const { error } = await supabase
        .from("company_settings")
        .upsert({
          id: companySettings?.id || '08751fa1-759f-4bfd-afd3-37a6d6b4f86f',
          ...data
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-settings"] });
      toast.success("Company settings updated successfully!");
      onClose();
    },
    onError: (error) => {
      toast.error("Failed to update company settings");
      console.error("Error updating company settings:", error);
    },
  });

  const uploadLogoMutation = useMutation({
    mutationFn: async (file: File) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('company-logos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage
        .from('company-logos')
        .getPublicUrl(data.path);

      return publicUrl;
    },
    onSuccess: async (logoUrl) => {
      const formData = form.getValues();
      await updateCompanySettings.mutateAsync({ ...formData, company_logo: logoUrl });
      setLogoFile(null);
      setLogoPreview(null);
      setShowLogoModal(false);
      toast.success("Logo updated successfully!");
    },
    onError: (error) => {
      console.error('Error uploading logo:', error);
      toast.error("Failed to upload logo. Please try again.");
    },
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error("Please select a valid image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
        setShowLogoModal(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = () => {
    if (logoFile) {
      uploadLogoMutation.mutate(logoFile);
    } else {
      toast.error("Please select a logo file first");
    }
  };

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
            {/* Logo Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Company Logo</h3>
              <div className="flex items-center space-x-4">
                <div className="h-16 w-32 border border-dashed border-muted-foreground rounded-lg flex items-center justify-center">
                  {companySettings?.company_logo ? (
                    <img 
                      src={companySettings.company_logo} 
                      alt="Company logo" 
                      className="h-full w-auto object-contain"
                    />
                  ) : (
                    <span className="text-sm text-muted-foreground">No logo</span>
                  )}
                </div>
                <div>
                  <Label htmlFor="logo-upload" className="cursor-pointer">
                    <Button variant="outline" className="relative" asChild>
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Logo
                      </span>
                    </Button>
                  </Label>
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG, GIF up to 5MB
                  </p>
                </div>
              </div>
            </div>

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

                <FormField
                  control={form.control}
                  name="support_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Support Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                          <Input 
                            placeholder="support@example.com" 
                            className="pl-10"
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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

      <LogoUploadModal
        isOpen={showLogoModal}
        onClose={() => {
          setShowLogoModal(false);
          setLogoPreview(null);
          setLogoFile(null);
        }}
        logoPreview={logoPreview}
        onSave={handleLogoUpload}
        isUploading={uploadLogoMutation.isPending}
      />
    </>
  );
}