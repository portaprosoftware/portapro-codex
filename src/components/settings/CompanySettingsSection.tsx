import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Building2, Upload, Save, Mail, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SuccessMessage } from "@/components/ui/SuccessMessage";
import { LogoUploadModal } from "@/components/settings/LogoUploadModal";

const companySettingsSchema = z.object({
  company_name: z.string().min(1, "Company name is required"),
  company_email: z.string().email("Invalid email address").optional().or(z.literal("")),
  company_phone: z.string().optional(),
  company_address: z.string().optional(),
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

export function CompanySettingsSection() {
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [showLogoModal, setShowLogoModal] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const queryClient = useQueryClient();

  const { data: companySettings, isLoading } = useQuery({
    queryKey: ["company-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_settings")
        .select("*")
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  const form = useForm<CompanySettingsFormData>({
    resolver: zodResolver(companySettingsSchema),
    defaultValues: {
      company_name: "",
      company_email: "",
      company_phone: "",
      company_address: "",
      company_timezone: "America/New_York",
      support_email: "",
    },
  });

  React.useEffect(() => {
    if (companySettings) {
      form.reset({
        company_name: companySettings.company_name || "",
        company_email: companySettings.company_email || "",
        company_phone: companySettings.company_phone || "",
        company_address: companySettings.company_address || "",
        company_timezone: companySettings.company_timezone || "America/New_York",
        support_email: companySettings.support_email || "",
      });
    }
  }, [companySettings, form]);

  const updateCompanySettings = useMutation({
    mutationFn: async (data: CompanySettingsFormData & { company_logo?: string }) => {
      const { error } = await supabase
        .from("company_settings")
        .update(data)
        .eq("id", companySettings?.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-settings"] });
      setShowSuccessMessage(true);
    },
    onError: (error) => {
      toast.error("Failed to update company settings");
      console.error("Error updating company settings:", error);
    },
  });

  const uploadLogoMutation = useMutation({
    mutationFn: async (file: File) => {
      console.log("Starting logo upload for file:", file.name);
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('company-logos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error("Storage upload error:", error);
        throw error;
      }
      
      console.log("Storage upload successful:", data);
      
      const { data: { publicUrl } } = supabase.storage
        .from('company-logos')
        .getPublicUrl(data.path);

      console.log("Generated public URL:", publicUrl);
      return publicUrl;
    },
    onSuccess: (logoUrl) => {
      console.log("Logo upload successful, updating company settings with URL:", logoUrl);
      const formData = form.getValues();
      updateCompanySettings.mutate({ ...formData, company_logo: logoUrl });
      setLogoFile(null);
      setLogoPreview(null);
      setShowLogoModal(false);
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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="w-5 h-5" />
            <span>Company Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Company Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="w-5 h-5" />
            <span>Company Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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

              <FormField
                control={form.control}
                name="company_address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Address</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Textarea 
                          placeholder="Enter complete company address"
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
                        <p className="text-xs text-muted-foreground">
                          This email address will be used for marketing communications and as the reply-to address for all correspondence including, quotes and invoices.
                        </p>
                       <FormMessage />
                     </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={updateCompanySettings.isPending}
                  className="bg-gradient-primary hover:bg-gradient-primary/90"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {updateCompanySettings.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Logo Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Company Logo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-muted">
              {logoPreview ? (
                <img 
                  src={logoPreview} 
                  alt="Logo preview" 
                  className="w-full h-full object-contain rounded-lg"
                />
              ) : companySettings?.company_logo ? (
                <img 
                  src={companySettings.company_logo} 
                  alt="Current logo" 
                  className="w-full h-full object-contain rounded-lg"
                />
              ) : (
                <Upload className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="hidden"
                id="logo-upload"
              />
              <Label htmlFor="logo-upload" className="cursor-pointer">
                <Button variant="outline" asChild>
                  <span>Choose Logo</span>
                </Button>
              </Label>
              <p className="text-xs text-muted-foreground mt-2">
                Recommended: 200x200px, JPG or PNG, max 5MB
              </p>
            </div>
          </div>
          
        </CardContent>
      </Card>

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

      {showSuccessMessage && (
        <SuccessMessage
          message="Company settings updated successfully"
          onComplete={() => setShowSuccessMessage(false)}
        />
      )}
    </div>
  );
}