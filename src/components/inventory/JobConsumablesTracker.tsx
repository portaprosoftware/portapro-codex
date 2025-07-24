import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Trash2, Package, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface JobConsumable {
  id: string;
  job_id: string;
  consumable_id: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  used_at: string;
  used_by?: string;
  notes?: string;
  consumables?: {
    name: string;
    sku?: string;
    category: string;
  };
  jobs?: {
    id: string;
    job_type: string;
    status: string;
    scheduled_date: string;
    customers?: {
      name: string;
    };
  };
}

interface Consumable {
  id: string;
  name: string;
  sku?: string;
  category: string;
  unit_price: number;
  on_hand_qty: number;
}

interface Job {
  id: string;
  job_type: string;
  scheduled_date: string;
  customers?: {
    name: string;
  };
}

export const JobConsumablesTracker: React.FC = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<string>('');
  const [formData, setFormData] = useState({
    job_id: '',
    consumable_id: '',
    quantity: 1,
    notes: ''
  });

  const queryClient = useQueryClient();

  const { data: jobConsumables, isLoading: loadingJobConsumables } = useQuery({
    queryKey: ['job-consumables'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_consumables' as any)
        .select(`
          *,
          consumables:consumable_id (name, sku, category),
          jobs:job_id (
            id, job_type, status, scheduled_date,
            customers:customer_id (name)
          )
        `)
        .order('used_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as unknown as JobConsumable[];
    }
  });

  const { data: consumables } = useQuery({
    queryKey: ['consumables-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consumables' as any)
        .select('id, name, sku, category, unit_price, on_hand_qty')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return (data || []) as unknown as Consumable[];
    }
  });

  const { data: recentJobs } = useQuery({
    queryKey: ['recent-jobs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jobs' as any)
        .select(`
          id, job_type, scheduled_date, status,
          customers:customer_id (name)
        `)
        .in('status', ['scheduled', 'in_progress', 'completed'])
        .order('scheduled_date', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return (data || []) as unknown as Job[];
    }
  });

  const addConsumableMutation = useMutation({
    mutationFn: async (data: any) => {
      const consumable = consumables?.find(c => c.id === data.consumable_id);
      if (!consumable) throw new Error('Consumable not found');

      const lineTotal = data.quantity * consumable.unit_price;

      const { error } = await supabase
        .from('job_consumables' as any)
        .insert([{
          job_id: data.job_id,
          consumable_id: data.consumable_id,
          quantity: data.quantity,
          unit_price: consumable.unit_price,
          line_total: lineTotal,
          notes: data.notes || null,
          used_by: 'Current User' // In real app, get from auth context
        }]);
      
      if (error) throw error;

      // Update consumable stock
      const { error: stockError } = await supabase
        .from('consumables' as any)
        .update({ 
          on_hand_qty: consumable.on_hand_qty - data.quantity 
        })
        .eq('id', data.consumable_id);

      if (stockError) throw stockError;
    },
    onSuccess: () => {
      toast.success('Consumable usage recorded');
      queryClient.invalidateQueries({ queryKey: ['job-consumables'] });
      queryClient.invalidateQueries({ queryKey: ['consumables-active'] });
      handleCloseModal();
    },
    onError: () => {
      toast.error('Failed to record consumable usage');
    }
  });

  const removeConsumableMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('job_consumables' as any)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Consumable usage removed');
      queryClient.invalidateQueries({ queryKey: ['job-consumables'] });
    },
    onError: () => {
      toast.error('Failed to remove consumable usage');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.job_id || !formData.consumable_id) {
      toast.error('Please select both job and consumable');
      return;
    }

    const consumable = consumables?.find(c => c.id === formData.consumable_id);
    if (consumable && consumable.on_hand_qty < formData.quantity) {
      toast.error('Insufficient stock available');
      return;
    }

    addConsumableMutation.mutate(formData);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setFormData({
      job_id: '',
      consumable_id: '',
      quantity: 1,
      notes: ''
    });
  };

  const filteredJobConsumables = selectedJob 
    ? jobConsumables?.filter(jc => jc.job_id === selectedJob)
    : jobConsumables;

  if (loadingJobConsumables) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Job Consumables Tracker
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-4 items-center">
              <div>
                <Label>Filter by Job</Label>
                <Select value={selectedJob} onValueChange={setSelectedJob}>
                  <SelectTrigger className="w-[300px]">
                    <SelectValue placeholder="All jobs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All jobs</SelectItem>
                    {recentJobs?.map(job => (
                      <SelectItem key={job.id} value={job.id}>
                        {job.job_type} - {job.customers?.name} ({new Date(job.scheduled_date).toLocaleDateString()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Record Usage
            </Button>
          </div>

          <div className="space-y-4">
            {filteredJobConsumables?.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No consumable usage recorded {selectedJob ? 'for this job' : 'yet'}
              </p>
            ) : (
              filteredJobConsumables?.map(usage => (
                <Card key={usage.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-primary" />
                          <span className="font-medium">{usage.consumables?.name}</span>
                          {usage.consumables?.sku && (
                            <span className="text-sm text-muted-foreground">({usage.consumables.sku})</span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          <span>
                            {usage.jobs?.job_type} - {usage.jobs?.customers?.name}
                          </span>
                          <span>
                            ({new Date(usage.jobs?.scheduled_date || '').toLocaleDateString()})
                          </span>
                        </div>

                        <div className="flex gap-4 text-sm">
                          <span>Quantity: <strong>{usage.quantity}</strong></span>
                          <span>Unit Price: <strong>${usage.unit_price.toFixed(2)}</strong></span>
                          <span>Total: <strong>${usage.line_total.toFixed(2)}</strong></span>
                        </div>

                        {usage.notes && (
                          <p className="text-sm text-muted-foreground italic">{usage.notes}</p>
                        )}

                        <p className="text-xs text-muted-foreground">
                          Used on {new Date(usage.used_at).toLocaleDateString()} at {new Date(usage.used_at).toLocaleTimeString()}
                          {usage.used_by && ` by ${usage.used_by}`}
                        </p>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeConsumableMutation.mutate(usage.id)}
                        disabled={removeConsumableMutation.isPending}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Consumable Usage</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="job_id">Job *</Label>
              <Select 
                value={formData.job_id} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, job_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a job" />
                </SelectTrigger>
                <SelectContent>
                  {recentJobs?.map(job => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.job_type} - {job.customers?.name} ({new Date(job.scheduled_date).toLocaleDateString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="consumable_id">Consumable *</Label>
              <Select 
                value={formData.consumable_id} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, consumable_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a consumable" />
                </SelectTrigger>
                <SelectContent>
                  {consumables?.map(consumable => (
                    <SelectItem key={consumable.id} value={consumable.id}>
                      {consumable.name} - Stock: {consumable.on_hand_qty} (${consumable.unit_price.toFixed(2)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes about usage..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={addConsumableMutation.isPending}
              >
                {addConsumableMutation.isPending ? 'Recording...' : 'Record Usage'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};