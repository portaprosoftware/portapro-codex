import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { format, parseISO, isToday, startOfDay } from 'date-fns';
import { CheckCircle, XCircle, Save, X } from 'lucide-react';
import { WeatherSelectionModal } from './WeatherSelectionModal';
import { InspectionItemsTable } from './InspectionItemsTable';
import { InspectionPhotoGallery } from './InspectionPhotoGallery';
import { useUserRole } from '@/hooks/useUserRole';

interface SpillKitInspectionDetailModalProps {
  inspectionId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleted?: () => void;
  onSaved?: () => void;
}

export function SpillKitInspectionDetailModal({
  inspectionId,
  isOpen,
  onClose,
  onDeleted,
  onSaved,
}: SpillKitInspectionDetailModalProps) {
  const { hasAdminAccess, userId } = useUserRole();
  const queryClient = useQueryClient();
  
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [showWeatherModal, setShowWeatherModal] = useState(false);
  
  // Edit state
  const [editedData, setEditedData] = useState<any>(null);

  // Fetch inspection details
  const { data: inspection, isLoading } = useQuery({
    queryKey: ['spill-kit-inspection-detail', inspectionId],
    queryFn: async () => {
      if (!inspectionId) return null;
      
      const { data, error } = await supabase
        .from('vehicle_spill_kit_checks')
        .select(`
          *,
          vehicles(id, license_plate, vehicle_type, make, model, nickname),
          spill_kit_templates(id, name, spill_kit_template_items(*))
        `)
        .eq('id', inspectionId)
        .is('deleted_at', null)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!inspectionId && isOpen,
  });

  // Fetch inspector profile
  const { data: inspectorProfile } = useQuery({
    queryKey: ['inspector-profile', inspection?.checked_by_clerk],
    queryFn: async () => {
      if (!inspection?.checked_by_clerk) return null;
      
      const { data } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('clerk_user_id', inspection.checked_by_clerk)
        .single();
      
      return data;
    },
    enabled: !!inspection?.checked_by_clerk,
  });

  // Initialize edit data when inspection loads
  useEffect(() => {
    if (inspection && mode === 'edit') {
      setEditedData({
        has_kit: inspection.has_kit,
        item_conditions: inspection.item_conditions || {},
        notes: inspection.notes || '',
        weather_conditions: inspection.weather_conditions || '',
        photos: inspection.photos || [],
        next_check_due: inspection.next_check_due || null,
      });
    }
  }, [inspection, mode]);

  // Check if user can edit (drivers can edit until EOD)
  const canEdit = () => {
    if (hasAdminAccess) return true;
    if (!inspection || !userId) return false;
    
    // Drivers can only edit their own inspections on the same day
    const createdDate = startOfDay(parseISO(inspection.created_at));
    const today = startOfDay(new Date());
    const isSameDay = createdDate.getTime() === today.getTime();
    const isOwnInspection = inspection.checked_by_clerk === userId;
    
    return isOwnInspection && isSameDay;
  };

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!inspectionId || !editedData) return;

      const { error } = await supabase
        .from('vehicle_spill_kit_checks')
        .update({
          has_kit: editedData.has_kit,
          item_conditions: editedData.item_conditions,
          notes: editedData.notes,
          weather_conditions: editedData.weather_conditions,
          photos: editedData.photos,
          next_check_due: editedData.next_check_due,
          updated_at: new Date().toISOString(),
        })
        .eq('id', inspectionId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Inspection updated successfully');
      queryClient.invalidateQueries({ queryKey: ['spill-kit-inspection-history'] });
      queryClient.invalidateQueries({ queryKey: ['spill-kit-inspection-detail', inspectionId] });
      setMode('view');
      onSaved?.();
    },
    onError: (error) => {
      toast.error('Failed to update inspection');
      console.error('Update error:', error);
    },
  });

  const handleItemChange = (itemId: string, field: string, value: any) => {
    setEditedData((prev: any) => ({
      ...prev,
      item_conditions: {
        ...prev.item_conditions,
        [itemId]: {
          ...prev.item_conditions[itemId],
          [field]: value,
        },
      },
    }));
  };

  const handleSave = () => {
    saveMutation.mutate();
  };

  if (!inspectionId || !isOpen) return null;

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-12">
            Loading inspection details...
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!inspection) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="text-center py-12 text-muted-foreground">
            Inspection not found
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const vehicleName = inspection.vehicles?.make && inspection.vehicles?.model
    ? `${inspection.vehicles.make} ${inspection.vehicles.model}${inspection.vehicles.nickname ? ` - ${inspection.vehicles.nickname}` : ''}`
    : inspection.vehicles?.vehicle_type || 'Unknown Vehicle';

  const inspectorName = inspectorProfile?.first_name && inspectorProfile?.last_name
    ? `${inspectorProfile.first_name} ${inspectorProfile.last_name}`
    : 'Unknown';

  const templateItems = inspection.spill_kit_templates?.spill_kit_template_items || [];
  const canEditInspection = canEdit();

  // Helper function to convert text to Title Case
  const toTitleCase = (str: string) => {
    return str.replace(/\w\S*/g, (txt) => {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-2xl">Spill Kit Inspection</DialogTitle>
                <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <p><strong>Vehicle:</strong> {vehicleName} ({inspection.vehicles?.license_plate})</p>
                  <p><strong>Date:</strong> {format(parseISO(inspection.created_at), 'MMM dd, yyyy h:mm a')}</p>
                  <p><strong>Inspector:</strong> {inspectorName}</p>
                </div>
              </div>
              {mode === 'edit' && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setMode('view');
                      setEditedData(null);
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={saveMutation.isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              )}
            </div>
            {!hasAdminAccess && canEditInspection && mode === 'view' && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800">
                <strong>Note:</strong> Drivers can edit their inspections until end of day.
              </div>
            )}
          </DialogHeader>

          <Tabs defaultValue="items" className="mt-6">
            <TabsList className="w-full">
              <TabsTrigger value="items" className="flex-1">Kit Overview</TabsTrigger>
              <TabsTrigger value="weather" className="flex-1">Weather</TabsTrigger>
              <TabsTrigger value="photos" className="flex-1">Photos</TabsTrigger>
              <TabsTrigger value="notes" className="flex-1">Notes</TabsTrigger>
            </TabsList>

            <TabsContent value="items" className="mt-4 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <Label className="text-sm text-muted-foreground">Kit Status</Label>
                  <div className="mt-2">
                    {inspection.has_kit ? (
                      <Badge variant="default" className="gap-1 bg-gradient-to-r from-green-600 to-green-500 text-white font-bold">
                        <CheckCircle className="h-3 w-3" /> Present
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="gap-1 bg-gradient-to-r from-red-600 to-red-500 text-white font-bold">
                        <XCircle className="h-3 w-3" /> Missing
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <Label className="text-sm text-muted-foreground">Template Used</Label>
                  <div className="mt-2 font-medium">
                    {inspection.spill_kit_templates?.name || 'N/A'}
                  </div>
                </div>

                {inspection.next_check_due && (
                  <div className="p-4 border rounded-lg">
                    <Label className="text-sm text-muted-foreground">Next Check Due</Label>
                    <div className="mt-2 font-medium">
                      {format(parseISO(inspection.next_check_due), 'MMM dd, yyyy')}
                    </div>
                  </div>
                )}
              </div>

              <InspectionItemsTable
                templateItems={templateItems}
                itemConditions={mode === 'edit' ? editedData?.item_conditions || {} : inspection.item_conditions || {}}
                isEditMode={mode === 'edit'}
                onItemChange={handleItemChange}
              />
            </TabsContent>

            <TabsContent value="weather" className="mt-4">
              {mode === 'edit' ? (
                <div className="space-y-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowWeatherModal(true)}
                  >
                    Select Weather Conditions
                  </Button>
                  {editedData?.weather_conditions && (
                    <div className="flex flex-wrap gap-2">
                      {editedData.weather_conditions.split(',').map((condition: string) => (
                        <Badge key={condition} className="bg-gradient-to-r from-green-600 to-green-500 text-white font-bold">
                          {toTitleCase(condition.trim())}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {inspection.weather_conditions ? (
                    inspection.weather_conditions.split(',').map((condition: string) => (
                      <Badge key={condition} className="bg-gradient-to-r from-green-600 to-green-500 text-white font-bold">
                        {toTitleCase(condition.trim())}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No weather conditions recorded</p>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="photos" className="mt-4">
              <InspectionPhotoGallery
                photos={mode === 'edit' ? editedData?.photos || [] : inspection.photos || []}
                isEditMode={mode === 'edit'}
                onPhotosChange={(photos) => setEditedData((prev: any) => ({ ...prev, photos }))}
              />
            </TabsContent>

            <TabsContent value="notes" className="mt-4">
              {mode === 'edit' ? (
                <Textarea
                  value={editedData?.notes || ''}
                  onChange={(e) => setEditedData((prev: any) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Add inspection notes..."
                  rows={8}
                />
              ) : (
                <div className="p-4 border rounded-lg min-h-[200px]">
                  {inspection.notes || (
                    <p className="text-muted-foreground">No notes recorded</p>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Weather Selection Modal */}
      {showWeatherModal && (
        <WeatherSelectionModal
          isOpen={showWeatherModal}
          onClose={() => setShowWeatherModal(false)}
          onSelect={(conditions) => {
            setEditedData((prev: any) => ({
              ...prev,
              weather_conditions: conditions.join(', '),
            }));
          }}
          currentValue={editedData?.weather_conditions?.split(',').map((c: string) => c.trim()) || []}
        />
      )}
    </>
  );
}
