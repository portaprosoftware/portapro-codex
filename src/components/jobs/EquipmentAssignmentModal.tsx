import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Package, 
  Plus, 
  Minus, 
  Calendar, 
  CheckCircle,
  AlertCircle,
  Search,
  Filter
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface EquipmentAssignmentModalProps {
  jobId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface EquipmentItem {
  productId: string;
  productName: string;
  quantity: number;
  assignmentType: 'bulk' | 'specific';
  specificItems?: string[];
  assignmentDate: string;
  returnDate?: string;
}

export const EquipmentAssignmentModal: React.FC<EquipmentAssignmentModalProps> = ({
  jobId,
  open,
  onOpenChange
}) => {
  const [activeTab, setActiveTab] = useState('assign');
  const [searchTerm, setSearchTerm] = useState('');
  const [equipmentItems, setEquipmentItems] = useState<EquipmentItem[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch products
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, stock_total, stock_in_service, default_price_per_day')
        .order('name');
      
      if (error) throw error;
      return data;
    },
    enabled: open
  });

  // Fetch current job assignments
  const { data: currentAssignments = [] } = useQuery({
    queryKey: ['job-equipment', jobId],
    queryFn: async () => {
      if (!jobId) return [];
      
      const { data, error } = await supabase
        .from('equipment_assignments')
        .select(`
          *,
          products(id, name),
          product_items(id, item_code, status)
        `)
        .eq('job_id', jobId);
      
      if (error) throw error;
      return data;
    },
    enabled: !!jobId && open
  });

  // Fetch individual items for specific assignment
  const { data: individualItems = [] } = useQuery({
    queryKey: ['product-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_items')
        .select('id, item_code, product_id, status, products(name)')
        .eq('status', 'available')
        .order('item_code');
      
      if (error) throw error;
      return data;
    },
    enabled: activeTab === 'specific'
  });

  // Create equipment assignment mutation
  const createAssignmentMutation = useMutation({
    mutationFn: async (assignment: EquipmentItem) => {
      if (!jobId) throw new Error('No job ID');
      
      if (assignment.assignmentType === 'bulk') {
        // Create bulk assignment
        const { data, error } = await supabase.rpc('reserve_equipment_for_job', {
          job_uuid: jobId,
          product_uuid: assignment.productId,
          reserve_quantity: assignment.quantity,
          assignment_date: assignment.assignmentDate,
          return_date: assignment.returnDate || null
        });
        
        if (error) throw error;
        return data;
      } else {
        // Create specific item assignments
        const results = [];
        for (const itemId of assignment.specificItems || []) {
          const { data, error } = await supabase.rpc('reserve_specific_item_for_job', {
            job_uuid: jobId,
            item_uuid: itemId,
            assignment_date: assignment.assignmentDate,
            return_date: assignment.returnDate || null
          });
          
          if (error) throw error;
          results.push(data);
        }
        return results;
      }
    },
    onSuccess: () => {
      toast({
        title: "Equipment Assigned",
        description: "Equipment has been successfully assigned to the job",
      });
      queryClient.invalidateQueries({ queryKey: ['job-equipment', jobId] });
      setEquipmentItems([]);
    },
    onError: (error: any) => {
      toast({
        title: "Assignment Failed",
        description: error.message || "Failed to assign equipment",
        variant: "destructive",
      });
    }
  });

  // Remove assignment mutation
  const removeAssignmentMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase
        .from('equipment_assignments')
        .delete()
        .eq('id', assignmentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Assignment Removed",
        description: "Equipment assignment has been removed",
      });
      queryClient.invalidateQueries({ queryKey: ['job-equipment', jobId] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove assignment",
        variant: "destructive",
      });
    }
  });

  const addEquipmentItem = (productId: string, productName: string) => {
    const newItem: EquipmentItem = {
      productId,
      productName,
      quantity: 1,
      assignmentType: 'bulk',
      specificItems: [],
      assignmentDate: new Date().toISOString().split('T')[0],
    };
    
    setEquipmentItems(prev => [...prev, newItem]);
  };

  const updateEquipmentItem = (index: number, updates: Partial<EquipmentItem>) => {
    setEquipmentItems(prev => 
      prev.map((item, i) => i === index ? { ...item, ...updates } : item)
    );
  };

  const removeEquipmentItem = (index: number) => {
    setEquipmentItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleAssignAll = () => {
    equipmentItems.forEach(item => {
      createAssignmentMutation.mutate(item);
    });
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAvailableCount = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product ? product.stock_total - product.stock_in_service : 0;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center">
            <Package className="w-5 h-5 mr-2" />
            Equipment Assignment
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="assign">Assign Equipment</TabsTrigger>
            <TabsTrigger value="current">Current Assignments</TabsTrigger>
          </TabsList>

          <TabsContent value="assign" className="space-y-6">
            {/* Search and Filter */}
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input 
                  placeholder="Search products..." 
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-2 gap-4 max-h-64 overflow-y-auto">
              {filteredProducts.map(product => {
                const available = getAvailableCount(product.id);
                const isAdded = equipmentItems.some(item => item.productId === product.id);
                
                return (
                  <Card key={product.id} className={cn(
                    "cursor-pointer transition-colors",
                    isAdded && "border-blue-500 bg-blue-50"
                  )}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-sm">{product.name}</h4>
                        <Badge variant={available > 0 ? "default" : "destructive"}>
                          {available} available
                        </Badge>
                      </div>
                      
                      <div className="text-xs text-gray-600 mb-3">
                        ${product.default_price_per_day}/day
                      </div>
                      
                      <Button 
                        size="sm" 
                        className="w-full"
                        disabled={available === 0 || isAdded}
                        onClick={() => addEquipmentItem(product.id, product.name)}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        {isAdded ? 'Added' : 'Add'}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Selected Equipment */}
            {equipmentItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Selected Equipment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {equipmentItems.map((item, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-medium">{item.productName}</h4>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeEquipmentItem(index)}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor={`quantity-${index}`}>Quantity</Label>
                          <Input
                            id={`quantity-${index}`}
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateEquipmentItem(index, { quantity: parseInt(e.target.value) || 1 })}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor={`assignment-date-${index}`}>Assignment Date</Label>
                          <Input
                            id={`assignment-date-${index}`}
                            type="date"
                            value={item.assignmentDate}
                            onChange={(e) => updateEquipmentItem(index, { assignmentDate: e.target.value })}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor={`return-date-${index}`}>Return Date</Label>
                          <Input
                            id={`return-date-${index}`}
                            type="date"
                            value={item.returnDate || ''}
                            onChange={(e) => updateEquipmentItem(index, { returnDate: e.target.value || undefined })}
                          />
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <Label>Assignment Type</Label>
                        <Select 
                          value={item.assignmentType} 
                          onValueChange={(value: 'bulk' | 'specific') => updateEquipmentItem(index, { assignmentType: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bulk">Bulk Assignment</SelectItem>
                            <SelectItem value="specific">Specific Items</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {item.assignmentType === 'specific' && (
                        <div className="mt-4">
                          <Label>Select Specific Items</Label>
                          <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                            {individualItems
                              .filter(indItem => indItem.product_id === item.productId)
                              .map(indItem => (
                                <div key={indItem.id} className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    checked={item.specificItems?.includes(indItem.id) || false}
                                    onChange={(e) => {
                                      const specificItems = item.specificItems || [];
                                      if (e.target.checked) {
                                        updateEquipmentItem(index, { 
                                          specificItems: [...specificItems, indItem.id]
                                        });
                                      } else {
                                        updateEquipmentItem(index, { 
                                          specificItems: specificItems.filter(id => id !== indItem.id)
                                        });
                                      }
                                    }}
                                  />
                                  <span className="text-sm">{indItem.item_code}</span>
                                  <Badge variant="outline">{indItem.status}</Badge>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline" onClick={() => setEquipmentItems([])}>
                      Clear All
                    </Button>
                    <Button 
                      onClick={handleAssignAll}
                      disabled={createAssignmentMutation.isPending}
                      className="bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white font-bold"
                    >
                      {createAssignmentMutation.isPending ? 'Assigning...' : 'Assign All Equipment'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="current" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Current Equipment Assignments</CardTitle>
              </CardHeader>
              <CardContent>
                {currentAssignments.length > 0 ? (
                  <div className="space-y-4">
                    {currentAssignments.map((assignment: any) => (
                      <div key={assignment.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <h4 className="font-medium">
                              {assignment.products?.name || 'Product'}
                            </h4>
                            <div className="text-sm text-gray-600">
                              <div>Quantity: {assignment.quantity}</div>
                              <div>Assigned: {new Date(assignment.assigned_date).toLocaleDateString()}</div>
                              {assignment.return_date && (
                                <div>Return: {new Date(assignment.return_date).toLocaleDateString()}</div>
                              )}
                              {assignment.product_items && (
                                <div>Item: {assignment.product_items.item_code}</div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Badge className={cn(
                              assignment.status === 'assigned' && 'bg-blue-500 text-white',
                              assignment.status === 'delivered' && 'bg-green-500 text-white',
                              assignment.status === 'returned' && 'bg-gray-500 text-white'
                            )}>
                              {assignment.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeAssignmentMutation.mutate(assignment.id)}
                              disabled={removeAssignmentMutation.isPending}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p>No equipment assigned to this job</p>
                    <p className="text-sm">Use the "Assign Equipment" tab to add equipment</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};