import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Settings, Zap, Timer, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AutoReorderRule {
  id: string;
  consumable_id: string;
  consumable_name: string;
  supplier_id: string;
  supplier_name: string;
  trigger_type: 'quantity' | 'time' | 'hybrid';
  min_quantity: number;
  reorder_quantity: number;
  reorder_interval_days: number;
  max_stock_level: number;
  lead_time_days: number;
  safety_stock: number;
  is_active: boolean;
  auto_approve: boolean;
  created_at: string;
  last_triggered: string | null;
}

export const AutoReorderRules: React.FC = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRule, setSelectedRule] = useState<AutoReorderRule | null>(null);
  const [formData, setFormData] = useState({
    consumable_id: '',
    supplier_id: '',
    trigger_type: 'quantity',
    min_quantity: 0,
    reorder_quantity: 0,
    reorder_interval_days: 30,
    max_stock_level: 0,
    lead_time_days: 7,
    safety_stock: 0,
    is_active: true,
    auto_approve: false
  });

  const { toast } = useToast();

  const { data: consumables } = useQuery({
    queryKey: ['consumables-for-reorder'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consumables' as any)
        .select('id, name, on_hand_qty, reorder_threshold')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return (data || []) as any[];
    }
  });

  // Mock suppliers data
  const mockSuppliers = [
    { id: '1', name: 'CleanCorp Supply' },
    { id: '2', name: 'Sanitation Solutions' },
    { id: '3', name: 'Maintenance Pro' }
  ];

  // Mock reorder rules data
  const mockRules: AutoReorderRule[] = [
    {
      id: '1',
      consumable_id: '1',
      consumable_name: 'Toilet Paper',
      supplier_id: '1',
      supplier_name: 'CleanCorp Supply',
      trigger_type: 'quantity',
      min_quantity: 50,
      reorder_quantity: 200,
      reorder_interval_days: 30,
      max_stock_level: 500,
      lead_time_days: 5,
      safety_stock: 25,
      is_active: true,
      auto_approve: true,
      created_at: '2024-01-15T10:00:00Z',
      last_triggered: '2024-01-20T14:30:00Z'
    },
    {
      id: '2',
      consumable_id: '2',
      consumable_name: 'Hand Sanitizer',
      supplier_id: '2',
      supplier_name: 'Sanitation Solutions',
      trigger_type: 'hybrid',
      min_quantity: 20,
      reorder_quantity: 100,
      reorder_interval_days: 15,
      max_stock_level: 200,
      lead_time_days: 3,
      safety_stock: 10,
      is_active: true,
      auto_approve: false,
      created_at: '2024-01-20T11:00:00Z',
      last_triggered: null
    }
  ];

  const { data: reorderRules = mockRules, isLoading } = useQuery({
    queryKey: ['reorder-rules'],
    queryFn: async () => {
      // In real app, query from reorder_rules table
      return mockRules;
    }
  });

  const addRuleMutation = useMutation({
    mutationFn: async (ruleData: any) => {
      // In real app, insert into reorder_rules table
      console.log('Adding reorder rule:', ruleData);
      return { id: Date.now().toString(), ...ruleData };
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Auto-reorder rule created successfully",
      });
      setShowAddModal(false);
      resetForm();
    }
  });

  const updateRuleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      // In real app, update reorder_rules table
      console.log('Updating reorder rule:', id, data);
      return { id, ...data };
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Auto-reorder rule updated successfully",
      });
      setShowEditModal(false);
      resetForm();
    }
  });

  const toggleRuleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      // In real app, update is_active field
      console.log('Toggling rule:', id, isActive);
      return { id, isActive };
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Rule status updated successfully",
      });
    }
  });

  const deleteRuleMutation = useMutation({
    mutationFn: async (id: string) => {
      // In real app, delete from reorder_rules table
      console.log('Deleting reorder rule:', id);
      return id;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Auto-reorder rule deleted successfully",
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const consumable = consumables?.find(c => c.id === formData.consumable_id);
    const supplier = mockSuppliers.find(s => s.id === formData.supplier_id);
    
    const ruleData = {
      ...formData,
      consumable_name: consumable?.name || '',
      supplier_name: supplier?.name || ''
    };
    
    if (selectedRule) {
      await updateRuleMutation.mutateAsync({
        id: selectedRule.id,
        data: ruleData
      });
    } else {
      await addRuleMutation.mutateAsync(ruleData);
    }
  };

  const handleEdit = (rule: AutoReorderRule) => {
    setSelectedRule(rule);
    setFormData({
      consumable_id: rule.consumable_id,
      supplier_id: rule.supplier_id,
      trigger_type: rule.trigger_type,
      min_quantity: rule.min_quantity,
      reorder_quantity: rule.reorder_quantity,
      reorder_interval_days: rule.reorder_interval_days,
      max_stock_level: rule.max_stock_level,
      lead_time_days: rule.lead_time_days,
      safety_stock: rule.safety_stock,
      is_active: rule.is_active,
      auto_approve: rule.auto_approve
    });
    setShowEditModal(true);
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    await toggleRuleMutation.mutateAsync({ id, isActive });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this auto-reorder rule?')) {
      await deleteRuleMutation.mutateAsync(id);
    }
  };

  const resetForm = () => {
    setFormData({
      consumable_id: '',
      supplier_id: '',
      trigger_type: 'quantity',
      min_quantity: 0,
      reorder_quantity: 0,
      reorder_interval_days: 30,
      max_stock_level: 0,
      lead_time_days: 7,
      safety_stock: 0,
      is_active: true,
      auto_approve: false
    });
    setSelectedRule(null);
  };

  const getTriggerTypeBadge = (type: string) => {
    switch (type) {
      case 'quantity':
        return <Badge variant="default">Quantity</Badge>;
      case 'time':
        return <Badge variant="secondary">Time</Badge>;
      case 'hybrid':
        return <Badge variant="outline">Hybrid</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const activeRules = reorderRules.filter(rule => rule.is_active);
  const totalRules = reorderRules.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Auto-Reorder Rules</h2>
          <p className="text-muted-foreground">Automate your inventory replenishment</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Rule
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Rules</p>
                <p className="text-2xl font-bold">{totalRules}</p>
              </div>
              <Settings className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Rules</p>
                <p className="text-2xl font-bold text-green-600">{activeRules.length}</p>
              </div>
              <Zap className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Auto-Approve</p>
                <p className="text-2xl font-bold text-blue-600">
                  {reorderRules.filter(r => r.auto_approve).length}
                </p>
              </div>
              <Target className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Recently Triggered</p>
                <p className="text-2xl font-bold text-orange-600">
                  {reorderRules.filter(r => r.last_triggered).length}
                </p>
              </div>
              <Timer className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rules Table */}
      <Card>
        <CardHeader>
          <CardTitle>Auto-Reorder Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Trigger Type</TableHead>
                <TableHead>Min Qty</TableHead>
                <TableHead>Reorder Qty</TableHead>
                <TableHead>Lead Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Triggered</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reorderRules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium">{rule.consumable_name}</TableCell>
                  <TableCell>{rule.supplier_name}</TableCell>
                  <TableCell>{getTriggerTypeBadge(rule.trigger_type)}</TableCell>
                  <TableCell>{rule.min_quantity}</TableCell>
                  <TableCell>{rule.reorder_quantity}</TableCell>
                  <TableCell>{rule.lead_time_days} days</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={rule.is_active}
                        onCheckedChange={(checked) => handleToggle(rule.id, checked)}
                      />
                      <span className="text-sm">
                        {rule.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {rule.last_triggered ? 
                      new Date(rule.last_triggered).toLocaleDateString() : 
                      'Never'
                    }
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(rule)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(rule.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Rule Modal */}
      <Dialog open={showAddModal || showEditModal} onOpenChange={() => {
        setShowAddModal(false);
        setShowEditModal(false);
        resetForm();
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedRule ? 'Edit Auto-Reorder Rule' : 'Add Auto-Reorder Rule'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="consumable_id">Consumable Item</Label>
                <Select value={formData.consumable_id} onValueChange={(value) => setFormData({...formData, consumable_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select consumable" />
                  </SelectTrigger>
                  <SelectContent>
                    {(consumables as any)?.map((consumable: any) => (
                      <SelectItem key={consumable.id} value={consumable.id}>
                        {consumable.name} (Stock: {consumable.on_hand_qty})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier_id">Supplier</Label>
                <Select value={formData.supplier_id} onValueChange={(value) => setFormData({...formData, supplier_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockSuppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="trigger_type">Trigger Type</Label>
              <Select value={formData.trigger_type} onValueChange={(value) => setFormData({...formData, trigger_type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quantity">Quantity Based</SelectItem>
                  <SelectItem value="time">Time Based</SelectItem>
                  <SelectItem value="hybrid">Hybrid (Quantity + Time)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min_quantity">Minimum Quantity</Label>
                <Input
                  id="min_quantity"
                  type="number"
                  value={formData.min_quantity}
                  onChange={(e) => setFormData({...formData, min_quantity: parseInt(e.target.value) || 0})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reorder_quantity">Reorder Quantity</Label>
                <Input
                  id="reorder_quantity"
                  type="number"
                  value={formData.reorder_quantity}
                  onChange={(e) => setFormData({...formData, reorder_quantity: parseInt(e.target.value) || 0})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_stock_level">Max Stock Level</Label>
                <Input
                  id="max_stock_level"
                  type="number"
                  value={formData.max_stock_level}
                  onChange={(e) => setFormData({...formData, max_stock_level: parseInt(e.target.value) || 0})}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reorder_interval_days">Reorder Interval (Days)</Label>
                <Input
                  id="reorder_interval_days"
                  type="number"
                  value={formData.reorder_interval_days}
                  onChange={(e) => setFormData({...formData, reorder_interval_days: parseInt(e.target.value) || 0})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lead_time_days">Lead Time (Days)</Label>
                <Input
                  id="lead_time_days"
                  type="number"
                  value={formData.lead_time_days}
                  onChange={(e) => setFormData({...formData, lead_time_days: parseInt(e.target.value) || 0})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="safety_stock">Safety Stock</Label>
                <Input
                  id="safety_stock"
                  type="number"
                  value={formData.safety_stock}
                  onChange={(e) => setFormData({...formData, safety_stock: parseInt(e.target.value) || 0})}
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                />
                <Label>Active</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.auto_approve}
                  onCheckedChange={(checked) => setFormData({...formData, auto_approve: checked})}
                />
                <Label>Auto-Approve Orders</Label>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => {
                setShowAddModal(false);
                setShowEditModal(false);
                resetForm();
              }}>
                Cancel
              </Button>
              <Button type="submit">
                {selectedRule ? 'Update' : 'Create'} Rule
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};