import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/clerk-react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Camera, Clock, CheckCircle, AlertCircle, Package, Upload, Truck, CalendarIcon, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PhotoCapture } from "./PhotoCapture";
import { StockVehicleSelectionModal } from "../StockVehicleSelectionModal";
import { VehicleSelectedDisplay } from "../VehicleSelectedDisplay";
import { WeatherSelectionModal } from "./WeatherSelectionModal";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { useGeolocation } from "@/hooks/useGeolocation";
import { Cloud, Loader2 } from "lucide-react";

type Props = {
  onSaved?: () => void;
  onCancel?: () => void;
};

type SpillKitTemplate = {
  template_id: string;
  template_name: string;
  items: any; // JSON from database
  description?: string;
  is_default?: boolean;
  vehicle_types?: string[];
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
  const { user } = useUser();
  
  const [vehicleId, setVehicleId] = useState<string>("");
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<SpillKitTemplate | null>(null);
  const [itemConditions, setItemConditions] = useState<Record<string, ItemCondition>>({});
  const [photos, setPhotos] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [weather, setWeather] = useState<string[]>([]);
  const [checkDuration, setCheckDuration] = useState<number>(0);
  const [checkStartTime] = useState(Date.now());
  const [autoRestockRequests, setAutoRestockRequests] = useState<boolean>(true);
  const [allMarkedPresent, setAllMarkedPresent] = useState(false);
  const [fetchingWeather, setFetchingWeather] = useState(false);
  const [weatherDetails, setWeatherDetails] = useState<string>("");
  const [isWeatherModalOpen, setIsWeatherModalOpen] = useState(false);
  
  const { latitude, longitude, error: gpsError } = useGeolocation();

  const fetchCurrentWeather = async () => {
    if (!latitude || !longitude) {
      toast({
        title: "Location Required",
        description: "Please enable location services to fetch weather",
        variant: "destructive"
      });
      return;
    }

    setFetchingWeather(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-current-weather', {
        body: { latitude, longitude }
      });

      if (error) throw error;

      // Don't auto-select manual weather - only set weather details
      // Format description to Title Case
      const titleCaseDescription = data.description
        .split(' ')
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      setWeatherDetails(`${titleCaseDescription} • ${data.temp}°F • ${data.humidity}% humidity • Wind: ${data.windSpeed} mph`);
      
      toast({
        title: "Weather Updated",
        description: `Current conditions: ${data.description}`,
      });
    } catch (error) {
      console.error('Weather fetch error:', error);
      toast({
        title: "Error",
        description: "Failed to fetch weather data",
        variant: "destructive"
      });
    } finally {
      setFetchingWeather(false);
    }
  };

  const handleVehicleSelect = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setVehicleId(vehicle.id);
    setIsVehicleModalOpen(false);
  };

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

  // Fetch all available spill kit templates
  const { data: allTemplates } = useQuery({
    queryKey: ["spill-kit-templates-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("spill_kit_templates")
        .select(`
          id,
          name,
          description,
          vehicle_types,
          is_default,
          is_active,
          spill_kit_template_items(*)
        `)
        .eq("is_active", true)
        .order("is_default", { ascending: false })
        .order("name");
      if (error) throw error;
      return data.map(template => ({
        template_id: template.id,
        template_name: template.name,
        items: template.spill_kit_template_items || [],
        description: template.description,
        is_default: template.is_default,
        vehicle_types: template.vehicle_types
      }));
    }
  });

  // Fetch default spill kit template for selected vehicle
  const { data: autoTemplateData, isLoading: templateLoading } = useQuery({
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

  const [manuallySelectedTemplateId, setManuallySelectedTemplateId] = useState<string | null>(null);

  // Update template when data loads or manual selection changes
  useEffect(() => {
    let templateToUse = null;
    
    // If user manually selected a template, use that
    if (manuallySelectedTemplateId && allTemplates) {
      templateToUse = allTemplates.find(t => t.template_id === manuallySelectedTemplateId);
    } 
    // Otherwise use the auto-selected template
    else if (autoTemplateData) {
      templateToUse = autoTemplateData;
    }
    // If no auto template but we have templates, use the default one
    else if (allTemplates && allTemplates.length > 0 && !manuallySelectedTemplateId) {
      const defaultTemplate = allTemplates.find(t => t.is_default);
      if (defaultTemplate) {
        templateToUse = defaultTemplate;
        setManuallySelectedTemplateId(defaultTemplate.template_id);
      }
    }
    
    if (templateToUse) {
      setSelectedTemplate(templateToUse);
      // Initialize item conditions - don't pre-select any status
      const initialConditions: Record<string, ItemCondition> = {};
      setItemConditions(initialConditions);
      // Reset the "Mark All as Present" button state
      setAllMarkedPresent(false);
    }
  }, [autoTemplateData, manuallySelectedTemplateId, allTemplates]);

  // Calculate completion percentage
  const completionPercentage = useMemo(() => {
    if (!selectedTemplate) return 0;
    const items = Array.isArray(selectedTemplate.items) ? selectedTemplate.items : [];
    const totalItems = items.length;
    if (totalItems === 0) return 0;
    
    // Count items that have any status selected
    const checkedItems = Object.values(itemConditions).filter(condition => condition.status).length;
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
        .insert([{
          vehicle_id: vehicleId,
          template_id: selectedTemplate.template_id,
          has_kit: kitStatus !== 'failed',
          item_conditions: itemConditions,
          photos,
          notes,
          weather_conditions: weather.length > 0 ? weather.join(", ") : null,
          weather_details: weatherDetails || null,
          inspection_duration_minutes: duration,
          completion_status: kitStatus,
          next_check_due: nextCheckDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
          checked_at: new Date().toISOString(),
          checked_by_clerk: user?.id || null
        }]);

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
      queryClient.invalidateQueries({ queryKey: ["spill-kit-inspection-history"] });
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

  const canSave = useMemo(() => {
    if (!vehicleId || !selectedTemplate) return false;
    
    const items = Array.isArray(selectedTemplate.items) ? selectedTemplate.items : [];
    if (items.length === 0) return false;
    
    // Check if at least some items have been checked (have a status)
    const checkedItems = Object.values(itemConditions).filter(condition => condition.status).length;
    return checkedItems > 0;
  }, [vehicleId, selectedTemplate, itemConditions]);

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
      case 'compliant': return 'bg-gradient-to-r from-green-500 to-green-600 text-white font-bold border-0';
      case 'warning': return 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-bold border-0';
      case 'partial': return 'bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold border-0';
      case 'failed': return 'bg-gradient-to-r from-red-500 to-red-600 text-white font-bold border-0';
      default: return 'bg-gradient-to-r from-gray-400 to-gray-500 text-white font-bold border-0';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle>
            Select Vehicle and Template
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Vehicle Selection */}
          <div>
            <label className="text-sm font-medium mb-2 block">Select Vehicle *</label>
            {selectedVehicle ? (
              <VehicleSelectedDisplay 
                vehicleId={vehicleId}
                onChangeClick={() => setIsVehicleModalOpen(true)}
              />
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start"
                onClick={() => setIsVehicleModalOpen(true)}
              >
                <Package className="mr-2 h-4 w-4" />
                Select vehicle to inspect...
              </Button>
            )}
          </div>

          <StockVehicleSelectionModal
            open={isVehicleModalOpen}
            onOpenChange={setIsVehicleModalOpen}
            selectedDate={new Date()}
            selectedVehicle={selectedVehicle}
            onVehicleSelect={handleVehicleSelect}
          />

          {/* Template Selection */}
          {vehicleId && allTemplates && allTemplates.length > 0 && (
            <div>
              <label className="text-sm font-medium mb-2 block">Inspection Template</label>
              <Select
                value={manuallySelectedTemplateId || autoTemplateData?.template_id || ""}
                onValueChange={(value) => setManuallySelectedTemplateId(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a template..." />
                </SelectTrigger>
                <SelectContent>
                  {allTemplates.map((template) => (
                    <SelectItem key={template.template_id} value={template.template_id}>
                      <div className="flex items-center gap-2">
                        <span>{template.template_name}</span>
                        {template.is_default && (
                          <Badge variant="secondary" className="text-xs">Default</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTemplate?.description && (
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedTemplate.description}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Template Items Checklist */}
      {selectedTemplate && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                Kit Contents Inspection - {selectedTemplate.template_name}
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (allMarkedPresent) {
                    // Clear all selections
                    setItemConditions({});
                    setAllMarkedPresent(false);
                    toast({
                      title: "All selections cleared",
                      description: "All item conditions have been reset",
                    });
                  } else {
                    // Mark all as present
                    const items = Array.isArray(selectedTemplate.items) ? selectedTemplate.items : [];
                    const allPresent: Record<string, ItemCondition> = {};
                    items.forEach((item: any) => {
                      allPresent[item.id] = { status: 'present' };
                    });
                    setItemConditions(allPresent);
                    setAllMarkedPresent(true);
                    toast({
                      title: "All items marked as present",
                      description: `${items.length} items updated`,
                    });
                  }
                }}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {allMarkedPresent ? "Clear All Selections" : "Mark All as Present"}
              </Button>
            </div>
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
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <Button
                                          variant="outline"
                                          className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !itemConditions[item.id]?.expiration_date && "text-muted-foreground"
                                          )}
                                        >
                                          <CalendarIcon className="mr-2 h-4 w-4" />
                                          {itemConditions[item.id]?.expiration_date ? (
                                            format(parseISO(itemConditions[item.id].expiration_date), "MMM dd, yyyy")
                                          ) : (
                                            <span>Select date</span>
                                          )}
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                          mode="single"
                                          selected={itemConditions[item.id]?.expiration_date ? parseISO(itemConditions[item.id].expiration_date) : undefined}
                                          onSelect={(date) => {
                                            if (date) {
                                              updateItemCondition(item.id, 'expiration_date', format(date, 'yyyy-MM-dd'));
                                            }
                                          }}
                                          initialFocus
                                          className="pointer-events-auto"
                                        />
                                      </PopoverContent>
                                    </Popover>
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
              <div className="space-y-2">
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
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2 max-w-4xl">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={fetchCurrentWeather}
                    disabled={fetchingWeather || !latitude}
                    className="justify-center gap-2"
                  >
                    {fetchingWeather ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="hidden sm:inline">Loading...</span>
                      </>
                    ) : (
                      <>
                        <MapPin className="h-4 w-4" />
                        <span className="hidden sm:inline">Auto-Add Weather</span>
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsWeatherModalOpen(true)}
                    className="justify-center gap-2"
                  >
                    <Cloud className="h-4 w-4" />
                    {weather.length > 0 ? (
                      <span className="capitalize truncate">{weather.join(", ")}</span>
                    ) : (
                      <span className="hidden sm:inline">Select Weather Manually</span>
                    )}
                  </Button>
                </div>
                {weatherDetails && (
                  <p className="text-xs text-muted-foreground">{weatherDetails}</p>
                )}
                {gpsError && (
                  <p className="text-xs text-destructive">{gpsError}</p>
                )}
              </div>
            </div>

            <WeatherSelectionModal
              isOpen={isWeatherModalOpen}
              onClose={() => setIsWeatherModalOpen(false)}
              onSelect={setWeather}
              currentValue={weather}
            />

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

      {/* Inspection Progress - Moved to bottom */}
      {selectedTemplate && (
        <Card>
          <CardContent className="pt-6">
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