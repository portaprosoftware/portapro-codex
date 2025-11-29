import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Camera, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Wrench,
  DollarSign,
  Plus,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { PhotoGallery } from '@/components/technician/PhotoGallery';
import { MobileCamera } from '@/components/technician/MobileCamera';
import { uploadWorkOrderPhoto, fetchWorkOrderPhotos, deleteWorkOrderPhoto } from '@/utils/photoUpload';
import { useUser } from '@clerk/clerk-react';
import { useOrganizationId } from '@/hooks/useOrganizationId';

interface Task {
  id: string;
  description: string;
  completed: boolean;
}

interface Part {
  id: string;
  name: string;
  quantity: number;
  cost: number;
}

interface LaborEntry {
  id: string;
  hours: number;
  description: string;
}

export default function TechnicianWorkOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useUser();
  const { orgId, isReady } = useOrganizationId();
  
  const [showCamera, setShowCamera] = useState(false);
  const [photoType, setPhotoType] = useState<'before' | 'after' | 'progress' | 'issue'>('progress');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [laborEntries, setLaborEntries] = useState<LaborEntry[]>([]);
  const [notes, setNotes] = useState('');
  
  // Fetch work order details
  const { data: workOrder, isLoading } = useQuery({
    queryKey: ['work-order-detail', id],
    queryFn: async () => {
      if (!id || !orgId) return null;
      const { data, error } = await supabase
        .from('work_orders')
        .select('*')
        .eq('id', id)
        .eq('organization_id', orgId)
        .single();
      
      if (error) throw error;
      
      // Initialize default tasks based on work order type
      const defaultTasks = [
        'Inspect affected area',
        'Document with photos',
        'Perform repair/service',
        'Test and verify',
        'Clean work area'
      ];
      
      setTasks(defaultTasks.map((desc, idx) => ({
        id: `task-${idx}`,
        description: desc,
        completed: false
      })));
      
      return data;
    },
    enabled: !!id && !!orgId && isReady
  });

  // Fetch photos
  const { data: photos = [], refetch: refetchPhotos } = useQuery({
    queryKey: ['work-order-photos', id],
    queryFn: () => fetchWorkOrderPhotos(id!, orgId!),
    enabled: !!id && !!orgId && isReady
  });

  // Upload photo mutation
  const uploadMutation = useMutation({
    mutationFn: async (photoDataUrl: string) => {
      if (!orgId) throw new Error('Organization ID required');

      return uploadWorkOrderPhoto(photoDataUrl, {
        workOrderId: id!,
        photoType,
        uploadedBy: user?.id,
        organizationId: orgId,
      });
    },
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: 'Photo uploaded',
          description: 'Photo added successfully',
        });
        refetchPhotos();
        setShowCamera(false);
      } else {
        toast({
          title: 'Upload failed',
          description: result.error || 'Failed to upload photo',
          variant: 'destructive',
        });
      }
    }
  });

  // Delete photo mutation
  const deleteMutation = useMutation({
    mutationFn: (photoId: string) => deleteWorkOrderPhoto(photoId, orgId!),
    onSuccess: () => {
      toast({
        title: 'Photo deleted',
        description: 'Photo removed successfully',
      });
      refetchPhotos();
    }
  });

  const handlePhotoCapture = (photoDataUrl: string) => {
    uploadMutation.mutate(photoDataUrl);
  };

  const toggleTask = (taskId: string) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  const addPart = () => {
    const newPart: Part = {
      id: `part-${Date.now()}`,
      name: '',
      quantity: 1,
      cost: 0
    };
    setParts([...parts, newPart]);
  };

  const updatePart = (id: string, field: keyof Part, value: any) => {
    setParts(parts.map(part => 
      part.id === id ? { ...part, [field]: value } : part
    ));
  };

  const removePart = (id: string) => {
    setParts(parts.filter(part => part.id !== id));
  };

  const addLaborEntry = () => {
    const newEntry: LaborEntry = {
      id: `labor-${Date.now()}`,
      hours: 0,
      description: ''
    };
    setLaborEntries([...laborEntries, newEntry]);
  };

  const updateLaborEntry = (id: string, field: keyof LaborEntry, value: any) => {
    setLaborEntries(laborEntries.map(entry => 
      entry.id === id ? { ...entry, [field]: value } : entry
    ));
  };

  const removeLaborEntry = (id: string) => {
    setLaborEntries(laborEntries.filter(entry => entry.id !== id));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'on_hold': return 'bg-yellow-500';
      case 'open': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading work order...</p>
        </div>
      </div>
    );
  }

  if (!workOrder) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Work Order Not Found</h2>
          <p className="text-muted-foreground mb-4">
            Unable to load work order details
          </p>
          <Button onClick={() => navigate('/technician')}>
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  const totalPartsCost = parts.reduce((sum, part) => sum + (part.quantity * part.cost), 0);
  const totalLaborHours = laborEntries.reduce((sum, entry) => sum + Number(entry.hours), 0);

  if (showCamera) {
    return (
      <MobileCamera
        onCapture={handlePhotoCapture}
        onClose={() => setShowCamera(false)}
        photoType={photoType}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center gap-3 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/technician')}
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{workOrder.work_order_number}</h1>
            <p className="text-sm text-muted-foreground">
              Asset: {workOrder.asset_id}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Status & Priority */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Status</Label>
              <Badge className={`${getStatusColor(workOrder.status)} text-white`}>
                {workOrder.status?.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Priority</Label>
              <Badge className={`${getPriorityColor(workOrder.priority)} text-white`}>
                {workOrder.priority?.toUpperCase()}
              </Badge>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Source:</span>
              <span className="font-medium">{workOrder.source}</span>
            </div>
            {workOrder.due_date && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Due Date:</span>
                <span className="font-medium">
                  {format(new Date(workOrder.due_date), 'MMM d, yyyy')}
                </span>
              </div>
            )}
            {(workOrder.meter_open_miles || workOrder.meter_open_hours) && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Meter Reading:</span>
                <span className="font-medium">
                  {workOrder.meter_open_miles ? `${workOrder.meter_open_miles.toLocaleString()} mi` : ''}
                  {workOrder.meter_open_hours ? `${workOrder.meter_open_hours.toLocaleString()} hrs` : ''}
                </span>
              </div>
            )}
          </div>
        </Card>

        {/* Description */}
        <Card className="p-4">
          <h2 className="font-bold mb-2">Description</h2>
          <p className="text-sm text-muted-foreground">{workOrder.description}</p>
        </Card>

        {/* Tasks Checklist */}
        {tasks.length > 0 && (
          <Card className="p-4">
            <h2 className="font-bold mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Tasks ({tasks.filter(t => t.completed).length}/{tasks.length})
            </h2>
            <div className="space-y-3">
              {tasks.map(task => (
                <div key={task.id} className="flex items-start gap-3">
                  <Checkbox
                    id={task.id}
                    checked={task.completed}
                    onCheckedChange={() => toggleTask(task.id)}
                    className="mt-1"
                  />
                  <Label
                    htmlFor={task.id}
                    className={`flex-1 cursor-pointer ${
                      task.completed ? 'line-through text-muted-foreground' : ''
                    }`}
                  >
                    {task.description}
                  </Label>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Parts Used */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Parts Used
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={addPart}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Part
            </Button>
          </div>

          {parts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No parts added yet
            </p>
          ) : (
            <div className="space-y-3">
              {parts.map(part => (
                <div key={part.id} className="space-y-2 p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <Input
                      placeholder="Part name"
                      value={part.name}
                      onChange={(e) => updatePart(part.id, 'name', e.target.value)}
                      className="flex-1 mr-2"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removePart(part.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Quantity</Label>
                      <Input
                        type="number"
                        min="1"
                        value={part.quantity}
                        onChange={(e) => updatePart(part.id, 'quantity', Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Cost ($)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={part.cost}
                        onChange={(e) => updatePart(part.id, 'cost', Number(e.target.value))}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="font-medium">Total Parts Cost:</span>
                <span className="text-lg font-bold">${totalPartsCost.toFixed(2)}</span>
              </div>
            </div>
          )}
        </Card>

        {/* Labor Hours */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Labor Hours
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={addLaborEntry}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Entry
            </Button>
          </div>

          {laborEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No labor entries yet
            </p>
          ) : (
            <div className="space-y-3">
              {laborEntries.map(entry => (
                <div key={entry.id} className="space-y-2 p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <Input
                      placeholder="Labor description"
                      value={entry.description}
                      onChange={(e) => updateLaborEntry(entry.id, 'description', e.target.value)}
                      className="flex-1 mr-2"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLaborEntry(entry.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <div>
                    <Label className="text-xs">Hours</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.25"
                      value={entry.hours}
                      onChange={(e) => updateLaborEntry(entry.id, 'hours', Number(e.target.value))}
                    />
                  </div>
                </div>
              ))}
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="font-medium">Total Labor Hours:</span>
                <span className="text-lg font-bold">{totalLaborHours.toFixed(2)} hrs</span>
              </div>
            </div>
          )}
        </Card>

        {/* Photos */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Photos ({photos.length})
            </h2>
          </div>

          {/* Photo Type Selector */}
          <div className="flex gap-2 mb-4">
            {(['before', 'progress', 'after', 'issue'] as const).map(type => (
              <Button
                key={type}
                variant={photoType === type ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setPhotoType(type);
                  setShowCamera(true);
                }}
                className="flex-1 capitalize"
              >
                {type}
              </Button>
            ))}
          </div>

          <PhotoGallery
            photos={photos}
            onDelete={(photoId) => deleteMutation.mutate(photoId)}
            onAddPhoto={() => setShowCamera(true)}
          />
        </Card>

        {/* Notes */}
        <Card className="p-4">
          <h2 className="font-bold mb-3">Work Notes</h2>
          <Textarea
            placeholder="Add notes about the work performed..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
          />
        </Card>

        {/* Summary Card */}
        <Card className="p-4 bg-primary/5">
          <h3 className="font-bold mb-3">Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tasks Completed:</span>
              <span className="font-medium">{tasks.filter(t => t.completed).length}/{tasks.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Parts Cost:</span>
              <span className="font-medium">${totalPartsCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Labor Hours:</span>
              <span className="font-medium">{totalLaborHours.toFixed(2)} hrs</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Photos:</span>
              <span className="font-medium">{photos.length}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
