import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Settings, Users, Package } from "lucide-react";
import { VendorManagementModal } from "./VendorManagementModal";
import { toast } from "sonner";

export const MaintenanceSettingsTab: React.FC = () => {
  const [inHouseEnabled, setInHouseEnabled] = useState(false);
  const [vendorModalOpen, setVendorModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Database['public']['Tables']['maintenance_vendors']['Row'] | null>(null);
  const [vendorModalMode, setVendorModalMode] = useState<"create" | "edit">("create");
  const queryClient = useQueryClient();

  // Fetch company settings
  const { data: companySettings } = useQuery({
    queryKey: ["company-maintenance-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_maintenance_settings")
        .select("*")
        .single();
      if (error) throw error;
      return data;
    }
  });

  // Update state when data changes
  React.useEffect(() => {
    if (companySettings) {
      setInHouseEnabled(companySettings.enable_inhouse_features);
    }
  }, [companySettings]);


  // Fetch vendors
  const { data: vendors } = useQuery({
    queryKey: ["maintenance-vendors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance_vendors")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    }
  });

  // Update in-house features setting
  const updateInHouseFeatures = useMutation({
    mutationFn: async (enabled: boolean) => {
      const { data, error } = await supabase
        .from("company_maintenance_settings")
        .update({ enable_inhouse_features: enabled })
        .eq("id", companySettings?.id);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-maintenance-settings"] });
      toast.success("Settings updated successfully");
    },
    onError: () => {
      toast.error("Failed to update settings");
    }
  });

  // Delete vendor mutation
  const deleteVendor = useMutation({
    mutationFn: async (vendorId: string) => {
      const { error } = await supabase
        .from("maintenance_vendors")
        .delete()
        .eq("id", vendorId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-vendors"] });
      toast.success("Vendor deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete vendor");
    }
  });

  const handleInHouseToggle = (enabled: boolean) => {
    setInHouseEnabled(enabled);
    updateInHouseFeatures.mutate(enabled);
  };

  const handleCreateVendor = () => {
    setEditingVendor(null);
    setVendorModalMode("create");
    setVendorModalOpen(true);
  };

  const handleEditVendor = (vendor: any) => {
    setEditingVendor(vendor);
    setVendorModalMode("edit");
    setVendorModalOpen(true);
  };

  const handleDeleteVendor = (vendorId: string, vendorName: string) => {
    if (window.confirm(`Are you sure you want to delete vendor "${vendorName}"? This action cannot be undone.`)) {
      deleteVendor.mutate(vendorId);
    }
  };

  return (
    <div className="space-y-6">
      {/* In-House Features Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Enable In-House Maintenance Features
          </CardTitle>
          <CardDescription>
            Unlock advanced features for managing internal technicians, parts inventory, and scheduling calendar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">In-House Shop Management</h4>
              <p className="text-sm text-gray-600 mt-1">
                Enable this to access technician assignment, parts tracking, and drag-and-drop calendar scheduling
              </p>
            </div>
            <Switch 
              checked={inHouseEnabled}
              onCheckedChange={handleInHouseToggle}
            />
          </div>
        </CardContent>
      </Card>

      {/* Vendor Management */}
      <Card>
        <CardHeader>
          <CardTitle>Vendor Management</CardTitle>
          <CardDescription>
            Manage service providers and their contact information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Specialties</TableHead>
                <TableHead>Hourly Rate</TableHead>
                <TableHead>Daily Rate</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendors?.map((vendor) => (
                <TableRow key={vendor.id}>
                  <TableCell className="font-medium">{vendor.name}</TableCell>
                  <TableCell>{vendor.contact_name || "—"}</TableCell>
                  <TableCell>{vendor.phone || "—"}</TableCell>
                  <TableCell>
                    {vendor.service_specialties && vendor.service_specialties.length > 0 ? (
                      <Select>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder={`${vendor.service_specialties.length} specialties`} />
                        </SelectTrigger>
                        <SelectContent>
                          {vendor.service_specialties.map((specialty: string) => (
                            <SelectItem key={specialty} value={specialty}>
                              {specialty}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      "General"
                    )}
                  </TableCell>
                  <TableCell>{vendor.hourly_rate ? `$${vendor.hourly_rate}` : "—"}</TableCell>
                  <TableCell>{vendor.daily_rate ? `$${vendor.daily_rate}` : "—"}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleEditVendor(vendor)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDeleteVendor(vendor.id, vendor.name)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4">
            <Button onClick={handleCreateVendor}>
              <Plus className="w-4 h-4 mr-2" />
              Add New Vendor
            </Button>
          </div>
        </CardContent>
      </Card>


      {/* Data Retention */}
      <Card>
        <CardHeader>
          <CardTitle>Data Retention & Auditing</CardTitle>
          <CardDescription>
            Configure how long maintenance records are kept and change tracking
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="retention-days">Record Retention (Days)</Label>
              <Select defaultValue="2555">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="365">1 Year</SelectItem>
                  <SelectItem value="1095">3 Years</SelectItem>
                  <SelectItem value="1825">5 Years</SelectItem>
                  <SelectItem value="2555">7 Years</SelectItem>
                  <SelectItem value="-1">Forever</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="enable-audit">Enable Change History</Label>
              <Switch id="enable-audit" defaultChecked />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white">
          <Settings className="w-4 h-4 mr-2" />
          Save All Settings
        </Button>
      </div>

      <VendorManagementModal
        open={vendorModalOpen}
        onOpenChange={setVendorModalOpen}
        vendor={editingVendor}
        mode={vendorModalMode}
      />
    </div>
  );
};