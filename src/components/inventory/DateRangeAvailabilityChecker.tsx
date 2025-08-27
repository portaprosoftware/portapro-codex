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

interface DateRangeAvailabilityCheckerProps {
  productId: string;
  productName: string;
  requestedQuantity?: number;
  onDateRangeChange?: (dateRange: DateRange | undefined) => void;
  className?: string;
}

export const DateRangeAvailabilityChecker: React.FC<DateRangeAvailabilityCheckerProps> = ({
  productId,
  productName,
  requestedQuantity = 1,
  onDateRangeChange,
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
        return 'bg-green-100 text-green-800 border-green-200';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'unavailable':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              readOnly
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
                    `❌ No units available for some days in the selected period`
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Daily Breakdown */}
            {availability.daily_breakdown && availability.daily_breakdown.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Daily Availability Breakdown</h4>
                <div className="space-y-1">
                  {availability.daily_breakdown.map((day, index) => {
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
                                <Badge variant="outline" className="bg-orange-100 text-orange-800">
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
                                <span className="text-gray-600">Bulk Available:</span>
                                <span className="ml-2 font-medium">{day.bulk_available}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Tracked Available:</span>
                                <span className="ml-2 font-medium">{day.tracked_available}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Bulk Assigned:</span>
                                <span className="ml-2 font-medium">{day.bulk_assigned}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Tracked Assigned:</span>
                                <span className="ml-2 font-medium">{day.tracked_assigned}</span>
                              </div>
                            </div>
                            
                            {hasConflicts && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <h5 className="font-medium text-gray-700 mb-2">Conflicts:</h5>
                                <div className="space-y-1">
                                  {day.conflicts.map((conflict, idx) => (
                                    <div key={idx} className="flex items-center gap-2 text-xs bg-white p-2 rounded border">
                                      <span className="font-medium">
                                        {conflict.job_number || 'Job'}:
                                      </span>
                                      <span>{conflict.customer_name || 'Unknown Customer'}</span>
                                      {conflict.item_id && (
                                        <Badge variant="outline" className="text-xs">
                                          Item: {conflict.item_id.slice(-8)}
                                        </Badge>
                                      )}
                                    </div>
                                  ))}
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