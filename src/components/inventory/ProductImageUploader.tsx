
import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Package, Upload, X } from "lucide-react";

interface ProductImageUploaderProps {
  label?: string;
  initialUrl?: string | null;
  onFileChange: (file: File | null) => void;
  onRemoveImage?: () => void;
  disabled?: boolean;
}

export const ProductImageUploader: React.FC<ProductImageUploaderProps> = ({
  label = "Product Image",
  initialUrl,
  onFileChange,
  onRemoveImage,
  disabled,
}) => {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(initialUrl || null);

  React.useEffect(() => {
    setPreviewUrl(initialUrl || null);
  }, [initialUrl]);

  const handlePick = () => {
    inputRef.current?.click();
  };

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      const localUrl = URL.createObjectURL(file);
      setPreviewUrl(localUrl);
      onFileChange(file);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    onFileChange(null);
    onRemoveImage?.();
  };

  return (
    <div className="space-y-2">
      <Label className="text-foreground">{label}</Label>
      <div className="flex items-start gap-4">
        <div className="w-28 h-28 rounded-xl border bg-background overflow-hidden flex items-center justify-center">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Product"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <Package className="h-8 w-8 text-muted-foreground" />
          )}
        </div>
        <div className="flex flex-col gap-2">
          <div className="text-sm text-muted-foreground">
            JPG, PNG, or WEBP. We’ll compress to JPG automatically.
          </div>
          <div className="flex gap-2">
            <Button type="button" onClick={handlePick} disabled={!!disabled}>
              <Upload className="w-4 h-4 mr-2" />
              {previewUrl ? "Change Image" : "Upload Image"}
            </Button>
            {(previewUrl || initialUrl) && (
              <Button
                type="button"
                variant="outline"
                onClick={handleRemove}
                disabled={!!disabled}
              >
                <X className="w-4 h-4 mr-2" />
                Remove
              </Button>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleChange}
          />
        </div>
      </div>
    </div>
  );
};
