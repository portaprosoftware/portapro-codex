import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, CreditCard, Link2, Percent, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface DepositCollectionStepProps {
  totalAmount: number;
  onDepositChange: (depositData: DepositData) => void;
  onCollectNow?: () => void;
  onGenerateLink?: () => void;
}

export interface DepositData {
  enabled: boolean;
  type: 'flat' | 'percentage';
  amount: number;
  percentage: number;
  dueDate: Date | null;
}

export const DepositCollectionStep: React.FC<DepositCollectionStepProps> = ({
  totalAmount,
  onDepositChange,
  onCollectNow,
  onGenerateLink,
}) => {
  const [depositEnabled, setDepositEnabled] = useState(false);
  const [depositType, setDepositType] = useState<'flat' | 'percentage'>('flat');
  const [flatAmount, setFlatAmount] = useState(0);
  const [percentage, setPercentage] = useState(25);
  const [dueDate, setDueDate] = useState<Date | null>(null);

  const calculatedDepositAmount = depositType === 'flat' 
    ? flatAmount 
    : (totalAmount * percentage) / 100;

  const remainingBalance = totalAmount - calculatedDepositAmount;

  useEffect(() => {
    onDepositChange({
      enabled: depositEnabled,
      type: depositType,
      amount: calculatedDepositAmount,
      percentage,
      dueDate,
    });
  }, [depositEnabled, depositType, flatAmount, percentage, dueDate, calculatedDepositAmount]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Deposit Collection</span>
            <div className="flex items-center gap-2">
              <Label htmlFor="deposit-enabled" className="text-sm font-normal">
                Require Deposit
              </Label>
              <Switch
                id="deposit-enabled"
                checked={depositEnabled}
                onCheckedChange={setDepositEnabled}
              />
            </div>
          </CardTitle>
        </CardHeader>
        
        {depositEnabled && (
          <CardContent className="space-y-6">
            {/* Deposit Type Selection */}
            <div className="space-y-3">
              <Label>Deposit Type</Label>
              <RadioGroup
                value={depositType}
                onValueChange={(value) => setDepositType(value as 'flat' | 'percentage')}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="flat" id="flat" />
                  <Label htmlFor="flat" className="flex items-center gap-2 cursor-pointer">
                    <DollarSign className="h-4 w-4" />
                    Flat Amount
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="percentage" id="percentage" />
                  <Label htmlFor="percentage" className="flex items-center gap-2 cursor-pointer">
                    <Percent className="h-4 w-4" />
                    Percentage
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Amount Input */}
            {depositType === 'flat' ? (
              <div className="space-y-2">
                <Label htmlFor="flat-amount">Deposit Amount</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="flat-amount"
                    type="number"
                    min="0"
                    max={totalAmount}
                    step="0.01"
                    value={flatAmount}
                    onChange={(e) => setFlatAmount(parseFloat(e.target.value) || 0)}
                    className="pl-9"
                    placeholder="0.00"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="percentage-amount">Deposit Percentage</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="percentage-amount"
                    type="number"
                    min="0"
                    max="100"
                    value={percentage}
                    onChange={(e) => setPercentage(parseInt(e.target.value) || 0)}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">
                    = ${calculatedDepositAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* Due Date */}
            <div className="space-y-2">
              <Label>Deposit Due Date (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !dueDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, 'PPP') : 'Select due date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate || undefined}
                    onSelect={(date) => setDueDate(date || null)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Summary */}
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Total Amount:</span>
                <span className="font-bold">${totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-medium">Deposit Required:</span>
                <span className="font-bold text-primary">
                  ${calculatedDepositAmount.toFixed(2)}
                  {depositType === 'percentage' && ` (${percentage}%)`}
                </span>
              </div>
              <div className="flex justify-between text-sm border-t pt-2">
                <span className="font-medium">Remaining Balance:</span>
                <span className="font-bold">${remainingBalance.toFixed(2)}</span>
              </div>
            </div>

            {/* Collection Actions */}
            <div className="flex gap-3">
              <Button
                onClick={onCollectNow}
                className="flex-1"
                disabled={calculatedDepositAmount <= 0}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Collect Now
              </Button>
              <Button
                onClick={onGenerateLink}
                variant="outline"
                className="flex-1"
                disabled={calculatedDepositAmount <= 0}
              >
                <Link2 className="mr-2 h-4 w-4" />
                Generate Link
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};
