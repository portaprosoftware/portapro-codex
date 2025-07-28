import React, { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { MapPin, Building } from "lucide-react";

interface AddStorageSiteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
}

export function AddStorageSiteModal({ open, onOpenChange, onClose }: AddStorageSiteModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address_type: "company_address" as "company_address" | "custom" | "gps",
    custom_street: "",
    custom_street2: "",
    custom_city: "",
    custom_state: "",
    custom_zip: "",
    gps_latitude: "",
    gps_longitude: "",
    is_default: false,
    is_active: true,
  });

  // Fetch company settings for address
  const { data: companySettings } = useQuery({
    queryKey: ['company-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  // Check if there's already a default location
  const { data: existingDefault } = useQuery({
    queryKey: ['existing-default-location'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('storage_locations')
        .select('*')
        .eq('is_default', true)
        .limit(1)
        .single();
      
      // It's okay if no default exists yet
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload: any = {
        name: data.name,
        description: data.description || null,
        address_type: data.address_type,
        is_default: data.is_default,
        is_active: data.is_active,
      };

      if (data.address_type === 'custom') {
        payload.custom_street = data.custom_street;
        payload.custom_street2 = data.custom_street2;
        payload.custom_city = data.custom_city;
        payload.custom_state = data.custom_state;
        payload.custom_zip = data.custom_zip;
      } else if (data.address_type === 'gps') {
        const lat = parseFloat(data.gps_latitude);
        const lng = parseFloat(data.gps_longitude);
        if (!isNaN(lat) && !isNaN(lng)) {
          payload.gps_coordinates = `POINT(${lng} ${lat})`;
        }
      }

      const { error } = await supabase
        .from('storage_locations')
        .insert([payload]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storage-locations'] });
      toast.success("Storage site created successfully");
      onClose();
      setFormData({
        name: "",
        description: "",
        address_type: "company_address",
        custom_street: "",
        custom_street2: "",
        custom_city: "",
        custom_state: "",
        custom_zip: "",
        gps_latitude: "",
        gps_longitude: "",
        is_default: false,
        is_active: true,
      });
    },
    onError: (error) => {
      toast.error("Failed to create storage site: " + error.message);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Site name is required");
      return;
    }

    if (formData.address_type === 'custom') {
      if (!formData.custom_street.trim() || !formData.custom_city.trim() || !formData.custom_state.trim()) {
        toast.error("Street, city, and state are required for custom address");
        return;
      }
    }

    if (formData.address_type === 'gps') {
      const lat = parseFloat(formData.gps_latitude);
      const lng = parseFloat(formData.gps_longitude);
      if (isNaN(lat) || isNaN(lng)) {
        toast.error("Valid latitude and longitude are required for GPS coordinates");
        return;
      }
    }

    createMutation.mutate(formData);
  };

  const formatCompanyAddress = () => {
    if (!companySettings) return "Company Address";
    
    const parts = [
      companySettings.company_street,
      companySettings.company_street2,
      companySettings.company_city,
      companySettings.company_state,
      companySettings.company_zipcode
    ].filter(Boolean);
    
    return parts.length > 0 ? parts.join(', ') : "Company Address";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Add Storage Site
          </DialogTitle>
          <DialogDescription>
            Create a new storage location for your inventory management
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Site Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Main Warehouse, North Yard, HQ Office"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description of this storage location"
                rows={2}
              />
            </div>
          </div>

          {/* Address Type Selection */}
          <div className="space-y-4">
            <Label>Address Type</Label>
            <RadioGroup
              value={formData.address_type}
              onValueChange={(value) => setFormData({ ...formData, address_type: value as any })}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="company_address" id="company_address" />
                <Label htmlFor="company_address" className="font-normal">
                  Use Company Address
                </Label>
              </div>
              {formData.address_type === 'company_address' && (
                <div className="ml-6 p-3 bg-muted rounded-md text-sm text-muted-foreground">
                  {formatCompanyAddress()}
                </div>
              )}

              <div className="flex items-center space-x-2">
                <RadioGroupItem value="custom" id="custom" />
                <Label htmlFor="custom" className="font-normal">
                  Custom Address
                </Label>
              </div>
              {formData.address_type === 'custom' && (
                <div className="ml-6 space-y-3">
                  <div>
                    <Label htmlFor="custom_street">Street Address *</Label>
                    <Input
                      id="custom_street"
                      value={formData.custom_street}
                      onChange={(e) => setFormData({ ...formData, custom_street: e.target.value })}
                      placeholder="123 Main Street"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="custom_street2">Street Address 2</Label>
                    <Input
                      id="custom_street2"
                      value={formData.custom_street2}
                      onChange={(e) => setFormData({ ...formData, custom_street2: e.target.value })}
                      placeholder="Suite, Unit, Building, Floor, etc."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="custom_city">City *</Label>
                      <Input
                        id="custom_city"
                        value={formData.custom_city}
                        onChange={(e) => setFormData({ ...formData, custom_city: e.target.value })}
                        placeholder="City"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="custom_state">State *</Label>
                      <Input
                        id="custom_state"
                        value={formData.custom_state}
                        onChange={(e) => setFormData({ ...formData, custom_state: e.target.value })}
                        placeholder="State"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="custom_zip">ZIP Code</Label>
                    <Input
                      id="custom_zip"
                      value={formData.custom_zip}
                      onChange={(e) => setFormData({ ...formData, custom_zip: e.target.value })}
                      placeholder="12345"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <RadioGroupItem value="gps" id="gps" />
                <Label htmlFor="gps" className="font-normal">
                  GPS Coordinates
                </Label>
              </div>
              {formData.address_type === 'gps' && (
                <div className="ml-6 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="gps_latitude">Latitude *</Label>
                      <Input
                        id="gps_latitude"
                        type="number"
                        step="any"
                        value={formData.gps_latitude}
                        onChange={(e) => setFormData({ ...formData, gps_latitude: e.target.value })}
                        placeholder="40.7128"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="gps_longitude">Longitude *</Label>
                      <Input
                        id="gps_longitude"
                        type="number"
                        step="any"
                        value={formData.gps_longitude}
                        onChange={(e) => setFormData({ ...formData, gps_longitude: e.target.value })}
                        placeholder="-74.0060"
                        required
                      />
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 inline mr-1" />
                    Enter precise GPS coordinates for this storage location
                  </div>
                </div>
              )}
            </RadioGroup>
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="is_default">Set as Default Location</Label>
                <p className="text-sm text-muted-foreground">
                  New inventory will be assigned to this location by default
                </p>
                {existingDefault && !formData.is_default && (
                  <p className="text-sm text-orange-600 mt-1">
                    Only one default location may be selected at a time. To enable this location as default, disable the current default location first.
                  </p>
                )}
              </div>
              <Switch
                id="is_default"
                checked={formData.is_default}
                onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
                disabled={!!existingDefault && !formData.is_default}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="is_active">Active</Label>
                <p className="text-sm text-muted-foreground">
                  Only active locations can receive new inventory
                </p>
              </div>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1"
            >
              {createMutation.isPending ? "Creating..." : "Create Storage Site"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}