import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface ActiveFilterChipProps {
  label: string;
  onClear: () => void;
}

export function ActiveFilterChip({ label, onClear }: ActiveFilterChipProps) {
  return (
    <Badge 
      variant="secondary" 
      className="bg-blue-100 text-blue-800 hover:bg-blue-200 pr-1 pl-3 py-1 gap-1 rounded-full font-medium"
    >
      {label}
      <button
        onClick={onClear}
        className="ml-1 rounded-full hover:bg-blue-300 p-0.5 transition-colors"
        aria-label="Clear filter"
      >
        <X className="h-3 w-3" />
      </button>
    </Badge>
  );
}
