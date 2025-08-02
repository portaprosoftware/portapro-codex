import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { useFilterPresets, FilterPreset } from '@/hooks/useFilterPresets';
import { Bookmark, Trash2, Clock, Users } from 'lucide-react';
import { format } from 'date-fns';

interface SavedPresetsProps {
  onApplyPreset: (preset: FilterPreset) => void;
  className?: string;
}

export const SavedPresets: React.FC<SavedPresetsProps> = ({
  onApplyPreset,
  className
}) => {
  const { presets, deletePreset, isLoading } = useFilterPresets('jobs');

  if (isLoading) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="text-sm text-muted-foreground">Loading presets...</div>
      </Card>
    );
  }

  if (presets.length === 0) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="text-center text-muted-foreground">
          <Bookmark className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No saved presets yet</p>
          <p className="text-xs">Save your first filter preset to see it here</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-4 space-y-4 ${className}`}>
      <div className="flex items-center gap-2">
        <Bookmark className="h-4 w-4 text-primary" />
        <h3 className="font-medium">Saved Filter Presets</h3>
      </div>

      <div className="space-y-2">
        {presets.map((preset) => (
          <div
            key={preset.id}
            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{preset.name}</span>
                {preset.is_public && (
                  <Users className="h-3 w-3 text-muted-foreground" />
                )}
              </div>
              
              {preset.description && (
                <p className="text-xs text-muted-foreground mt-1">
                  {preset.description}
                </p>
              )}

              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                {preset.usage_count > 0 && (
                  <span>Used {preset.usage_count} times</span>
                )}
                {preset.last_used_at && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(new Date(preset.last_used_at), 'MMM d')}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onApplyPreset(preset)}
                className="h-8"
              >
                Apply
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deletePreset(preset.id)}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {presets.length > 0 && (
        <div className="pt-2 border-t">
          <Select onValueChange={(presetId) => {
            const preset = presets.find(p => p.id === presetId);
            if (preset) onApplyPreset(preset);
          }}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Quick apply preset..." />
            </SelectTrigger>
            <SelectContent>
              {presets.map((preset) => (
                <SelectItem key={preset.id} value={preset.id}>
                  {preset.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </Card>
  );
};