import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  gradient: string;
  onClick?: () => void;
  subtitle?: string;
}

export function KpiCard({ 
  title, 
  value, 
  icon: Icon, 
  gradient, 
  onClick,
  subtitle 
}: KpiCardProps) {
  return (
    <Card 
      className={cn(
        "border-transparent text-white transition-all duration-200",
        gradient,
        onClick && "cursor-pointer hover:scale-105 hover:shadow-xl active:scale-100"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <p className="text-sm font-medium text-white/90">{title}</p>
            <p className="text-2xl sm:text-3xl font-bold text-white">
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-white/80">{subtitle}</p>
            )}
          </div>
          <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white flex-shrink-0 ml-2" />
        </div>
      </CardContent>
    </Card>
  );
}
