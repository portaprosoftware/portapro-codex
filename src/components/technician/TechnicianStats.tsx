import React from 'react';
import { Card } from '@/components/ui/card';
import { Clock, Wrench, CheckCircle2, AlertTriangle } from 'lucide-react';

interface TechnicianStatsProps {
  workOrders: any[];
}

export const TechnicianStats: React.FC<TechnicianStatsProps> = ({ workOrders }) => {
  const stats = {
    pending: workOrders.filter(wo => ['open', 'awaiting_parts'].includes(wo.status)).length,
    inProgress: workOrders.filter(wo => wo.status === 'in_progress').length,
    completed: workOrders.filter(wo => wo.status === 'completed').length,
    overdue: workOrders.filter(wo => wo.due_date && new Date(wo.due_date) < new Date()).length,
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-500 rounded-full">
            <Clock className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.pending}</p>
            <p className="text-sm text-blue-700 dark:text-blue-300">To Do</p>
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-orange-500 rounded-full">
            <Wrench className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{stats.inProgress}</p>
            <p className="text-sm text-orange-700 dark:text-orange-300">Active</p>
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-green-500 rounded-full">
            <CheckCircle2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.completed}</p>
            <p className="text-sm text-green-700 dark:text-green-300">Done</p>
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200 dark:border-red-800">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-500 rounded-full">
            <AlertTriangle className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-red-900 dark:text-red-100">{stats.overdue}</p>
            <p className="text-sm text-red-700 dark:text-red-300">Overdue</p>
          </div>
        </div>
      </Card>
    </div>
  );
};
