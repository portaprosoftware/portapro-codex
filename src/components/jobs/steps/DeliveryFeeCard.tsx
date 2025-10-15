import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { NumberInput } from '@/components/ui/number-input';
import { DollarSign } from 'lucide-react';
import { useCompanySettings } from '@/hooks/useCompanySettings';

interface DeliveryFeeCardProps {
  enabled: boolean;
  amount: number;
  onEnabledChange: (enabled: boolean) => void;
  onAmountChange: (amount: number) => void;
}

export const DeliveryFeeCard: React.FC<DeliveryFeeCardProps> = ({
  enabled,
  amount,
  onEnabledChange,
  onAmountChange,
}) => {
  const { data: companySettings, isLoading } = useCompanySettings();
  const [initialized, setInitialized] = useState(false);

  // Initialize with company settings when component mounts (only once)
  useEffect(() => {
    if (companySettings && !isLoading && !initialized) {
      // Auto-enable if setting is turned on
      if (companySettings.auto_enable_delivery_fee) {
        onEnabledChange(true);
        if (companySettings.default_delivery_fee) {
          onAmountChange(companySettings.default_delivery_fee);
        }
      } else if (companySettings.default_delivery_fee && amount === 0) {
        // Just set the default amount, don't auto-enable
        onAmountChange(companySettings.default_delivery_fee);
      }
      setInitialized(true);
    }
  }, [companySettings, isLoading, initialized]);

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-green-600">
            <DollarSign className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg">Delivery & Additional Fees</CardTitle>
            <CardDescription>
              Add delivery charges or other additional fees to this job
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Toggle Switch */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="delivery-fee-toggle" className="text-sm font-medium">
              Include Delivery Fee
            </Label>
            <p className="text-xs text-muted-foreground">
              Add a delivery or service fee to this job
            </p>
          </div>
          <Switch
            id="delivery-fee-toggle"
            checked={enabled}
            onCheckedChange={onEnabledChange}
          />
        </div>

        {/* Amount Input - Only show when enabled */}
        {enabled && (
          <div className="space-y-2 pt-2 border-t">
            <Label htmlFor="delivery-fee-amount" className="text-sm font-medium">
              Fee Amount
            </Label>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-muted-foreground">$</span>
              <NumberInput
                id="delivery-fee-amount"
                value={amount || 0}
                onChange={onAmountChange}
                min={0}
                max={99999}
                step={0.01}
                showControls={true}
                size="default"
                className="flex-1"
              />
            </div>
            {companySettings?.default_delivery_fee && 
             amount !== companySettings.default_delivery_fee && (
              <p className="text-xs text-muted-foreground">
                Default fee: ${companySettings.default_delivery_fee.toFixed(2)}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
