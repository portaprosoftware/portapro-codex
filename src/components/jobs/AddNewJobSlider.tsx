
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Plus } from 'lucide-react';

interface AddNewJobSliderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddNewJobSlider: React.FC<AddNewJobSliderProps> = ({ open, onOpenChange }) => {
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Job
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              Job wizard is being rebuilt from the ground up.
            </p>
            <p className="text-sm text-muted-foreground">
              Coming soon with comprehensive job creation features.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
