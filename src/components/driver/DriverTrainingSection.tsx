import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CertificateUploadButton } from '@/components/training/CertificateUploadButton';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  GraduationCap, Plus, Calendar, CheckCircle, 
  AlertTriangle, Clock, Download, ExternalLink 
} from 'lucide-react';

const trainingSchema = z.object({
  training_type: z.string().min(1, "Training type is required"),
  last_completed: z.string().optional(),
  next_due: z.string().optional(),
  instructor_name: z.string().optional(),
  notes: z.string().optional(),
});

type TrainingFormData = z.infer<typeof trainingSchema>;

interface DriverTrainingSectionProps {
  driverId: string;
}

const TRAINING_TYPES = [
  'Safety Training',
  'Hazmat Certification',
  'Defensive Driving',
  'Equipment Operation',
  'Customer Service',
  'First Aid/CPR',
  'DOT Compliance',
  'Environmental Safety',
  'Other'
];

export function DriverTrainingSection({ driverId }: DriverTrainingSectionProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: trainingRecords = [], isLoading } = useQuery({
    queryKey: ['driver-training', driverId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('driver_training_records')
        .select('*')
        .eq('driver_id', driverId)
        .order('last_completed', { ascending: false });

      if (error) throw error;
      return data || [];
    }
  });

  const form = useForm<TrainingFormData>({
    resolver: zodResolver(trainingSchema),
    defaultValues: {
      training_type: '',
      last_completed: '',
      next_due: '',
      instructor_name: '',
      notes: '',
    }
  });

  const addTraining = useMutation({
    mutationFn: async (data: TrainingFormData) => {
      const { error } = await supabase
        .from('driver_training_records')
        .insert({
          driver_id: driverId,
          training_type: data.training_type,
          last_completed: data.last_completed || null,
          next_due: data.next_due || null,
          instructor_name: data.instructor_name || null,
          notes: data.notes || null,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-training', driverId] });
      toast.success('Training record added successfully');
      setIsAddModalOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast.error('Failed to add training record');
      console.error('Error adding training:', error);
    }
  });

  const deleteTraining = useMutation({
    mutationFn: async (recordId: string) => {
      const { error } = await supabase
        .from('driver_training_records')
        .delete()
        .eq('id', recordId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-training', driverId] });
      toast.success('Training record deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete training record');
      console.error('Error deleting training:', error);
    }
  });

  const onSubmit = (data: TrainingFormData) => {
    addTraining.mutate(data);
  };

  const getTrainingStatus = (record: any) => {
    if (!record.next_due) return 'completed';
    
    const nextDue = new Date(record.next_due);
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    if (nextDue < now) return 'overdue';
    if (nextDue <= thirtyDaysFromNow) return 'due_soon';
    return 'current';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'overdue':
        return (
          <Badge variant="destructive">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Overdue
          </Badge>
        );
      case 'due_soon':
        return (
          <Badge variant="destructive" className="bg-orange-500">
            <Clock className="w-3 h-3 mr-1" />
            Due Soon
          </Badge>
        );
      case 'current':
        return (
          <Badge variant="default">
            <CheckCircle className="w-3 h-3 mr-1" />
            Current
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <GraduationCap className="w-5 h-5" />
              <span>Training Records</span>
              <Badge variant="secondary">{trainingRecords.length} Records</Badge>
            </CardTitle>
            
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Training
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add Training Record</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="training_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Training Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select training type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {TRAINING_TYPES.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="last_completed"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Completion Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="next_due"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Next Due Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="instructor_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Instructor/Provider</FormLabel>
                          <FormControl>
                            <Input placeholder="Training provider or instructor name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Additional notes about this training..." 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={addTraining.isPending}>
                        {addTraining.isPending ? "Adding..." : "Add Record"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {trainingRecords.length > 0 ? (
            <div className="space-y-4">
              {trainingRecords.map((record) => {
                const status = getTrainingStatus(record);
                return (
                  <div key={record.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <h4 className="font-semibold text-gray-900">{record.training_type}</h4>
                        {getStatusBadge(status)}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => deleteTraining.mutate(record.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      {record.last_completed && (
                        <div>
                          <span className="font-medium text-gray-600">Completed:</span>
                          <p>{new Date(record.last_completed).toLocaleDateString()}</p>
                        </div>
                      )}
                      
                      {record.next_due && (
                        <div>
                          <span className="font-medium text-gray-600">Next Due:</span>
                          <p>{new Date(record.next_due).toLocaleDateString()}</p>
                        </div>
                      )}
                      
                      {record.instructor_name && (
                        <div>
                          <span className="font-medium text-gray-600">Instructor:</span>
                          <p>{record.instructor_name}</p>
                        </div>
                      )}
                    </div>
                    
                    {record.notes && (
                      <div className="text-sm">
                        <span className="font-medium text-gray-600">Notes:</span>
                        <p className="text-gray-700 mt-1">{record.notes}</p>
                      </div>
                    )}

                    <div className="pt-2">
                      <CertificateUploadButton
                        driverId={driverId}
                        certificationName={`${record.training_type} Certificate`}
                        onUploaded={(url) => {
                          console.log('Training certificate uploaded:', url);
                        }}
                        uploadedFile={record.certificate_url}
                        onRemove={() => {
                          console.log('Remove training certificate');
                        }}
                        buttonText="Upload Certificate"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <GraduationCap className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">No training records found</p>
              <Button onClick={() => setIsAddModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Training Record
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}