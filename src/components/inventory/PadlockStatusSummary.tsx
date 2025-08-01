import React from 'react';
import { Lock, Unlock, AlertTriangle, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useOverduePadlockedUnits } from '@/hooks/usePadlockOperations';
import { cn } from '@/lib/utils';

export const PadlockStatusSummary: React.FC = () => {
  const { data: overdueUnits, isLoading } = useOverduePadlockedUnits();

  const statusCards = [
    {
      title: 'Padlocked Units',
      icon: Lock,
      count: overdueUnits?.filter((unit: any) => unit.currently_padlocked).length || 0,
      color: 'text-orange-600',
      bgColor: 'bg-gradient-to-br from-orange-50 to-orange-100',
      borderColor: 'border-orange-200'
    },
    {
      title: 'Unlocked Units',
      icon: Unlock,
      count: overdueUnits?.filter((unit: any) => !unit.currently_padlocked).length || 0,
      color: 'text-green-600',
      bgColor: 'bg-gradient-to-br from-green-50 to-green-100',
      borderColor: 'border-green-200'
    },
    {
      title: 'Overdue Padlocked',
      icon: AlertTriangle,
      count: overdueUnits?.length || 0,
      color: 'text-red-600',
      bgColor: 'bg-gradient-to-br from-red-50 to-red-100',
      borderColor: 'border-red-200'
    },
    {
      title: 'Security Score',
      icon: Shield,
      count: overdueUnits ? Math.max(0, 100 - (overdueUnits.length * 5)) : 100,
      color: overdueUnits && overdueUnits.length > 0 ? 'text-yellow-600' : 'text-green-600',
      bgColor: overdueUnits && overdueUnits.length > 0 ? 'bg-gradient-to-br from-yellow-50 to-yellow-100' : 'bg-gradient-to-br from-green-50 to-green-100',
      borderColor: overdueUnits && overdueUnits.length > 0 ? 'border-yellow-200' : 'border-green-200',
      suffix: '%'
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {statusCards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className={cn(
            "border transition-all duration-200 hover:shadow-md",
            card.bgColor,
            card.borderColor
          )}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    {card.title}
                  </p>
                  <p className={cn("text-2xl font-bold", card.color)}>
                    {card.count}{card.suffix || ''}
                  </p>
                </div>
                <div className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full bg-white/50 border",
                  card.borderColor
                )}>
                  <Icon className={cn("w-5 h-5", card.color)} />
                </div>
              </div>
              {index === 2 && overdueUnits && overdueUnits.length > 0 && (
                <Badge variant="destructive" className="mt-2 text-xs">
                  Needs Attention
                </Badge>
              )}
              {index === 3 && overdueUnits && overdueUnits.length === 0 && (
                <Badge className="mt-2 text-xs bg-green-600">
                  Excellent
                </Badge>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};