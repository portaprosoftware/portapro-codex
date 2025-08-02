import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FilterData } from '@/hooks/useFilterPresets';

interface SavePresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, description?: string) => void;
  filterData: FilterData;
  isSaving?: boolean;
}

export const SavePresetModal: React.FC<SavePresetModalProps> = ({
  isOpen,
  onClose,
  onSave,
  filterData,
  isSaving = false
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim(), description.trim() || undefined);
      setName('');
      setDescription('');
      onClose();
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    onClose();
  };

  const getFilterSummary = () => {
    const summary: string[] = [];
    
    if (filterData.dateRange) {
      summary.push('Date Range');
    }
    if (filterData.searchTerm) {
      summary.push('Search Term');
    }
    if (filterData.selectedDriver && filterData.selectedDriver !== 'all') {
      summary.push('Driver Filter');
    }
    if (filterData.selectedJobType && filterData.selectedJobType !== 'all') {
      summary.push('Job Type Filter');
    }
    if (filterData.selectedStatus && filterData.selectedStatus !== 'all') {
      summary.push('Status Filter');
    }
    
    return summary.length > 0 ? summary.join(', ') : 'No active filters';
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save Filter Preset</DialogTitle>
          <DialogDescription>
            Save your current filter settings to quickly apply them later.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="preset-name">Preset Name</Label>
            <Input
              id="preset-name"
              placeholder="e.g., Weekend Deliveries"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && name.trim()) {
                  handleSave();
                }
              }}
            />
          </div>
          
          <div>
            <Label htmlFor="preset-description">Description (Optional)</Label>
            <Textarea
              id="preset-description"
              placeholder="Describe when to use this preset..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          
          <div className="p-3 bg-muted rounded-lg">
            <Label className="text-sm font-medium">Current Filters:</Label>
            <p className="text-sm text-muted-foreground mt-1">
              {getFilterSummary()}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!name.trim() || isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Preset'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};