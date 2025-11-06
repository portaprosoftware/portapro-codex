import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganizationId } from './useOrganizationId';

export interface DepositMetrics {
  total_deposits_collected: number;
  total_deposits_pending: number;
  total_deposits_overdue: number;
  collection_rate: number;
  average_deposit_amount: number;
  conversion_rate_with_deposits: number;
  conversion_rate_without_deposits: number;
}

export interface DepositBreakdown {
  status: string;
  count: number;
  total_amount: number;
}

export function useDepositAnalytics(dateRange?: { from: Date; to: Date }) {
  const { orgId } = useOrganizationId();

  return useQuery({
    queryKey: ['deposit-analytics', orgId, dateRange],
    queryFn: async () => {
      if (!orgId) throw new Error('Organization ID required');

      const startDate = dateRange?.from?.toISOString() || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = dateRange?.to?.toISOString() || new Date().toISOString();

      // Fetch quotes with deposit data
      const { data: quotes, error: quotesError } = await supabase
        .from('quotes')
        .select('deposit_required, deposit_amount, deposit_status, status, created_at')
        .eq('organization_id', orgId)
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (quotesError) throw quotesError;

      // Calculate metrics
      const quotesWithDeposits = quotes?.filter(q => q.deposit_required) || [];
      const quotesWithoutDeposits = quotes?.filter(q => !q.deposit_required) || [];

      const depositsPaid = quotesWithDeposits.filter(q => q.deposit_status === 'paid');
      const depositsPending = quotesWithDeposits.filter(q => q.deposit_status === 'pending');
      const depositsOverdue = quotesWithDeposits.filter(q => q.deposit_status === 'overdue');

      const totalCollected = depositsPaid.reduce((sum, q) => sum + (q.deposit_amount || 0), 0);
      const totalPending = depositsPending.reduce((sum, q) => sum + (q.deposit_amount || 0), 0);
      const totalOverdue = depositsOverdue.reduce((sum, q) => sum + (q.deposit_amount || 0), 0);

      const collectionRate = quotesWithDeposits.length > 0 
        ? (depositsPaid.length / quotesWithDeposits.length) * 100 
        : 0;

      const avgDepositAmount = depositsPaid.length > 0 
        ? totalCollected / depositsPaid.length 
        : 0;

      // Calculate conversion rates (quotes to jobs)
      const acceptedWithDeposits = quotesWithDeposits.filter(q => q.status === 'accepted');
      const acceptedWithoutDeposits = quotesWithoutDeposits.filter(q => q.status === 'accepted');

      const conversionWithDeposits = quotesWithDeposits.length > 0 
        ? (acceptedWithDeposits.length / quotesWithDeposits.length) * 100 
        : 0;

      const conversionWithoutDeposits = quotesWithoutDeposits.length > 0 
        ? (acceptedWithoutDeposits.length / quotesWithoutDeposits.length) * 100 
        : 0;

      const metrics: DepositMetrics = {
        total_deposits_collected: totalCollected,
        total_deposits_pending: totalPending,
        total_deposits_overdue: totalOverdue,
        collection_rate: collectionRate,
        average_deposit_amount: avgDepositAmount,
        conversion_rate_with_deposits: conversionWithDeposits,
        conversion_rate_without_deposits: conversionWithoutDeposits,
      };

      const breakdown: DepositBreakdown[] = [
        { status: 'paid', count: depositsPaid.length, total_amount: totalCollected },
        { status: 'pending', count: depositsPending.length, total_amount: totalPending },
        { status: 'overdue', count: depositsOverdue.length, total_amount: totalOverdue },
      ];

      return { metrics, breakdown };
    },
    enabled: !!orgId,
  });
}
