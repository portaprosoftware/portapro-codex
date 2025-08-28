import React, { useState } from 'react';
import { useAvailabilityEngine } from '@/hooks/useAvailabilityEngine';
import { DatePickerWithRange } from '@/components/ui/DatePickerWithRange';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CalendarDays, ChevronDown, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface DateRangeAvailabilityCheckerProps {
  productId: string;
  productName: string;
  requestedQuantity?: number;
  onDateRangeChange?: (dateRange: DateRange | undefined) => void;
  onQuantityChange?: (quantity: number) => void;
  className?: string;
}

export const DateRangeAvailabilityChecker: React.FC<DateRangeAvailabilityCheckerProps> = ({
  productId,
  productName,
  requestedQuantity = 1,
  onDateRangeChange,
  onQuantityChange,
  className
}) => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});

  const startDate = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined;
  const endDate = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined;

  const { data: availability, isLoading, error } = useAvailabilityEngine(
    productId,
    startDate,
    endDate
  );

  // Build an augmented daily breakdown where conflicts include ALL unavailable units
  const augmentedDailyBreakdown = React.useMemo(() => {
    if (!availability?.daily_breakdown) return [] as typeof availability.daily_breakdown;

    // Collect units that are unavailable for other reasons (not 'available')
    const unavailableUnits = new Map(
      (availability.individual_items || [])
        .filter((u) => u.status && u.status !== 'available')
        .map((u) => [u.item_id, u])
    );

    return availability.daily_breakdown.map((day) => {
      const existing = day.conflicts || [];
      const existingIds = new Set<string>(
        existing.map((c: any) => c.item_id).filter(Boolean)
      );

      // Candidates are unavailable units not already represented in conflicts
      const candidates = Array.from(unavailableUnits.values()).filter(
        (u) => !existingIds.has(u.item_id)
      );

      const deficit = Math.max(0, (day.tracked_assigned || 0) - existing.length);
      const extras = candidates.slice(0, deficit).map((u) => ({
        assignment_id: `unavailable:${u.item_id}`,
        job_number: 'Unavailable',
        customer_name: u.status ? u.status.charAt(0).toUpperCase() + u.status.slice(1) : 'Unavailable',
        item_id: u.item_id,
        item_code: u.item_code,
        status: u.status || 'unavailable',
      }));

      return { ...day, conflicts: [...existing, ...extras] };
    });
  }, [availability]);

  // Collect unique item IDs appearing in conflicts so we can show their custom attributes
  const conflictItemIds = React.useMemo(() => {
    const ids = new Set<string>();
    augmentedDailyBreakdown?.forEach((day) => {
      day.conflicts?.forEach((c: any) => {
        if (c.item_id) ids.add(c.item_id);
      });
    });
    return Array.from(ids);
  }, [augmentedDailyBreakdown]);

  const { data: conflictAttributesMap } = useQuery<{ [itemId: string]: Array<{ name: string; value: string }>}>({
    queryKey: ['conflict-item-attributes', productId, startDate, endDate, conflictItemIds.join(',')],
    enabled: conflictItemIds.length > 0,
    queryFn: async () => {
      const { data: attrs, error: attrError } = await supabase
        .from('product_item_attributes')
        .select('item_id, property_id, property_value')
        .in('item_id', conflictItemIds);
      if (attrError) throw attrError;
      if (!attrs || attrs.length === 0) return {};

      const propertyIds = Array.from(new Set(attrs.map((a: any) => a.property_id)));
      const { data: props, error: propError } = await supabase
        .from('product_properties')
        .select('id, attribute_name')
        .in('id', propertyIds);
      if (propError) throw propError;

      const nameById = new Map<string, string>((props || []).map((p: any) => [p.id, p.attribute_name]));
      const map: { [itemId: string]: Array<{ name: string; value: string }> } = {};
      for (const a of attrs) {
        const name = nameById.get(a.property_id) || 'Attribute';
        if (!map[a.item_id]) map[a.item_id] = [];
        map[a.item_id].push({ name, value: a.property_value });
      }
      return map;
    },
  });

  const handleDateRangeChange = (newDateRange: DateRange | undefined) => {
    setDateRange(newDateRange);
    onDateRangeChange?.(newDateRange);
  };
  const toggleDayExpansion = (date: string) => {
    setExpandedDays(prev => ({
      ...prev,
      [date]: !prev[date]
    }));
  };

  const getAvailabilityStatus = (available: number, requested: number) => {
    if (available >= requested) return 'available';
    if (available > 0) return 'partial';
    return 'unavailable';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'partial':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'unavailable':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Info className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-gradient-green text-white border-green-500 font-bold';
      case 'partial':
        return 'bg-gradient-orange text-white border-orange-500 font-bold';
      case 'unavailable':
        return 'bg-gradient-red text-white border-red-500 font-bold';
      default:
        return 'bg-gradient-secondary text-white border-gray-500 font-bold';
    }
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-blue-600" />
          Date Range Availability Checker
        </CardTitle>
        <CardDescription>
          Check availability for {productName} over a specific date range
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Date Range Picker */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Date Range</label>
          <DatePickerWithRange
            date={dateRange}
            onDateChange={handleDateRangeChange}
            placeholder="Select availability period"
          />
        </div>

        {/* Requested Quantity Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Requested Quantity</label>
          <div className="w-20">
            <input
              type="number"
              min="1"
              value={requestedQuantity}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '') {
                  onQuantityChange?.(1);
                } else {
                  const num = parseInt(value);
                  onQuantityChange?.(isNaN(num) || num < 1 ? 1 : num);
                }
              }}
              onFocus={(e) => e.target.select()}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-4 text-gray-500">
            Checking availability...
          </div>
        )}

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>
              Failed to check availability: {error.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Results */}
        {availability && !isLoading && !error && (
          <div className="space-y-4">
            {/* Summary */}
            {availability.summary && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Period Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Min Available:</span>
                    <span className="ml-2 font-medium">{availability.summary.min_available}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Max Available:</span>
                    <span className="ml-2 font-medium">{availability.summary.max_available}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Avg Available:</span>
                    <span className="ml-2 font-medium">{availability.summary.avg_available}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Stock:</span>
                    <span className="ml-2 font-medium">{availability.total}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Overall Availability Status */}
            {availability.summary && (
              <Alert>
                {getStatusIcon(getAvailabilityStatus(availability.summary.min_available, requestedQuantity))}
                <AlertDescription>
                  {availability.summary.min_available >= requestedQuantity ? (
                    `✅ ${requestedQuantity} units are available for the entire selected period`
                  ) : availability.summary.min_available > 0 ? (
                    `⚠️ Only ${availability.summary.min_available} units available (${requestedQuantity} requested)`
                  ) : (
                    <>
                      {`❌ No units available for some days in the selected period`}
                      {(() => {
                        // Find next date with sufficient availability
                        const nextDate = availability.daily_breakdown?.find(day => 
                          day.total_available >= requestedQuantity
                        );
                        return nextDate ? (
                          <div className="mt-2">
                            <Badge variant="outline" className="bg-gradient-primary text-white border-blue-500 font-bold">
                              Next date with {requestedQuantity} available: {format(parseISO(nextDate.date), 'MMM d, yyyy')}
                            </Badge>
                          </div>
                        ) : null;
                      })()}
                    </>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Daily Breakdown */}
            {augmentedDailyBreakdown && augmentedDailyBreakdown.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Daily Availability Breakdown</h4>
                <div className="space-y-1">
                  {augmentedDailyBreakdown.map((day, index) => {
                    const dayDate = format(parseISO(day.date), 'MMM dd, yyyy');
                    const status = getAvailabilityStatus(day.total_available, requestedQuantity);
                    const hasConflicts = day.conflicts && day.conflicts.length > 0;
                    
                    return (
                      <Collapsible key={day.date}>
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="ghost"
                            className="w-full justify-between p-3 h-auto border border-gray-200 hover:bg-gray-50"
                            onClick={() => toggleDayExpansion(day.date)}
                          >
                            <div className="flex items-center gap-3">
                              {getStatusIcon(status)}
                              <span className="font-medium">{dayDate}</span>
                              <Badge variant="outline" className={getStatusBadgeClass(status)}>
                                {day.total_available} available
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              {hasConflicts && (
                                <Badge variant="outline" className="bg-gradient-orange text-white border-orange-500 font-bold">
                                  {day.conflicts.length} conflicts
                                </Badge>
                              )}
                              <ChevronDown
                                className={cn(
                                  "w-4 h-4 transition-transform duration-200",
                                  expandedDays[day.date] && "rotate-180"
                                )}
                              />
                            </div>
                          </Button>
                        </CollapsibleTrigger>
                        
                        <CollapsibleContent className="px-3 pb-3">
                          <div className="bg-gray-50 p-3 rounded-md space-y-2 text-sm">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <span className="text-gray-600">Available:</span>
                                <span className="ml-2 font-medium">{day.tracked_available}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Assigned:</span>
                                <span className="ml-2 font-medium">{day.tracked_assigned}</span>
                              </div>
                            </div>
                            
                            {hasConflicts && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <h5 className="font-medium text-gray-700 mb-2">Conflicts:</h5>
                                <div className="space-y-1">
                                  {day.conflicts.map((conflict: any, idx) => {
                                      const attrs = conflict.item_id ? conflictAttributesMap?.[conflict.item_id] : undefined;
                                      const attrsText = attrs?.map((a) => `${a.name}: ${a.value}`).join(', ');
                                      const unitLabel = conflict.item_code || (conflict.item_id ? conflict.item_id.slice(-6) : null);
                                      return (
                                        <div key={idx} className="flex flex-wrap items-center gap-2 text-xs bg-white p-2 rounded border">
                                          <span className="font-medium">{conflict.job_number || 'Unavailable'}:</span>
                                          <span>{conflict.customer_name || 'Unavailable'}</span>
                                          {unitLabel && (
                                            <Badge variant="outline" className="text-xs bg-gradient-secondary text-white border-gray-500 font-bold">
                                              Unit: {unitLabel}
                                            </Badge>
                                          )}
                                          {attrsText && (
                                            <span className="text-gray-600">{attrsText}</span>
                                          )}
                                        </div>
                                      );
                                    })}
                                </div>
                              </div>
                            )}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* No Results */}
        {!isLoading && !error && !availability && !dateRange?.from && (
          <div className="text-center py-4 text-gray-500">
            Select a date range to check availability
          </div>
        )}
        
        {!isLoading && !error && !availability && dateRange?.from && (
          <div className="text-center py-4 text-gray-500">
            No availability data found for the selected date range
          </div>
        )}
      </CardContent>
    </Card>
  );
};