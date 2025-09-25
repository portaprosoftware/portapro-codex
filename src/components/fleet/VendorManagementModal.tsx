import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

import { toast } from "sonner";

interface VendorManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendor?: any;
  mode: "create" | "edit";
}

const SPECIALTY_OPTIONS = [
  "Engine Repair",
  "Transmission",
  "Electrical", 
  "Hydraulics",
  "Brakes",
  "Tires",
  "Body Work",
  "Glass Repair",
  "Painting",
  "Welding",
  "General Maintenance",
  "Emergency Service"
];

const US_STATES = [
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" }
];

export const VendorManagementModal: React.FC<VendorManagementModalProps> = ({
  open,
  onOpenChange,
  vendor,
  mode
}) => {
  const [formData, setFormData] = useState({
    name: "",
    contact_name: "",
    phone: "",
    email: "",
    street: "",
    street2: "",
    city: "",
    state: "",
    zip: "",
    service_specialties: [] as string[],
    hourly_rate: "",
    daily_rate: "",
    notes: ""
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    if (vendor && mode === "edit") {
      setFormData({
        name: vendor.name || "",
        contact_name: vendor.contact_name || "",
        phone: formatPhoneNumber(vendor.phone || ""),
        email: vendor.email || "",
        street: vendor.street || "",
        street2: vendor.street2 || "",
        city: vendor.city || "",
        state: vendor.state || "",
        zip: vendor.zip || "",
        service_specialties: vendor.service_specialties || [],
        hourly_rate: vendor.hourly_rate?.toString() || "",
        daily_rate: vendor.daily_rate?.toString() || "",
        notes: vendor.notes || ""
      });
    } else {
      // Reset form for create mode
      setFormData({
        name: "",
        contact_name: "",
        phone: "",
        email: "",
        street: "",
        street2: "",
        city: "",
        state: "",
        zip: "",
        service_specialties: [],
        hourly_rate: "",
        daily_rate: "",
        notes: ""
      });
    }
  }, [vendor, mode, open]);

  const formatPhoneNumber = (value: string) => {
    // Remove all non-numeric characters
    const phoneNumber = value.replace(/\D/g, '');
    
    // Format as (123) 555-1234
    if (phoneNumber.length >= 10) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
    } else if (phoneNumber.length >= 6) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6)}`;
    } else if (phoneNumber.length >= 3) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    } else {
      return phoneNumber;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData(prev => ({ ...prev, phone: formatted }));
  };


  const createVendor = useMutation({
    mutationFn: async (data: typeof formData) => {
      const submitData = {
        ...data,
        hourly_rate: data.hourly_rate ? parseFloat(data.hourly_rate) : null,
        daily_rate: data.daily_rate ? parseFloat(data.daily_rate) : null
      };
      const { error } = await supabase
        .from("maintenance_vendors")
        .insert([submitData]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-vendors"] });
      toast.success("Vendor created successfully");
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Failed to create vendor");
    }
  });

  const updateVendor = useMutation({
    mutationFn: async (data: typeof formData) => {
      const submitData = {
        ...data,
        hourly_rate: data.hourly_rate ? parseFloat(data.hourly_rate) : null,
        daily_rate: data.daily_rate ? parseFloat(data.daily_rate) : null
      };
      const { error } = await supabase
        .from("maintenance_vendors")
        .update(submitData)
        .eq("id", vendor.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-vendors"] });
      toast.success("Vendor updated successfully");
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Failed to update vendor");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Vendor name is required");
      return;
    }

    if (mode === "create") {
      createVendor.mutate(formData);
    } else {
      updateVendor.mutate(formData);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Add New Vendor" : "Edit Vendor"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Vendor Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="ABC Mechanics"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="contact_name">Contact Name</Label>
                <Input
                  id="contact_name"
                  value={formData.contact_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_name: e.target.value }))}
                  placeholder="John Smith"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  placeholder="(123) 555-1234"
                  maxLength={14}
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="contact@abcmechanics.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="hourly_rate">Hourly Rate</Label>
                <Input
                  id="hourly_rate"
                  type="number"
                  step="0.01"
                  value={formData.hourly_rate}
                  onChange={(e) => setFormData(prev => ({ ...prev, hourly_rate: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <Label htmlFor="daily_rate">Daily Rate</Label>
                <Input
                  id="daily_rate"
                  type="number"
                  step="0.01"
                  value={formData.daily_rate}
                  onChange={(e) => setFormData(prev => ({ ...prev, daily_rate: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Address</h3>
            
            <div>
              <Label htmlFor="street">Street Address</Label>
              <Input
                id="street"
                value={formData.street}
                onChange={(e) => setFormData(prev => ({ ...prev, street: e.target.value }))}
                placeholder="123 Main Street"
              />
            </div>

            <div>
              <Label htmlFor="street2">Street Address 2</Label>
              <Input
                id="street2"
                value={formData.street2}
                onChange={(e) => setFormData(prev => ({ ...prev, street2: e.target.value }))}
                placeholder="Suite 100, Building A"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="New York"
                />
              </div>
              
              <div>
                <Label htmlFor="state">State</Label>
                <Select value={formData.state} onValueChange={(value) => setFormData(prev => ({ ...prev, state: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map((state) => (
                      <SelectItem key={state.code} value={state.code}>
                        {state.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="zip">ZIP Code</Label>
                <Input
                  id="zip"
                  value={formData.zip}
                  onChange={(e) => setFormData(prev => ({ ...prev, zip: e.target.value }))}
                  placeholder="10001"
                  maxLength={10}
                />
              </div>
            </div>
          </div>

          {/* Service Specialties - View Only */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Service Specialties</h3>
            
            {formData.service_specialties.length > 0 ? (
              <div className="space-y-2">
                <Label>Current Specialties</Label>
                <div className="flex flex-wrap gap-2">
                  {formData.service_specialties.map((specialty) => (
                    <Badge key={specialty} variant="secondary">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No specialties listed</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes about this vendor..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createVendor.isPending || updateVendor.isPending}
            >
              {mode === "create" ? "Create Vendor" : "Update Vendor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};