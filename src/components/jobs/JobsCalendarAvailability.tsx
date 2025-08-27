import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Eye, EyeOff } from 'lucide-react';
import { AvailabilityCalendar } from '@/components/inventory/AvailabilityCalendar';
import { DateRangeAvailabilityChecker } from '@/components/inventory/DateRangeAvailabilityChecker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface JobsCalendarAvailabilityProps {
  selectedDate: Date;
  onDateSelect?: (date: Date) => void;
}

export const JobsCalendarAvailability: React.FC<JobsCalendarAvailabilityProps> = ({
  selectedDate,
  onDateSelect
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isExpanded) {
    return (
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              Availability Tracker
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(true)}
              className="h-7 px-2"
            >
              <Eye className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-xs text-muted-foreground">
            Check product availability across dates for better scheduling
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Availability Tracker
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(false)}
            className="h-7 px-2"
          >
            <EyeOff className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="calendar" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
            <TabsTrigger value="range">Date Range</TabsTrigger>
          </TabsList>
          
          <TabsContent value="calendar" className="mt-4">
            <AvailabilityCalendar
              productId=""
              productName="All Products"
              requestedQuantity={1}
              onDateSelect={onDateSelect}
              className="max-h-80 overflow-y-auto"
            />
          </TabsContent>
          
          <TabsContent value="range" className="mt-4">
            <DateRangeAvailabilityChecker
              productId=""
              productName="All Products"
              requestedQuantity={1}
              className="max-h-80 overflow-y-auto"
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};