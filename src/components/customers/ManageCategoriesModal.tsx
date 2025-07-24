import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Plus, 
  Copy, 
  Download, 
  Music, 
  FerrisWheel, 
  Trees, 
  HardHat,
  Trash2,
  Check,
  Palette
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface PinCategory {
  id: string;
  name: string;
  color: string;
  is_default: boolean;
}

interface TemplateCategory {
  name: string;
  icon: React.ReactNode;
  categories: string[];
}

interface ManageCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  customerName: string;
  existingCategories: Array<{ category_name: string; point_count: number }>;
  onCategoriesUpdated: () => void;
}

// Predefined color palette
const AVAILABLE_COLORS = [
  '#EF4444', // Red (default)
  '#F97316', // Orange
  '#F59E0B', // Amber
  '#EAB308', // Yellow
  '#84CC16', // Lime
  '#22C55E', // Green
  '#10B981', // Emerald
  '#14B8A6', // Teal
  '#06B6D4', // Cyan
  '#0EA5E9', // Sky
  '#3B82F6', // Blue
  '#6366F1', // Indigo
  '#8B5CF6', // Violet
  '#A855F7', // Purple
  '#D946EF', // Fuchsia
  '#EC4899', // Pink
  '#F43F5E', // Rose
  '#6B7280', // Gray
  '#374151', // Dark Gray
  '#1F2937', // Very Dark Gray
];

const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  {
    name: "Concerts",
    icon: <Music className="w-4 h-4" />,
    categories: [
      "Main Stage Entrance",
      "Backstage Access", 
      "VIP/Artist Entrance",
      "Merch & Vendor Booths",
      "Food & Beverage Areas",
      "First-Aid/Medical Tent",
      "Security Checkpoint",
      "Media/Press Pit",
      "Load-in Dock",
      "Emergency Exits"
    ]
  },
  {
    name: "Fairs & Carnivals",
    icon: <FerrisWheel className="w-4 h-4" />,
    categories: [
      "Grand Entrance",
      "Ride Queue Zones",
      "Game Alley/Midway",
      "Food Court/Concessions",
      "VIP/Sponsor Tent",
      "First-Aid Station",
      "Lost & Found",
      "Restroom Clusters",
      "Livestock/Petting Zoo",
      "Parking/Shuttle Pickup"
    ]
  },
  {
    name: "City Parks & Public Spaces",
    icon: <Trees className="w-4 h-4" />,
    categories: [
      "Park Entrance/Gate",
      "Playground",
      "Picnic Pavilion",
      "Restroom Facilities",
      "Dog Park",
      "Sports Fields/Courts",
      "Scenic Overlook/Fountain",
      "Bike Rack/Trailhead",
      "Event Stage/Bandstand",
      "Maintenance/Storage Shed"
    ]
  },
  {
    name: "Construction Sites",
    icon: <HardHat className="w-4 h-4" />,
    categories: [
      "Site Entrance/Security Gate",
      "Material Laydown Yard",
      "Equipment Storage/Yard",
      "Crane/Hoist Location",
      "Site Office/Trailer",
      "Worker Check-in/Time Clock",
      "First-Aid/Safety Station",
      "Concrete Pour Zone",
      "Tool Crib",
      "Emergency Assembly Point"
    ]
  }
];

export function ManageCategoriesModal({
  isOpen,
  onClose,
  customerId,
  customerName,
  existingCategories,
  onCategoriesUpdated
}: ManageCategoriesModalProps) {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#EF4444');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateCategory | null>(null);
  const [selectedTemplateCategories, setSelectedTemplateCategories] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing categories for this customer
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['pin-categories', customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pin_categories')
        .select('*')
        .eq('customer_id', customerId)
        .order('name');
      
      if (error) throw error;
      return data as PinCategory[];
    },
    enabled: isOpen
  });

  // Create new category mutation with automatic placeholder pin correction
  const createCategoryMutation = useMutation({
    mutationFn: async ({ name, color }: { name: string; color: string }) => {
      const { data, error } = await supabase
        .from('pin_categories')
        .insert({
          customer_id: customerId,
          name: name.trim(),
          color,
          is_default: false
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Fix any existing placeholder pins with Kansas coordinates for this customer
      await fixPlaceholderPinLocations();
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pin-categories', customerId] });
      setNewCategoryName('');
      setNewCategoryColor('#EF4444');
      toast({
        title: "Success",
        description: "Category created successfully",
      });
    },
    onError: (error) => {
      console.error('Error creating category:', error);
      toast({
        title: "Error",
        description: "Failed to create category",
        variant: "destructive",
      });
    }
  });

  // Function to fix placeholder pins that were created with Kansas coordinates
  const fixPlaceholderPinLocations = async () => {
    try {
      // Get customer's service locations
      const { data: serviceLocations } = await supabase
        .from('customer_service_locations')
        .select('*')
        .eq('customer_id', customerId);

      if (!serviceLocations || serviceLocations.length === 0) return;

      // Get the primary service location
      const primaryLocation = serviceLocations.find(loc => loc.is_default) || serviceLocations[0];
      let targetCoordinates: [number, number] | null = null;

      // Check if we already have GPS coordinates stored
      if (primaryLocation.gps_coordinates && typeof primaryLocation.gps_coordinates === 'string') {
        const [lng, lat] = primaryLocation.gps_coordinates.split(',').map(Number);
        if (!isNaN(lat) && !isNaN(lng)) {
          targetCoordinates = [lng, lat];
        }
      }

      // If no stored coordinates, try to geocode the address
      if (!targetCoordinates && primaryLocation.street && primaryLocation.city && primaryLocation.state) {
        const fullAddress = [
          primaryLocation.street,
          primaryLocation.street2,
          primaryLocation.city,
          primaryLocation.state,
          primaryLocation.zip
        ].filter(Boolean).join(' ');

        try {
          // Get Mapbox token
          const { data: tokenData } = await supabase.functions.invoke('get-mapbox-token');
          const mapboxToken = tokenData?.token;

          if (mapboxToken) {
            const encodedAddress = encodeURIComponent(fullAddress.trim());
            const response = await fetch(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${mapboxToken}&limit=1&country=us`
            );

            if (response.ok) {
              const data = await response.json();
              if (data.features && data.features.length > 0) {
                const [lng, lat] = data.features[0].center;
                targetCoordinates = [lng, lat];

                // Store the geocoded coordinates for future use
                await supabase
                  .from('customer_service_locations')
                  .update({ 
                    gps_coordinates: `${lng},${lat}` 
                  })
                  .eq('id', primaryLocation.id);
              }
            }
          }
        } catch (geocodeError) {
          console.error('Geocoding error:', geocodeError);
        }
      }

      // If we have target coordinates, update any placeholder pins with Kansas coordinates
      if (targetCoordinates) {
        const [targetLng, targetLat] = targetCoordinates;

        // Find placeholder pins with Kansas coordinates (39.8283, -98.5795)
        const { data: placeholderPins } = await supabase
          .from('service_location_coordinates')
          .select('id, service_location_id')
          .in('service_location_id', serviceLocations.map(loc => loc.id))
          .eq('latitude', 39.8283)
          .eq('longitude', -98.5795);

        if (placeholderPins && placeholderPins.length > 0) {
          // Update each placeholder pin to use the customer's actual coordinates
          const updatePromises = placeholderPins.map(pin => 
            supabase
              .from('service_location_coordinates')
              .update({
                latitude: targetLat,
                longitude: targetLng,
                description: 'Pin location updated to customer address'
              })
              .eq('id', pin.id)
          );

          await Promise.all(updatePromises);

          console.log(`Updated ${placeholderPins.length} placeholder pins to customer location`);
        }
      }
    } catch (error) {
      console.error('Error fixing placeholder pin locations:', error);
    }
  };

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      const { error } = await supabase
        .from('pin_categories')
        .delete()
        .eq('id', categoryId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pin-categories', customerId] });
      toast({
        title: "Success",
        description: "Category deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Error deleting category:', error);
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive",
      });
    }
  });

  // Update category color mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ categoryId, color }: { categoryId: string; color: string }) => {
      const { error } = await supabase
        .from('pin_categories')
        .update({ color })
        .eq('id', categoryId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pin-categories', customerId] });
      toast({
        title: "Success",
        description: "Category color updated successfully",
      });
    },
    onError: (error) => {
      console.error('Error updating category:', error);
      toast({
        title: "Error",
        description: "Failed to update category color",
        variant: "destructive",
      });
    }
  });

  const handleAddCustomCategory = () => {
    if (!newCategoryName.trim()) return;
    
    // Check if category already exists
    const exists = categories.some(cat => 
      cat.name.toLowerCase() === newCategoryName.trim().toLowerCase()
    );
    
    if (exists) {
      toast({
        title: "Error",
        description: "A category with this name already exists",
        variant: "destructive",
      });
      return;
    }
    
    createCategoryMutation.mutate({
      name: newCategoryName.trim(),
      color: newCategoryColor
    });
  };

  const handleDeleteCategory = (categoryId: string, categoryName: string) => {
    if (categoryName === 'Uncategorized') {
      toast({
        title: "Error",
        description: "Cannot delete the default Uncategorized category",
        variant: "destructive",
      });
      return;
    }
    
    deleteCategoryMutation.mutate(categoryId);
  };

  const handleColorChange = (categoryId: string, color: string) => {
    updateCategoryMutation.mutate({ categoryId, color });
  };

  const handleTemplateSelection = (template: TemplateCategory) => {
    setSelectedTemplate(template);
    setSelectedTemplateCategories(new Set(template.categories));
  };

  const handleTemplateCategoryToggle = (category: string) => {
    const newSelected = new Set(selectedTemplateCategories);
    if (newSelected.has(category)) {
      newSelected.delete(category);
    } else {
      newSelected.add(category);
    }
    setSelectedTemplateCategories(newSelected);
  };

  const handleSelectAllTemplate = () => {
    if (!selectedTemplate) return;
    
    if (selectedTemplateCategories.size === selectedTemplate.categories.length) {
      setSelectedTemplateCategories(new Set());
    } else {
      setSelectedTemplateCategories(new Set(selectedTemplate.categories));
    }
  };

  const exportTemplateCategories = () => {
    if (!selectedTemplate) return;
    
    const selectedCats = Array.from(selectedTemplateCategories);
    const csvData = selectedCats.map(cat => ({
      'Customer Name': customerName,
      'Category': cat,
      'Location': `${customerName} - Main Location`,
      'Coordinates': 'N/A - Template',
      'Description': `Template category from ${selectedTemplate.name}`
    }));

    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => `"${row[header as keyof typeof row]}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `category-template-${selectedTemplate.name.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Success",
      description: `${selectedCats.length} template categories exported to CSV`,
    });
  };

  const copyTemplateCategories = () => {
    if (!selectedTemplate) return;
    
    const selectedCats = Array.from(selectedTemplateCategories);
    const textData = selectedCats.map(cat => 
      `${customerName} - ${cat}\nCategory: ${cat}\nLocation: ${customerName} - Main Location\nCoordinates: N/A - Template\nDescription: Template category from ${selectedTemplate.name}\n`
    ).join('\n---\n');

    navigator.clipboard.writeText(textData).then(() => {
      toast({
        title: "Success",
        description: `${selectedCats.length} template categories copied to clipboard`,
      });
    }).catch(() => {
      toast({
        title: "Error",
        description: "Failed to copy template categories",
        variant: "destructive",
      });
    });
  };

  const ColorPicker = ({ color, onChange }: { color: string; onChange: (color: string) => void }) => (
    <div className="flex flex-wrap gap-1 p-2 border rounded-lg bg-muted/50">
      {AVAILABLE_COLORS.map((availableColor) => (
        <button
          key={availableColor}
          type="button"
          className={`w-6 h-6 rounded-full border-2 transition-all ${
            color === availableColor ? 'border-foreground scale-110' : 'border-transparent hover:scale-105'
          }`}
          style={{ backgroundColor: availableColor }}
          onClick={() => onChange(availableColor)}
          title={availableColor}
        />
      ))}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Manage Categories</DialogTitle>
          <DialogDescription>
            Create custom categories with colors or choose from pre-built templates for organizing your GPS coordinates
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="custom" className="w-full flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="custom">Custom Categories</TabsTrigger>
            <TabsTrigger value="templates">Template Ideas</TabsTrigger>
          </TabsList>

          <TabsContent value="custom" className="space-y-4 overflow-y-auto max-h-[60vh]">
            <div className="space-y-4">
              {/* Add New Category */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Add New Category</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter category name..."
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddCustomCategory()}
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleAddCustomCategory} 
                      disabled={!newCategoryName.trim() || createCategoryMutation.isPending}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add
                    </Button>
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-2 block">Category Color</label>
                    <ColorPicker color={newCategoryColor} onChange={setNewCategoryColor} />
                  </div>
                </CardContent>
              </Card>

              {/* Existing Categories */}
              {isLoading ? (
                <div className="text-center text-muted-foreground">Loading categories...</div>
              ) : categories.length > 0 ? (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Your Categories</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {categories.map((category) => (
                        <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-4 h-4 rounded-full border"
                              style={{ backgroundColor: category.color }}
                            />
                            <span className="text-sm font-medium">{category.name}</span>
                            {category.is_default && (
                              <Badge variant="secondary" className="text-xs">Default</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {!category.is_default && (
                              <>
                                <div className="relative group">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="p-1 h-auto"
                                  >
                                    <Palette className="w-3 h-3" />
                                  </Button>
                                  <div className="absolute top-full right-0 mt-1 hidden group-hover:block z-50">
                                    <ColorPicker 
                                      color={category.color} 
                                      onChange={(color) => handleColorChange(category.id, color)} 
                                    />
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteCategory(category.id, category.name)}
                                  disabled={deleteCategoryMutation.isPending}
                                  className="p-1 h-auto text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No categories found. Add your first category above.
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4 overflow-y-auto max-h-[60vh]">
            <div className="grid grid-cols-2 gap-4">
              {TEMPLATE_CATEGORIES.map((template) => (
                <Card 
                  key={template.name} 
                  className={`cursor-pointer transition-colors ${
                    selectedTemplate?.name === template.name ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => handleTemplateSelection(template)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      {template.icon}
                      {template.name}
                      {selectedTemplate?.name === template.name && (
                        <Check className="w-4 h-4 text-primary ml-auto" />
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      {template.categories.length} categories
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {selectedTemplate && (
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      {selectedTemplate.icon}
                      {selectedTemplate.name} Categories
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAllTemplate}
                      >
                        {selectedTemplateCategories.size === selectedTemplate.categories.length ? 'Deselect All' : 'Select All'}
                      </Button>
                      {selectedTemplateCategories.size > 0 && (
                        <>
                          <Button variant="outline" size="sm" onClick={exportTemplateCategories}>
                            <Download className="w-3 h-3 mr-1" />
                            Export CSV
                          </Button>
                          <Button variant="outline" size="sm" onClick={copyTemplateCategories}>
                            <Copy className="w-3 h-3 mr-1" />
                            Copy
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {selectedTemplateCategories.size} of {selectedTemplate.categories.length} selected
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                    {selectedTemplate.categories.map((category) => (
                      <div key={category} className="flex items-center space-x-2">
                        <Checkbox
                          id={category}
                          checked={selectedTemplateCategories.has(category)}
                          onCheckedChange={() => handleTemplateCategoryToggle(category)}
                        />
                        <label
                          htmlFor={category}
                          className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {category}
                        </label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={() => {
            onCategoriesUpdated();
            onClose();
            toast({
              title: "Success",
              description: "Categories updated successfully",
            });
          }}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
