import React from 'react';
import { AlertTriangle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useOverduePadlockedUnits } from '@/hooks/usePadlockOperations';

export const OverduePadlockedUnitsWidget: React.FC = () => {
  const { data: overdueUnits, isLoading } = useOverduePadlockedUnits();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Overdue Padlocked Units</CardTitle>
          <AlertTriangle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  const overdueCount = overdueUnits?.length || 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Overdue Padlocked Units</CardTitle>
        <AlertTriangle className={`h-4 w-4 ${overdueCount > 0 ? 'text-red-500' : 'text-gray-400'}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-red-600">{overdueCount}</div>
        <p className="text-xs text-muted-foreground">
          Units requiring attention
        </p>
        
        {overdueCount > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium text-red-700">Most Overdue:</p>
            {overdueUnits?.slice(0, 3).map((unit: any) => (
              <div key={unit.item_id} className="flex items-center justify-between text-xs">
                <span className="font-mono">{unit.item_code}</span>
                <Badge variant="destructive" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  {unit.days_overdue}d
                </Badge>
              </div>
            ))}
            {overdueCount > 3 && (
              <p className="text-xs text-gray-500">
                and {overdueCount - 3} more...
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};