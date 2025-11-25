import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle,
  Camera,
  PenTool,
  Clock,
  Wrench,
  FileText,
  Plus,
  Trash2,
  RotateCcw
} from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { PhotoGallery } from '@/components/technician/PhotoGallery';
import { MobileCamera } from '@/components/technician/MobileCamera';
import { VoiceRecorder } from '@/components/shared/VoiceRecorder';
import { uploadWorkOrderPhoto, fetchWorkOrderPhotos, deleteWorkOrderPhoto } from '@/utils/photoUpload';
import { useUser } from '@clerk/clerk-react';
import { useTenantId } from '@/lib/tenantQuery';

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

type CompletionStep = 'photos' | 'parts' | 'labor' | 'notes' | 'signature' | 'review';

export default function TechnicianWorkOrderComplete() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useUser();
  const tenantId = useTenantId();
  const signatureRef = useRef<SignatureCanvas>(null);
  
  const [currentStep, setCurrentStep] = useState<CompletionStep>('photos');
  const [showCamera, setShowCamera] = useState(false);
  const [photoType, setPhotoType] = useState<'before' | 'after' | 'progress' | 'issue'>('after');
  const [parts, setParts] = useState<Part[]>([]);
  const [laborEntries, setLaborEntries] = useState<LaborEntry[]>([
    { id: 'labor-1', hours: 0, description: '' }
  ]);
  const [completionNotes, setCompletionNotes] = useState('');
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);

  // Fetch work order details
  const { data: workOrder, isLoading } = useQuery({
    queryKey: ['work-order-complete', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('work_orders')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  // Fetch photos
  const { data: photos = [], refetch: refetchPhotos } = useQuery({
    queryKey: ['work-order-photos', id],
    queryFn: () => fetchWorkOrderPhotos(id!),
    enabled: !!id
  });

  // Upload photo mutation
  const uploadMutation = useMutation({
    mutationFn: async (photoDataUrl: string) => {
      return uploadWorkOrderPhoto(photoDataUrl, {
        workOrderId: id!,
        photoType,
        uploadedBy: user?.id
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
    mutationFn: deleteWorkOrderPhoto,
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
    if (laborEntries.length > 1) {
      setLaborEntries(laborEntries.filter(entry => entry.id !== id));
    }
  };

  const clearSignature = () => {
    signatureRef.current?.clear();
    setSignatureData(null);
  };

  const saveSignature = () => {
    if (signatureRef.current?.isEmpty()) {
      toast({
        title: 'Signature required',
        description: 'Please provide your signature',
        variant: 'destructive',
      });
      return;
    }
    const data = signatureRef.current?.toDataURL();
    setSignatureData(data || null);
    setCurrentStep('review');
  };

  const handleComplete = async () => {
    if (!signatureData) {
      toast({
        title: 'Signature required',
        description: 'Please complete all steps including signature',
        variant: 'destructive',
      });
      return;
    }

    const afterPhotos = photos.filter(p => p.type === 'after');
    if (afterPhotos.length === 0) {
      toast({
        title: 'After photos required',
        description: 'Please add at least one "after" photo',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const totalLaborHours = laborEntries.reduce((sum, entry) => sum + Number(entry.hours || 0), 0);
      const totalPartsCost = parts.reduce((sum, part) => sum + (part.quantity * part.cost), 0);

      // Create signature record
      const { data: signatureRecord, error: signatureError } = await supabase
        .from('work_order_signatures')
        .insert({
          work_order_id: id!,
          signature_type: 'technician',
          signed_by: user?.id || 'unknown',
          signature_data: signatureData
        })
        .select()
        .single();

      if (signatureError) throw signatureError;

      // Update work order
      const { error: updateError } = await supabase
        .from('work_orders')
        .update({
          status: 'completed',
          closed_at: new Date().toISOString(),
          closed_by: user?.id,
          resolution_notes: completionNotes,
          total_labor_hours: totalLaborHours,
          total_parts_cost: totalPartsCost,
          total_cost: totalPartsCost,
          technician_signature_id: signatureRecord.id,
          updated_at: new Date().toISOString()
        })
        // TENANT-SCOPED
        .eq('organization_id', tenantId!)
        .eq('id', id);

      if (updateError) throw updateError;

      // Add history entry
      await supabase.from('work_order_history').insert({
        work_order_id: id!,
        from_status: workOrder?.status || 'in_progress',
        to_status: 'completed',
        changed_by: user?.id,
        organization_id: tenantId!,
        note: `Work order completed via mobile. Labor: ${totalLaborHours}hrs, Parts: $${totalPartsCost.toFixed(2)}`
      });

      toast({
        title: 'Work order completed',
        description: 'Work order has been successfully completed',
      });

      navigate('/technician');
    } catch (error) {
      console.error('Error completing work order:', error);
      toast({
        title: 'Completion failed',
        description: 'Failed to complete work order. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStepNumber = (step: CompletionStep) => {
    const steps: CompletionStep[] = ['photos', 'parts', 'labor', 'notes', 'signature', 'review'];
    return steps.indexOf(step) + 1;
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
          <Button onClick={() => navigate('/technician')}>
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  if (showCamera) {
    return (
      <MobileCamera
        onCapture={handlePhotoCapture}
        onClose={() => setShowCamera(false)}
        photoType={photoType}
      />
    );
  }

  const totalLaborHours = laborEntries.reduce((sum, entry) => sum + Number(entry.hours || 0), 0);
  const totalPartsCost = parts.reduce((sum, part) => sum + (part.quantity * part.cost), 0);
  const afterPhotos = photos.filter(p => p.type === 'after');

  return (
    <div className="min-h-screen bg-background pb-24">
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
            <h1 className="text-xl font-bold">Complete Work Order</h1>
            <p className="text-sm text-muted-foreground">
              {workOrder.work_order_number}
            </p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-1 px-4 pb-3">
          {['photos', 'parts', 'labor', 'notes', 'signature', 'review'].map((step, idx) => (
            <div
              key={step}
              className={`h-2 flex-1 rounded-full ${
                getStepNumber(currentStep as CompletionStep) > idx + 1
                  ? 'bg-green-500'
                  : getStepNumber(currentStep as CompletionStep) === idx + 1
                  ? 'bg-primary'
                  : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Step 1: Photos */}
        {currentStep === 'photos' && (
          <>
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Camera className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="font-bold text-lg">Step 1: Final Photos</h2>
                  <p className="text-sm text-muted-foreground">
                    Add "After" photos showing completed work
                  </p>
                </div>
              </div>

              <div className="flex gap-2 mb-4">
                <Button
                  variant={photoType === 'after' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setPhotoType('after');
                    setShowCamera(true);
                  }}
                  className="flex-1"
                >
                  After Photos
                </Button>
                <Button
                  variant={photoType === 'issue' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setPhotoType('issue');
                    setShowCamera(true);
                  }}
                  className="flex-1"
                >
                  Issues Found
                </Button>
              </div>

              {afterPhotos.length === 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-4">
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 font-medium">
                    ⚠️ At least one "After" photo is required
                  </p>
                </div>
              )}

              <PhotoGallery
                photos={photos}
                onDelete={(photoId) => deleteMutation.mutate(photoId)}
                onAddPhoto={() => setShowCamera(true)}
              />
            </Card>

            <Button
              onClick={() => setCurrentStep('parts')}
              disabled={afterPhotos.length === 0}
              className="w-full h-14 text-lg font-semibold"
              size="lg"
            >
              Continue to Parts
            </Button>
          </>
        )}

        {/* Step 2: Parts */}
        {currentStep === 'parts' && (
          <>
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Wrench className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="font-bold text-lg">Step 2: Parts Used</h2>
                  <p className="text-sm text-muted-foreground">
                    List all parts used for this repair
                  </p>
                </div>
              </div>

              {parts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No parts added</p>
                  <Button onClick={addPart} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Part
                  </Button>
                </div>
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
                  
                  <Button onClick={addPart} variant="outline" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Another Part
                  </Button>

                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="font-medium">Total Parts Cost:</span>
                    <span className="text-lg font-bold">${totalPartsCost.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </Card>

            <div className="flex gap-2">
              <Button
                onClick={() => setCurrentStep('photos')}
                variant="outline"
                className="flex-1 h-12"
              >
                Back
              </Button>
              <Button
                onClick={() => setCurrentStep('labor')}
                className="flex-1 h-12"
              >
                Continue
              </Button>
            </div>
          </>
        )}

        {/* Step 3: Labor */}
        {currentStep === 'labor' && (
          <>
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="font-bold text-lg">Step 3: Labor Hours</h2>
                  <p className="text-sm text-muted-foreground">
                    Track time spent on this work order
                  </p>
                </div>
              </div>

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
                      {laborEntries.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeLaborEntry(entry.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs">Hours</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.25"
                        value={entry.hours}
                        onChange={(e) => updateLaborEntry(entry.id, 'hours', Number(e.target.value))}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                ))}
                
                <Button onClick={addLaborEntry} variant="outline" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Labor Entry
                </Button>

                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="font-medium">Total Labor Hours:</span>
                  <span className="text-lg font-bold">{totalLaborHours.toFixed(2)} hrs</span>
                </div>
              </div>
            </Card>

            <div className="flex gap-2">
              <Button
                onClick={() => setCurrentStep('parts')}
                variant="outline"
                className="flex-1 h-12"
              >
                Back
              </Button>
              <Button
                onClick={() => setCurrentStep('notes')}
                disabled={totalLaborHours === 0}
                className="flex-1 h-12"
              >
                Continue
              </Button>
            </div>
          </>
        )}

        {/* Step 4: Notes */}
        {currentStep === 'notes' && (
          <>
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="font-bold text-lg">Step 4: Completion Notes</h2>
                  <p className="text-sm text-muted-foreground">
                    Describe the work performed
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Work Summary</Label>
                <Textarea
                  placeholder="Describe the work completed, any issues found, and recommendations..."
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  rows={8}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  {completionNotes.length} / 500 characters
                </p>

                {/* Voice Input */}
                <div className="pt-3 border-t">
                  <Label className="mb-3 block">Or use voice input</Label>
                  <VoiceRecorder
                    isRecording={isVoiceRecording}
                    onRecordingChange={setIsVoiceRecording}
                    onTranscript={(text) => {
                      setCompletionNotes(prev => {
                        const newText = prev ? `${prev} ${text}` : text;
                        return newText.slice(0, 500); // Respect character limit
                      });
                    }}
                  />
                </div>
              </div>
            </Card>

            <div className="flex gap-2">
              <Button
                onClick={() => setCurrentStep('labor')}
                variant="outline"
                className="flex-1 h-12"
              >
                Back
              </Button>
              <Button
                onClick={() => setCurrentStep('signature')}
                disabled={!completionNotes.trim()}
                className="flex-1 h-12"
              >
                Continue
              </Button>
            </div>
          </>
        )}

        {/* Step 5: Signature */}
        {currentStep === 'signature' && (
          <>
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <PenTool className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="font-bold text-lg">Step 5: Your Signature</h2>
                  <p className="text-sm text-muted-foreground">
                    Sign to certify work completion
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Draw your signature below</Label>
                <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg overflow-hidden bg-white">
                  <SignatureCanvas
                    ref={signatureRef}
                    canvasProps={{
                      className: 'w-full h-48 cursor-crosshair',
                    }}
                    backgroundColor="white"
                  />
                </div>
                <Button
                  onClick={clearSignature}
                  variant="outline"
                  className="w-full"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Clear Signature
                </Button>
              </div>
            </Card>

            <div className="flex gap-2">
              <Button
                onClick={() => setCurrentStep('notes')}
                variant="outline"
                className="flex-1 h-12"
              >
                Back
              </Button>
              <Button
                onClick={saveSignature}
                className="flex-1 h-12"
              >
                Continue to Review
              </Button>
            </div>
          </>
        )}

        {/* Step 6: Review */}
        {currentStep === 'review' && (
          <>
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                </div>
                <div className="flex-1">
                  <h2 className="font-bold text-lg">Review & Submit</h2>
                  <p className="text-sm text-muted-foreground">
                    Confirm all details before completing
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Summary */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">After Photos:</span>
                    <span className="font-medium">{afterPhotos.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Photos:</span>
                    <span className="font-medium">{photos.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Parts Used:</span>
                    <span className="font-medium">{parts.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Parts Cost:</span>
                    <span className="font-medium">${totalPartsCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Labor Hours:</span>
                    <span className="font-medium">{totalLaborHours.toFixed(2)} hrs</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t">
                    <span className="font-medium">Signature:</span>
                    <Badge variant="outline" className="bg-green-500/10">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Signed
                    </Badge>
                  </div>
                </div>

                {signatureData && (
                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">Preview Signature</Label>
                    <img
                      src={signatureData}
                      alt="Signature"
                      className="border rounded-lg p-2 bg-white w-full"
                    />
                  </div>
                )}
              </div>
            </Card>

            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <p className="text-sm text-foreground">
                By completing this work order, you certify that all work has been performed according to standards and all information provided is accurate.
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setCurrentStep('signature')}
                variant="outline"
                className="flex-1 h-12"
                disabled={isSubmitting}
              >
                Back
              </Button>
              <Button
                onClick={handleComplete}
                disabled={isSubmitting}
                className="flex-1 h-14 text-lg font-semibold bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                    Completing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-6 w-6 mr-2" />
                    Complete Work Order
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
