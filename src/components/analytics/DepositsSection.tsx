import React from 'react';
import { DepositAnalyticsCard } from './DepositAnalyticsCard';
import { DepositRevenueBreakdown } from './DepositRevenueBreakdown';

interface DepositsSectionProps {
  dateRange: { from: Date; to: Date };
}

export function DepositsSection({ dateRange }: DepositsSectionProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DepositAnalyticsCard dateRange={dateRange} />
        <DepositRevenueBreakdown dateRange={dateRange} />
      </div>
    </div>
  );
}
