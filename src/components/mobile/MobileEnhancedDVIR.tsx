import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MobileOptimizedButton } from './MobileOptimizedButton';
import { PullToRefresh } from './PullToRefresh';
import { useEnhancedOffline } from '@/hooks/useEnhancedOffline';
import { hapticFeedback } from '@/utils/mobileUtils';
import { Camera, CheckCircle, AlertTriangle, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DVIRItem {
  id: string;
  label: string;
  required: boolean;
  status: 'pass' | 'fail' | 'pending';
  notes?: string;
  photo?: string;
}

interface MobileEnhancedDVIRProps {
  vehicleId: string;
  onComplete: (data: any) => Promise<void>;
}

export const MobileEnhancedDVIR: React.FC<MobileEnhancedDVIRProps> = ({
  vehicleId,
  onComplete
}) => {
  const { toast } = useToast();
  const { addOfflineData, isOnline } = useEnhancedOffline();
  const [items, setItems] = useState<DVIRItem[]>([
    { id: '1', label: 'Pre-trip Inspection', required: true, status: 'pending' },
    { id: '2', label: 'Engine Oil Level', required: true, status: 'pending' },
    { id: '3', label: 'Hydraulic Fluid', required: true, status: 'pending' },
    { id: '4', label: 'Vacuum Pump Operation', required: true, status: 'pending' },
    { id: '5', label: 'Hose Connections', required: true, status: 'pending' },
    { id: '6', label: 'Tank Seals', required: true, status: 'pending' },
    { id: '7', label: 'Spill Kit Present', required: true, status: 'pending' },
    { id: '8', label: 'Safety Equipment', required: true, status: 'pending' },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateItemStatus = (itemId: string, status: 'pass' | 'fail') => {
    hapticFeedback('light');
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, status } : item
    ));
  };

  const addPhoto = async (itemId: string) => {
    // Simulate photo capture
    hapticFeedback('medium');
    
    try {
      // In a real app, this would open camera
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment';
      
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const photoUrl = URL.createObjectURL(file);
          setItems(prev => prev.map(item => 
            item.id === itemId ? { ...item, photo: photoUrl } : item
          ));
          
          toast({
            title: "Photo Added",
            description: "Photo captured and attached to inspection item",
          });
        }
      };
      
      input.click();
    } catch (error) {
      toast({
        title: "Camera Error",
        description: "Failed to access camera. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async () => {
    const incompleteItems = items.filter(item => item.required && item.status === 'pending');
    
    if (incompleteItems.length > 0) {
      hapticFeedback('heavy');
      toast({
        title: "Incomplete Inspection",
        description: `${incompleteItems.length} required items not completed`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    hapticFeedback('medium');

    try {
      const dvirData = {
        vehicle_id: vehicleId,
        inspection_items: items,
        completed_at: new Date().toISOString(),
        has_defects: items.some(item => item.status === 'fail'),
        offline_created: !isOnline
      };

      if (isOnline) {
        await onComplete(dvirData);
      } else {
        addOfflineData('dvir', dvirData, 'current-user'); // In real app, get actual user ID
        toast({
          title: "DVIR Saved Offline",
          description: "Inspection saved locally and will sync when connected",
        });
      }

      toast({
        title: "DVIR Completed",
        description: "Vehicle inspection has been submitted successfully",
      });

    } catch (error) {
      hapticFeedback('heavy');
      toast({
        title: "Submission Failed",
        description: "Failed to submit DVIR. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRefresh = async () => {
    // Simulate refreshing vehicle data
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast({
      title: "Data Refreshed",
      description: "Vehicle information updated",
    });
  };

  const completedCount = items.filter(item => item.status !== 'pending').length;
  const progressPercentage = (completedCount / items.length) * 100;

  return (
    <PullToRefresh onRefresh={handleRefresh} className="h-full">
      <div className="p-4 space-y-4">
        {/* Progress Header */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span>DVIR Progress</span>
              <span className="text-sm font-normal">{completedCount}/{items.length}</span>
            </CardTitle>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </CardHeader>
        </Card>

        {/* Inspection Items */}
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium">{item.label}</span>
                  {item.required && (
                    <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded">
                      Required
                    </span>
                  )}
                </div>

                <div className="flex gap-2 mb-3">
                  <MobileOptimizedButton
                    variant={item.status === 'pass' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateItemStatus(item.id, 'pass')}
                    className="flex-1"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Pass
                  </MobileOptimizedButton>
                  
                  <MobileOptimizedButton
                    variant={item.status === 'fail' ? 'destructive' : 'outline'}
                    size="sm"
                    onClick={() => updateItemStatus(item.id, 'fail')}
                    className="flex-1"
                  >
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    Fail
                  </MobileOptimizedButton>

                  <MobileOptimizedButton
                    variant="outline"
                    size="sm"
                    onClick={() => addPhoto(item.id)}
                    className="px-3"
                  >
                    <Camera className="w-4 h-4" />
                  </MobileOptimizedButton>
                </div>

                {item.photo && (
                  <div className="mt-2">
                    <img 
                      src={item.photo} 
                      alt="Inspection photo" 
                      className="w-full h-32 object-cover rounded border"
                    />
                  </div>
                )}

                {item.status === 'fail' && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                    <textarea
                      placeholder="Describe the defect..."
                      className="w-full p-2 text-sm border rounded resize-none"
                      rows={2}
                      onChange={(e) => {
                        setItems(prev => prev.map(prevItem => 
                          prevItem.id === item.id 
                            ? { ...prevItem, notes: e.target.value }
                            : prevItem
                        ));
                      }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Submit Button */}
        <div className="sticky bottom-4 pt-4">
          <MobileOptimizedButton
            onClick={handleSubmit}
            loading={isSubmitting}
            disabled={completedCount < items.filter(item => item.required).length}
            fullWidth
            size="lg"
            className="shadow-lg"
          >
            {!isOnline && <Upload className="w-4 h-4 mr-2" />}
            Submit DVIR {!isOnline && '(Offline)'}
          </MobileOptimizedButton>
        </div>
      </div>
    </PullToRefresh>
  );
};