import React, { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, XCircle } from "lucide-react";
import SignatureCanvas from "react-signature-canvas";

interface WorkOrderSignOffSectionProps {
  technicianSignature?: string;
  reviewerSignature?: string;
  returnToService: boolean;
  onTechnicianSignatureChange: (signature: string) => void;
  onReviewerSignatureChange: (signature: string) => void;
  onReturnToServiceChange: (value: boolean) => void;
  outOfService: boolean;
  hasFailedItems: boolean;
}

export const WorkOrderSignOffSection: React.FC<WorkOrderSignOffSectionProps> = ({
  technicianSignature,
  reviewerSignature,
  returnToService,
  onTechnicianSignatureChange,
  onReviewerSignatureChange,
  onReturnToServiceChange,
  outOfService,
  hasFailedItems
}) => {
  const techSigRef = useRef<SignatureCanvas>(null);
  const reviewSigRef = useRef<SignatureCanvas>(null);

  const handleTechClear = () => {
    techSigRef.current?.clear();
    onTechnicianSignatureChange('');
  };

  const handleTechSave = () => {
    if (techSigRef.current) {
      const signature = techSigRef.current.toDataURL();
      onTechnicianSignatureChange(signature);
    }
  };

  const handleReviewClear = () => {
    reviewSigRef.current?.clear();
    onReviewerSignatureChange('');
  };

  const handleReviewSave = () => {
    if (reviewSigRef.current) {
      const signature = reviewSigRef.current.toDataURL();
      onReviewerSignatureChange(signature);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Sign-Offs & Return to Service</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Vehicle status warning */}
        {outOfService && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-600">Vehicle Out of Service</span>
            </div>
            <p className="text-xs text-muted-foreground">
              This vehicle is currently marked as out of service. Complete all repairs and toggle "Return to Service" below before closing.
            </p>
          </div>
        )}

        {/* Defects warning */}
        {hasFailedItems && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-600">Failed Checklist Items</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Some checklist items have failed. Ensure all critical issues are resolved before marking as complete.
            </p>
          </div>
        )}

        <Separator />

        {/* Technician Signature */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Technician Signature *</Label>
          <p className="text-xs text-muted-foreground">
            Sign to verify work completion
          </p>
          
          {technicianSignature ? (
            <div className="border rounded-lg p-2 bg-muted/50">
              <img src={technicianSignature} alt="Technician signature" className="max-h-24 mx-auto" />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleTechClear}
                className="w-full mt-2 text-xs"
                type="button"
              >
                Clear Signature
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="border rounded-lg bg-white">
                <SignatureCanvas
                  ref={techSigRef}
                  canvasProps={{
                    className: 'w-full h-32 rounded-lg',
                  }}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleTechClear}
                  className="flex-1 text-xs"
                  type="button"
                >
                  Clear
                </Button>
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={handleTechSave}
                  className="flex-1 text-xs"
                  type="button"
                >
                  Save Signature
                </Button>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Reviewer Approval (optional) */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Reviewer Approval <Badge variant="outline" className="ml-2 text-xs">Optional</Badge>
          </Label>
          <p className="text-xs text-muted-foreground">
            For critical repairs or major work
          </p>
          
          {reviewerSignature ? (
            <div className="border rounded-lg p-2 bg-muted/50">
              <img src={reviewerSignature} alt="Reviewer signature" className="max-h-24 mx-auto" />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleReviewClear}
                className="w-full mt-2 text-xs"
                type="button"
              >
                Clear Signature
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="border rounded-lg bg-white">
                <SignatureCanvas
                  ref={reviewSigRef}
                  canvasProps={{
                    className: 'w-full h-32 rounded-lg',
                  }}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleReviewClear}
                  className="flex-1 text-xs"
                  type="button"
                >
                  Clear
                </Button>
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={handleReviewSave}
                  className="flex-1 text-xs"
                  type="button"
                >
                  Save Signature
                </Button>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Return to Service Toggle */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="return-to-service" className="text-sm font-medium">
                Return Vehicle to Service
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Vehicle will be available for scheduling
              </p>
            </div>
            <Switch
              id="return-to-service"
              checked={returnToService}
              onCheckedChange={onReturnToServiceChange}
              disabled={!outOfService}
            />
          </div>

          {returnToService && outOfService && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">Ready for Service</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Vehicle will be marked as active and available for new jobs
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
