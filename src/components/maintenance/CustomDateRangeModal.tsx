import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { CalendarIcon, X, Filter } from "lucide-react";
import { format } from "date-fns";

interface CustomDateRangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (startDate: Date, endDate: Date) => void;
}

export const CustomDateRangeModal: React.FC<CustomDateRangeModalProps> = ({
  isOpen,
  onClose,
  onApply,
}) => {
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());

  const handleApply = () => {
    if (startDate && endDate) {
      onApply(startDate, endDate);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Select Custom Date Range
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label>Start Date</Label>
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={setStartDate}
              className="rounded-md border"
            />
            {startDate && (
              <p className="text-sm text-gray-600">
                Selected: {format(startDate, "PPP")}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Label>End Date</Label>
            <Calendar
              mode="single"
              selected={endDate}
              onSelect={setEndDate}
              className="rounded-md border"
              disabled={(date) => startDate ? date < startDate : false}
            />
            {endDate && (
              <p className="text-sm text-gray-600">
                Selected: {format(endDate, "PPP")}
              </p>
            )}
          </div>
        </div>

        {startDate && endDate && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-blue-900">
              Date Range: {format(startDate, "MMM d, yyyy")} - {format(endDate, "MMM d, yyyy")}
            </p>
            <p className="text-xs text-blue-700">
              {Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} days
            </p>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            disabled={!startDate || !endDate}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Filter className="w-4 h-4 mr-2" />
            Apply Filter
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};