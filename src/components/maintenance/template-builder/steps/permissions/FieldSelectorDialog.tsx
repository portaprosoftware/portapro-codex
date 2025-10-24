import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EnhancedSection } from "../../types";
import { Button } from "@/components/ui/button";

interface FieldSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sections: EnhancedSection[];
  selectedFields: string[];
  onFieldsChange: (fields: string[]) => void;
  title: string;
}

export function FieldSelectorDialog({
  open,
  onOpenChange,
  sections,
  selectedFields,
  onFieldsChange,
  title,
}: FieldSelectorDialogProps) {
  const toggleField = (fieldId: string) => {
    if (selectedFields.includes(fieldId)) {
      onFieldsChange(selectedFields.filter(id => id !== fieldId));
    } else {
      onFieldsChange([...selectedFields, fieldId]);
    }
  };

  const selectAll = () => {
    const allFieldIds = sections.flatMap(s => s.fields.map(f => f.id));
    onFieldsChange(allFieldIds);
  };

  const deselectAll = () => {
    onFieldsChange([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          <Button variant="outline" size="sm" onClick={selectAll}>
            Select All
          </Button>
          <Button variant="outline" size="sm" onClick={deselectAll}>
            Deselect All
          </Button>
        </div>

        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-6">
            {sections.map((section) => (
              <div key={section.id} className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground">
                  {section.title}
                </h4>
                <div className="space-y-2 pl-4">
                  {section.fields.map((field) => (
                    <div key={field.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={field.id}
                        checked={selectedFields.includes(field.id)}
                        onCheckedChange={() => toggleField(field.id)}
                      />
                      <Label htmlFor={field.id} className="text-sm cursor-pointer">
                        {field.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
