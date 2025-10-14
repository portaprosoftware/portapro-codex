import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Clock, CheckCircle, XCircle } from 'lucide-react';

export function DepositStatusWidget() {
  // Placeholder widget for future deposit tracking
  const depositStats = {
    pending: 0,
    paid: 0,
    failed: 0,
    pendingAmount: 0,
    paidAmount: 0,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Deposit Tracking
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
            <p className="text-sm text-muted-foreground mb-1">Collected</p>
            <p className="text-2xl font-bold text-green-700">
              ${depositStats.paidAmount.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {depositStats.paid} deposits
            </p>
          </div>
          <div className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200">
            <p className="text-sm text-muted-foreground mb-1">Pending</p>
            <p className="text-2xl font-bold text-yellow-700">
              ${depositStats.pendingAmount.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {depositStats.pending} deposits
            </p>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="space-y-2">
          {[
            { status: 'pending', count: depositStats.pending, label: 'Pending', icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
            { status: 'paid', count: depositStats.paid, label: 'Paid', icon: CheckCircle, color: 'bg-green-100 text-green-800' },
            { status: 'failed', count: depositStats.failed, label: 'Failed', icon: XCircle, color: 'bg-red-100 text-red-800' },
          ].map(({ status, count, label, icon: Icon, color }) => (
            <div key={status} className="flex items-center justify-between py-2 border-b last:border-0">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium">{label}</span>
              </div>
              <Badge className={color}>
                {count}
              </Badge>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground text-center">
            Deposit tracking ready for quote/job workflows
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
