import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, Settings, Users, Package } from "lucide-react";
import { toast } from "sonner";

export const MaintenanceSettingsTab: React.FC = () => {
  const [inHouseEnabled, setInHouseEnabled] = useState(false);
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
    },
    onSuccess: (data) => {
      setInHouseEnabled(data.enable_inhouse_features);
    }
  });

  // Fetch task types
  const { data: taskTypes } = useQuery({
    queryKey: ["maintenance-task-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance_task_types")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    }
  });

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

  const handleInHouseToggle = (enabled: boolean) => {
    setInHouseEnabled(enabled);
    updateInHouseFeatures.mutate(enabled);
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
          <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div>
              <h4 className="font-medium text-blue-900">In-House Shop Management</h4>
              <p className="text-sm text-blue-600 mt-1">
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

      {/* Default Intervals */}
      <Card>
        <CardHeader>
          <CardTitle>Default Maintenance Intervals</CardTitle>
          <CardDescription>
            Configure default service intervals for different maintenance types
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task Type</TableHead>
                <TableHead>Default Miles</TableHead>
                <TableHead>Default Days</TableHead>
                <TableHead>Default Cost</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {taskTypes?.map((taskType) => (
                <TableRow key={taskType.id}>
                  <TableCell className="font-medium">{taskType.name}</TableCell>
                  <TableCell>{taskType.default_interval_miles || "—"}</TableCell>
                  <TableCell>{taskType.default_interval_days || "—"}</TableCell>
                  <TableCell>${taskType.default_cost || 0}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add New Task Type
            </Button>
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
                <TableHead>Status</TableHead>
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
                    {vendor.service_specialties?.join(", ") || "General"}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      vendor.is_active 
                        ? "bg-green-100 text-green-800" 
                        : "bg-red-100 text-red-800"
                    }`}>
                      {vendor.is_active ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add New Vendor
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notification Timing */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Timing</CardTitle>
          <CardDescription>
            Configure when and how maintenance reminders are sent
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="advance-days">Advance Notice (Days)</Label>
              <Input 
                id="advance-days"
                type="number" 
                defaultValue="7"
                min="1"
                max="30"
              />
            </div>
            <div>
              <Label htmlFor="send-time">Daily Send Time</Label>
              <Select defaultValue="08:00">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }, (_, i) => (
                    <SelectItem key={i} value={`${i.toString().padStart(2, '0')}:00`}>
                      {`${i.toString().padStart(2, '0')}:00`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="from-email">From Email</Label>
              <Input 
                id="from-email"
                type="email" 
                placeholder="maintenance@company.com"
              />
            </div>
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
    </div>
  );
};