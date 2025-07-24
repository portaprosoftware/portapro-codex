import React, { useState } from 'react';
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
  Check
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Category {
  id: string;
  name: string;
  description?: string;
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
  const [customCategories, setCustomCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateCategory | null>(null);
  const [selectedTemplateCategories, setSelectedTemplateCategories] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const handleAddCustomCategory = () => {
    if (!newCategoryName.trim()) return;
    
    const newCategory: Category = {
      id: Date.now().toString(),
      name: newCategoryName.trim()
    };
    
    setCustomCategories([...customCategories, newCategory]);
    setNewCategoryName('');
  };

  const handleRemoveCustomCategory = (id: string) => {
    setCustomCategories(customCategories.filter(cat => cat.id !== id));
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Manage Categories</DialogTitle>
          <DialogDescription>
            Create custom categories or choose from pre-built templates for organizing your GPS coordinates
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="custom" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="custom">Custom Categories</TabsTrigger>
            <TabsTrigger value="templates">Template Ideas</TabsTrigger>
          </TabsList>

          <TabsContent value="custom" className="space-y-4">
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter category name..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddCustomCategory()}
                  className="flex-1"
                />
                <Button onClick={handleAddCustomCategory} disabled={!newCategoryName.trim()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </div>

              {existingCategories.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Existing Categories</h4>
                  <div className="flex flex-wrap gap-2">
                    {existingCategories.map((cat) => (
                      <Badge key={cat.category_name} variant="secondary">
                        {cat.category_name} ({cat.point_count})
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {customCategories.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">New Categories</h4>
                  <div className="space-y-2">
                    {customCategories.map((cat) => (
                      <div key={cat.id} className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm">{cat.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveCustomCategory(cat.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
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
            // This would save the categories - placeholder for now
            onCategoriesUpdated();
            onClose();
            toast({
              title: "Success",
              description: "Categories updated successfully",
            });
          }}>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}