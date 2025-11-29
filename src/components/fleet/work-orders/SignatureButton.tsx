import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Edit2, Trash2 } from "lucide-react";
import SignatureCanvas from "react-signature-canvas";
import { format } from "date-fns";

interface SignatureButtonProps {
  label: string;
  signatureData?: string | null;
  signedAt?: string | null;
  signedBy?: string | null;
  onSign: (signatureData: string) => void;
  onClear?: () => void;
  required?: boolean;
  disabled?: boolean;
}

export const SignatureButton: React.FC<SignatureButtonProps> = ({
  label,
  signatureData,
  signedAt,
  signedBy,
  onSign,
  onClear,
  required = false,
  disabled = false
}) => {
  const [open, setOpen] = useState(false);
  const sigRef = useRef<typeof SignatureCanvas | null>(null);
  const [hasDrawn, setHasDrawn] = useState(false);

  const handleClear = () => {
    sigRef.current?.clear();
    setHasDrawn(false);
  };

  const handleSave = () => {
    if (sigRef.current && !sigRef.current.isEmpty()) {
      const signature = sigRef.current.toDataURL();
      onSign(signature);
      setOpen(false);
      setHasDrawn(false);
    }
  };

  const handleDelete = () => {
    if (onClear) {
      onClear();
    }
  };

  return (
    <>
      {signatureData ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">{label}</span>
            </div>
            <Badge variant="outline" className="text-xs">
              Signed
            </Badge>
          </div>
          <div className="border rounded-lg p-2 bg-muted/30">
            <img 
              src={signatureData} 
              alt={`${label} signature`} 
              className="max-h-24 w-full object-contain"
            />
            {signedAt && (
              <p className="text-xs text-muted-foreground mt-2">
                Signed {format(new Date(signedAt), "MMM d, yyyy 'at' h:mm a")}
                {signedBy && ` by ${signedBy}`}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen(true)}
              disabled={disabled}
              className="flex-1"
            >
              <Edit2 className="h-3 w-3 mr-1" />
              Update
            </Button>
            {onClear && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                disabled={disabled}
                className="flex-1"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          onClick={() => setOpen(true)}
          disabled={disabled}
          className="w-full"
        >
          <Edit2 className="h-4 w-4 mr-2" />
          {label} {required && <span className="text-destructive ml-1">*</span>}
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{label}</DialogTitle>
            <DialogDescription>
              Sign in the box below using your mouse or touch screen
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-lg bg-white">
              <SignatureCanvas
                ref={sigRef}
                canvasProps={{
                  className: 'w-full h-48 rounded-lg cursor-crosshair',
                }}
                onBegin={() => setHasDrawn(true)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleClear}
              disabled={!hasDrawn}
            >
              Clear
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasDrawn}
            >
              Save Signature
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
