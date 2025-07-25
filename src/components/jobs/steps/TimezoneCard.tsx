import React from 'react';
import { Globe, Clock, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { formatTimezoneLabel } from '@/lib/timezoneUtils';

interface TimezoneCardProps {
  companyTimezone: string;
  customerTimezone: string | null;
  customerZip?: string;
  timezoneMatch: boolean;
  dualTimezoneMode: boolean;
  onDualTimezoneModeChange: (enabled: boolean) => void;
}

export const TimezoneCard: React.FC<TimezoneCardProps> = ({
  companyTimezone,
  customerTimezone,
  customerZip,
  timezoneMatch,
  dualTimezoneMode,
  onDualTimezoneModeChange
}) => {
  return (
    <Card className="border-2">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center space-x-2">
            <Globe className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Timezone Configuration</h3>
          </div>

          {/* Company Timezone */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Company Timezone:</span>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">{formatTimezoneLabel(companyTimezone)}</span>
              </div>
            </div>

            {/* Customer Timezone */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Customer Timezone:</span>
              <div className="flex items-center space-x-2">
                {customerTimezone ? (
                  <>
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{formatTimezoneLabel(customerTimezone)}</span>
                    {customerZip && (
                      <span className="text-xs text-muted-foreground">({customerZip})</span>
                    )}
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">Not detected</span>
                )}
              </div>
            </div>
          </div>

          {/* Timezone Match Badge */}
          <div className="flex items-center justify-center">
            {timezoneMatch ? (
              <Badge className="bg-gradient-to-r from-green-600 to-green-700 text-white font-bold px-4 py-2">
                Timezone Match
              </Badge>
            ) : (
              <Badge className="bg-gradient-to-r from-red-600 to-red-700 text-white font-bold px-4 py-2">
                Timezone Mismatch
              </Badge>
            )}
          </div>

          {/* Dual Timezone Option */}
          {!timezoneMatch && customerTimezone && (
            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between space-x-3">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <div>
                    <Label htmlFor="dual-timezone" className="text-sm font-medium">
                      Send updates in both timezones
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Helps prevent confusion by showing times in both timezones
                    </p>
                  </div>
                </div>
                <Switch
                  id="dual-timezone"
                  checked={dualTimezoneMode}
                  onCheckedChange={onDualTimezoneModeChange}
                />
              </div>

              {dualTimezoneMode && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs text-amber-800">
                    <strong>Example:</strong> "Job scheduled for 9:00 AM ET (6:00 AM PT)"
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};