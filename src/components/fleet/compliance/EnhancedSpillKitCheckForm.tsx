import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Camera, Clock, CheckCircle, AlertCircle, Package, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PhotoCapture } from "./PhotoCapture";

type Props = {
  onSaved?: () => void;
  onCancel?: () => void;
};

type SpillKitTemplate = {
  template_id: string;
  template_name: string;
  items: any; // JSON from database
};

type ItemCondition = {
  status: 'present' | 'missing' | 'low' | 'expired';
  actual_quantity?: number;
  expiration_date?: string;
  notes?: string;
};

export const EnhancedSpillKitCheckForm: React.FC<Props> = ({ onSaved, onCancel }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [vehicleId, setVehicleId] = useState<string>("");
  const [selectedTemplate, setSelectedTemplate] = useState<SpillKitTemplate | null>(null);
  const [itemConditions, setItemConditions] = useState<Record<string, ItemCondition>>({});
  const [photos, setPhotos] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [weather, setWeather] = useState("");
  const [checkDuration, setCheckDuration] = useState<number>(0);
  const [checkStartTime] = useState(Date.now());
  const [autoRestockRequests, setAutoRestockRequests] = useState<boolean>(true);

  // Fetch vehicles
  const { data: vehicles } = useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("id, license_plate, vehicle_type")
        .eq("status", "active")
        .order("license_plate");
      if (error) throw error;
      return data;
    }
  });

  // Fetch spill kit template for selected vehicle
  const { data: templateData, isLoading: templateLoading } = useQuery({
    queryKey: ["spill-kit-template", vehicleId],
    queryFn: async () => {
      if (!vehicleId) return null;
      
      const vehicle = vehicles?.find(v => v.id === vehicleId);
      if (!vehicle) return null;

      const { data, error } = await supabase.rpc('get_spill_kit_template_for_vehicle', {
        vehicle_type_param: vehicle.vehicle_type || 'truck'
      });
      if (error) throw error;
      return data?.[0] || null;
    },
    enabled: !!vehicleId && !!vehicles
  });

  // Update template when data loads
  useEffect(() => {
    if (templateData) {
      setSelectedTemplate(templateData);
      // Initialize item conditions
      const initialConditions: Record<string, ItemCondition> = {};
      const items = Array.isArray(templateData.items) ? templateData.items : [];
      items.forEach((item: any) => {
        initialConditions[item.id] = { status: 'present' };
      });
      setItemConditions(initialConditions);
    }
  }, [templateData]);

  // Calculate completion percentage
  const completionPercentage = useMemo(() => {
    if (!selectedTemplate) return 0;
    const items = Array.isArray(selectedTemplate.items) ? selectedTemplate.items : [];
    const totalItems = items.length;
    const checkedItems = Object.keys(itemConditions).length;
    return Math.round((checkedItems / totalItems) * 100);
  }, [selectedTemplate, itemConditions]);

  // Calculate overall kit status
  const kitStatus = useMemo(() => {
    if (!selectedTemplate) return 'unknown';
    
    const conditions = Object.values(itemConditions);
    const items = Array.isArray(selectedTemplate.items) ? selectedTemplate.items : [];
    const criticalItems = items.filter((item: any) => item.critical_item);
    const criticalStatuses = criticalItems.map((item: any) => itemConditions[item.id]?.status);
    
    if (criticalStatuses.some(status => status === 'missing')) return 'failed';
    if (conditions.some(c => c.status === 'missing' || c.status === 'expired')) return 'partial';
    if (conditions.some(c => c.status === 'low')) return 'warning';
    return 'compliant';
  }, [selectedTemplate, itemConditions]);

  // Update item condition
  const updateItemCondition = (itemId: string, field: keyof ItemCondition, value: any) => {
    setItemConditions(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value
      }
    }));
  };

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!vehicleId || !selectedTemplate) {
        throw new Error("Vehicle and template selection required");
      }

      const duration = Math.round((Date.now() - checkStartTime) / 1000 / 60); // minutes
      const nextCheckDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      
      // Calculate missing items
      const missingItems = Object.entries(itemConditions)
        .filter(([_, condition]) => condition.status === 'missing')
        .map(([itemId, _]) => {
          const items = Array.isArray(selectedTemplate.items) ? selectedTemplate.items : [];
          const item = items.find((i: any) => i.id === itemId);
          return {
            name: item?.item_name || itemId,
            quantity: item?.required_quantity || 1
          };
        });
      
      const { data, error } = await supabase
        .from("vehicle_spill_kit_checks")
        .insert({
          vehicle_id: vehicleId,
          template_id: selectedTemplate.template_id,
          has_kit: kitStatus !== 'failed',
          item_conditions: itemConditions,
          missing_items: missingItems,
          photos,
          notes,
          weather_conditions: weather,
          inspection_duration_minutes: duration,
          completion_status: kitStatus,
          next_check_due: nextCheckDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
          checked_at: new Date().toISOString()
        });

      if (error) throw error;

      // Generate automatic restock request if enabled and items are missing
      if (autoRestockRequests && missingItems.length > 0) {
        await supabase.rpc("generate_spill_kit_restock_request", {
          p_vehicle_id: vehicleId,
          p_missing_items: missingItems,
          p_template_id: selectedTemplate.template_id || null
        });
      }

      return data;
    },
    onSuccess: () => {
      toast({
        title: "Spill Kit Check Saved",
        description: "The inspection has been recorded successfully."
      });
      queryClient.invalidateQueries({ queryKey: ["spill-kits-status"] });
      onSaved?.();
    },
    onError: (error) => {
      toast({
        title: "Error Saving Check",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const canSave = vehicleId && selectedTemplate && Object.keys(itemConditions).length > 0;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'partial': return <AlertCircle className="w-4 h-4 text-orange-600" />;
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-600" />;
      default: return <Package className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'bg-green-100 text-green-800 border-green-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'partial': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Enhanced Spill Kit Inspection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Vehicle Selection */}
          <div>
            <label className="text-sm font-medium mb-2 block">Select Vehicle</label>
            <Select value={vehicleId} onValueChange={setVehicleId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a vehicle to inspect..." />
              </SelectTrigger>
              <SelectContent>
                {vehicles?.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.license_plate} ({vehicle.vehicle_type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Inspection Progress */}
          {selectedTemplate && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Inspection Progress</span>
                <span className="text-sm text-muted-foreground">{completionPercentage}% Complete</span>
              </div>
              <Progress value={completionPercentage} className="h-2" />
              <div className="flex items-center gap-2">
                {getStatusIcon(kitStatus)}
                <Badge className={getStatusColor(kitStatus)}>
                  {kitStatus.charAt(0).toUpperCase() + kitStatus.slice(1)}
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Template Items Checklist */}
      {selectedTemplate && (
        <Card>
          <CardHeader>
            <CardTitle>
              Kit Contents Inspection - {selectedTemplate.template_name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {templateLoading ? (
              <div className="text-center py-4">Loading template...</div>
            ) : (
              <div className="space-y-4">
                {['absorbents', 'ppe', 'disposal', 'documentation'].map(category => {
                  const items = Array.isArray(selectedTemplate.items) ? selectedTemplate.items : [];
                  const categoryItems = items.filter((item: any) => item.category === category);
                  if (categoryItems.length === 0) return null;

                  return (
                    <div key={category}>
                      <h4 className="font-medium capitalize mb-3 text-sm">{category.replace('_', ' ')}</h4>
                      <div className="space-y-3">
                        {categoryItems.map((item: any) => (
                          <div key={item.id} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{item.item_name}</span>
                                  {item.critical_item && (
                                    <Badge variant="outline" className="text-xs">Critical</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  Required: {item.required_quantity}
                                </p>
                              </div>
                            </div>

                            {/* Status Selection */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                              {['present', 'missing', 'low', 'expired'].map(status => (
                                <label key={status} className="flex items-center space-x-2 cursor-pointer">
                                  <Checkbox
                                    checked={itemConditions[item.id]?.status === status}
                                    onCheckedChange={() => 
                                      updateItemCondition(item.id, 'status', status)
                                    }
                                  />
                                  <span className="text-sm capitalize">{status}</span>
                                </label>
                              ))}
                            </div>

                            {/* Additional fields based on status */}
                            {itemConditions[item.id]?.status && itemConditions[item.id]?.status !== 'missing' && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                                <div>
                                  <label className="text-xs font-medium mb-1 block">Actual Quantity</label>
                                  <Input
                                    type="number"
                                    placeholder="0"
                                    value={itemConditions[item.id]?.actual_quantity || ''}
                                    onChange={(e) => updateItemCondition(item.id, 'actual_quantity', parseInt(e.target.value))}
                                  />
                                </div>
                                {item.expiration_trackable && (
                                  <div>
                                    <label className="text-xs font-medium mb-1 block">Expiration Date</label>
                                    <Input
                                      type="date"
                                      value={itemConditions[item.id]?.expiration_date || ''}
                                      onChange={(e) => updateItemCondition(item.id, 'expiration_date', e.target.value)}
                                    />
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Item notes */}
                            <div className="mt-3">
                              <label className="text-xs font-medium mb-1 block">Item Notes</label>
                              <Input
                                placeholder="Any issues or observations..."
                                value={itemConditions[item.id]?.notes || ''}
                                onChange={(e) => updateItemCondition(item.id, 'notes', e.target.value)}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                      <Separator className="my-4" />
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Photos and Additional Info */}
      {selectedTemplate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Documentation & Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Photo Documentation */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Photo Documentation</Label>
              <PhotoCapture 
                onPhotosChange={setPhotos}
                maxPhotos={5}
                initialPhotos={photos}
              />
            </div>

            {/* Automation Options */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Automation Options</Label>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="auto-restock">Automatic Restock Requests</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically generate restock requests for missing items
                  </p>
                </div>
                <Switch
                  id="auto-restock"
                  checked={autoRestockRequests}
                  onCheckedChange={setAutoRestockRequests}
                />
              </div>
            </div>

            {/* Weather Conditions */}
            <div>
              <label className="text-sm font-medium mb-2 block">Weather Conditions</label>
              <Select value={weather} onValueChange={setWeather}>
                <SelectTrigger>
                  <SelectValue placeholder="Select weather conditions..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clear">Clear</SelectItem>
                  <SelectItem value="cloudy">Cloudy</SelectItem>
                  <SelectItem value="rainy">Rainy</SelectItem>
                  <SelectItem value="snowy">Snowy</SelectItem>
                  <SelectItem value="windy">Windy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* General Notes */}
            <div>
              <label className="text-sm font-medium mb-2 block">General Notes</label>
              <Textarea
                placeholder="Any additional observations, recommendations, or issues..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          onClick={() => saveMutation.mutate()}
          disabled={!canSave || saveMutation.isPending}
        >
          {saveMutation.isPending ? (
            <>
              <Clock className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Complete Inspection'
          )}
        </Button>
      </div>
    </div>
  );
};