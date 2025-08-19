import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { X, Upload, Camera } from "lucide-react";

export type ItemCondition = "excellent" | "good" | "fair" | "poor";

interface ReturnToServiceItem {
  id: string;
  itemCode: string;
  condition: ItemCondition;
}

interface CompletionPhoto {
  file: File;
  preview: string;
}

interface ReturnToServiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: Array<{ id: string; itemCode: string }>;
  onConfirm: (payload: { itemsWithConditions: ReturnToServiceItem[]; completionSummary: string; completionPhotos: CompletionPhoto[] }) => void;
  isLoading?: boolean;
}

const conditionOptions = [
  { value: "excellent" as const, label: "Excellent", color: "bg-green-500" },
  { value: "good" as const, label: "Good", color: "bg-blue-500" },
  { value: "fair" as const, label: "Fair", color: "bg-yellow-500" },
  { value: "poor" as const, label: "Poor", color: "bg-orange-500" },
];

export const ReturnToServiceModal: React.FC<ReturnToServiceModalProps> = ({
  open,
  onOpenChange,
  items,
  onConfirm,
  isLoading = false,
}) => {
  const [itemConditions, setItemConditions] = useState<Record<string, ItemCondition>>(() => {
    // Default all items to "good" condition
    const defaultConditions: Record<string, ItemCondition> = {};
    items.forEach(item => {
      defaultConditions[item.id] = "good";
    });
    return defaultConditions;
  });

  const [completionSummary, setCompletionSummary] = useState("");
  const [completionPhotos, setCompletionPhotos] = useState<CompletionPhoto[]>([]);

  const handlePhotoFiles = (files: FileList | null) => {
    if (!files) return;
    const max = 5;
    const toAdd = Array.from(files).slice(0, Math.max(0, max - completionPhotos.length));
    const readers = toAdd.map((file) =>
      new Promise<CompletionPhoto>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve({ file, preview: e.target?.result as string });
        reader.readAsDataURL(file);
      })
    );
    Promise.all(readers).then((newPhotos) => setCompletionPhotos((prev) => [...prev, ...newPhotos]));
  };

  const removeCompletionPhoto = (index: number) => {
    setCompletionPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConditionChange = (itemId: string, condition: ItemCondition) => {
    setItemConditions(prev => ({
      ...prev,
      [itemId]: condition,
    }));
  };

  const handleBulkConditionSet = (condition: ItemCondition) => {
    const newConditions: Record<string, ItemCondition> = {};
    items.forEach(item => {
      newConditions[item.id] = condition;
    });
    setItemConditions(newConditions);
  };

  const handleConfirm = () => {
    const itemsWithConditions = items.map(item => ({
      id: item.id,
      itemCode: item.itemCode,
      condition: itemConditions[item.id],
    }));
    onConfirm({ itemsWithConditions, completionSummary, completionPhotos });
  };

  const allConditionsSet = items.every(item => itemConditions[item.id]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Return Items to Service</DialogTitle>
          <DialogDescription>
            Please select the condition for each item being returned from maintenance.
            The condition will help track the quality of your inventory.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Bulk Actions */}
          <div className="border rounded-lg p-4 bg-muted/50">
            <h4 className="text-sm font-medium mb-3">Quick Actions</h4>
            <div className="flex flex-wrap gap-2">
              {conditionOptions.map(option => (
                <Button
                  key={option.value}
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkConditionSet(option.value)}
                  className="text-xs"
                >
                  Set all to {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Individual Item Conditions */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Item Conditions</h4>
            {items.map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="font-mono">
                    {item.itemCode}
                  </Badge>
                </div>
                <Select
                  value={itemConditions[item.id]}
                  onValueChange={(value: ItemCondition) => handleConditionChange(item.id, value)}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    {conditionOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${option.color}`} />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                    <SelectItem value="needs_repair" disabled className="opacity-50">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        Needs Repair (N/A)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>

          {/* Completion Photos Section */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Completion Photos (Optional)</h4>
            <p className="text-xs text-muted-foreground">Add up to 5 photos showing the completed repair work.</p>
            
            {completionPhotos.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {completionPhotos.map((photo, index) => (
                  <div key={index} className="relative">
                    <img
                      src={photo.preview}
                      alt={`Completion photo ${index + 1}`}
                      className="w-full h-20 object-cover rounded-lg border"
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-1 right-1 h-5 w-5 p-0"
                      onClick={() => removeCompletionPhoto(index)}
                      type="button"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {completionPhotos.length < 5 && (
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.capture = 'environment';
                    input.onchange = (e) => handlePhotoFiles((e.target as HTMLInputElement).files);
                    input.click();
                  }}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Camera
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.multiple = true;
                    input.accept = 'image/*';
                    input.onchange = (e) => handlePhotoFiles((e.target as HTMLInputElement).files);
                    input.click();
                  }}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </Button>
              </div>
            )}
          </div>

          {/* Repair Summary Section */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Repair Summary (Optional)</h4>
            <Textarea
              placeholder="Describe the work completed, parts replaced, or any notes about the repair..."
              value={completionSummary}
              onChange={(e) => setCompletionSummary(e.target.value)}
              rows={3}
            />
          </div>

          <div className="text-xs text-muted-foreground p-3 bg-muted/30 rounded-lg">
            <strong>Note:</strong> "Needs Repair" is disabled since these items are coming out of maintenance.
            If an item still needs repair, keep it in maintenance status instead.
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!allConditionsSet || isLoading}
            className="min-w-[120px]"
          >
            {isLoading ? "Returning..." : `Return ${items.length} Item${items.length > 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};