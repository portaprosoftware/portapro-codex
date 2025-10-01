import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface AddSpillKitStorageLocationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location?: any;
  onSuccess: () => void;
}

export const AddSpillKitStorageLocationModal: React.FC<AddSpillKitStorageLocationModalProps> = ({
  open,
  onOpenChange,
  location,
  onSuccess
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: location?.name || "",
    location_type: location?.location_type || "warehouse",
    address_type: location?.address_type || "custom",
    address_custom: location?.address_custom || "",
    address_gps_lat: location?.address_gps_lat || "",
    address_gps_lng: location?.address_gps_lng || "",
    vehicle_id: location?.vehicle_id || "",
    is_default: location?.is_default || false,
    is_active: location?.is_active !== false,
    capacity_limit: location?.capacity_limit || "",
    contact_person: location?.contact_person || "",
    contact_phone: location?.contact_phone || "",
    notes: location?.notes || ""
  });

  const { data: vehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, license_plate, vehicle_type')
        .eq('status', 'active')
        .order('license_plate');
      if (error) throw error;
      return data;
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload: any = {
        name: formData.name,
        location_type: formData.location_type,
        address_type: formData.address_type,
        is_default: formData.is_default,
        is_active: formData.is_active,
        contact_person: formData.contact_person || null,
        contact_phone: formData.contact_phone || null,
        notes: formData.notes || null
      };

      if (formData.address_type === 'custom') {
        payload.address_custom = formData.address_custom;
      } else if (formData.address_type === 'gps') {
        payload.address_gps_lat = parseFloat(formData.address_gps_lat) || null;
        payload.address_gps_lng = parseFloat(formData.address_gps_lng) || null;
      }

      if (formData.location_type === 'vehicle' && formData.vehicle_id) {
        payload.vehicle_id = formData.vehicle_id;
      }

      if (formData.capacity_limit) {
        payload.capacity_limit = parseInt(formData.capacity_limit);
      }

      let error;
      if (location?.id) {
        ({ error } = await supabase
          .from('storage_locations')
          .update(payload)
          .eq('id', location.id));
      } else {
        ({ error } = await supabase
          .from('storage_locations')
          .insert([payload]));
      }

      if (error) throw error;

      toast({
        title: "Success",
        description: `Location ${location?.id ? 'updated' : 'created'} successfully`
      });
      
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {location?.id ? 'Edit' : 'Add'} Storage Location
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Location Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="e.g., Main Warehouse, Vehicle 123"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="location_type">Location Type *</Label>
              <Select
                value={formData.location_type}
                onValueChange={(value) => setFormData({ ...formData, location_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="warehouse">Warehouse</SelectItem>
                  <SelectItem value="vehicle">Vehicle</SelectItem>
                  <SelectItem value="facility">Facility</SelectItem>
                  <SelectItem value="mobile">Mobile Unit</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="address_type">Address Type *</Label>
              <Select
                value={formData.address_type}
                onValueChange={(value) => setFormData({ ...formData, address_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="company">Company Address</SelectItem>
                  <SelectItem value="custom">Custom Address</SelectItem>
                  <SelectItem value="gps">GPS Coordinates</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.address_type === 'custom' && (
            <div>
              <Label htmlFor="address_custom">Custom Address</Label>
              <Textarea
                id="address_custom"
                value={formData.address_custom}
                onChange={(e) => setFormData({ ...formData, address_custom: e.target.value })}
                placeholder="Enter full address"
              />
            </div>
          )}

          {formData.address_type === 'gps' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="address_gps_lat">Latitude</Label>
                <Input
                  id="address_gps_lat"
                  type="number"
                  step="any"
                  value={formData.address_gps_lat}
                  onChange={(e) => setFormData({ ...formData, address_gps_lat: e.target.value })}
                  placeholder="e.g., 40.7128"
                />
              </div>
              <div>
                <Label htmlFor="address_gps_lng">Longitude</Label>
                <Input
                  id="address_gps_lng"
                  type="number"
                  step="any"
                  value={formData.address_gps_lng}
                  onChange={(e) => setFormData({ ...formData, address_gps_lng: e.target.value })}
                  placeholder="e.g., -74.0060"
                />
              </div>
            </div>
          )}

          {formData.location_type === 'vehicle' && vehicles && (
            <div>
              <Label htmlFor="vehicle_id">Assign to Vehicle</Label>
              <Select
                value={formData.vehicle_id}
                onValueChange={(value) => setFormData({ ...formData, vehicle_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle..." />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.license_plate} - {vehicle.vehicle_type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="capacity_limit">Capacity Limit (items)</Label>
              <Input
                id="capacity_limit"
                type="number"
                value={formData.capacity_limit}
                onChange={(e) => setFormData({ ...formData, capacity_limit: e.target.value })}
                placeholder="Optional"
              />
            </div>
            <div>
              <Label htmlFor="contact_phone">Contact Phone</Label>
              <Input
                id="contact_phone"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                placeholder="Optional"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="contact_person">Contact Person</Label>
            <Input
              id="contact_person"
              value={formData.contact_person}
              onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
              placeholder="Optional"
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional information..."
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                id="is_default"
                checked={formData.is_default}
                onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
              />
              <Label htmlFor="is_default" className="cursor-pointer">Set as default location</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active" className="cursor-pointer">Active</Label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : location?.id ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
