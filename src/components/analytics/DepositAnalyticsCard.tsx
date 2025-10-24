import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { useDepositAnalytics } from '@/hooks/useDepositAnalytics';
import { Skeleton } from '@/components/ui/skeleton';

interface DepositAnalyticsCardProps {
  dateRange?: { from: Date; to: Date };
}

export function DepositAnalyticsCard({ dateRange }: DepositAnalyticsCardProps) {
  const { data, isLoading } = useDepositAnalytics(dateRange);

  if (isLoading) {
    return (
      <div>
        <div className="mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Deposit Analytics
          </h3>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { metrics, breakdown } = data;

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
      <div className="mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Deposit Analytics
        </h3>
      </div>
      <div className="space-y-6">
        {/* Summary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-700" />
              <p className="text-sm font-medium text-green-900">Collected</p>
            </div>
            <p className="text-2xl font-bold text-green-700">
              ${metrics.total_deposits_collected.toFixed(2)}
            </p>
            <p className="text-xs text-green-600 mt-1">
              {breakdown.find(b => b.status === 'paid')?.count || 0} deposits
            </p>
          </div>

          <div className="p-4 rounded-lg bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-yellow-700" />
              <p className="text-sm font-medium text-yellow-900">Pending</p>
            </div>
            <p className="text-2xl font-bold text-yellow-700">
              ${metrics.total_deposits_pending.toFixed(2)}
            </p>
            <p className="text-xs text-yellow-600 mt-1">
              {breakdown.find(b => b.status === 'pending')?.count || 0} deposits
            </p>
          </div>

          <div className="p-4 rounded-lg bg-gradient-to-br from-red-50 to-red-100 border border-red-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-red-700" />
              <p className="text-sm font-medium text-red-900">Overdue</p>
            </div>
            <p className="text-2xl font-bold text-red-700">
              ${metrics.total_deposits_overdue.toFixed(2)}
            </p>
            <p className="text-xs text-red-600 mt-1">
              {breakdown.find(b => b.status === 'overdue')?.count || 0} deposits
            </p>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="space-y-3 border-t pt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Collection Rate</span>
            <Badge variant="outline" className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 font-bold">
              {metrics.collection_rate.toFixed(1)}%
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Avg Deposit Amount</span>
            <span className="text-sm font-bold">${metrics.average_deposit_amount.toFixed(2)}</span>
          </div>

          <div className="border-t pt-3 mt-3">
            <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Conversion Impact
            </p>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs">With Deposits</span>
              <Badge variant="outline" className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 font-bold text-xs">
                {metrics.conversion_rate_with_deposits.toFixed(1)}%
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs">Without Deposits</span>
              <Badge variant="outline" className="bg-gradient-to-r from-gray-400 to-gray-500 text-white border-0 font-bold text-xs">
                {metrics.conversion_rate_without_deposits.toFixed(1)}%
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
