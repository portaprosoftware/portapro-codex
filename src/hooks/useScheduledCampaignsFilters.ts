import { useState, useMemo } from 'react';
import { DateRange } from 'react-day-picker';

interface ScheduledCampaignsFilters {
  searchQuery: string;
  campaignType: 'all' | 'email' | 'sms';
  dateRange: DateRange | undefined;
}

export const useScheduledCampaignsFilters = () => {
  const [filters, setFilters] = useState<ScheduledCampaignsFilters>({
    searchQuery: '',
    campaignType: 'all',
    dateRange: undefined
  });

  const updateFilter = <K extends keyof ScheduledCampaignsFilters>(
    key: K,
    value: ScheduledCampaignsFilters[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      searchQuery: '',
      campaignType: 'all',
      dateRange: undefined
    });
  };

  const hasActiveFilters = useMemo(() => {
    return (
      filters.searchQuery.trim() !== '' ||
      filters.campaignType !== 'all' ||
      (filters.dateRange?.from !== undefined) ||
      (filters.dateRange?.to !== undefined)
    );
  }, [filters]);

  const buildWhereClause = useMemo(() => {
    const conditions: any[] = [
      { column: 'status', operator: 'eq', value: 'scheduled' }
    ];

    if (filters.searchQuery.trim()) {
      conditions.push({
        column: 'name',
        operator: 'ilike',
        value: `%${filters.searchQuery.trim()}%`
      });
    }

    if (filters.campaignType !== 'all') {
      conditions.push({
        column: 'campaign_type',
        operator: 'eq',
        value: filters.campaignType
      });
    }

    if (filters.dateRange?.from) {
      conditions.push({
        column: 'scheduled_at',
        operator: 'gte',
        value: filters.dateRange.from.toISOString()
      });
    }

    if (filters.dateRange?.to) {
      // Add 23:59:59 to include the entire end date
      const endDate = new Date(filters.dateRange.to);
      endDate.setHours(23, 59, 59, 999);
      conditions.push({
        column: 'scheduled_at',
        operator: 'lte',
        value: endDate.toISOString()
      });
    }

    return conditions;
  }, [filters]);

  return {
    filters,
    updateFilter,
    clearFilters,
    hasActiveFilters,
    buildWhereClause
  };
};