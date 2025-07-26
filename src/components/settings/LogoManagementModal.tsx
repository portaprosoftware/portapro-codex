import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, Save, X, Image } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LogoManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLogo: any;
}

export function LogoManagementModal({ isOpen, onClose, currentLogo }: LogoManagementModalProps) {
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const queryClient = useQueryClient();

  // Reset state when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setLogoPreview(null);
      setLogoFile(null);
    }
  }, [isOpen]);

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
      // Update the company settings with the new logo URL
      const { data, error } = await supabase
        .from("company_settings")
        .update({ company_logo: logoUrl })
        .select("company_logo, company_name")
        .single();

      if (error) throw error;

      // Update both cache keys
      queryClient.setQueryData(["company-logo"], data);
      queryClient.setQueryData(["company-settings"], (old: any) => ({
        ...old,
        company_logo: logoUrl
      }));
      
      setLogoFile(null);
      setLogoPreview(null);
      toast.success("Logo updated successfully!");
      onClose();
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
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveLogo = () => {
    if (logoFile) {
      uploadLogoMutation.mutate(logoFile);
    } else {
      toast.error("Please select a logo file first");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Image className="w-5 h-5" />
            Manage Company Logo
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Current Logo Display */}
          <div className="space-y-3">
            <Label>Current Logo</Label>
            <div className="w-full h-32 border border-dashed border-border rounded-lg flex items-center justify-center bg-muted">
              {currentLogo?.company_logo ? (
                <img 
                  src={currentLogo.company_logo} 
                  alt="Current company logo" 
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <div className="text-center">
                  <Image className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No logo uploaded</p>
                </div>
              )}
            </div>
          </div>

          {/* New Logo Upload */}
          <div className="space-y-3">
            <Label>Upload New Logo</Label>
            <div className="w-full h-32 border border-dashed border-border rounded-lg flex items-center justify-center bg-muted">
              {logoPreview ? (
                <img 
                  src={logoPreview} 
                  alt="Logo preview" 
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <div className="text-center">
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Click to upload new logo</p>
                </div>
              )}
            </div>
            
            <Label htmlFor="logo-upload" className="cursor-pointer">
              <Button variant="outline" className="w-full" asChild>
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  Choose Logo File
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
            <p className="text-xs text-muted-foreground text-center">
              PNG, JPG, GIF up to 5MB. Recommended size: 200x80px
            </p>
          </div>
          
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={handleSaveLogo}
              disabled={uploadLogoMutation.isPending || !logoFile}
              className="bg-gradient-primary hover:bg-gradient-primary/90"
            >
              <Save className="w-4 h-4 mr-2" />
              {uploadLogoMutation.isPending ? "Saving..." : "Save Logo"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}