import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Percent } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface EditDepositPercentageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  currentCustomPercentage?: number | null;
  companyDefaultPercentage: number;
}

export function EditDepositPercentageDialog({
  isOpen,
  onClose,
  customerId,
  currentCustomPercentage,
  companyDefaultPercentage
}: EditDepositPercentageDialogProps) {
  const [percentage, setPercentage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isOpen) {
      setPercentage(currentCustomPercentage?.toString() || '');
    }
  }, [isOpen, currentCustomPercentage]);

  const handleSave = async () => {
    const numValue = parseFloat(percentage);
    
    if (percentage !== '' && (isNaN(numValue) || numValue < 0 || numValue > 100)) {
      toast({
        title: "Invalid percentage",
        description: "Please enter a value between 0 and 100",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('customers')
        .update({ 
          custom_deposit_percentage: percentage === '' ? null : numValue 
        })
        .eq('id', customerId);

      if (error) throw error;

      toast({
        title: "Deposit percentage updated",
        description: percentage === '' 
          ? "Now using company default"
          : `Custom deposit percentage set to ${numValue}%`
      });

      queryClient.invalidateQueries({ queryKey: ['customer', customerId] });
      onClose();
    } catch (error) {
      console.error('Error updating deposit percentage:', error);
      toast({
        title: "Error",
        description: "Failed to update deposit percentage",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseDefault = () => {
    setPercentage('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Percent className="w-5 h-5" />
            Edit Default Deposit Percentage
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="percentage">Custom Deposit Percentage</Label>
            <div className="relative">
              <Input
                id="percentage"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={percentage}
                onChange={(e) => setPercentage(e.target.value)}
                placeholder={`${companyDefaultPercentage}`}
                className="pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                %
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Leave empty to use company default ({companyDefaultPercentage}%)
            </p>
          </div>

          <div className="rounded-lg bg-muted p-3 space-y-1">
            <p className="text-sm font-medium">Company Default</p>
            <p className="text-2xl font-bold">{companyDefaultPercentage}%</p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleUseDefault}
            disabled={isLoading}
          >
            Use Company Default
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
          >
            {isLoading ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
