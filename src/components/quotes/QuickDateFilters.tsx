import { Button } from "@/components/ui/button";
import { DateRange } from "react-day-picker";
import { startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter } from "date-fns";

interface QuickDateFiltersProps {
  onDateRangeChange: (range: DateRange | undefined) => void;
  activeFilter?: string;
  onActiveFilterChange?: (filter: string) => void;
}

export function QuickDateFilters({ 
  onDateRangeChange, 
  activeFilter,
  onActiveFilterChange 
}: QuickDateFiltersProps) {
  const filters = [
    {
      id: 'last7days',
      label: 'Last 7 Days',
      getRange: () => ({
        from: startOfDay(subDays(new Date(), 7)),
        to: endOfDay(new Date())
      })
    },
    {
      id: 'last30days',
      label: 'Last 30 Days',
      getRange: () => ({
        from: startOfDay(subDays(new Date(), 30)),
        to: endOfDay(new Date())
      })
    },
    {
      id: 'thismonth',
      label: 'This Month',
      getRange: () => ({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date())
      })
    },
    {
      id: 'lastquarter',
      label: 'Last Quarter',
      getRange: () => ({
        from: startOfQuarter(subDays(new Date(), 90)),
        to: endOfQuarter(subDays(new Date(), 90))
      })
    },
    {
      id: 'all',
      label: 'All Time',
      getRange: () => undefined
    }
  ];

  const handleFilterClick = (filter: typeof filters[0]) => {
    onDateRangeChange(filter.getRange());
    onActiveFilterChange?.(filter.id);
  };

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
      {filters.map((filter) => (
        <Button
          key={filter.id}
          variant={activeFilter === filter.id ? "default" : "outline"}
          size="sm"
          onClick={() => handleFilterClick(filter)}
          className={`flex-shrink-0 min-h-[44px] whitespace-nowrap ${
            activeFilter === filter.id 
              ? 'bg-gradient-primary text-white' 
              : 'hover:bg-muted'
          }`}
        >
          {filter.label}
        </Button>
      ))}
    </div>
  );
}
