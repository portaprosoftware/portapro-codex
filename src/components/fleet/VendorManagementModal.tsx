import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

interface Vendor {
  id?: string;
  name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  service_specialties: string[] | null;
  hourly_rate: number | null;
  notes: string | null;
  is_active: boolean | null;
}

interface VendorManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendor?: Vendor | null;
  mode: "create" | "edit";
}

const vendorSchema = z.object({
  name: z.string().trim().min(1, "Vendor name is required").max(100, "Name must be less than 100 characters"),
  contact_name: z.string().trim().max(100, "Contact name must be less than 100 characters").optional(),
  phone: z.string().trim().max(20, "Phone must be less than 20 characters").optional(),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters").optional().or(z.literal("")),
  address: z.string().trim().max(500, "Address must be less than 500 characters").optional(),
  hourly_rate: z.number().min(0, "Hourly rate must be positive").max(9999, "Hourly rate must be less than $9999").optional(),
  notes: z.string().trim().max(1000, "Notes must be less than 1000 characters").optional(),
});

const DEFAULT_SPECIALTIES = [
  "Engine Repair",
  "Transmission",
  "Electrical",
  "HVAC",
  "Brakes",
  "Tires",
  "Oil Changes",
  "DOT Inspections",
  "Hydraulics",
  "Body Work",
  "Glass Repair",
  "Detailing",
  "Towing",
  "General Maintenance"
];

export const VendorManagementModal: React.FC<VendorManagementModalProps> = ({
  open,
  onOpenChange,
  vendor,
  mode,
}) => {
  const [formData, setFormData] = useState<Vendor>({
    name: "",
    contact_name: "",
    phone: "",
    email: "",
    address: "",
    service_specialties: [],
    hourly_rate: null,
    notes: "",
    is_active: true,
  });
  const [newSpecialty, setNewSpecialty] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const queryClient = useQueryClient();

  useEffect(() => {
    if (vendor && mode === "edit") {
      setFormData({
        ...vendor,
        contact_name: vendor.contact_name || "",
        phone: vendor.phone || "",
        email: vendor.email || "",
        address: vendor.address || "",
        service_specialties: vendor.service_specialties || [],
        notes: vendor.notes || "",
        is_active: vendor.is_active ?? true,
      });
    } else {
      setFormData({
        name: "",
        contact_name: "",
        phone: "",
        email: "",
        address: "",
        service_specialties: [],
        hourly_rate: null,
        notes: "",
        is_active: true,
      });
    }
    setErrors({});
    setNewSpecialty("");
  }, [vendor, mode, open]);

  const validateForm = () => {
    try {
      const cleanData = {
        ...formData,
        contact_name: formData.contact_name || undefined,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        address: formData.address || undefined,
        notes: formData.notes || undefined,
      };
      vendorSchema.parse(cleanData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const createVendor = useMutation({
    mutationFn: async (vendorData: Vendor) => {
      const { data, error } = await supabase
        .from("maintenance_vendors")
        .insert([{
          name: vendorData.name.trim(),
          contact_name: vendorData.contact_name?.trim() || null,
          phone: vendorData.phone?.trim() || null,
          email: vendorData.email?.trim() || null,
          address: vendorData.address?.trim() || null,
          service_specialties: vendorData.service_specialties,
          hourly_rate: vendorData.hourly_rate,
          notes: vendorData.notes?.trim() || null,
          is_active: vendorData.is_active,
        }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-vendors"] });
      toast.success("Vendor created successfully");
      onOpenChange(false);
    },
    onError: (error) => {
      console.error("Error creating vendor:", error);
      toast.error("Failed to create vendor");
    },
  });

  const updateVendor = useMutation({
    mutationFn: async (vendorData: Vendor) => {
      const { data, error } = await supabase
        .from("maintenance_vendors")
        .update({
          name: vendorData.name.trim(),
          contact_name: vendorData.contact_name?.trim() || null,
          phone: vendorData.phone?.trim() || null,
          email: vendorData.email?.trim() || null,
          address: vendorData.address?.trim() || null,
          service_specialties: vendorData.service_specialties,
          hourly_rate: vendorData.hourly_rate,
          notes: vendorData.notes?.trim() || null,
          is_active: vendorData.is_active,
        })
        .eq("id", vendor?.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-vendors"] });
      toast.success("Vendor updated successfully");
      onOpenChange(false);
    },
    onError: (error) => {
      console.error("Error updating vendor:", error);
      toast.error("Failed to update vendor");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (mode === "create") {
      createVendor.mutate(formData);
    } else {
      updateVendor.mutate(formData);
    }
  };

  const addSpecialty = (specialty: string) => {
    const trimmedSpecialty = specialty.trim();
    if (trimmedSpecialty && !formData.service_specialties?.includes(trimmedSpecialty)) {
      setFormData(prev => ({
        ...prev,
        service_specialties: [...(prev.service_specialties || []), trimmedSpecialty]
      }));
    }
    setNewSpecialty("");
  };

  const removeSpecialty = (specialty: string) => {
    setFormData(prev => ({
      ...prev,
      service_specialties: prev.service_specialties?.filter(s => s !== specialty) || []
    }));
  };

  const isSubmitting = createVendor.isPending || updateVendor.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Add New Vendor" : "Edit Vendor"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Vendor Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter vendor name"
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
              </div>

              <div>
                <Label htmlFor="contact_name">Contact Person</Label>
                <Input
                  id="contact_name"
                  value={formData.contact_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_name: e.target.value }))}
                  placeholder="Primary contact name"
                  className={errors.contact_name ? "border-red-500" : ""}
                />
                {errors.contact_name && <p className="text-sm text-red-500 mt-1">{errors.contact_name}</p>}
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="(555) 123-4567"
                  className={errors.phone ? "border-red-500" : ""}
                />
                {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone}</p>}
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="vendor@example.com"
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Full business address"
                rows={2}
                className={errors.address ? "border-red-500" : ""}
              />
              {errors.address && <p className="text-sm text-red-500 mt-1">{errors.address}</p>}
            </div>
          </div>

          {/* Service Specialties */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Service Specialties</h3>
            
            <div className="flex flex-wrap gap-2 min-h-[40px] p-3 border rounded-md">
              {formData.service_specialties?.map((specialty) => (
                <Badge key={specialty} variant="secondary" className="flex items-center gap-1">
                  {specialty}
                  <button
                    type="button"
                    onClick={() => removeSpecialty(specialty)}
                    className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {!formData.service_specialties?.length && (
                <span className="text-muted-foreground text-sm">No specialties added yet</span>
              )}
            </div>

            <div className="flex gap-2">
              <Input
                value={newSpecialty}
                onChange={(e) => setNewSpecialty(e.target.value)}
                placeholder="Enter specialty and press Enter"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSpecialty(newSpecialty);
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => addSpecialty(newSpecialty)}
                disabled={!newSpecialty.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="text-sm text-muted-foreground">
              <p className="mb-2">Quick add common specialties:</p>
              <div className="flex flex-wrap gap-1">
                {DEFAULT_SPECIALTIES.map((specialty) => (
                  <Button
                    key={specialty}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addSpecialty(specialty)}
                    disabled={formData.service_specialties?.includes(specialty)}
                    className="text-xs h-7"
                  >
                    {specialty}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Pricing & Notes */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Additional Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="hourly_rate">Hourly Rate ($)</Label>
                <Input
                  id="hourly_rate"
                  type="number"
                  min="0"
                  max="9999"
                  step="0.01"
                  value={formData.hourly_rate || ""}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    hourly_rate: e.target.value ? parseFloat(e.target.value) : null 
                  }))}
                  placeholder="0.00"
                  className={errors.hourly_rate ? "border-red-500" : ""}
                />
                {errors.hourly_rate && <p className="text-sm text-red-500 mt-1">{errors.hourly_rate}</p>}
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="is_active">Active Status</Label>
                <Switch
                  id="is_active"
                  checked={formData.is_active ?? true}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes about this vendor..."
                rows={3}
                className={errors.notes ? "border-red-500" : ""}
              />
              {errors.notes && <p className="text-sm text-red-500 mt-1">{errors.notes}</p>}
            </div>
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : mode === "create" ? "Create Vendor" : "Update Vendor"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};