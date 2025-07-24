
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useOfflineSync } from "./useOfflineSync";

async function processJobConsumables(jobId: string, consumablesData: any) {
  const { billingMethod, items, selectedBundle, subscriptionEnabled } = consumablesData;

  if (billingMethod === 'per-use' && items.length > 0) {
    // Create job_consumables records and update stock
    for (const item of items) {
      if (item.consumableId && item.quantity > 0) {
        // Create job consumable record
        await supabase.from('job_consumables').insert({
          job_id: jobId,
          consumable_id: item.consumableId,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          line_total: item.total,
          used_by: null // Will be set when job is completed
        });

        // Update consumable stock (prevent negative values)
        const { data: currentStock } = await supabase
          .from('consumables')
          .select('on_hand_qty')
          .eq('id', item.consumableId)
          .single();
        
        const newQuantity = Math.max(0, (currentStock?.on_hand_qty || 0) - item.quantity);
        
        await supabase.from('consumables')
          .update({ on_hand_qty: newQuantity })
          .eq('id', item.consumableId);
      }
    }
  } else if (billingMethod === 'bundle' && selectedBundle) {
    // Handle bundle processing - get bundle items and create records
    const { data: bundleItems } = await supabase
      .from('consumable_bundle_items')
      .select('*, consumables(*)')
      .eq('bundle_id', selectedBundle);

    if (bundleItems) {
      for (const bundleItem of bundleItems) {
        // Create job consumable record
        await supabase.from('job_consumables').insert({
          job_id: jobId,
          consumable_id: bundleItem.consumable_id,
          quantity: bundleItem.quantity,
          unit_price: bundleItem.consumables.unit_price,
          line_total: bundleItem.quantity * bundleItem.consumables.unit_price,
          used_by: null
        });

        // Update stock (prevent negative values)
        const { data: currentStock } = await supabase
          .from('consumables')
          .select('on_hand_qty')
          .eq('id', bundleItem.consumable_id)
          .single();
        
        const newQuantity = Math.max(0, (currentStock?.on_hand_qty || 0) - bundleItem.quantity);
        
        await supabase.from('consumables')
          .update({ on_hand_qty: newQuantity })
          .eq('id', bundleItem.consumable_id);
      }
    }
  } else if (billingMethod === 'subscription' && subscriptionEnabled) {
    // For subscription, we might not track specific items unless they're manually added
    // This is for internal tracking only, no stock updates needed unless specific items are logged
    console.log('Subscription plan active - no automatic stock adjustments');
  }
}

interface JobFormData {
  customer_id: string;
  job_type: 'delivery' | 'pickup' | 'service';
  scheduled_date: string;
  scheduled_time?: string;
  notes?: string;
  special_instructions?: string;
  driver_id?: string;
  vehicle_id?: string;
  timezone?: string;
  billing_method?: string;
  subscription_plan?: string;
  consumables_data?: any;
}

export function useJobs(filters?: {
  date?: string;
  status?: string;
  driver_id?: string;
  job_type?: string;
}) {
  return useQuery({
    queryKey: ['jobs', filters],
    queryFn: async () => {
      let query = supabase
        .from('jobs')
        .select(`
          *,
          customers!inner(id, name, service_street, service_city, service_state),
          profiles:driver_id(id, first_name, last_name),
          vehicles(id, license_plate, vehicle_type)
        `)
        .order('scheduled_date', { ascending: true });

      if (filters?.date) {
        query = query.eq('scheduled_date', filters.date);
      }
      
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters?.driver_id) {
        query = query.eq('driver_id', filters.driver_id);
      }
      
      if (filters?.job_type) {
        query = query.eq('job_type', filters.job_type);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateJob() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { addToQueue, isOnline } = useOfflineSync();

  return useMutation({
    mutationFn: async (jobData: JobFormData) => {
      if (!isOnline) {
        addToQueue({
          type: 'job_creation',
          jobId: crypto.randomUUID(),
          data: jobData
        });
        return null;
      }

      // Generate job number
      const jobTypePrefix = {
        'delivery': 'DEL',
        'pickup': 'PKP',
        'service': 'SVC'
      }[jobData.job_type];

      const jobNumber = `${jobTypePrefix}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

      const { consumables_data, ...jobDataForDB } = jobData;

      const { data: newJob, error } = await supabase
        .from('jobs')
        .insert({
          ...jobDataForDB,
          job_number: jobNumber,
          status: 'assigned',
          timezone: jobData.timezone || 'America/New_York'
        })
        .select()
        .single();

      if (error) throw error;

      // Handle consumables processing
      if (consumables_data && newJob) {
        await processJobConsumables(newJob.id, consumables_data);
      }

      return newJob;
    },
    onSuccess: (data) => {
      if (data) {
        toast({
          title: "Job Created",
          description: `Job ${data.job_number} has been created successfully`,
        });
      } else {
        toast({
          title: "Queued for Sync",
          description: "Job will be created when connection is restored",
        });
      }
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create job",
        variant: "destructive",
      });
      console.error('Job creation error:', error);
    }
  });
}

export function useUpdateJobStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { addToQueue, isOnline } = useOfflineSync();

  return useMutation({
    mutationFn: async ({ jobId, status }: { jobId: string; status: string }) => {
      if (!isOnline) {
        addToQueue({
          type: 'status_update',
          jobId,
          data: { status }
        });
        return null;
      }

      const { data, error } = await supabase
        .from('jobs')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data) {
        toast({
          title: "Status Updated",
          description: `Job status updated to ${data.status}`,
        });
      } else {
        toast({
          title: "Queued for Sync",
          description: "Status will update when connection is restored",
        });
      }
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update job status",
        variant: "destructive",
      });
      console.error('Job status update error:', error);
    }
  });
}

export function useDriverJobs(driverId?: string) {
  return useQuery({
    queryKey: ['driver-jobs', driverId],
    queryFn: async () => {
      if (!driverId) return [];

      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          customers!inner(id, name, service_street, service_city, service_state),
          vehicles(id, license_plate, vehicle_type)
        `)
        .eq('driver_id', driverId)
        .gte('scheduled_date', new Date().toISOString().split('T')[0])
        .order('scheduled_date', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!driverId,
  });
}
